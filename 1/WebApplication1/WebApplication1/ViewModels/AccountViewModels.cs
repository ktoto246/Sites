using System.ComponentModel.DataAnnotations;

namespace WebApplication1.ViewModels;

public sealed class LoginViewModel
{
    [Display(Name = "Логин")]
    [Required(ErrorMessage = "Введите логин.")]
    public string UserName { get; set; } = "";

    [Display(Name = "Пароль")]
    [Required(ErrorMessage = "Введите пароль.")]
    [DataType(DataType.Password)]
    public string Password { get; set; } = "";

    [Display(Name = "Запомнить меня")]
    public bool RememberMe { get; set; }

    public string? ReturnUrl { get; set; }
}
