using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models.Entities;
using WebApplication1.ViewModels;

namespace WebApplication1.Controllers;

[Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
public sealed class MaintenanceController(ApplicationDbContext db) : Controller
{
    public async Task<IActionResult> Index()
    {
        var now = DateTime.UtcNow;
        var rows = await db.MaintenanceRules.Include(rule => rule.Equipment).OrderBy(rule => rule.Equipment.InventoryNumber).Select(rule => new { rule.Id, Equipment = rule.Equipment.InventoryNumber + " — " + rule.Equipment.Model, rule.Name, rule.IntervalDays, rule.IntervalHours, rule.WarningDays, rule.WarningHours, rule.BaselineDateUtc, rule.BaselineHours, CurrentHours = rule.Equipment.EngineHours }).ToListAsync();
        var list = rows.Select(rule =>
        {
            DateTime? nextDate = rule.IntervalDays is int days ? rule.BaselineDateUtc.AddDays(days) : null;
            decimal? nextHours = rule.IntervalHours is decimal hours ? rule.BaselineHours + hours : null;
            var overdue = (nextDate is not null && now >= nextDate) || (nextHours is not null && rule.CurrentHours >= nextHours);
            var warning = !overdue && ((nextDate is not null && rule.WarningDays is int warningDays && now >= nextDate.Value.AddDays(-warningDays)) || (nextHours is not null && rule.WarningHours is decimal warningHours && rule.CurrentHours >= nextHours - warningHours));
            return new MaintenanceRuleListItemViewModel { Id = rule.Id, Equipment = rule.Equipment, Name = rule.Name, Status = overdue ? "Требуется" : warning ? "Скоро" : "По графику", NextDateUtc = nextDate, NextHours = nextHours };
        }).ToList();
        return View(list);
    }

    public async Task<IActionResult> Create()
    {
        await PopulateEquipmentAsync();
        return View(new MaintenanceRuleFormViewModel());
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(MaintenanceRuleFormViewModel form)
    {
        if (form.IntervalDays is null && form.IntervalHours is null) ModelState.AddModelError(string.Empty, "Укажите календарный интервал, интервал моточасов или оба значения.");
        var equipment = await db.Equipments.FirstOrDefaultAsync(item => item.Id == form.EquipmentId);
        if (equipment is null) ModelState.AddModelError(nameof(form.EquipmentId), "Выберите доступную технику.");
        if (!ModelState.IsValid) { await PopulateEquipmentAsync(); return View(form); }
        db.MaintenanceRules.Add(new MaintenanceRule { EquipmentId = form.EquipmentId, Name = form.Name.Trim(), IntervalDays = form.IntervalDays, IntervalHours = form.IntervalHours, WarningDays = form.WarningDays, WarningHours = form.WarningHours, BaselineDateUtc = DateTime.UtcNow, BaselineHours = equipment!.EngineHours });
        await db.SaveChangesAsync(); TempData["Success"] = "Регламент ТО добавлен."; return RedirectToAction(nameof(Index));
    }

    private async Task PopulateEquipmentAsync() => ViewBag.Equipments = new SelectList(await db.Equipments.OrderBy(item => item.InventoryNumber).Select(item => new { item.Id, Name = item.InventoryNumber + " — " + item.Model }).ToListAsync(), "Id", "Name");
}
