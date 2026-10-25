using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WebApplication1.Data;
using WebApplication1.Models;
using WebApplication1.ViewModels;

namespace WebApplication1.Controllers;

public class HomeController : LocalController
{
    private readonly AppDbContext _db;
    public HomeController(AppDbContext db) => _db = db;

    public async Task<IActionResult> Index()
    {
        var requests = _db.MaintenanceRequests.Include(x => x.Equipment).Include(x => x.Mechanic).AsQueryable();
        var plans = _db.MaintenancePlans.Include(x => x.Equipment).Include(x => x.Mechanic).AsQueryable();
        if (CurrentRole == "mechanic") { requests = requests.Where(x => x.MechanicId == CurrentEmployeeId); plans = plans.Where(x => x.MechanicId == CurrentEmployeeId); }
        var purchaseRows = await _db.Purchases.Where(x => x.PurchaseDate.Month == DateTime.Today.Month).Select(x => new { x.Quantity, x.UnitPrice }).ToListAsync();
        return View(new DashboardViewModel { Role = CurrentRole, EquipmentCount = await _db.Equipment.CountAsync(x => x.Status != "Списана"), ActiveRequests = await requests.CountAsync(x => x.Status != "Завершена" && x.Status != "Отменена"), UpcomingMaintenance = await plans.CountAsync(x => x.DueDate >= DateTime.Today && x.DueDate <= DateTime.Today.AddDays(14)), LowStockParts = await _db.Parts.CountAsync(x => x.StockQuantity <= x.MinStock), MonthPurchases = purchaseRows.Sum(x => x.Quantity * x.UnitPrice), RecentRequests = await requests.OrderByDescending(x => x.ReportedAt).Take(5).ToListAsync(), UpcomingPlans = await plans.Where(x => x.Status == "Запланировано").OrderBy(x => x.DueDate).Take(4).ToListAsync(), Equipment = await _db.Equipment.Include(x => x.AssignedDriver).Where(x => x.Status != "Списана").OrderBy(x => x.Status).Take(4).ToListAsync() });
    }
}

public class EquipmentController : LocalController
{
    private readonly AppDbContext _db;
    public EquipmentController(AppDbContext db) => _db = db;
    public async Task<IActionResult> Index(string? search, string? status)
    {
        var query = _db.Equipment.Include(x => x.AssignedDriver).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(x => x.Name.Contains(search) || x.Brand.Contains(search) || x.Model.Contains(search) || x.InventoryNumber.Contains(search));
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        ViewBag.Search = search; ViewBag.Status = status; ViewBag.Statuses = await _db.Equipment.Select(x => x.Status).Distinct().ToListAsync();
        return View(await query.OrderBy(x => x.InventoryNumber).ToListAsync());
    }
    public async Task<IActionResult> Details(int id)
    {
        var equipment = await _db.Equipment.Include(x => x.AssignedDriver).FirstOrDefaultAsync(x => x.Id == id); if (equipment is null) return NotFound();
        ViewBag.Drivers = await _db.Employees.Where(x => x.Role == "driver" && x.IsActive).OrderBy(x => x.FullName).ToListAsync();
        return View(new EquipmentDetailsViewModel { Equipment = equipment, Requests = await _db.MaintenanceRequests.Include(x => x.Mechanic).Where(x => x.EquipmentId == id).OrderByDescending(x => x.ReportedAt).ToListAsync(), Plans = await _db.MaintenancePlans.Include(x => x.Mechanic).Where(x => x.EquipmentId == id).OrderBy(x => x.DueDate).ToListAsync() });
    }
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateAssignment(int id, int? assignedDriverId)
    {
        if (CurrentRole is not ("admin" or "dispatcher")) return Forbid();
        var equipment = await _db.Equipment.FindAsync(id); if (equipment is null || equipment.Status == "Списана") return NotFound();
        equipment.AssignedDriverId = assignedDriverId;
        await _db.SaveChangesAsync();
        return RedirectToAction(nameof(Details), new { id });
    }
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> WriteOff(int id, string reason)
    {
        if (CurrentRole != "admin") return Forbid();
        var equipment = await _db.Equipment.FindAsync(id); if (equipment is null) return NotFound();
        equipment.Status = "Списана"; equipment.AssignedDriverId = null; equipment.WriteOffDate = DateTime.Today; equipment.WriteOffReason = reason;
        await _db.SaveChangesAsync();
        return RedirectToAction(nameof(Details), new { id });
    }}

