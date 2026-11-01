using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models.Entities;
using WebApplication1.ViewModels;

namespace WebApplication1.Controllers;

public sealed class AccountController(SignInManager<ApplicationUser> signInManager, UserManager<ApplicationUser> userManager, ApplicationDbContext db) : Controller
{
    [AllowAnonymous]
    public IActionResult Login(string? returnUrl = null) => View(new LoginViewModel { ReturnUrl = returnUrl });

    [HttpPost]
    [AllowAnonymous]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (!ModelState.IsValid) return View(model);

        var user = await userManager.FindByNameAsync(model.UserName.Trim());
        var isActive = user?.EmployeeId is int employeeId && await db.Employees.IgnoreQueryFilters().AnyAsync(employee => employee.Id == employeeId && employee.IsActive);
        if (!isActive)
        {
            ModelState.AddModelError(string.Empty, "Неверный логин или пароль.");
            return View(model);
        }

        var result = await signInManager.PasswordSignInAsync(user!, model.Password, model.RememberMe, lockoutOnFailure: true);
        if (result.Succeeded) return LocalRedirect(Url.IsLocalUrl(model.ReturnUrl) ? model.ReturnUrl! : Url.Action("Index", "Home")!);
        ModelState.AddModelError(string.Empty, result.IsLockedOut ? "Учётная запись временно заблокирована." : "Неверный логин или пароль.");
        return View(model);
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return RedirectToAction("Index", "Home");
    }

    [AllowAnonymous]
    public IActionResult AccessDenied() => View();
}
