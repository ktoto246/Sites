using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using WebApplication1.Data;
using WebApplication1.Models;
using WebApplication1.Models.Entities;
using WebApplication1.ViewModels;

namespace WebApplication1.Controllers;

public class HomeController(ApplicationDbContext db) : Controller
{
    public async Task<IActionResult> Index()
    {
        if (User.Identity?.IsAuthenticated != true) return RedirectToAction("Login", "Account");
        var now = DateTime.UtcNow;
        var newRequests = await db.RepairRequests.CountAsync(request => request.Status == RequestStatus.New);
        var active = await db.WorkOrders.CountAsync(order => order.Status == WorkOrderStatus.InProgress || order.Status == WorkOrderStatus.Planned);
        var waiting = await db.WorkOrders.CountAsync(order => order.Status == WorkOrderStatus.WaitingForParts);
        var rules = await db.MaintenanceRules.Include(rule => rule.Equipment).ToListAsync();
        var overdue = rules.Count(rule => (rule.IntervalDays is int days && now >= rule.BaselineDateUtc.AddDays(days)) || (rule.IntervalHours is decimal hours && rule.Equipment.EngineHours >= rule.BaselineHours + hours));
        var values = await db.WorkOrders.GroupBy(order => order.Status).Select(group => new { Status = group.Key, Value = group.Count() }).ToListAsync();
        var bars = new[] { WorkOrderStatus.Planned, WorkOrderStatus.InProgress, WorkOrderStatus.WaitingForParts, WorkOrderStatus.Completed }.Select(status => new DashboardBarViewModel { Label = status switch { WorkOrderStatus.Planned => "Запланировано", WorkOrderStatus.InProgress => "В работе", WorkOrderStatus.WaitingForParts => "Ожидают детали", WorkOrderStatus.Completed => "Завершено", _ => status.ToString() }, Value = values.FirstOrDefault(value => value.Status == status)?.Value ?? 0 }).ToList();
        var alerts = new List<DashboardAlertViewModel>();
        if (newRequests > 0) alerts.Add(new DashboardAlertViewModel { Title = $"Новые заявки: {newRequests}", Description = "Требуют решения диспетчера.", LinkController = "Requests" });
        if (waiting > 0) alerts.Add(new DashboardAlertViewModel { Title = $"Ожидание деталей: {waiting}", Description = "Проверьте закупки и поступления.", LinkController = "WorkOrders" });
        if (overdue > 0) alerts.Add(new DashboardAlertViewModel { Title = $"ТО требуется: {overdue}", Description = "Есть регламенты с достигнутым сроком.", LinkController = "Maintenance" });
        return View(new DashboardViewModel { NewRequests = newRequests, ActiveWorkOrders = active, WaitingForParts = waiting, OverdueMaintenance = overdue, RepairStatusBars = bars, Alerts = alerts });
    }

    public IActionResult Privacy() => View();

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error() => View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
}
