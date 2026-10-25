using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;

namespace WebApplication1.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<MaintenanceRequest> MaintenanceRequests => Set<MaintenanceRequest>();
    public DbSet<MaintenancePlan> MaintenancePlans => Set<MaintenancePlan>();
    public DbSet<Part> Parts => Set<Part>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<WorkPart> WorkParts => Set<WorkPart>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Equipment>().HasOne(x => x.AssignedDriver).WithMany().HasForeignKey(x => x.AssignedDriverId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<MaintenanceRequest>().HasOne(x => x.Equipment).WithMany(x => x.Requests).HasForeignKey(x => x.EquipmentId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<MaintenanceRequest>().HasOne(x => x.Reporter).WithMany().HasForeignKey(x => x.ReporterId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<MaintenanceRequest>().HasOne(x => x.Mechanic).WithMany().HasForeignKey(x => x.MechanicId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<MaintenancePlan>().HasOne(x => x.Equipment).WithMany(x => x.MaintenancePlans).HasForeignKey(x => x.EquipmentId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Purchase>().HasOne(x => x.Part).WithMany(x => x.Purchases).HasForeignKey(x => x.PartId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Purchase>().HasOne(x => x.PurchasedBy).WithMany().HasForeignKey(x => x.PurchasedById).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<WorkPart>().HasOne(x => x.Request).WithMany(x => x.WorkParts).HasForeignKey(x => x.RequestId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WorkPart>().HasOne(x => x.Part).WithMany(x => x.WorkParts).HasForeignKey(x => x.PartId).OnDelete(DeleteBehavior.Restrict);
    }
}
