using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1.Data;
using WebApplication1.Models.Entities;
using WebApplication1.ViewModels;

namespace WebApplication1.Controllers;

[Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
public sealed class InventoryController(ApplicationDbContext db, IWebHostEnvironment environment) : Controller
{
    public async Task<IActionResult> Index()
    {
        var parts = await db.Parts.AsNoTracking().OrderBy(part => part.Article).Select(part => new PartStockListItemViewModel
        {
            Id = part.Id,
            Article = part.Article,
            Name = part.Name,
            Unit = part.Unit,
            Available = db.StockBatches.Where(batch => batch.PartId == part.Id).Sum(batch => (decimal?)batch.AvailableQuantity) ?? 0m,
            Reserved = db.StockBatches.Where(batch => batch.PartId == part.Id).Sum(batch => (decimal?)batch.ReservedQuantity) ?? 0m
        }).ToListAsync();
        return View(parts);
    }

    public IActionResult CreatePart() => View(new PartFormViewModel());

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> CreatePart(PartFormViewModel model)
    {
        if (await db.Parts.IgnoreQueryFilters().AnyAsync(part => part.Article == model.Article.Trim())) ModelState.AddModelError(nameof(model.Article), "Артикул уже существует.");
        if (!ModelState.IsValid) return View(model);
        db.Parts.Add(new Part { Article = model.Article.Trim(), Name = model.Name.Trim(), Unit = model.Unit.Trim() });
        await db.SaveChangesAsync(); TempData["Success"] = "Деталь добавлена."; return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> CreatePurchase()
    {
        await PopulatePurchaseOptionsAsync();
        return View(new PurchaseFormViewModel { ExpectedDate = DateTime.Today.AddDays(7) });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> CreatePurchase(PurchaseFormViewModel model)
    {
        if (!await db.Parts.AnyAsync(part => part.Id == model.PartId)) ModelState.AddModelError(nameof(model.PartId), "Деталь недоступна.");
        if (!await db.Suppliers.AnyAsync(supplier => supplier.Id == model.SupplierId)) ModelState.AddModelError(nameof(model.SupplierId), "Поставщик недоступен.");
        if (!ModelState.IsValid) { await PopulatePurchaseOptionsAsync(); return View(model); }
        var purchase = new Purchase { SupplierId = model.SupplierId, Status = PurchaseStatus.Ordered, ExpectedAtUtc = model.ExpectedDate?.ToUniversalTime() };
        purchase.Lines.Add(new PurchaseLine { PartId = model.PartId, OrderedQuantity = model.Quantity, UnitPrice = model.UnitPrice });
        db.Purchases.Add(purchase); await db.SaveChangesAsync(); TempData["Success"] = "Закупка оформлена. После поступления подтвердите её в списке закупок."; return RedirectToAction(nameof(Purchases));
    }

    public async Task<IActionResult> Purchases()
    {
        var purchases = await db.Purchases.Include(purchase => purchase.Supplier).Include(purchase => purchase.Lines).ThenInclude(line => line.Part).OrderByDescending(purchase => purchase.CreatedAtUtc).ToListAsync();
        return View(purchases);
    }

    [HttpGet]
    public async Task<IActionResult> Receive(int id)
    {
        var purchase = await db.Purchases
            .Include(p => p.Supplier)
            .Include(p => p.Lines).ThenInclude(l => l.Part)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (purchase == null) return NotFound();

        return View(purchase);
    }

    [HttpPost, ActionName("Receive"), ValidateAntiForgeryToken]
    public async Task<IActionResult> ReceiveConfirmed(int id)
    {
        var purchase = await db.Purchases.Include(item => item.Lines).FirstOrDefaultAsync(item => item.Id == id);
        if (purchase is null) return NotFound();
        if (purchase.Status is PurchaseStatus.Received or PurchaseStatus.Cancelled)
        {
            TempData["Error"] = "Эту закупку нельзя принять повторно.";
            return RedirectToAction(nameof(Purchases));
        }

        var now = DateTime.UtcNow;
        foreach (var line in purchase.Lines)
        {
            var received = line.OrderedQuantity - line.ReceivedQuantity;
            if (received <= 0) continue;
            line.ReceivedQuantity += received;
            db.StockBatches.Add(new StockBatch { PartId = line.PartId, PurchaseLineId = line.Id, ReceivedQuantity = received, AvailableQuantity = received, UnitCost = line.UnitPrice, ReceivedAtUtc = now });
        }

        purchase.Status = PurchaseStatus.Received;
        purchase.ReceivedAtUtc = now;
        await db.SaveChangesAsync();

        TempData["Success"] = "Поступление принято на склад.";
        return RedirectToAction(nameof(Purchases));
    }

    private async Task PopulatePurchaseOptionsAsync()
    {
        ViewBag.Parts = new SelectList(await db.Parts.OrderBy(part => part.Article).Select(part => new { part.Id, Name = part.Article + " — " + part.Name }).ToListAsync(), "Id", "Name");
        ViewBag.Suppliers = new SelectList(await db.Suppliers.OrderBy(supplier => supplier.Name).ToListAsync(), "Id", "Name");
    }

    public async Task<IActionResult> Batches(int partId)
    {
        var part = await db.Parts.FindAsync(partId);
        if (part == null) return NotFound();
        ViewBag.Part = part;
        var batches = await db.StockBatches.Include(b => b.PurchaseLine).Where(b => b.PartId == partId).OrderBy(b => b.ReceivedAtUtc).ToListAsync();
        return View(batches);
    }

    public async Task<IActionResult> Adjust(int batchId)
    {
        var batch = await db.StockBatches.Include(b => b.Part).FirstOrDefaultAsync(b => b.Id == batchId);
        if (batch == null) return NotFound();
        return View(new StockAdjustmentViewModel { StockBatchId = batch.Id, PartName = batch.Part.Name, AvailableQuantity = batch.AvailableQuantity, Unit = batch.Part.Unit });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Adjust(StockAdjustmentViewModel model)
    {
        var batch = await db.StockBatches.Include(b => b.Part).FirstOrDefaultAsync(b => b.Id == model.StockBatchId);
        if (batch == null) return NotFound();
        if (!ModelState.IsValid) { model.PartName = batch.Part.Name; model.AvailableQuantity = batch.AvailableQuantity; model.Unit = batch.Part.Unit; return View(model); }

        var isDecrease = model.Type == StockMovementType.WriteOff || model.Type == StockMovementType.InventoryDecrease;
        if (isDecrease && model.Quantity > batch.AvailableQuantity)
        {
            ModelState.AddModelError("Quantity", "Нельзя списать больше доступного остатка партии.");
            model.PartName = batch.Part.Name; model.AvailableQuantity = batch.AvailableQuantity; model.Unit = batch.Part.Unit; return View(model);
        }

        var movement = new StockMovement
        {
            StockBatchId = batch.Id,
            Type = model.Type,
            Quantity = model.Quantity,
            UnitCost = batch.UnitCost,
            Reason = model.Reason.Trim(),
            CreatedByUserId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!
        };

        if (isDecrease) batch.AvailableQuantity -= model.Quantity;
        else if (model.Type == StockMovementType.InventoryIncrease) batch.AvailableQuantity += model.Quantity;

        db.StockMovements.Add(movement);
        await db.SaveChangesAsync();
        TempData["Success"] = "Остатки партии скорректированы.";
        return RedirectToAction(nameof(Batches), new { partId = batch.PartId });
    }
}