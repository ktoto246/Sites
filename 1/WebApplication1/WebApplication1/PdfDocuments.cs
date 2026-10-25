using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WebApplication1.Models;
using WebApplication1.ViewModels;

namespace WebApplication1;

public static class PdfDocuments
{
    public static byte[] SystemReport(ReportsViewModel model) => Document.Create(document => document.Page(page =>
    {
        page.Margin(36); page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(11));
        page.Header().Text("АгроКонтроль — сводный отчёт").FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
        page.Content().Column(column => { column.Spacing(14); column.Item().Text($"Период отчёта: {model.DateFrom:dd.MM.yyyy} - {model.DateTo:dd.MM.yyyy}"); column.Item().Text($"Дата формирования: {DateTime.Today:dd.MM.yyyy}"); column.Item().Row(row => { row.RelativeItem().Text($"Всего заявок: {model.TotalRequests}"); row.RelativeItem().Text($"Завершено: {model.CompletedRequests}"); row.RelativeItem().Text($"В работе: {model.InProgressRequests}"); }); column.Item().Text($"Расходы на запчасти: {model.TotalSpend:N0} ₽").Bold(); column.Item().Text("Распределение заявок по статусам").FontSize(14).Bold(); column.Item().Table(table => { table.ColumnsDefinition(c => { c.RelativeColumn(); c.ConstantColumn(100); }); table.Header(h => { h.Cell().Text("Статус").Bold(); h.Cell().AlignRight().Text("Количество").Bold(); }); foreach (var item in model.Statuses) { table.Cell().Text(item.Label); table.Cell().AlignRight().Text(item.Count.ToString()); } }); }); page.Footer().AlignCenter().Text("Локальная веб-система учёта ТО и ремонта сельхозтехники");
    })).GeneratePdf();

    public static byte[] PurchaseReceipt(Purchase purchase) => Document.Create(document => document.Page(page =>
    {
        page.Margin(36); page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(11));
        page.Header().Text("Чек поступления запчастей").FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
        page.Content().Column(c => { c.Spacing(10); c.Item().Text($"Документ: {purchase.ReceiptNumber}"); c.Item().Text($"Дата: {purchase.PurchaseDate:dd.MM.yyyy}"); c.Item().Text($"Поставщик: {purchase.Supplier}"); c.Item().LineHorizontal(1); c.Item().Text($"Запчасть: {purchase.Part?.Name}").Bold(); c.Item().Text($"Артикул: {purchase.Part?.Article}"); c.Item().Text($"Количество: {purchase.Quantity} {purchase.Part?.Unit}"); c.Item().Text($"Цена за единицу: {purchase.UnitPrice:N2} ₽"); c.Item().Text($"Итого: {purchase.Total:N2} ₽").FontSize(14).Bold(); c.Item().LineHorizontal(1); c.Item().Text($"Оформил: {purchase.PurchasedBy?.FullName}"); }); page.Footer().AlignCenter().Text("АгроКонтроль — документ сформирован системой");
    })).GeneratePdf();

    public static byte[] WorkReport(MaintenanceRequest request) => Document.Create(document => document.Page(page =>
    {
        page.Margin(36); page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(11)); page.Header().Text("Карточка выполненной работы").FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
        page.Content().Column(c => { c.Spacing(10); c.Item().Text($"Заявка №{request.Id:000}"); c.Item().Text($"Техника: {request.Equipment?.Brand} {request.Equipment?.Model} ({request.Equipment?.InventoryNumber})"); c.Item().Text($"Неисправность: {request.Title}").Bold(); c.Item().Text(request.Description); c.Item().LineHorizontal(1); c.Item().Text("Выполненные работы").FontSize(14).Bold(); c.Item().Text(request.WorkPerformed ?? "Не указано"); c.Item().Text($"Исполнитель: {request.Mechanic?.FullName}"); c.Item().Text($"Дата завершения: {request.CompletedAt:dd.MM.yyyy}"); c.Item().Text("Использованные детали").FontSize(14).Bold(); foreach (var part in request.WorkParts) c.Item().Text($"• {part.Part?.Name} — {part.Quantity} {part.Part?.Unit}"); }); page.Footer().AlignCenter().Text("АгроКонтроль — карточка ремонта");
    })).GeneratePdf();
}