public class RequestsController : LocalController
{
    private readonly AppDbContext _db;
    public RequestsController(AppDbContext db) => _db = db;
    public async Task<IActionResult> Index(string? status, string? search)
    {
        var query = _db.MaintenanceRequests.Include(x => x.Equipment).Include(x => x.Reporter).Include(x => x.Mechanic).AsQueryable();
        if (CurrentRole == "mechanic") query = query.Where(x => x.MechanicId == CurrentEmployeeId);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(x => x.Title.Contains(search) || x.Equipment!.Brand.Contains(search) || x.Equipment.Model.Contains(search) || x.Equipment.InventoryNumber.Contains(search));
        ViewBag.Status = status; ViewBag.Search = search;
        return View(await query.OrderByDescending(x => x.ReportedAt).ToListAsync());
    }
    public async Task<IActionResult> Details(int id)
    {
        var request = await _db.MaintenanceRequests.Include(x => x.Equipment).Include(x => x.Reporter).Include(x => x.Mechanic).Include(x => x.WorkParts).ThenInclude(x => x.Part).FirstOrDefaultAsync(x => x.Id == id);
        if (request is null || (CurrentRole == "mechanic" && request.MechanicId != CurrentEmployeeId)) return NotFound();
        ViewBag.Mechanics = await _db.Employees.Where(x => x.Role == "mechanic" && x.IsActive).OrderBy(x => x.FullName).ToListAsync();
        return View(new RequestDetailsViewModel { Request = request, AvailableParts = await _db.Parts.OrderBy(x => x.Name).ToListAsync() });
    }
    public async Task<IActionResult> Create()
    {
        ViewBag.Equipment = await _db.Equipment.Where(x => x.Status != "Списана").OrderBy(x => x.InventoryNumber).ToListAsync(); ViewBag.Employees = await _db.Employees.Where(x => x.Role == "driver").OrderBy(x => x.FullName).ToListAsync(); ViewBag.Mechanics = await _db.Employees.Where(x => x.Role == "mechanic" && x.IsActive).OrderBy(x => x.FullName).ToListAsync();
        return View(new MaintenanceRequest { ReportedAt = DateTime.Today, Priority = "Средний" });
    }
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(MaintenanceRequest model)
    {
        model.Status = model.MechanicId.HasValue ? "Назначена" : "Новая"; model.ReportedAt = DateTime.Today;
        if (model.ReporterId == 0) model.ReporterId = await _db.Employees.Where(x => x.Role == "driver").Select(x => x.Id).FirstAsync();
        _db.MaintenanceRequests.Add(model); await _db.SaveChangesAsync(); return RedirectToAction(nameof(Details), new { id = model.Id });
    }
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> TakeToWork(int id)
    {
        if (CurrentRole != "mechanic") return Forbid(); var request = await _db.MaintenanceRequests.FindAsync(id); if (request is null) return NotFound();
        request.MechanicId = CurrentEmployeeId; request.Status = "В работе"; await _db.SaveChangesAsync(); return RedirectToAction(nameof(Details), new { id });
    }
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Assign(int id, int mechanicId)
    {
        if (CurrentRole is not ("dispatcher" or "admin")) return Forbid(); var request = await _db.MaintenanceRequests.FindAsync(id); if (request is null) return NotFound();
        request.MechanicId = mechanicId; request.Status = "Назначена"; await _db.SaveChangesAsync(); return RedirectToAction(nameof(Details), new { id });
    }
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> CompleteWork(int id, string status, string? workPerformed, int? partId, int partQuantity)
    {
        var request = await _db.MaintenanceRequests.FindAsync(id); if (request is null || (CurrentRole == "mechanic" && request.MechanicId != CurrentEmployeeId)) return NotFound();
        request.Status = status; request.WorkPerformed = workPerformed; if (status == "Завершена") request.CompletedAt = DateTime.Today;
        if (partId.HasValue && partQuantity > 0) { var part = await _db.Parts.FindAsync(partId.Value); if (part is not null && part.StockQuantity >= partQuantity) { part.StockQuantity -= partQuantity; _db.WorkParts.Add(new WorkPart { RequestId = request.Id, PartId = part.Id, Quantity = partQuantity }); } }
        await _db.SaveChangesAsync(); return RedirectToAction(nameof(Details), new { id });
    }
    public async Task<IActionResult> WorkReportPdf(int id)
    {
        var request = await _db.MaintenanceRequests.Include(x => x.Equipment).Include(x => x.Mechanic).Include(x => x.Reporter).Include(x => x.WorkParts).ThenInclude(x => x.Part).FirstOrDefaultAsync(x => x.Id == id); if (request is null) return NotFound();
        var bytes = PdfDocuments.WorkReport(request); return File(bytes, "application/pdf", $"акт-работы-{request.Id:000}.pdf");
    }
}

