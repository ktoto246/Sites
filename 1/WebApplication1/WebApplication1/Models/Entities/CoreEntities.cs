using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace WebApplication1.Models.Entities;

public static class AppRoles
{
    public const string Administrator = "Administrator";
    public const string Dispatcher = "Dispatcher";
    public const string TractorDriver = "TractorDriver";
    public const string Mechanic = "Mechanic";
    public static readonly string[] All = [Administrator, Dispatcher, TractorDriver, Mechanic];

    public static string DisplayName(string role) => role switch
    {
        Administrator => "Администратор",
        Dispatcher => "Диспетчер",
        TractorDriver => "Тракторист",
        Mechanic => "Механик",
        _ => role
    };
}

public class ApplicationUser : IdentityUser
{
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
}

public class Employee
{
    public int Id { get; set; }
    [Required, StringLength(160)] public string FullName { get; set; } = "";
    [StringLength(32)] public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? DismissedAtUtc { get; set; }
    public ApplicationUser? User { get; set; }
}

public class Equipment
{
    public int Id { get; set; }
    [Required, StringLength(50)] public string InventoryNumber { get; set; } = "";
    [Required, StringLength(120)] public string Model { get; set; } = "";
    [StringLength(30)] public string? RegistrationNumber { get; set; }
    public decimal EngineHours { get; set; }
    public bool IsActive { get; set; } = true;
}

public class EngineHourReading
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public Equipment Equipment { get; set; } = null!;
    public decimal Hours { get; set; }
    public DateTime RecordedAtUtc { get; set; } = DateTime.UtcNow;
    [Required, StringLength(160)] public string Source { get; set; } = "";
    [StringLength(500)] public string? CorrectionReason { get; set; }
    public string? RecordedByUserId { get; set; }
    public ApplicationUser? RecordedByUser { get; set; }
}

public enum RequestStatus { New, Accepted, Rejected, Cancelled }
public enum WorkOrderType { Repair, Maintenance }
public enum WorkOrderStatus { Planned, InProgress, WaitingForParts, Completed, Cancelled }
public enum StageStatus { Planned, InProgress, Completed, Cancelled }
public enum RequirementStatus { Open, Fulfilled, Cancelled }
public enum PurchaseStatus { Draft, Ordered, PartiallyReceived, Received, Cancelled }
public enum StockMovementType { Receipt, Reservation, ReservationRelease, Issue, Use, Return, WriteOff, InventoryIncrease, InventoryDecrease, Reversal }

public class RepairRequest
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public Equipment Equipment { get; set; } = null!;
    [Required] public string AuthorUserId { get; set; } = "";
    public ApplicationUser AuthorUser { get; set; } = null!;
    [Required, StringLength(2000)] public string Description { get; set; } = "";
    public decimal EngineHours { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public RequestStatus Status { get; set; } = RequestStatus.New;
    [StringLength(1000)] public string? DecisionReason { get; set; }
    public WorkOrder? WorkOrder { get; set; }
}

public class WorkOrder
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public Equipment Equipment { get; set; } = null!;
    public int? RepairRequestId { get; set; }
    public RepairRequest? RepairRequest { get; set; }
    public int? MaintenanceRuleId { get; set; }
    public MaintenanceRule? MaintenanceRule { get; set; }
    public WorkOrderType Type { get; set; }
    public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Planned;
    [Required, StringLength(300)] public string Title { get; set; } = "";
    [StringLength(2000)] public string? Description { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? PlannedStartUtc { get; set; }
    public DateTime? PlannedEndUtc { get; set; }
    public DateTime? ActualStartUtc { get; set; }
    public DateTime? ActualEndUtc { get; set; }
    [StringLength(2000)] public string? Result { get; set; }
    [StringLength(1000)] public string? CancellationReason { get; set; }
    [Timestamp] public byte[] RowVersion { get; set; } = [];
    public ICollection<WorkStage> Stages { get; set; } = new List<WorkStage>();
}

public class WorkStage
{
    public int Id { get; set; }
    public int WorkOrderId { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;
    public StageStatus Status { get; set; } = StageStatus.Planned;
    public DateTime PlannedStartUtc { get; set; }
    public DateTime PlannedEndUtc { get; set; }
    public DateTime? ActualStartUtc { get; set; }
    public DateTime? ActualEndUtc { get; set; }
    [StringLength(1000)] public string? EndReason { get; set; }
    public ICollection<MechanicAssignment> Assignments { get; set; } = new List<MechanicAssignment>();
}

public class MechanicAssignment
{
    public int Id { get; set; }
    public int WorkStageId { get; set; }
    public WorkStage WorkStage { get; set; } = null!;
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public DateTime PlannedStartUtc { get; set; }
    public DateTime PlannedEndUtc { get; set; }
    public DateTime? ActualStartUtc { get; set; }
    public DateTime? ActualEndUtc { get; set; }
    public bool IsCancelled { get; set; }
    [StringLength(1000)] public string? CancellationReason { get; set; }
}

public class WorkLog
{
    public int Id { get; set; }
    public int WorkOrderId { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;
    public int? WorkStageId { get; set; }
    public WorkStage? WorkStage { get; set; }
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    [Required, StringLength(2000)] public string Description { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public class MaintenanceRule
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public Equipment Equipment { get; set; } = null!;
    [Required, StringLength(200)] public string Name { get; set; } = "";
    public int? IntervalDays { get; set; }
    public decimal? IntervalHours { get; set; }
    public int? WarningDays { get; set; }
    public decimal? WarningHours { get; set; }
    public DateTime BaselineDateUtc { get; set; }
    public decimal BaselineHours { get; set; }
    public bool IsActive { get; set; } = true;
}

public class MaintenanceRecord
{
    public int Id { get; set; }
    public int MaintenanceRuleId { get; set; }
    public MaintenanceRule MaintenanceRule { get; set; } = null!;
    public int WorkOrderId { get; set; }
    public WorkOrder WorkOrder { get; set; } = null!;
    public DateTime CompletedAtUtc { get; set; }
    public decimal EngineHours { get; set; }
}
