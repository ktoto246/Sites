using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using WebApplication1.Data;
using WebApplication1.Models.Entities;
using WebApplication1.ViewModels;

namespace WebApplication1.Controllers;

[Authorize(Roles = AppRoles.Administrator)]
public sealed class ReportsController(ApplicationDbContext db) : Controller
{
    public async Task<IActionResult> Index(DateTime? from, DateTime? to)
    {
        var model = await BuildAsync(from, to);
        return View(model);
    }

    public async Task<FileResult> ExportCsv(DateTime? from, DateTime? to)
    {
        var report = await BuildAsync(from, to);
        var builder = new StringBuilder();
        builder.AppendLine("Показатель;Значение");
        builder.AppendLine($"Период;{report.From:dd.MM.yyyy} — {report.To:dd.MM.yyyy}");
        builder.AppendLine($"Ремонтов;{report.Repairs}");
        builder.AppendLine($"Завершено;{report.Completed}");
        builder.AppendLine($"Просрочено;{report.Overdue}");
        builder.AppendLine($"Закупки, руб.;{report.PurchasedCost:F2}");
        builder.AppendLine($"Фактический расход, руб.;{report.UsedCost:F2}");
        builder.AppendLine($"Потери и брак, руб.;{report.LossCost:F2}");
        builder.AppendLine(); builder.AppendLine("Механик;Количество назначений");
        foreach (var item in report.MechanicLoad) builder.AppendLine($"{item.Label};{item.Value}");
        return File(Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(builder.ToString())).ToArray(), "text/csv; charset=utf-8", $"agro-report-{report.From:yyyyMMdd}-{report.To:yyyyMMdd}.csv");
    }

    private async Task<ReportViewModel> BuildAsync(DateTime? from, DateTime? to)
    {
        var start = (from ?? DateTime.Today.AddDays(-30)).Date.ToUniversalTime();
        var end = (to ?? DateTime.Today).Date.AddDays(1).ToUniversalTime();
        if (end <= start) end = start.AddDays(1);
        var orders = db.WorkOrders.Where(order => order.CreatedAtUtc >= start && order.CreatedAtUtc < end);
        var repairs = await orders.CountAsync(order => order.Type == WorkOrderType.Repair);
        var completed = await orders.CountAsync(order => order.Status == WorkOrderStatus.Completed);
        var overdue = await orders.CountAsync(order => order.Status != WorkOrderStatus.Completed && order.Status != WorkOrderStatus.Cancelled && order.PlannedEndUtc != null && order.PlannedEndUtc < DateTime.UtcNow);
        var purchases = await db.PurchaseLines.Where(line => line.Purchase.ReceivedAtUtc >= start && line.Purchase.ReceivedAtUtc < end).SumAsync(line => (decimal?)(line.ReceivedQuantity * line.UnitPrice)) ?? 0m;
        var used = await db.StockMovements.Where(move => move.CreatedAtUtc >= start && move.CreatedAtUtc < end && move.Type == StockMovementType.Use).SumAsync(move => (decimal?)(move.Quantity * move.UnitCost)) ?? 0m;
        var loss = await db.StockMovements.Where(move => move.CreatedAtUtc >= start && move.CreatedAtUtc < end && (move.Type == StockMovementType.WriteOff || move.Type == StockMovementType.InventoryDecrease)).SumAsync(move => (decimal?)(move.Quantity * move.UnitCost)) ?? 0m;
        var workload = await db.MechanicAssignments.IgnoreQueryFilters().Where(assignment => assignment.PlannedStartUtc >= start && assignment.PlannedStartUtc < end && !assignment.IsCancelled).GroupBy(assignment => assignment.Employee.FullName).Select(group => new DashboardBarViewModel { Label = group.Key, Value = group.Count() }).OrderByDescending(item => item.Value).Take(8).ToListAsync();
        return new ReportViewModel { From = start.ToLocalTime().Date, To = end.AddTicks(-1).ToLocalTime().Date, Repairs = repairs, Completed = completed, Overdue = overdue, PurchasedCost = purchases, UsedCost = used, LossCost = loss, MechanicLoad = workload };
    }
}
