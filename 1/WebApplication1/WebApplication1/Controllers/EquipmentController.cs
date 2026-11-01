using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1.Data;
using WebApplication1.Models.Entities;
using WebApplication1.ViewModels;

namespace WebApplication1.Controllers;

[Authorize]
public sealed class EquipmentController(ApplicationDbContext db) : Controller
{
    public async Task<IActionResult> Index(bool archived = false)
    {
        var equipment = archived && User.IsInRole(AppRoles.Administrator)
            ? await db.Equipments.IgnoreQueryFilters().Where(item => !item.IsActive).OrderBy(item => item.InventoryNumber).ToListAsync()
            : await db.Equipments.OrderBy(item => item.InventoryNumber).ToListAsync();
        ViewBag.Archived = archived;
        return View(equipment);
    }

    public async Task<IActionResult> Details(int id)
    {
        var item = await db.Equipments.IgnoreQueryFilters().FirstOrDefaultAsync(equipment => equipment.Id == id);
        if (item is null || (!item.IsActive && !User.IsInRole(AppRoles.Administrator))) return NotFound();
        ViewBag.History = await db.WorkOrders.IgnoreQueryFilters().Where(order => order.EquipmentId == id).OrderByDescending(order => order.CreatedAtUtc).ToListAsync();
        return View(item);
    }

    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public IActionResult Create() => View(new EquipmentFormViewModel());

    [HttpPost, ValidateAntiForgeryToken, Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> Create(EquipmentFormViewModel form)
    {
        if (await db.Equipments.IgnoreQueryFilters().AnyAsync(item => item.InventoryNumber == form.InventoryNumber.Trim())) ModelState.AddModelError(nameof(form.InventoryNumber), "Инвентарный номер уже используется.");
        if (!ModelState.IsValid) return View(form);
        var item = new Equipment { InventoryNumber = form.InventoryNumber.Trim(), Model = form.Model.Trim(), RegistrationNumber = string.IsNullOrWhiteSpace(form.RegistrationNumber) ? null : form.RegistrationNumber.Trim(), EngineHours = form.EngineHours };
        db.Equipments.Add(item); await db.SaveChangesAsync(); TempData["Success"] = "Техника добавлена."; return RedirectToAction(nameof(Details), new { id = item.Id });
    }

    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> Edit(int id)
    {
        var item = await db.Equipments.FirstOrDefaultAsync(equipment => equipment.Id == id); if (item is null) return NotFound();
        return View("Create", new EquipmentFormViewModel { Id = item.Id, InventoryNumber = item.InventoryNumber, Model = item.Model, RegistrationNumber = item.RegistrationNumber, EngineHours = item.EngineHours });
    }

    [HttpPost, ValidateAntiForgeryToken, Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> Edit(EquipmentFormViewModel form)
    {
        var item = await db.Equipments.FirstOrDefaultAsync(equipment => equipment.Id == form.Id); if (item is null) return NotFound();
        if (form.EngineHours < item.EngineHours) ModelState.AddModelError(nameof(form.EngineHours), "Моточасы нельзя уменьшить через редактирование. Нужна отдельная корректировка с причиной.");
        if (!ModelState.IsValid) return View("Create", form);
        item.InventoryNumber = form.InventoryNumber.Trim(); item.Model = form.Model.Trim(); item.RegistrationNumber = string.IsNullOrWhiteSpace(form.RegistrationNumber) ? null : form.RegistrationNumber.Trim();
        if (form.EngineHours > item.EngineHours) { item.EngineHours = form.EngineHours; db.EngineHourReadings.Add(new EngineHourReading { EquipmentId = item.Id, Hours = form.EngineHours, Source = "Изменение карточки техники", RecordedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) }); }
        await db.SaveChangesAsync(); TempData["Success"] = "Карточка техники изменена."; return RedirectToAction(nameof(Details), new { id = item.Id });
    }

    [HttpPost, ValidateAntiForgeryToken, Authorize(Roles = AppRoles.Administrator)]
    public async Task<IActionResult> Archive(int id)
    {
        var item = await db.Equipments.FirstOrDefaultAsync(equipment => equipment.Id == id); if (item is null) return NotFound();
        if (await db.WorkOrders.AnyAsync(order => order.EquipmentId == id && order.Status != WorkOrderStatus.Completed && order.Status != WorkOrderStatus.Cancelled)) { TempData["Error"] = "Нельзя архивировать технику с активными нарядами."; return RedirectToAction(nameof(Details), new { id }); }
        item.IsActive = false; await db.SaveChangesAsync(); TempData["Success"] = "Техника архивирована; история сохранена."; return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken, Authorize(Roles = AppRoles.Administrator)]
    public async Task<IActionResult> Restore(int id)
    {
        var item = await db.Equipments.IgnoreQueryFilters().FirstOrDefaultAsync(equipment => equipment.Id == id && !equipment.IsActive); if (item is null) return NotFound();
        item.IsActive = true; await db.SaveChangesAsync(); TempData["Success"] = "Техника восстановлена."; return RedirectToAction(nameof(Details), new { id });
    }
}
