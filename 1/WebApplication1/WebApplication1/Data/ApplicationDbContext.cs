using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models.Entities;

namespace WebApplication1.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Equipment> Equipments => Set<Equipment>();
    public DbSet<EngineHourReading> EngineHourReadings => Set<EngineHourReading>();
    public DbSet<RepairRequest> RepairRequests => Set<RepairRequest>();
    public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();
    public DbSet<WorkStage> WorkStages => Set<WorkStage>();
    public DbSet<MechanicAssignment> MechanicAssignments => Set<MechanicAssignment>();
    public DbSet<WorkLog> WorkLogs => Set<WorkLog>();
    public DbSet<MaintenanceRule> MaintenanceRules => Set<MaintenanceRule>();
    public DbSet<MaintenanceRecord> MaintenanceRecords => Set<MaintenanceRecord>();
    public DbSet<Part> Parts => Set<Part>();
    public DbSet<PartRequirement> PartRequirements => Set<PartRequirement>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<PurchaseLine> PurchaseLines => Set<PurchaseLine>();
    public DbSet<StockBatch> StockBatches => Set<StockBatch>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<StatusHistory> StatusHistories => Set<StatusHistory>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public override int SaveChanges()
    {
        SetLocalConcurrencyValues();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetLocalConcurrencyValues();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void SetLocalConcurrencyValues()
    {
        foreach (var entry in ChangeTracker.Entries<WorkOrder>().Where(entry => entry.State is EntityState.Added or EntityState.Modified))
            entry.Entity.RowVersion = Guid.NewGuid().ToByteArray();
        foreach (var entry in ChangeTracker.Entries<StockBatch>().Where(entry => entry.State is EntityState.Added or EntityState.Modified))
            entry.Entity.RowVersion = Guid.NewGuid().ToByteArray();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Employee>().HasQueryFilter(x => x.IsActive);
        modelBuilder.Entity<Equipment>().HasQueryFilter(x => x.IsActive);
        modelBuilder.Entity<Part>().HasQueryFilter(x => x.IsActive);
        modelBuilder.Entity<Supplier>().HasQueryFilter(x => x.IsActive);
        modelBuilder.Entity<MaintenanceRule>().HasQueryFilter(x => x.IsActive);
        modelBuilder.Entity<ApplicationUser>().HasOne(x => x.Employee).WithOne(x => x.User)
            .HasForeignKey<ApplicationUser>(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WorkOrder>().Property(item => item.RowVersion).IsConcurrencyToken().ValueGeneratedNever();
        modelBuilder.Entity<StockBatch>().Property(item => item.RowVersion).IsConcurrencyToken().ValueGeneratedNever();

        modelBuilder.Entity<Equipment>().HasIndex(x => x.InventoryNumber).IsUnique();
        modelBuilder.Entity<Equipment>().HasIndex(x => x.RegistrationNumber).IsUnique().HasFilter("[RegistrationNumber] IS NOT NULL");
        modelBuilder.Entity<Part>().HasIndex(x => x.Article).IsUnique();
        modelBuilder.Entity<WorkOrder>().HasIndex(x => x.RepairRequestId).IsUnique().HasFilter("[RepairRequestId] IS NOT NULL");
        modelBuilder.Entity<MechanicAssignment>().HasIndex(x => new { x.EmployeeId, x.PlannedStartUtc, x.PlannedEndUtc });
        modelBuilder.Entity<StockMovement>().HasIndex(x => new { x.StockBatchId, x.CreatedAtUtc });
        modelBuilder.Entity<StatusHistory>().HasIndex(x => new { x.EntityType, x.EntityId, x.ChangedAtUtc });
        modelBuilder.Entity<AuditLog>().HasIndex(x => new { x.EntityType, x.EntityId, x.OccurredAtUtc });

        foreach (var entity in modelBuilder.Model.GetEntityTypes().Where(t => t.ClrType.Namespace == typeof(Employee).Namespace))
        {
            foreach (var fk in entity.GetForeignKeys()) fk.DeleteBehavior = DeleteBehavior.Restrict;
            foreach (var property in entity.GetProperties().Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                if (property.GetPrecision() == null) { property.SetPrecision(18); property.SetScale(2); }
            }
        }

        modelBuilder.Entity<Equipment>().ToTable(t => t.HasCheckConstraint("CK_Equipment_EngineHours", "[EngineHours] >= 0"));
        modelBuilder.Entity<EngineHourReading>().ToTable(t => t.HasCheckConstraint("CK_EngineHourReading_Hours", "[Hours] >= 0"));
        modelBuilder.Entity<RepairRequest>().ToTable(t => t.HasCheckConstraint("CK_RepairRequest_EngineHours", "[EngineHours] >= 0"));
        modelBuilder.Entity<WorkOrder>().ToTable(t => t.HasCheckConstraint("CK_WorkOrder_Plan", "[PlannedStartUtc] IS NULL OR [PlannedEndUtc] IS NULL OR [PlannedEndUtc] > [PlannedStartUtc]"));
        modelBuilder.Entity<WorkStage>().ToTable(t => t.HasCheckConstraint("CK_WorkStage_Plan", "[PlannedEndUtc] > [PlannedStartUtc]"));
        modelBuilder.Entity<MechanicAssignment>().ToTable(t => t.HasCheckConstraint("CK_MechanicAssignment_Plan", "[PlannedEndUtc] > [PlannedStartUtc]"));
        modelBuilder.Entity<MaintenanceRule>().ToTable(t =>
        {
            t.HasCheckConstraint("CK_MaintenanceRule_Interval", "([IntervalDays] IS NOT NULL OR [IntervalHours] IS NOT NULL) AND ([IntervalDays] IS NULL OR [IntervalDays] > 0) AND ([IntervalHours] IS NULL OR [IntervalHours] > 0)");
            t.HasCheckConstraint("CK_MaintenanceRule_Thresholds", "[BaselineHours] >= 0 AND ([WarningDays] IS NULL OR [WarningDays] >= 0) AND ([WarningHours] IS NULL OR [WarningHours] >= 0)");
        });
        modelBuilder.Entity<MaintenanceRecord>().ToTable(t => t.HasCheckConstraint("CK_MaintenanceRecord_EngineHours", "[EngineHours] >= 0"));
        modelBuilder.Entity<PartRequirement>().ToTable(t => t.HasCheckConstraint("CK_PartRequirement_Quantities", "[Quantity] > 0 AND [ReservedQuantity] >= 0 AND [IssuedQuantity] >= 0"));
        modelBuilder.Entity<PurchaseLine>().ToTable(t => t.HasCheckConstraint("CK_PurchaseLine_Values", "[OrderedQuantity] > 0 AND [ReceivedQuantity] >= 0 AND [ReceivedQuantity] <= [OrderedQuantity] AND [UnitPrice] >= 0"));
        modelBuilder.Entity<StockBatch>().ToTable(t => t.HasCheckConstraint("CK_StockBatch_Values", "[ReceivedQuantity] > 0 AND [AvailableQuantity] >= 0 AND [ReservedQuantity] >= 0 AND [ReservedQuantity] <= [AvailableQuantity] AND [UnitCost] >= 0"));
        modelBuilder.Entity<StockMovement>().ToTable(t => t.HasCheckConstraint("CK_StockMovement_Values", "[Quantity] > 0 AND [UnitCost] >= 0"));
    }
}
