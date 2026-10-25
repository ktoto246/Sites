using WebApplication1.Models;

namespace WebApplication1.Data;

public static class SeedData
{
    public static void Initialize(AppDbContext db)
    {
        if (db.Employees.Any()) return;

        var employees = new[]
        {
            new Employee { FullName = "Иванов Сергей Петрович", Position = "Администратор системы", Role = "admin", Phone = "+7 900 120-10-01", Login = "admin", Password = "admin123", IsActive = true },
            new Employee { FullName = "Кузнецова Мария Андреевна", Position = "Диспетчер", Role = "dispatcher", Phone = "+7 900 120-10-02", Login = "dispatcher", Password = "dispatcher123", IsActive = true },
            new Employee { FullName = "Соколов Алексей Викторович", Position = "Механик", Role = "mechanic", Phone = "+7 900 120-10-03", Login = "mechanic", Password = "mechanic123", IsActive = true },
            new Employee { FullName = "Петров Михаил Олегович", Position = "Механик", Role = "mechanic", Phone = "+7 900 120-10-04", Login = "mechanic2", Password = "mechanic123", IsActive = true },
            new Employee { FullName = "Егоров Николай Иванович", Position = "Тракторист", Role = "driver", Phone = "+7 900 120-10-05" },
            new Employee { FullName = "Волков Андрей Сергеевич", Position = "Тракторист", Role = "driver", Phone = "+7 900 120-10-06" }
        };
        db.Employees.AddRange(employees);
        db.SaveChanges();

        var equipment = new[]
        {
            new Equipment { InventoryNumber = "TR-001", Name = "Трактор", Brand = "МТЗ", Model = "82.1", Year = 2021, Status = "В работе", Location = "Участок №1", AssignedDriverId = 5, Hours = 1840 },
            new Equipment { InventoryNumber = "TR-002", Name = "Трактор", Brand = "Кировец", Model = "К-744Р", Year = 2020, Status = "ТО скоро", Location = "Участок №2", AssignedDriverId = 6, Hours = 2360 },
            new Equipment { InventoryNumber = "CM-014", Name = "Комбайн", Brand = "Ростсельмаш", Model = "ACROS 595 Plus", Year = 2022, Status = "В работе", Location = "Гараж", AssignedDriverId = 6, Hours = 980 },
            new Equipment { InventoryNumber = "PL-007", Name = "Плуг оборотный", Brand = "Lemken", Model = "Juwel 8", Year = 2023, Status = "Исправен", Location = "Склад навесного", AssignedDriverId = null, Hours = 320 },
            new Equipment { InventoryNumber = "OP-003", Name = "Опрыскиватель", Brand = "Amazone", Model = "UX 5200", Year = 2021, Status = "В ремонте", Location = "Ремонтная зона", AssignedDriverId = null, Hours = 710 }
        };
        db.Equipment.AddRange(equipment);
        db.SaveChanges();

        var parts = new[]
        {
            new Part { Name = "Масляный фильтр", Article = "OF-206", Unit = "шт.", StockQuantity = 14, MinStock = 6 },
            new Part { Name = "Дизельное масло 15W-40", Article = "OIL-15W40", Unit = "л", StockQuantity = 86, MinStock = 40 },
            new Part { Name = "Ремень привода вентилятора", Article = "BELT-82", Unit = "шт.", StockQuantity = 3, MinStock = 4 },
            new Part { Name = "Гидравлический шланг", Article = "HYD-12", Unit = "шт.", StockQuantity = 8, MinStock = 3 },
            new Part { Name = "Комплект уплотнителей", Article = "SEAL-744", Unit = "компл.", StockQuantity = 2, MinStock = 2 }
        };
        db.Parts.AddRange(parts);
        db.SaveChanges();

        var requests = new[]
        {
            new MaintenanceRequest { EquipmentId = 5, ReporterId = 6, MechanicId = 3, Title = "Подтекает гидравлика", Description = "Следы масла на левом рукаве, требуется диагностика и замена шланга.", Priority = "Высокий", Status = "В работе", ReportedAt = DateTime.Today.AddDays(-1), ScheduledFor = DateTime.Today, WorkPerformed = "Диагностика выполнена" },
            new MaintenanceRequest { EquipmentId = 2, ReporterId = 6, MechanicId = 4, Title = "Плановое ТО-2", Description = "Замена масла, фильтров и проверка ходовой части.", Priority = "Средний", Status = "Ожидает запчасти", ReportedAt = DateTime.Today.AddDays(-3), ScheduledFor = DateTime.Today.AddDays(2) },
            new MaintenanceRequest { EquipmentId = 1, ReporterId = 5, MechanicId = 3, Title = "Замена масла", Description = "Плановая замена масла после 250 моточасов.", Priority = "Низкий", Status = "Завершена", ReportedAt = DateTime.Today.AddDays(-10), ScheduledFor = DateTime.Today.AddDays(-7), CompletedAt = DateTime.Today.AddDays(-7), WorkPerformed = "Масло заменено, фильтр установлен, узлы проверены.", Cost = 6850 },
            new MaintenanceRequest { EquipmentId = 3, ReporterId = 6, MechanicId = 4, Title = "Проверка жатки", Description = "Сезонная диагностика перед уборочной кампанией.", Priority = "Средний", Status = "Новая", ReportedAt = DateTime.Today, ScheduledFor = DateTime.Today.AddDays(5) }
        };
        db.MaintenanceRequests.AddRange(requests);
        db.SaveChanges();

        db.MaintenancePlans.AddRange(
            new MaintenancePlan { EquipmentId = 2, Title = "ТО-2: фильтры и ходовая", DueDate = DateTime.Today.AddDays(2), Hours = 2500, Status = "Запланировано", MechanicId = 4 },
            new MaintenancePlan { EquipmentId = 3, Title = "Сезонная диагностика", DueDate = DateTime.Today.AddDays(5), Hours = 1000, Status = "Запланировано", MechanicId = 3 },
            new MaintenancePlan { EquipmentId = 1, Title = "Контроль после ремонта", DueDate = DateTime.Today.AddDays(12), Hours = 2000, Status = "Запланировано", MechanicId = 3 }
        );
        db.Purchases.AddRange(
            new Purchase { PartId = 1, Supplier = "ООО «АгроСнаб»", Quantity = 20, UnitPrice = 460, PurchaseDate = DateTime.Today.AddDays(-4), ReceiptNumber = "ПН-1048", PurchasedById = 2 },
            new Purchase { PartId = 3, Supplier = "ЗАО «Техдеталь»", Quantity = 5, UnitPrice = 2850, PurchaseDate = DateTime.Today.AddDays(-9), ReceiptNumber = "ПН-1032", PurchasedById = 2 }
        );
        db.SaveChanges();
    }
}

