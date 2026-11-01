using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using WebApplication1.Data;
using WebApplication1.Models.Entities;
using WebApplication1.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(connectionString));
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.SignIn.RequireConfirmedAccount = false;
        options.Password.RequiredLength = 6;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = true;
        options.User.RequireUniqueEmail = false;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.AccessDeniedPath = "/Account/AccessDenied";
    options.SlidingExpiration = true;
    options.Events.OnValidatePrincipal = async context =>
    {
        await SecurityStampValidator.ValidatePrincipalAsync(context);
        if (context.Principal?.Identity?.IsAuthenticated != true) return;
        var userManager = context.HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.GetUserAsync(context.Principal);
        if (user?.EmployeeId is null) { context.RejectPrincipal(); await context.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme); return; }
        var db = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
        var active = await db.Employees.IgnoreQueryFilters().Where(x => x.Id == user.EmployeeId).Select(x => x.IsActive).SingleOrDefaultAsync();
        if (!active) { context.RejectPrincipal(); await context.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme); }
    };
});
builder.Services.AddScoped<SchedulingService>();
builder.Services.AddControllersWithViews();

var app = builder.Build();
var russianCulture = new CultureInfo("ru-RU");
CultureInfo.DefaultThreadCurrentCulture = russianCulture;
CultureInfo.DefaultThreadCurrentUICulture = russianCulture;

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapStaticAssets();
app.MapControllerRoute(name: "default", pattern: "{controller=Home}/{action=Index}/{id?}").WithStaticAssets();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    await DevelopmentDataSeeder.SeedAsync(scope.ServiceProvider);
}

app.Run();
