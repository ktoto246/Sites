using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models.Entities;

namespace WebApplication1.Data;

public static class DevelopmentDataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        await db.Database.MigrateAsync();
        var roles = services.GetRequiredService<RoleManager<IdentityRole>>();
        var users = services.GetRequiredService<UserManager<ApplicationUser>>();

        foreach (var role in AppRoles.All)
            if (!await roles.RoleExistsAsync(role)) Ensure(await roles.CreateAsync(new IdentityRole(role)));

        var accounts = new (string Login, string Name, string Role, string Phone)[]
        {
            ("admin", "Ирина Сергеевна Орлова", AppRoles.Administrator, "+7 (900) 000-00-01"),
            ("dispatcher", "Марина Викторовна Белова", AppRoles.Dispatcher, "+7 (900) 000-00-02"),
            ("driver", "Алексей Петрович Смирнов", AppRoles.TractorDriver, "+7 (900) 000-00-03"),
            ("mechanic", "Сергей Николаевич Волков", AppRoles.Mechanic, "+7 (900) 000-00-04"),
            ("mechanic2", "Дмитрий Андреевич Кузнецов", AppRoles.Mechanic, "+7 (900) 000-00-05")
        };

        foreach (var (login, name, role, phone) in accounts)
        {
            var user = await users.FindByNameAsync(login);
            if (user is null)
            {
                var employee = new Employee { FullName = name, Phone = phone };
                db.Employees.Add(employee);
                await db.SaveChangesAsync();
                user = new ApplicationUser { UserName = login, EmployeeId = employee.Id };
                Ensure(await users.CreateAsync(user, "Demo123!"));
            }
            else if (user.EmployeeId is int employeeId)
            {
                var employee = await db.Employees.IgnoreQueryFilters().FirstOrDefaultAsync(item => item.Id == employeeId);
                if (employee is not null && (employee.FullName.StartsWith("Демо ") || string.IsNullOrWhiteSpace(employee.FullName)))
                {
                    employee.FullName = name;
                    employee.Phone = phone;
                }
            }
            if (!await users.IsInRoleAsync(user, role)) Ensure(await users.AddToRoleAsync(user, role));
        }
        await db.SaveChangesAsync();

        var equipmentSeeds = new (string Number, string Model, string Registration, decimal Hours)[]
        {
            ("Т-001", "МТЗ-82.1", "К 582 АР 64", 3240),
            ("К-002", "Acros 595 Plus", "К 117 АР 64", 1875),
            ("Т-003", "John Deere 6M 155", "К 304 АР 64", 921),
            ("П-004", "Кировец К-742", "К 477 АР 64", 1430),
            ("О-005", "Ростсельмаш RSM 161", "К 810 АР 64", 2280)
        };
        foreach (var (number, model, registration, hours) in equipmentSeeds)
        {
            if (!await db.Equipments.IgnoreQueryFilters().AnyAsync(item => item.InventoryNumber == number))
                db.Equipments.Add(new Equipment { InventoryNumber = number, Model = model, RegistrationNumber = registration, EngineHours = hours });
        }

        var partSeeds = new (string Article, string Name, decimal Price)[]
        {
            ("F-001", "Масляный фильтр МТЗ", 850),
            ("B-004", "Ремень привода генератора", 1150),
            ("H-014", "Гидравлический шланг", 1320),
            ("G-022", "Комплект прокладок двигателя", 2460),
            ("L-008", "Подшипник 208", 640)
        };
        foreach (var (article, name, _) in partSeeds)
        {
            if (!await db.Parts.IgnoreQueryFilters().AnyAsync(item => item.Article == article))
                db.Parts.Add(new Part { Article = article, Name = name, Unit = "шт." });
        }

        var supplierSeeds = new (string Name, string Contact)[]
        {
            ("ООО «АгроЗапчасть»", "+7 (8452) 00-00-01"),
            ("ТехноПарк-Саратов", "+7 (8452) 00-00-02"),
            ("ИП Петров А.В.", "+7 (8452) 00-00-03"),
            ("Агромаш-Сервис", "+7 (8452) 00-00-04"),
            ("ПоволжьеТехСнаб", "+7 (8452) 00-00-05")
        };
        foreach (var (name, contact) in supplierSeeds)
        {
            if (!await db.Suppliers.IgnoreQueryFilters().AnyAsync(item => item.Name == name))
                db.Suppliers.Add(new Supplier { Name = name, Contact = contact });
        }
        await db.SaveChangesAsync();

        var driver = await users.FindByNameAsync("driver") ?? throw new InvalidOperationException("Не создан демо-тракторист.");
        var admin = await users.FindByNameAsync("admin") ?? throw new InvalidOperationException("Не создан демо-администратор.");
        var mechanics = await db.Employees.Where(item => item.FullName == "Сергей Николаевич Волков" || item.FullName == "Дмитрий Андреевич Кузнецов").OrderBy(item => item.Id).ToListAsync();
        var equipment = await db.Equipments.OrderBy(item => item.Id).ToListAsync();
        var parts = await db.Parts.OrderBy(item => item.Id).ToListAsync();
        var suppliers = await db.Suppliers.OrderBy(item => item.Id).ToListAsync();

        if (await db.EngineHourReadings.CountAsync() < 5)
        {
            foreach (var item in equipment.Take(5))
            {
                if (!await db.EngineHourReadings.AnyAsync(reading => reading.EquipmentId == item.Id))
                    db.EngineHourReadings.Add(new EngineHourReading { EquipmentId = item.Id, Hours = item.EngineHours, RecordedAtUtc = DateTime.UtcNow.AddDays(-15 + item.Id), Source = "Первичное заполнение демонстрационной базы", RecordedByUserId = admin.Id });
            }
            await db.SaveChangesAsync();
        }

        var targetNewOrders = Math.Max(0, 5 - await db.WorkOrders.CountAsync());
        var workTitles = new[] { "Ремонт гидравлической системы", "Замена приводного ремня", "Плановое ТО двигателя", "Диагностика трансмиссии", "Замена подшипника" };
        for (var index = 0; index < targetNewOrders; index++)
        {
            var machine = equipment[(index + 1) % equipment.Count];
            var started = DateTime.UtcNow.AddDays(-20 + index * 3);
            var request = new RepairRequest
            {
                EquipmentId = machine.Id,
                AuthorUserId = driver.Id,
                Description = $"Демонстрационная заявка: требуется {workTitles[index].ToLowerInvariant()}.",
                EngineHours = machine.EngineHours,
                CreatedAtUtc = started.AddHours(-3),
                Status = RequestStatus.Accepted
            };
            var order = new WorkOrder
            {
                EquipmentId = machine.Id,
                RepairRequest = request,
                Type = index == 2 ? WorkOrderType.Maintenance : WorkOrderType.Repair,
                Status = WorkOrderStatus.Completed,
                Title = workTitles[index],
                Description = "Учебные данные для демонстрации полного процесса ремонта.",
                CreatedAtUtc = started.AddDays(-1),
                PlannedStartUtc = started,
                PlannedEndUtc = started.AddHours(5),
                ActualStartUtc = started,
                ActualEndUtc = started.AddHours(4),
                Result = "Работы выполнены, техника допущена к эксплуатации."
            };
            var stage = new WorkStage { PlannedStartUtc = started, PlannedEndUtc = started.AddHours(5), ActualStartUtc = started, ActualEndUtc = started.AddHours(4), Status = StageStatus.Completed };
            stage.Assignments.Add(new MechanicAssignment { EmployeeId = mechanics[index % mechanics.Count].Id, PlannedStartUtc = started, PlannedEndUtc = started.AddHours(5), ActualStartUtc = started, ActualEndUtc = started.AddHours(4) });
            order.Stages.Add(stage);
            db.WorkOrders.Add(order);
        }
        await db.SaveChangesAsync();

        if (await db.RepairRequests.CountAsync() < 5)
        {
            for (var index = await db.RepairRequests.CountAsync(); index < 5; index++)
            {
                var machine = equipment[index % equipment.Count];
                db.RepairRequests.Add(new RepairRequest { EquipmentId = machine.Id, AuthorUserId = driver.Id, Description = $"Демонстрационная заявка без наряда №{index + 1}", EngineHours = machine.EngineHours, CreatedAtUtc = DateTime.UtcNow.AddDays(-index), Status = RequestStatus.New });
            }
            await db.SaveChangesAsync();
        }

        var orders = await db.WorkOrders.Include(item => item.Stages).OrderBy(item => item.Id).ToListAsync();
        if (await db.WorkStages.CountAsync() < 5 || await db.MechanicAssignments.CountAsync() < 5)
        {
            var missingStages = Math.Max(0, 5 - await db.WorkStages.CountAsync());
            for (var index = 0; index < missingStages; index++)
            {
                var order = orders[index % orders.Count];
                var start = DateTime.UtcNow.AddDays(-8 - index);
                var stage = new WorkStage { WorkOrderId = order.Id, PlannedStartUtc = start, PlannedEndUtc = start.AddHours(3), ActualStartUtc = start, ActualEndUtc = start.AddHours(3), Status = StageStatus.Completed, EndReason = "Учебный дополнительный этап" };
                stage.Assignments.Add(new MechanicAssignment { EmployeeId = mechanics[index % mechanics.Count].Id, PlannedStartUtc = start, PlannedEndUtc = start.AddHours(3), ActualStartUtc = start, ActualEndUtc = start.AddHours(3) });
                db.WorkStages.Add(stage);
            }
            await db.SaveChangesAsync();
        }

        if (await db.MechanicAssignments.CountAsync() < 5)
        {
            var stages = await db.WorkStages.OrderBy(item => item.Id).ToListAsync();
            for (var index = await db.MechanicAssignments.CountAsync(); index < 5; index++)
            {
                var stage = stages[index % stages.Count];
                db.MechanicAssignments.Add(new MechanicAssignment { WorkStageId = stage.Id, EmployeeId = mechanics[index % mechanics.Count].Id, PlannedStartUtc = stage.PlannedStartUtc, PlannedEndUtc = stage.PlannedEndUtc, ActualStartUtc = stage.ActualStartUtc, ActualEndUtc = stage.ActualEndUtc });
            }
            await db.SaveChangesAsync();
        }

        orders = await db.WorkOrders.Include(item => item.Stages).OrderBy(item => item.Id).ToListAsync();
        if (await db.WorkLogs.CountAsync() < 5)
        {
            foreach (var order in orders.Take(5))
            {
                if (!await db.WorkLogs.AnyAsync(log => log.WorkOrderId == order.Id))
                    db.WorkLogs.Add(new WorkLog { WorkOrderId = order.Id, WorkStageId = order.Stages.FirstOrDefault()?.Id, EmployeeId = mechanics[order.Id % mechanics.Count].Id, Description = "Осмотр выполнен, результаты работ внесены в заказ-наряд.", CreatedAtUtc = order.CreatedAtUtc.AddHours(1) });
            }
            await db.SaveChangesAsync();
        }

        if (await db.PartRequirements.CountAsync() < 5)
        {
            for (var index = 0; index < Math.Min(5, orders.Count); index++)
            {
                if (!await db.PartRequirements.AnyAsync(requirement => requirement.WorkOrderId == orders[index].Id))
                    db.PartRequirements.Add(new PartRequirement { WorkOrderId = orders[index].Id, PartId = parts[index % parts.Count].Id, Quantity = 1, ReservedQuantity = 1, IssuedQuantity = 1, Status = RequirementStatus.Fulfilled, Comment = "Учебная потребность в запасной части" });
            }
            await db.SaveChangesAsync();
        }

        if (await db.Purchases.CountAsync() < 5)
        {
            for (var index = await db.Purchases.CountAsync(); index < 5; index++)
            {
                var part = parts[index % parts.Count];
                var purchase = new Purchase
                {
                    SupplierId = suppliers[index % suppliers.Count].Id,
                    Status = PurchaseStatus.Received,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-30 + index * 4),
                    ExpectedAtUtc = DateTime.UtcNow.AddDays(-29 + index * 4),
                    ReceivedAtUtc = DateTime.UtcNow.AddDays(-28 + index * 4)
                };
                purchase.Lines.Add(new PurchaseLine { PartId = part.Id, OrderedQuantity = 5 + index, ReceivedQuantity = 5 + index, UnitPrice = partSeeds.First(item => item.Article == part.Article).Price });
                db.Purchases.Add(purchase);
                await db.SaveChangesAsync();
                var line = purchase.Lines.Single();
                db.StockBatches.Add(new StockBatch { PartId = part.Id, PurchaseLineId = line.Id, ReceivedQuantity = line.ReceivedQuantity, AvailableQuantity = line.ReceivedQuantity - 1, ReservedQuantity = 0, UnitCost = line.UnitPrice, ReceivedAtUtc = purchase.ReceivedAtUtc!.Value });
                await db.SaveChangesAsync();
            }
        }

        var batches = await db.StockBatches.OrderBy(item => item.Id).ToListAsync();
        var requirements = await db.PartRequirements.OrderBy(item => item.Id).ToListAsync();
        if (await db.StockMovements.CountAsync() < 5)
        {
            for (var index = await db.StockMovements.CountAsync(); index < 5; index++)
            {
                var batch = batches[index % batches.Count];
                var requirement = requirements[index % requirements.Count];
                db.StockMovements.Add(new StockMovement { StockBatchId = batch.Id, WorkOrderId = requirement.WorkOrderId, PartRequirementId = requirement.Id, Type = StockMovementType.Use, Quantity = 1, UnitCost = batch.UnitCost, Reason = "Учебное списание детали в ремонт", CreatedAtUtc = DateTime.UtcNow.AddDays(-10 + index), CreatedByUserId = admin.Id });
            }
            await db.SaveChangesAsync();
        }

        if (await db.MaintenanceRules.IgnoreQueryFilters().CountAsync() < 5)
        {
            for (var index = await db.MaintenanceRules.IgnoreQueryFilters().CountAsync(); index < 5; index++)
            {
                var machine = equipment[index % equipment.Count];
                db.MaintenanceRules.Add(new MaintenanceRule { EquipmentId = machine.Id, Name = $"Регламентное ТО-{index + 1}", IntervalDays = 180, IntervalHours = 250, WarningDays = 14, WarningHours = 25, BaselineDateUtc = DateTime.UtcNow.AddDays(-160 + index), BaselineHours = Math.Max(0, machine.EngineHours - 220) });
            }
            await db.SaveChangesAsync();
        }

        var rules = await db.MaintenanceRules.IgnoreQueryFilters().OrderBy(item => item.Id).ToListAsync();
        if (await db.MaintenanceRecords.CountAsync() < 5)
        {
            for (var index = await db.MaintenanceRecords.CountAsync(); index < 5; index++)
            {
                var rule = rules[index % rules.Count];
                var order = orders.FirstOrDefault(item => item.Type == WorkOrderType.Maintenance) ?? orders.First();
                db.MaintenanceRecords.Add(new MaintenanceRecord { MaintenanceRuleId = rule.Id, WorkOrderId = order.Id, CompletedAtUtc = order.ActualEndUtc ?? order.CreatedAtUtc, EngineHours = rule.BaselineHours });
            }
            await db.SaveChangesAsync();
        }

        if (await db.StatusHistories.CountAsync() < 5)
        {
            for (var index = await db.StatusHistories.CountAsync(); index < 5; index++)
            {
                var order = orders[index % orders.Count];
                db.StatusHistories.Add(new StatusHistory { EntityType = "WorkOrder", EntityId = order.Id, PreviousStatus = "Запланирован", NewStatus = "Завершён", Reason = "Учебная история изменения статуса", ChangedAtUtc = order.ActualEndUtc ?? order.CreatedAtUtc, ChangedByUserId = admin.Id });
            }
            await db.SaveChangesAsync();
        }

        if (await db.AuditLogs.CountAsync() < 5)
        {
            for (var index = await db.AuditLogs.CountAsync(); index < 5; index++)
            {
                var order = orders[index % orders.Count];
                db.AuditLogs.Add(new AuditLog { EntityType = "WorkOrder", EntityId = order.Id, Action = "Seeded", Details = "Учебная запись аудита", OccurredAtUtc = order.CreatedAtUtc, UserId = admin.Id });
            }
            await db.SaveChangesAsync();
        }
    }

    private static void Ensure(IdentityResult result)
    {
        if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(item => item.Description)));
    }
}
