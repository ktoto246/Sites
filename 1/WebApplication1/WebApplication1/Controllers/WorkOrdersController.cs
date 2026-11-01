using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1.Data;
using WebApplication1.Models.Entities;
using WebApplication1.Services;
using WebApplication1.ViewModels;

namespace WebApplication1.Controllers;

[Authorize]
public sealed class WorkOrdersController(ApplicationDbContext db, SchedulingService scheduling) : Controller
{
    public async Task<IActionResult> Index()
    {
        var orders = db.WorkOrders.AsNoTracking().Include(order => order.Equipment).Include(order => order.Stages).ThenInclude(stage => stage.Assignments).ThenInclude(assignment => assignment.Employee).AsQueryable();
        if (User.IsInRole(AppRoles.TractorDriver))
        {
            var id = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            orders = orders.Where(order => order.RepairRequest != null && order.RepairRequest.AuthorUserId == id);
        }
        else if (User.IsInRole(AppRoles.Mechanic))
        {
            var employeeId = await GetCurrentEmployeeIdAsync();
            orders = orders.Where(order => order.Stages.Any(stage => stage.Assignments.Any(assignment => assignment.EmployeeId == employeeId)));
        }
        else if (!User.IsInRole(AppRoles.Administrator) && !User.IsInRole(AppRoles.Dispatcher)) return Forbid();

        var loadedOrders = await orders.OrderByDescending(order => order.CreatedAtUtc).ToListAsync();
        var result = loadedOrders.Select(order => new WorkOrderListItemViewModel
        {
            Id = order.Id,
            Title = order.Title,
            Equipment = order.Equipment.InventoryNumber + " — " + order.Equipment.Model,
            Type = order.Type,
            Status = order.Status,
            PlannedStartUtc = order.PlannedStartUtc,
            PlannedEndUtc = order.PlannedEndUtc,
            Mechanics = string.Join(", ", order.Stages.SelectMany(stage => stage.Assignments).Select(assignment => assignment.Employee.FullName).Distinct())
        }).ToList();
        return View(result);
    }

    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> Create(int? requestId = null)
    {
        var model = new WorkOrderFormViewModel { RepairRequestId = requestId };
        if (requestId is int id)
        {
            var request = await db.RepairRequests.Include(item => item.Equipment).FirstOrDefaultAsync(item => item.Id == id && item.WorkOrder == null);
            if (request is null) return NotFound();
            model.EquipmentId = request.EquipmentId;
            model.Title = $"Ремонт: {request.Equipment.InventoryNumber}";
            model.Description = request.Description;
        }
        await PopulateOptionsAsync();
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> Create(WorkOrderFormViewModel model)
    {
        if (model.PlannedEndLocal <= model.PlannedStartLocal) ModelState.AddModelError(nameof(model.PlannedEndLocal), "Окончание должно быть позже начала.");
        var equipment = await db.Equipments.FirstOrDefaultAsync(item => item.Id == model.EquipmentId);
        if (equipment is null) ModelState.AddModelError(nameof(model.EquipmentId), "Выберите доступную технику.");
        var start = model.PlannedStartLocal.ToUniversalTime();
        var end = model.PlannedEndLocal.ToUniversalTime();
        var conflict = ModelState.IsValid ? await scheduling.GetConflictAsync(model.EquipmentId, model.MechanicIds, start, end) : null;
        if (conflict is not null) ModelState.AddModelError(string.Empty, conflict);
        if (!ModelState.IsValid) { await PopulateOptionsAsync(); return View(model); }

        RepairRequest? request = null;
        if (model.RepairRequestId is int requestId)
        {
            request = await db.RepairRequests.FirstOrDefaultAsync(item => item.Id == requestId && item.WorkOrder == null);
            if (request is null) { ModelState.AddModelError(string.Empty, "Заявка недоступна для создания наряда."); await PopulateOptionsAsync(); return View(model); }
        }
        var order = new WorkOrder
        {
            EquipmentId = model.EquipmentId, RepairRequestId = model.RepairRequestId, Type = model.Type, Title = model.Title.Trim(), Description = model.Description?.Trim(), PlannedStartUtc = start, PlannedEndUtc = end
        };
        var stage = new WorkStage { PlannedStartUtc = start, PlannedEndUtc = end };
        foreach (var mechanicId in model.MechanicIds.Distinct()) stage.Assignments.Add(new MechanicAssignment { EmployeeId = mechanicId, PlannedStartUtc = start, PlannedEndUtc = end });
        order.Stages.Add(stage);
        if (request is not null) request.Status = RequestStatus.Accepted;
        db.WorkOrders.Add(order);
        await db.SaveChangesAsync();
        TempData["Success"] = "Заказ-наряд создан и механики назначены.";
        return RedirectToAction(nameof(Details), new { id = order.Id });
    }

    public async Task<IActionResult> Details(int id)
    {
        var order = await db.WorkOrders.IgnoreQueryFilters().Include(item => item.Equipment).Include(item => item.RepairRequest).ThenInclude(request => request!.AuthorUser).Include(item => item.Stages).ThenInclude(stage => stage.Assignments).ThenInclude(assignment => assignment.Employee).FirstOrDefaultAsync(item => item.Id == id);
        if (order is null || !await CanAccessAsync(order)) return NotFound();
        var logs = await db.WorkLogs.Include(log => log.Employee).Where(log => log.WorkOrderId == id).OrderByDescending(log => log.CreatedAtUtc).ToListAsync();
        var requirements = await db.PartRequirements.Include(requirement => requirement.Part).Where(requirement => requirement.WorkOrderId == id).OrderBy(requirement => requirement.Status).ToListAsync();
        ViewBag.Parts = new SelectList(await db.Parts.OrderBy(part => part.Article).Select(part => new { part.Id, Name = part.Article + " — " + part.Name }).ToListAsync(), "Id", "Name");
        var mechanics = await (from employee in db.Employees
            join user in db.Users on employee.Id equals user.EmployeeId
            join userRole in db.UserRoles on user.Id equals userRole.UserId
            join role in db.Roles on userRole.RoleId equals role.Id
            where role.Name == AppRoles.Mechanic
            orderby employee.FullName
            select new { employee.Id, employee.FullName }).Distinct().ToListAsync();
        ViewBag.Mechanics = new MultiSelectList(mechanics, "Id", "FullName");
        return View(new WorkOrderDetailsViewModel { WorkOrder = order, Logs = logs, Requirements = requirements });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher + "," + AppRoles.Mechanic)]
    public async Task<IActionResult> Start(int id)
    {
        var order = await db.WorkOrders.Include(item => item.Stages).ThenInclude(stage => stage.Assignments).FirstOrDefaultAsync(item => item.Id == id);
        if (order is null || !await CanAccessAsync(order)) return NotFound();
        if (order.Status != WorkOrderStatus.Planned) { TempData["Error"] = "Начать можно только запланированный наряд."; return RedirectToAction(nameof(Details), new { id }); }
        var now = DateTime.UtcNow;
        order.Status = WorkOrderStatus.InProgress; order.ActualStartUtc = now;
        var stage = order.Stages.Where(item => item.Status == StageStatus.Planned).OrderBy(item => item.PlannedStartUtc).FirstOrDefault();
        if (stage is not null) { stage.Status = StageStatus.InProgress; stage.ActualStartUtc = now; foreach(var assignment in stage.Assignments) assignment.ActualStartUtc = now; }
        await db.SaveChangesAsync(); TempData["Success"] = "Работа начата."; return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher + "," + AppRoles.Mechanic)]
    public async Task<IActionResult> WaitForParts(int id)
    {
        var order = await db.WorkOrders.Include(item => item.Stages).ThenInclude(stage => stage.Assignments).FirstOrDefaultAsync(item => item.Id == id);
        if (order is null || !await CanAccessAsync(order)) return NotFound();
        if (order.Status != WorkOrderStatus.InProgress) { TempData["Error"] = "Ожидание деталей можно установить только для начатого ремонта."; return RedirectToAction(nameof(Details), new { id }); }
        var now = DateTime.UtcNow;
        foreach (var stage in order.Stages.Where(item => item.Status is StageStatus.Planned or StageStatus.InProgress))
        {
            stage.Status = StageStatus.Completed; stage.ActualEndUtc = now; stage.EndReason = "Ожидание деталей";
            foreach (var assignment in stage.Assignments.Where(item => !item.IsCancelled)) { assignment.ActualEndUtc = now; if (assignment.PlannedStartUtc > now) { assignment.IsCancelled = true; assignment.CancellationReason = "Этап освобождён из-за ожидания деталей"; } }
        }
        order.Status = WorkOrderStatus.WaitingForParts; order.PlannedStartUtc = null; order.PlannedEndUtc = null;
        await db.SaveChangesAsync(); TempData["Success"] = "Механики освобождены, техника остаётся в ремонте до поступления деталей."; return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> Cancel(int id, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason)) { TempData["Error"] = "Укажите причину отмены."; return RedirectToAction(nameof(Details), new { id }); }
        var order = await db.WorkOrders.Include(item => item.RepairRequest).FirstOrDefaultAsync(item => item.Id == id);
        if (order is null || order.Status is WorkOrderStatus.Completed or WorkOrderStatus.Cancelled) return NotFound();
        order.Status = WorkOrderStatus.Cancelled; order.CancellationReason = reason.Trim(); if (order.RepairRequest is not null) order.RepairRequest.Status = RequestStatus.Cancelled;
        await db.SaveChangesAsync(); TempData["Success"] = "Заказ-наряд отменён, история сохранена."; return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher + "," + AppRoles.Mechanic)]
    public async Task<IActionResult> AddLog(int id, WorkLogFormViewModel form)
    {
        var order = await db.WorkOrders
            .Include(item => item.Stages).ThenInclude(stage => stage.Assignments)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (order is null || !await CanAccessAsync(order)) return NotFound();
        if (!ModelState.IsValid) { TempData["Error"] = "Введите описание выполненных работ."; return RedirectToAction(nameof(Details), new { id }); }

        db.WorkLogs.Add(new WorkLog { WorkOrderId = id, EmployeeId = await GetCurrentEmployeeIdAsync(), Description = form.Description.Trim() });
        await db.SaveChangesAsync();
        TempData["Success"] = "Запись добавлена в журнал работ.";
        return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost, ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher + "," + AppRoles.Mechanic)]
    public async Task<IActionResult> AddRequirement(int id, PartRequirementFormViewModel model)
    {
        var order = await db.WorkOrders.Include(item => item.Stages).ThenInclude(stage => stage.Assignments).FirstOrDefaultAsync(item => item.Id == id);
        if (order is null || !await CanAccessAsync(order)) return NotFound();

        if (model.PartId == null && string.IsNullOrWhiteSpace(model.CustomName))
        {
            TempData["Error"] = "Выберите деталь или напишите её название!";
            return RedirectToAction(nameof(Details), new { id });
        }

        db.PartRequirements.Add(new PartRequirement
        {
            WorkOrderId = id,
            PartId = model.PartId,
            CustomName = model.CustomName?.Trim(),
            Quantity = model.Quantity,
            Comment = model.Comment?.Trim()
        });

        await db.SaveChangesAsync();
        TempData["Success"] = "Потребность добавлена.";
        return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost, ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> BindCustomRequirement(int id, int realPartId)
    {
        var req = await db.PartRequirements.FindAsync(id);
        if (req == null || req.PartId != null) return NotFound();

        req.PartId = realPartId;
        req.CustomName = null;
        await db.SaveChangesAsync();

        TempData["Success"] = "Деталь привязана к справочнику. Теперь её можно зарезервировать.";
        return RedirectToAction(nameof(Details), new { id = req.WorkOrderId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> Reopen(int id, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            TempData["Error"] = "Укажите причину переоткрытия.";
            return RedirectToAction(nameof(Details), new { id });
        }

        var order = await db.WorkOrders.FirstOrDefaultAsync(item => item.Id == id);
        if (order is null || order.Status != WorkOrderStatus.Completed) return NotFound();

        // Скидываем статус в ожидание, чтобы диспетчер заново назначил рабочий слот через PlanNextStage
        order.Status = WorkOrderStatus.WaitingForParts;
        order.ActualEndUtc = null;

        db.WorkLogs.Add(new WorkLog
        {
            WorkOrderId = order.Id,
            EmployeeId = await GetCurrentEmployeeIdAsync(),
            Description = $"⚠️ Наряд переоткрыт диспетчером. Причина: {reason.Trim()}"
        });

        await db.SaveChangesAsync();
        TempData["Success"] = "Наряд переоткрыт. Теперь назначьте новый этап работы механикам.";
        return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher + "," + AppRoles.Mechanic)]
    public async Task<IActionResult> Complete(int id, CompletionFormViewModel form)
    {
        var order = await db.WorkOrders.Include(item => item.Equipment).Include(item => item.Stages).ThenInclude(stage => stage.Assignments).FirstOrDefaultAsync(item => item.Id == id);
        if (order is null || !await CanAccessAsync(order)) return NotFound();
        if (order.Status != WorkOrderStatus.InProgress) { TempData["Error"] = "Завершить можно только начатый наряд."; return RedirectToAction(nameof(Details), new { id }); }
        if (!ModelState.IsValid) { TempData["Error"] = "Заполните результат и корректные моточасы."; return RedirectToAction(nameof(Details), new { id }); }
        var unresolved = await db.PartRequirements.AnyAsync(requirement => requirement.WorkOrderId == id && requirement.Status == RequirementStatus.Open);
        if (unresolved) { TempData["Error"] = "Нельзя завершить наряд: разрешите все потребности в деталях."; return RedirectToAction(nameof(Details), new { id }); }
        var now = DateTime.UtcNow;
        order.Status = WorkOrderStatus.Completed; order.ActualEndUtc = now; order.Result = form.Result.Trim();
        foreach (var stage in order.Stages.Where(stage => stage.Status == StageStatus.InProgress || stage.Status == StageStatus.Planned))
        {
            stage.Status = StageStatus.Completed; stage.ActualEndUtc = now;
            foreach (var assignment in stage.Assignments.Where(assignment => !assignment.IsCancelled)) assignment.ActualEndUtc = now;
        }
        if (form.EngineHours < order.Equipment.EngineHours) { TempData["Error"] = "Моточасы не могут быть меньше текущих значений техники."; return RedirectToAction(nameof(Details), new { id }); }
        if (form.EngineHours > order.Equipment.EngineHours) { order.Equipment.EngineHours = form.EngineHours; db.EngineHourReadings.Add(new EngineHourReading { EquipmentId = order.EquipmentId, Hours = form.EngineHours, Source = "Завершение заказ-наряда", RecordedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) }); }
        await db.SaveChangesAsync(); TempData["Success"] = "Ремонт завершён, история сохранена."; return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher + "," + AppRoles.Mechanic)]
    public async Task<IActionResult> UseRequirement(int id)
    {
        var requirement = await db.PartRequirements.Include(item => item.Part).FirstOrDefaultAsync(item => item.Id == id);
        if (requirement is null || !await CanAccessAsync(await db.WorkOrders.FirstAsync(order => order.Id == requirement.WorkOrderId))) return NotFound();
        if (requirement.IssuedQuantity >= requirement.ReservedQuantity) { TempData["Error"] = "Все зарезервированные детали уже списаны в ремонт."; return RedirectToAction(nameof(Details), new { id = requirement.WorkOrderId }); }
        var reservations = await db.StockMovements.Include(move => move.StockBatch).Where(move => move.PartRequirementId == id && move.Type == StockMovementType.Reservation).ToListAsync();
        var alreadyUsed = await db.StockMovements.Where(move => move.PartRequirementId == id && move.Type == StockMovementType.Use).SumAsync(move => (decimal?)move.Quantity) ?? 0m;
        var availableToUse = reservations.Sum(move => move.Quantity) - alreadyUsed;
        if (availableToUse <= 0) { TempData["Error"] = "Для этой потребности нет доступного резерва."; return RedirectToAction(nameof(Details), new { id = requirement.WorkOrderId }); }
        var remaining = availableToUse;
        foreach (var reservation in reservations.OrderBy(move => move.CreatedAtUtc))
        {
            var alreadyFromBatch = await db.StockMovements.Where(move => move.PartRequirementId == id && move.Type == StockMovementType.Use && move.StockBatchId == reservation.StockBatchId).SumAsync(move => (decimal?)move.Quantity) ?? 0m;
            var quantity = Math.Min(reservation.Quantity - alreadyFromBatch, remaining);
            if (quantity <= 0) continue;
            reservation.StockBatch.ReservedQuantity -= quantity;
            reservation.StockBatch.AvailableQuantity -= quantity;
            db.StockMovements.Add(new StockMovement { StockBatchId = reservation.StockBatchId, WorkOrderId = requirement.WorkOrderId, PartRequirementId = requirement.Id, Type = StockMovementType.Use, Quantity = quantity, UnitCost = reservation.StockBatch.UnitCost, Reason = "Фактическое использование в ремонте", CreatedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)! });
            requirement.IssuedQuantity += quantity; remaining -= quantity;
            if (remaining <= 0) break;
        }
        await db.SaveChangesAsync(); TempData["Success"] = "Детали списаны на ремонт."; return RedirectToAction(nameof(Details), new { id = requirement.WorkOrderId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> PlanNextStage(int id, WorkStageFormViewModel form)
    {
        var order = await db.WorkOrders.FirstOrDefaultAsync(item => item.Id == id);
        if (order is null) return NotFound();
        if (order.Status != WorkOrderStatus.WaitingForParts) { TempData["Error"] = "Новый этап можно назначить только после ожидания деталей."; return RedirectToAction(nameof(Details), new { id }); }
        if (form.PlannedEndLocal <= form.PlannedStartLocal) ModelState.AddModelError(nameof(form.PlannedEndLocal), "Окончание должно быть позже начала.");
        var start = form.PlannedStartLocal.ToUniversalTime(); var end = form.PlannedEndLocal.ToUniversalTime();
        var conflict = ModelState.IsValid ? await scheduling.GetConflictAsync(order.EquipmentId, form.MechanicIds, start, end, order.Id) : null;
        if (conflict is not null) ModelState.AddModelError(string.Empty, conflict);
        if (!ModelState.IsValid) { TempData["Error"] = string.Join(" ", ModelState.Values.SelectMany(value => value.Errors).Select(error => error.ErrorMessage)); return RedirectToAction(nameof(Details), new { id }); }
        var stage = new WorkStage { WorkOrderId = id, PlannedStartUtc = start, PlannedEndUtc = end };
        foreach (var mechanicId in form.MechanicIds.Distinct()) stage.Assignments.Add(new MechanicAssignment { EmployeeId = mechanicId, PlannedStartUtc = start, PlannedEndUtc = end });
        db.WorkStages.Add(stage); order.PlannedStartUtc = start; order.PlannedEndUtc = end; order.Status = WorkOrderStatus.Planned;
        await db.SaveChangesAsync(); TempData["Success"] = "Новый рабочий этап запланирован, механики снова назначены."; return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> ReserveRequirement(int id)
    {
        var requirement = await db.PartRequirements.Include(item => item.Part).FirstOrDefaultAsync(item => item.Id == id);
        if (requirement is null || requirement.Status != RequirementStatus.Open) return NotFound();

        var remaining = requirement.Quantity - requirement.ReservedQuantity;
        if (remaining <= 0) { TempData["Error"] = "Потребность уже полностью зарезервирована."; return RedirectToAction(nameof(Details), new { id = requirement.WorkOrderId }); }

        var batches = await db.StockBatches.Where(batch => batch.PartId == requirement.PartId && batch.AvailableQuantity - batch.ReservedQuantity > 0).OrderBy(batch => batch.ReceivedAtUtc).ToListAsync();

        // Считаем суммарно доступный остаток по всем партиям
        var totalAvailable = batches.Sum(b => b.AvailableQuantity - b.ReservedQuantity);
        if (remaining > totalAvailable)
        {
            TempData["Error"] = $"Нельзя зарезервировать: требуется {remaining:0.###}, а на складе свободно только {totalAvailable:0.###} {requirement.Part.Unit}. Оформите закупку!";
            return RedirectToAction(nameof(Details), new { id = requirement.WorkOrderId });
        }

        var need = remaining;
        foreach (var batch in batches)
        {
            var quantity = Math.Min(need, batch.AvailableQuantity - batch.ReservedQuantity);
            if (quantity <= 0) continue;

            batch.ReservedQuantity += quantity;
            need -= quantity;

            db.StockMovements.Add(new StockMovement
            {
                StockBatchId = batch.Id,
                WorkOrderId = requirement.WorkOrderId,
                PartRequirementId = requirement.Id,
                Type = StockMovementType.Reservation,
                Quantity = quantity,
                UnitCost = batch.UnitCost,
                Reason = "Резерв под заказ-наряд",
                CreatedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!
            });

            if (need == 0) break;
        }

        requirement.ReservedQuantity += remaining - need;
        if (need == 0) requirement.Status = RequirementStatus.Fulfilled;

        await db.SaveChangesAsync();
        TempData["Success"] = "Деталь успешно зарезервирована со склада.";
        return RedirectToAction(nameof(Details), new { id = requirement.WorkOrderId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher)]
    public async Task<IActionResult> CancelRequirement(int id)
    {
        var req = await db.PartRequirements.Include(item => item.Part).FirstOrDefaultAsync(item => item.Id == id);
        if (req is null || req.Status == RequirementStatus.Cancelled) return NotFound();
        if (req.IssuedQuantity > 0) { TempData["Error"] = "Нельзя отменить: есть списанные детали. Сначала оформите их возврат."; return RedirectToAction(nameof(Details), new { id = req.WorkOrderId }); }

        if (req.ReservedQuantity > 0)
        {
            var reservations = await db.StockMovements.Include(m => m.StockBatch).Where(m => m.PartRequirementId == id && m.Type == StockMovementType.Reservation).ToListAsync();
            foreach (var res in reservations)
            {
                var batch = res.StockBatch;
                batch.ReservedQuantity -= res.Quantity;
                db.StockMovements.Add(new StockMovement { StockBatchId = batch.Id, WorkOrderId = req.WorkOrderId, PartRequirementId = req.Id, Type = StockMovementType.ReservationRelease, Quantity = res.Quantity, UnitCost = batch.UnitCost, Reason = "Отмена потребности", CreatedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)! });
            }
            req.ReservedQuantity = 0;
        }

        req.Status = RequirementStatus.Cancelled;
        await db.SaveChangesAsync();
        TempData["Success"] = "Потребность отменена, резерв освобождён.";
        return RedirectToAction(nameof(Details), new { id = req.WorkOrderId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = AppRoles.Administrator + "," + AppRoles.Dispatcher + "," + AppRoles.Mechanic)]
    public async Task<IActionResult> ReturnRequirement(int id, decimal returnQuantity)
    {
        if (returnQuantity <= 0) { TempData["Error"] = "Укажите количество для возврата."; return RedirectToAction(nameof(Details), new { id }); }

        var req = await db.PartRequirements.Include(r => r.Part).FirstOrDefaultAsync(r => r.Id == id);
        if (req == null) return NotFound();
        if (returnQuantity > req.IssuedQuantity) { TempData["Error"] = "Нельзя вернуть больше, чем было списано."; return RedirectToAction(nameof(Details), new { id = req.WorkOrderId }); }

        var uses = await db.StockMovements.Include(m => m.StockBatch)
                         .Where(m => m.PartRequirementId == id && m.Type == StockMovementType.Use)
                         .OrderByDescending(m => m.CreatedAtUtc)
                         .ToListAsync();

        var remaining = returnQuantity;
        foreach (var use in uses)
        {
            var alreadyReturned = await db.StockMovements.Where(m => m.ReversesMovementId == use.Id && m.Type == StockMovementType.Return).SumAsync(m => (decimal?)m.Quantity) ?? 0m;
            var availableToReturnFromUse = use.Quantity - alreadyReturned;
            if (availableToReturnFromUse <= 0) continue;

            var qtyToReturn = Math.Min(availableToReturnFromUse, remaining);
            use.StockBatch.AvailableQuantity += qtyToReturn; // Возвращаем доступный остаток на склад

            db.StockMovements.Add(new StockMovement { StockBatchId = use.StockBatchId, WorkOrderId = req.WorkOrderId, PartRequirementId = req.Id, ReversesMovementId = use.Id, Type = StockMovementType.Return, Quantity = qtyToReturn, UnitCost = use.StockBatch.UnitCost, Reason = "Возврат детали из ремонта", CreatedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)! });

            req.IssuedQuantity -= qtyToReturn;
            remaining -= qtyToReturn;
            if (remaining <= 0) break;
        }

        await db.SaveChangesAsync();
        TempData["Success"] = $"Успешно возвращено {returnQuantity:0.###} {req.Part.Unit} на склад.";
        return RedirectToAction(nameof(Details), new { id = req.WorkOrderId });
    }

    private async Task PopulateOptionsAsync()
    {
        ViewBag.Equipments = new SelectList(await db.Equipments.OrderBy(item => item.InventoryNumber).Select(item => new { item.Id, Name = item.InventoryNumber + " — " + item.Model }).ToListAsync(), "Id", "Name");
        var mechanics = await (from employee in db.Employees
            join user in db.Users on employee.Id equals user.EmployeeId
            join userRole in db.UserRoles on user.Id equals userRole.UserId
            join role in db.Roles on userRole.RoleId equals role.Id
            where role.Name == AppRoles.Mechanic
            orderby employee.FullName
            select new { employee.Id, employee.FullName }).Distinct().ToListAsync();
        ViewBag.Mechanics = new MultiSelectList(mechanics, "Id", "FullName");
    }

    private async Task<int> GetCurrentEmployeeIdAsync() => await db.Users.Where(user => user.Id == User.FindFirstValue(ClaimTypes.NameIdentifier)).Select(user => user.EmployeeId ?? 0).SingleAsync();
    private async Task<bool> CanAccessAsync(WorkOrder order)
    {
        if (User.IsInRole(AppRoles.Administrator) || User.IsInRole(AppRoles.Dispatcher)) return true;
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        if (User.IsInRole(AppRoles.TractorDriver)) return order.RepairRequest?.AuthorUserId == userId;
        if (!User.IsInRole(AppRoles.Mechanic)) return false;
        var employeeId = await GetCurrentEmployeeIdAsync();
        return order.Stages.SelectMany(stage => stage.Assignments).Any(assignment => assignment.EmployeeId == employeeId);
    }
}
