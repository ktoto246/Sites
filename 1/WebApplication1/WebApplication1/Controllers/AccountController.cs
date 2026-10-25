using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;

namespace WebApplication1.Controllers;

public class AccountController : Controller
{
    private readonly AppDbContext _db;
    public AccountController(AppDbContext db) => _db = db;

    [HttpGet]
    public IActionResult Login()
    {
        if (HttpContext.Session.GetInt32("EmployeeId").HasValue) return RedirectToAction("Index", "Home");
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(string login, string password)
    {
        var employee = await _db.Employees.FirstOrDefaultAsync(x => x.Login == login && x.Password == password && x.IsActive);
        if (employee is null)
        {
            ViewBag.Error = "Неверный логин, пароль или учётная запись отключена.";
            return View();
        }

        HttpContext.Session.SetInt32("EmployeeId", employee.Id);
        HttpContext.Session.SetString("Role", employee.Role);
        HttpContext.Session.SetString("EmployeeName", employee.FullName);
        return RedirectToAction("Index", "Home");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return RedirectToAction(nameof(Login));
    }
}
