using System.ComponentModel.DataAnnotations;

namespace WebApplication1.ViewModels;

public sealed class EmployeeFormViewModel
{
    [Required(ErrorMessage = "Укажите ФИО.")][StringLength(160)] public string FullName { get; set; } = "";
    [StringLength(32)] public string? Phone { get; set; }
    [Required(ErrorMessage = "Укажите логин.")][StringLength(64)] public string UserName { get; set; } = "";
    [Required(ErrorMessage = "Укажите роль.")] public string Role { get; set; } = "";
    [Required(ErrorMessage = "Укажите пароль.")][DataType(DataType.Password)][StringLength(100, MinimumLength = 6)] public string Password { get; set; } = "";
}