public class WarehouseController : LocalController
{
    private readonly AppDbContext _db;
    public WarehouseController(AppDbContext db) => _db = db;
    public async Task<IActionResult> Index(string? search)
    {
        var query = _db.Parts.AsQueryable(); if (!string.IsNullOrWhiteSpace(search)) query = query.Where(x => x.Name.Contains(search) || x.Article.Contains(search));
        ViewBag.Search = search; ViewBag.Purchases = await _db.Purchases.Include(x => x.Part).Include(x => x.PurchasedBy).OrderByDescending(x => x.PurchaseDate).Take(8).ToListAsync(); ViewBag.Employees = await _db.Employees.Where(x => (x.Role == "dispatcher" || x.Role == "admin") && x.IsActive).ToListAsync();
        return View(await query.OrderBy(x => x.StockQuantity <= x.MinStock ? 0 : 1).ThenBy(x => x.Name).ToListAsync());
    }
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Purchase(Purchase model)
    {
        var part = await _db.Parts.FindAsync(model.PartId); if (part is null || model.Quantity <= 0 || model.UnitPrice < 0) return NotFound();
        part.StockQuantity += model.Quantity; model.PurchaseDate = DateTime.Today; if (model.PurchasedById == 0) model.PurchasedById = CurrentEmployeeId;
        _db.Purchases.Add(model); await _db.SaveChangesAsync(); return RedirectToAction(nameof(ReceiptPdf), new { id = model.Id });
    }
    public async Task<IActionResult> ReceiptPdf(int id)
    {
        var purchase = await _db.Purchases.Include(x => x.Part).Include(x => x.PurchasedBy).FirstOrDefaultAsync(x => x.Id == id); if (purchase is null) return NotFound();
        return File(PdfDocuments.PurchaseReceipt(purchase), "application/pdf", $"чек-закупки-{purchase.ReceiptNumber}.pdf");
    }
}

