using System.ComponentModel.DataAnnotations;

namespace WebApplication1.ViewModels;

public sealed class MaintenanceRuleFormViewModel
{
    [Range(1, int.MaxValue, ErrorMessage = "Выберите технику.")] public int EquipmentId { get; set; }
    [Required(ErrorMessage = "Укажите название ТО.")][StringLength(200)] public string Name { get; set; } = "";
    [Range(1, 36500, ErrorMessage = "Укажите положительный интервал.")] public int? IntervalDays { get; set; }
    [Range(typeof(decimal), "1", "999999", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true, ErrorMessage = "Укажите положительный интервал.")] public decimal? IntervalHours { get; set; }
    [Range(0, 36500, ErrorMessage = "Укажите неотрицательное значение.")] public int? WarningDays { get; set; }
    [Range(typeof(decimal), "0", "999999", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true, ErrorMessage = "Укажите неотрицательное значение.")] public decimal? WarningHours { get; set; }
}

public sealed class MaintenanceRuleListItemViewModel
{
    public int Id { get; init; }
    public string Equipment { get; init; } = "";
    public string Name { get; init; } = "";
    public string Status { get; init; } = "";
    public DateTime? NextDateUtc { get; init; }
    public decimal? NextHours { get; init; }
}
