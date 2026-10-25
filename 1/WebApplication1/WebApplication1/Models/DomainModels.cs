namespace WebApplication1.Models;

public class Employee
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Position { get; set; } = "";
    public string Role { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Login { get; set; } = "";
    public string Password { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public ICollection<MaintenanceRequest> ReportedRequests { get; set; } = new List<MaintenanceRequest>();
}

public class Equipment
{
    public int Id { get; set; }
    public string InventoryNumber { get; set; } = "";
    public string Name { get; set; } = "";
    public string Brand { get; set; } = "";
    public string Model { get; set; } = "";
    public int Year { get; set; }
    public string Status { get; set; } = "";
    public string Location { get; set; } = "";
    public int? AssignedDriverId { get; set; }
    public Employee? AssignedDriver { get; set; }
    public int Hours { get; set; }
    public DateTime? WriteOffDate { get; set; }
    public string? WriteOffReason { get; set; }
    public ICollection<MaintenanceRequest> Requests { get; set; } = new List<MaintenanceRequest>();
    public ICollection<MaintenancePlan> MaintenancePlans { get; set; } = new List<MaintenancePlan>();
}

public class MaintenanceRequest
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }
    public int ReporterId { get; set; }
    public Employee? Reporter { get; set; }
    public int? MechanicId { get; set; }
    public Employee? Mechanic { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Priority { get; set; } = "Средний";
    public string Status { get; set; } = "Новая";
    public DateTime ReportedAt { get; set; }
    public DateTime? ScheduledFor { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? WorkPerformed { get; set; }
    public decimal Cost { get; set; }
    public ICollection<WorkPart> WorkParts { get; set; } = new List<WorkPart>();
}

public class MaintenancePlan
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }
    public int? MechanicId { get; set; }
    public Employee? Mechanic { get; set; }
    public string Title { get; set; } = "";
    public DateTime DueDate { get; set; }
    public int Hours { get; set; }
    public DateTime? WriteOffDate { get; set; }
    public string? WriteOffReason { get; set; }
    public string Status { get; set; } = "Запланировано";
}

public class Part
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Article { get; set; } = "";
    public string Unit { get; set; } = "шт.";
    public int StockQuantity { get; set; }
    public int MinStock { get; set; }
    public ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
    public ICollection<WorkPart> WorkParts { get; set; } = new List<WorkPart>();
}

public class Purchase
{
    public int Id { get; set; }
    public int PartId { get; set; }
    public Part? Part { get; set; }
    public string Supplier { get; set; } = "";
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public DateTime PurchaseDate { get; set; }
    public string ReceiptNumber { get; set; } = "";
    public int PurchasedById { get; set; }
    public Employee? PurchasedBy { get; set; }
    public decimal Total => Quantity * UnitPrice;
}

public class WorkPart
{
    public int Id { get; set; }
    public int RequestId { get; set; }
    public MaintenanceRequest? Request { get; set; }
    public int PartId { get; set; }
    public Part? Part { get; set; }
    public int Quantity { get; set; }
}


