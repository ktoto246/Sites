using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Models.Entities;

public class Part
{
    public int Id { get; set; }
    [Required, StringLength(80)] public string Article { get; set; } = "";
    [Required, StringLength(200)] public string Name { get; set; } = "";
    [Required, StringLength(20)] public string Unit { get; set; } = "шт.";
    public bool IsActive { get; set; } = true;
}

public class Supplier
{
    public int Id { get; set; }
    [Required, StringLength(200)] public string Name { get; set; } = "";
    [StringLength(100)] public string? Contact { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PartRequirement
{
    public int Id { get; set; }
    public int WorkOrderId { get; set; }
    public WorkOrder? WorkOrder { get; set; }
    public int? PartId { get; set; }
    public Part? Part { get; set; }
    public string? CustomName { get; set; }
    public decimal Quantity { get; set; }
    public decimal ReservedQuantity { get; set; }
    public decimal IssuedQuantity { get; set; }
    public RequirementStatus Status { get; set; }
    public string? Comment { get; set; }
}

public class Purchase
{
    public int Id { get; set; }
    public int SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;
    public PurchaseStatus Status { get; set; } = PurchaseStatus.Draft;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ExpectedAtUtc { get; set; }
    public DateTime? ReceivedAtUtc { get; set; }
    [StringLength(260)] public string? ReceiptStoredFileName { get; set; }
    [StringLength(260)] public string? ReceiptOriginalFileName { get; set; }
    public ICollection<PurchaseLine> Lines { get; set; } = new List<PurchaseLine>();
}

public class PurchaseLine
{
    public int Id { get; set; }
    public int PurchaseId { get; set; }
    public Purchase Purchase { get; set; } = null!;
    public int PartId { get; set; }
    public Part Part { get; set; } = null!;
    public int? PartRequirementId { get; set; }
    public PartRequirement? PartRequirement { get; set; }
    [Precision(18, 3)] public decimal OrderedQuantity { get; set; }
    [Precision(18, 3)] public decimal ReceivedQuantity { get; set; }
    [Precision(18, 2)] public decimal UnitPrice { get; set; }
}

public class StockBatch
{
    public int Id { get; set; }
    public int PartId { get; set; }
    public Part Part { get; set; } = null!;
    public int PurchaseLineId { get; set; }
    public PurchaseLine PurchaseLine { get; set; } = null!;
    [Precision(18, 3)] public decimal ReceivedQuantity { get; set; }
    [Precision(18, 3)] public decimal AvailableQuantity { get; set; }
    [Precision(18, 3)] public decimal ReservedQuantity { get; set; }
    [Precision(18, 2)] public decimal UnitCost { get; set; }
    public DateTime ReceivedAtUtc { get; set; }
    [Timestamp] public byte[] RowVersion { get; set; } = [];
}

public class StockMovement
{
    public int Id { get; set; }
    public int StockBatchId { get; set; }
    public StockBatch StockBatch { get; set; } = null!;
    public int? WorkOrderId { get; set; }
    public WorkOrder? WorkOrder { get; set; }
    public int? PartRequirementId { get; set; }
    public PartRequirement? PartRequirement { get; set; }
    public int? ReversesMovementId { get; set; }
    public StockMovement? ReversesMovement { get; set; }
    public StockMovementType Type { get; set; }
    [Precision(18, 3)] public decimal Quantity { get; set; }
    [Precision(18, 2)] public decimal UnitCost { get; set; }
    [Required, StringLength(1000)] public string Reason { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    [Required] public string CreatedByUserId { get; set; } = "";
    public ApplicationUser CreatedByUser { get; set; } = null!;
}

public class StatusHistory
{
    public int Id { get; set; }
    [Required, StringLength(80)] public string EntityType { get; set; } = "";
    public int EntityId { get; set; }
    [StringLength(100)] public string? PreviousStatus { get; set; }
    [Required, StringLength(100)] public string NewStatus { get; set; } = "";
    [StringLength(1000)] public string? Reason { get; set; }
    public DateTime ChangedAtUtc { get; set; } = DateTime.UtcNow;
    [Required] public string ChangedByUserId { get; set; } = "";
    public ApplicationUser ChangedByUser { get; set; } = null!;
}

public class AuditLog
{
    public int Id { get; set; }
    [Required, StringLength(80)] public string EntityType { get; set; } = "";
    public int EntityId { get; set; }
    [Required, StringLength(80)] public string Action { get; set; } = "";
    [StringLength(2000)] public string? Details { get; set; }
    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }
}
