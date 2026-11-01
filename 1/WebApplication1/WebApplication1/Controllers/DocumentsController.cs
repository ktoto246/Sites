using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models.Entities;

namespace WebApplication1.Controllers;

[Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
public sealed class DocumentsController(ApplicationDbContext db, IWebHostEnvironment environment) : Controller
{
    public async Task<IActionResult> Receipt(int id)
    {
        var purchase = await db.Purchases.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id);
        if (purchase?.ReceiptStoredFileName is null) return NotFound();
        var folder = Path.Combine(environment.ContentRootPath, "App_Data", "Receipts");
        var path = Path.Combine(folder, Path.GetFileName(purchase.ReceiptStoredFileName));
        if (!System.IO.File.Exists(path)) return NotFound();
        return PhysicalFile(path, "application/pdf", purchase.ReceiptOriginalFileName ?? "receipt.pdf", enableRangeProcessing: true);
    }
}
