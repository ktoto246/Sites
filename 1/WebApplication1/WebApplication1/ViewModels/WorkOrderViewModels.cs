using System.ComponentModel.DataAnnotations;
using WebApplication1.Models.Entities;

namespace WebApplication1.ViewModels;

public sealed class WorkOrderFormViewModel
{
    public int? RepairRequestId { get; set; }
    [Display(Name = "Техника")][Range(1, int.MaxValue, ErrorMessage = "Выберите технику.")] public int EquipmentId { get; set; }
    [Display(Name = "Тип работ")] public WorkOrderType Type { get; set; } = WorkOrderType.Repair;
    [Display(Name = "Название")][Required(ErrorMessage = "Укажите название работ.")][StringLength(300)] public string Title { get; set; } = "";
    [Display(Name = "Описание")] [StringLength(2000)] public string? Description { get; set; }
    [Display(Name = "Начало")][Required] public DateTime PlannedStartLocal { get; set; } = DateTime.Now.AddHours(1);
    [Display(Name = "Окончание")][Required] public DateTime PlannedEndLocal { get; set; } = DateTime.Now.AddHours(5);
    [Display(Name = "Механики")][MinLength(1, ErrorMessage = "Назначьте хотя бы одного механика.")] public List<int> MechanicIds { get; set; } = [];
}

public sealed class WorkOrderListItemViewModel
{
    public int Id { get; init; }
    public string Title { get; init; } = "";
    public string Equipment { get; init; } = "";
    public WorkOrderType Type { get; init; }
    public WorkOrderStatus Status { get; init; }
    public DateTime? PlannedStartUtc { get; init; }
    public DateTime? PlannedEndUtc { get; init; }
    public string Mechanics { get; init; } = "";
}

public sealed class WorkOrderDetailsViewModel
{
    public WorkOrder WorkOrder { get; init; } = null!;
    public IReadOnlyList<WorkLog> Logs { get; init; } = [];
    public IReadOnlyList<PartRequirement> Requirements { get; init; } = [];
    public string? ConflictMessage { get; set; }
}

public sealed class PartRequirementFormViewModel
{
    public int? PartId { get; set; }
    public string? CustomName { get; set; }
    public decimal Quantity { get; set; }
    public string? Comment { get; set; }
}

public sealed class WorkLogFormViewModel
{
    [Required(ErrorMessage = "Опишите выполненную работу.")][StringLength(2000)] public string Description { get; set; } = "";
}

public sealed class CompletionFormViewModel
{
    [Required(ErrorMessage = "Заполните результат ремонта.")][StringLength(2000)] public string Result { get; set; } = "";
    [Range(0, 9_999_999)] public decimal EngineHours { get; set; }
}

public sealed class WorkStageFormViewModel
{
    [Required] public DateTime PlannedStartLocal { get; set; } = DateTime.Now.AddHours(1);
    [Required] public DateTime PlannedEndLocal { get; set; } = DateTime.Now.AddHours(5);
    [MinLength(1, ErrorMessage = "Назначьте хотя бы одного механика.")] public List<int> MechanicIds { get; set; } = [];
}
