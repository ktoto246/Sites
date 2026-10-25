using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace WebApplication1.Controllers;

public abstract class LocalController : Controller
{
    protected int CurrentEmployeeId => HttpContext.Session.GetInt32("EmployeeId") ?? 0;
    protected string CurrentRole => HttpContext.Session.GetString("Role") ?? string.Empty;
    protected string CurrentEmployeeName => HttpContext.Session.GetString("EmployeeName") ?? string.Empty;

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (CurrentEmployeeId == 0)
        {
            context.Result = RedirectToAction("Login", "Account");
            return;
        }

        ViewData["Role"] = CurrentRole;
        ViewData["ActiveEmployeeName"] = CurrentEmployeeName;
        base.OnActionExecuting(context);
    }
}
