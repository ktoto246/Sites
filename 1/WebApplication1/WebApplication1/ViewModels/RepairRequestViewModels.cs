using System.ComponentModel.DataAnnotations;
using WebApplication1.Models.Entities;

namespace WebApplication1.ViewModels;

public sealed class RepairRequestFormViewModel
{
    [Display(Name = "Техника")]
    [Range(1, int.MaxValue, ErrorMessage = "Выберите технику.")]
    public int EquipmentId { get; set; }

    [Display(Name = "Показание моточасов")]
    [Range(0, 9_999_999, ErrorMessage = "Укажите корректное значение моточасов.")]
    public decimal EngineHours { get; set; }

    [Display(Name = "Что произошло")]
    [Required(ErrorMessage = "Опишите неисправность.")]
    [StringLength(2000, MinimumLength = 10, ErrorMessage = "Описание должно содержать от 10 до 2000 символов.")]
    public string Description { get; set; } = "";
}

public sealed class RepairRequestListItemViewModel
{
    public int Id { get; init; }
    public string EquipmentName { get; init; } = "";
    public string Description { get; init; } = "";
    public RequestStatus Status { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime? PlannedEndUtc { get; init; }
    public bool HasDuplicateWarning { get; init; }
}