public class ReportsController : LocalController
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;
    public async Task<IActionResult> Index(DateTime? dateFrom, DateTime? dateTo) => View(await BuildModel(dateFrom, dateTo));
    public async Task<IActionResult> ExportPdf(DateTime? dateFrom, DateTime? dateTo)
    {
        var model = await BuildModel(dateFrom, dateTo);
        return File(PdfDocuments.SystemReport(model), "application/pdf", $"отчёт-агроконтроль-{model.DateFrom:yyyy-MM-dd}-{model.DateTo:yyyy-MM-dd}.pdf");
    }
    private async Task<ReportsViewModel> BuildModel(DateTime? dateFrom, DateTime? dateTo)
    {
        var from = (dateFrom ?? new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1)).Date;
        var to = (dateTo ?? DateTime.Today).Date;
        if (from > to) (from, to) = (to, from);
        var requests = await _db.MaintenanceRequests.Include(x => x.Equipment).Where(x => x.ReportedAt.Date >= from && x.ReportedAt.Date <= to).ToListAsync();
        var expenses = await _db.Purchases.Where(x => x.PurchaseDate.Date >= from && x.PurchaseDate.Date <= to).Select(x => x.Quantity * x.UnitPrice).SumAsync();
        return new ReportsViewModel { DateFrom = from, DateTo = to, TotalRequests = requests.Count, CompletedRequests = requests.Count(x => x.Status == "Завершена"), InProgressRequests = requests.Count(x => x.Status is "В работе" or "Назначена"), TotalSpend = expenses, Statuses = requests.GroupBy(x => x.Status).Select(g => new ReportItem { Label = g.Key, Count = g.Count() }).OrderByDescending(x => x.Count).ToList(), Monthly = requests.GroupBy(x => x.ReportedAt.Date).OrderBy(x => x.Key).Select(g => new ReportItem { Label = g.Key.ToString("dd.MM"), Count = g.Count() }).ToList(), EquipmentWorkload = requests.GroupBy(x => x.Equipment?.Name ?? "Без техники").Select(g => new ReportItem { Label = g.Key, Count = g.Count() }).OrderByDescending(x => x.Count).Take(5).ToList() };
    }
}

public class EmployeesController : LocalController
{
    private readonly AppDbContext _db;
    public EmployeesController(AppDbContext db) => _db = db;
    public async Task<IActionResult> Index(string? search)
    {
        if (CurrentRole != "admin") return Forbid(); var query = _db.Employees.AsQueryable(); if (!string.IsNullOrWhiteSpace(search)) query = query.Where(x => x.FullName.Contains(search) || x.Position.Contains(search) || x.Login.Contains(search)); ViewBag.Search = search;
        return View(await query.OrderBy(x => x.Role).ThenBy(x => x.FullName).ToListAsync());
    }
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Employee model)
    {
        if (CurrentRole != "admin") return Forbid(); if (string.IsNullOrWhiteSpace(model.FullName) || string.IsNullOrWhiteSpace(model.Login) || string.IsNullOrWhiteSpace(model.Password)) return RedirectToAction(nameof(Index));
        model.IsActive = true; _db.Employees.Add(model); await _db.SaveChangesAsync(); return RedirectToAction(nameof(Index));
    }
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleActive(int id)
    {
        if (CurrentRole != "admin") return Forbid(); var employee = await _db.Employees.FindAsync(id); if (employee is null || employee.Id == CurrentEmployeeId) return RedirectToAction(nameof(Index)); if (employee.IsActive && employee.Role == "admin" && await _db.Employees.CountAsync(x => x.Role == "admin" && x.IsActive) <= 1) { TempData["Error"] = "Нельзя уволить последнего активного администратора."; return RedirectToAction(nameof(Index)); } if (employee.IsActive && employee.Role == "driver") { var assignedEquipment = await _db.Equipment.Where(x => x.AssignedDriverId == employee.Id).ToListAsync(); foreach (var item in assignedEquipment) item.AssignedDriverId = null; } if (employee.IsActive && employee.Role == "mechanic") { var openRequests = await _db.MaintenanceRequests.Where(x => x.MechanicId == employee.Id && x.Status != "Завершена").ToListAsync(); foreach (var item in openRequests) { item.MechanicId = null; item.Status = "Новая"; } } employee.IsActive = !employee.IsActive; await _db.SaveChangesAsync(); return RedirectToAction(nameof(Index));
    }
}

