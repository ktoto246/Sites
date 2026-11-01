using System.ComponentModel.DataAnnotations;
using WebApplication1.Models.Entities;

namespace WebApplication1.ViewModels;

public sealed class PartFormViewModel
{
    [Required(ErrorMessage = "Укажите артикул.")][StringLength(80)] public string Article { get; set; } = "";
    [Required(ErrorMessage = "Укажите название.")][StringLength(200)] public string Name { get; set; } = "";
    [Required(ErrorMessage = "Укажите единицу измерения.")][StringLength(20)] public string Unit { get; set; } = "шт.";
}

public sealed class PartStockListItemViewModel
{
    public int Id { get; init; }
    public string Article { get; init; } = "";
    public string Name { get; init; } = "";
    public string Unit { get; init; } = "";
    public decimal Available { get; init; }
    public decimal Reserved { get; init; }
}

public sealed class PurchaseFormViewModel
{
    [Range(1, int.MaxValue, ErrorMessage = "Выберите поставщика.")] public int SupplierId { get; set; }
    [Range(1, int.MaxValue, ErrorMessage = "Выберите деталь.")] public int PartId { get; set; }
    [Range(typeof(decimal), "0.001", "999999", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true, ErrorMessage = "Укажите количество.")] public decimal Quantity { get; set; }
    [Range(typeof(decimal), "0", "99999999", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true, ErrorMessage = "Укажите цену.")] public decimal UnitPrice { get; set; }
    [DataType(DataType.Date)][Display(Name = "Ожидаемое поступление")] public DateTime? ExpectedDate { get; set; }
}

public sealed class StockAdjustmentViewModel
{
    public int StockBatchId { get; set; }
    public string PartName { get; set; } = "";
    public decimal AvailableQuantity { get; set; }
    public string Unit { get; set; } = "";

    [Display(Name = "Тип операции")]
    public StockMovementType Type { get; set; } = StockMovementType.WriteOff;

    [Display(Name = "Количество")]
    [Range(typeof(decimal), "0.001", "999999", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true, ErrorMessage = "Укажите корректное количество.")]
    public decimal Quantity { get; set; }

    [Display(Name = "Причина (обязательно)")]
    [Required(ErrorMessage = "Укажите причину корректировки.")]
    [StringLength(1000)]
    public string Reason { get; set; } = "";
}