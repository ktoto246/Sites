using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1.Data;
using WebApplication1.Models.Entities;
using WebApplication1.ViewModels;

namespace WebApplication1.Controllers;

[Authorize]
public sealed class RequestsController(ApplicationDbContext db) : Controller
{
    public async Task<IActionResult> Index()
    {
        var query = db.RepairRequests.AsNoTracking().Include(request => request.Equipment).Include(request => request.WorkOrder).OrderByDescending(request => request.CreatedAtUtc).AsQueryable();
        if (User.IsInRole(AppRoles.TractorDriver))
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            query = query.Where(request => request.AuthorUserId == userId);
        }
        else if (!User.IsInRole(AppRoles.Administrator) && !User.IsInRole(AppRoles.Dispatcher)) return Forbid();

        var requests = await query.Select(request => new RepairRequestListItemViewModel
        {
            Id = request.Id,
            EquipmentName = request.Equipment.InventoryNumber + " — " + request.Equipment.Model,
            Description = request.Description,
            Status = request.Status,
            CreatedAtUtc = request.CreatedAtUtc,
            PlannedEndUtc = request.WorkOrder == null ? null : request.WorkOrder.PlannedEndUtc,
            // Чекаем, есть ли активный наряд на этот трактор или другие новые заявки
            HasDuplicateWarning = db.WorkOrders.Any(wo => wo.EquipmentId == request.EquipmentId && wo.Status != WorkOrderStatus.Completed && wo.Status != WorkOrderStatus.Cancelled)
                       || db.RepairRequests.Any(rr => rr.EquipmentId == request.EquipmentId && rr.Id != request.Id && rr.Status == RequestStatus.New)
        }).ToListAsync();
        return View(requests);
    }

    [Authorize(Roles = AppRoles.TractorDriver)]
    public async Task<IActionResult> Create()
    {
        await PopulateEquipmentAsync();
        return View(new RepairRequestFormViewModel());
    }

    [HttpPost, ValidateAntiForgeryToken, Authorize(Roles = AppRoles.TractorDriver)]
    public async Task<IActionResult> Create(RepairRequestFormViewModel model)
    {
        var equipment = await db.Equipments.FirstOrDefaultAsync(item => item.Id == model.EquipmentId && item.IsActive);
        if (equipment is null) ModelState.AddModelError(nameof(model.EquipmentId), "Выбранная техника недоступна.");
        if (model.EngineHours < equipment?.EngineHours) ModelState.AddModelError(nameof(model.EngineHours), "Моточасы не могут быть меньше последнего сохранённого значения.");
        if (!ModelState.IsValid) { await PopulateEquipmentAsync(); return View(model); }

        var authorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        db.RepairRequests.Add(new RepairRequest { EquipmentId = equipment!.Id, AuthorUserId = authorId, Description = model.Description.Trim(), EngineHours = model.EngineHours });
        if (model.EngineHours > equipment.EngineHours)
        {
            equipment.EngineHours = model.EngineHours;
            db.EngineHourReadings.Add(new EngineHourReading { EquipmentId = equipment.Id, Hours = model.EngineHours, Source = "Заявка о неисправности", RecordedByUserId = authorId });
        }
        await db.SaveChangesAsync();
        TempData["Success"] = "Заявка отправлена диспетчеру. Состояние ремонта появится в её карточке.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken, Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> Reject(int id, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason)) { TempData["Error"] = "Укажите причину отклонения."; return RedirectToAction(nameof(Index)); }
        var request = await db.RepairRequests.FirstOrDefaultAsync(item => item.Id == id && item.Status == RequestStatus.New);
        if (request is null) return NotFound();
        request.Status = RequestStatus.Rejected;
        request.DecisionReason = reason.Trim();
        await db.SaveChangesAsync();
        TempData["Success"] = "Заявка отклонена с указанием причины.";
        return RedirectToAction(nameof(Index));
    }

    private async Task PopulateEquipmentAsync()
    {
        ViewBag.Equipments = new SelectList(await db.Equipments.OrderBy(item => item.InventoryNumber).Select(item => new { item.Id, Name = item.InventoryNumber + " — " + item.Model }).ToListAsync(), "Id", "Name");
    }
}
