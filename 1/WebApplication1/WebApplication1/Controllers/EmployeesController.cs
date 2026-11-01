using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models.Entities;
using WebApplication1.ViewModels;

namespace WebApplication1.Controllers;

[Authorize(Roles = AppRoles.Administrator)]
public sealed class EmployeesController(ApplicationDbContext db, UserManager<ApplicationUser> users) : Controller
{
    public async Task<IActionResult> Index(bool archived = false)
    {
        var employees = archived ? await db.Employees.IgnoreQueryFilters().Where(employee => !employee.IsActive).Include(employee => employee.User).OrderBy(employee => employee.FullName).ToListAsync() : await db.Employees.Include(employee => employee.User).OrderBy(employee => employee.FullName).ToListAsync();
        var userIds = employees.Where(employee => employee.User is not null).Select(employee => employee.User!.Id).ToList();
        var roleMap = await (from userRole in db.UserRoles join role in db.Roles on userRole.RoleId equals role.Id where userIds.Contains(userRole.UserId) select new { userRole.UserId, role.Name }).ToDictionaryAsync(item => item.UserId, item => item.Name ?? "—");
        ViewBag.Roles = roleMap; ViewBag.Archived = archived;
        return View(employees);
    }

    public IActionResult Create() { ViewBag.Roles = AppRoles.All; return View(new EmployeeFormViewModel()); }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(EmployeeFormViewModel form)
    {
        if (!AppRoles.All.Contains(form.Role)) ModelState.AddModelError(nameof(form.Role), "Выберите доступную роль.");
        if (await users.FindByNameAsync(form.UserName.Trim()) is not null) ModelState.AddModelError(nameof(form.UserName), "Этот логин уже занят.");
        if (!ModelState.IsValid) { ViewBag.Roles = AppRoles.All; return View(form); }
        var employee = new Employee { FullName = form.FullName.Trim(), Phone = form.Phone?.Trim() };
        db.Employees.Add(employee); await db.SaveChangesAsync();
        var user = new ApplicationUser { UserName = form.UserName.Trim(), EmployeeId = employee.Id };
        var result = await users.CreateAsync(user, form.Password); if (!result.Succeeded) { db.Employees.Remove(employee); await db.SaveChangesAsync(); foreach (var error in result.Errors) ModelState.AddModelError(string.Empty, error.Description); ViewBag.Roles = AppRoles.All; return View(form); }
        await users.AddToRoleAsync(user, form.Role); TempData["Success"] = "Сотрудник и учётная запись созданы."; return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Deactivate(int id)
    {
        var employee = await db.Employees.Include(item => item.User).FirstOrDefaultAsync(item => item.Id == id); if (employee is null) return NotFound();
        var activeAssignment = await db.MechanicAssignments.Include(item => item.WorkStage).AnyAsync(item => item.EmployeeId == id && !item.IsCancelled && (item.WorkStage.Status == StageStatus.Planned || item.WorkStage.Status == StageStatus.InProgress));
        if (activeAssignment) { TempData["Error"] = "Нельзя уволить сотрудника с активными назначениями. Сначала переназначьте или завершите работы."; return RedirectToAction(nameof(Index)); }
        if (employee.User is not null && await users.IsInRoleAsync(employee.User, AppRoles.Administrator))
        {
            var adminUsers = await users.GetUsersInRoleAsync(AppRoles.Administrator);
            var activeAdmins = adminUsers.Count(user => user.EmployeeId is not null && db.Employees.IgnoreQueryFilters().Any(employee => employee.Id == user.EmployeeId && employee.IsActive));
            if (activeAdmins <= 1) { TempData["Error"] = "Нельзя отключить последнего активного администратора."; return RedirectToAction(nameof(Index)); }
        }
        employee.IsActive = false; employee.DismissedAtUtc = DateTime.UtcNow; if (employee.User is not null) { await users.SetLockoutEndDateAsync(employee.User, DateTimeOffset.MaxValue); await users.UpdateSecurityStampAsync(employee.User); }
        await db.SaveChangesAsync(); TempData["Success"] = "Сотрудник уволен, вход отключён, история сохранена."; return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Restore(int id)
    {
        var employee = await db.Employees.IgnoreQueryFilters().Include(item => item.User).FirstOrDefaultAsync(item => item.Id == id && !item.IsActive); if (employee is null) return NotFound();
        employee.IsActive = true; employee.DismissedAtUtc = null; if (employee.User is not null) { await users.SetLockoutEndDateAsync(employee.User, null); await users.UpdateSecurityStampAsync(employee.User); }
        await db.SaveChangesAsync(); TempData["Success"] = "Сотрудник восстановлен."; return RedirectToAction(nameof(Index));
    }
}
