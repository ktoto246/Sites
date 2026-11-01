using System.ComponentModel.DataAnnotations;

namespace WebApplication1.ViewModels;

public sealed class EquipmentFormViewModel
{
    public int Id { get; set; }
    [Required(ErrorMessage = "Укажите инвентарный номер.")][StringLength(50)] public string InventoryNumber { get; set; } = "";
    [Required(ErrorMessage = "Укажите модель.")][StringLength(120)] public string Model { get; set; } = "";
    [StringLength(30)] public string? RegistrationNumber { get; set; }
    [Range(0, 9_999_999, ErrorMessage = "Укажите корректные моточасы.")] public decimal EngineHours { get; set; }
}
