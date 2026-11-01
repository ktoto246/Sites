using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApplication1.Data.Migrations
{
    /// <inheritdoc />
    public partial class CustomPartRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FullName = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    DismissedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Equipments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    InventoryNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Model = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    RegistrationNumber = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    EngineHours = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipments", x => x.Id);
                    table.CheckConstraint("CK_Equipment_EngineHours", "[EngineHours] >= 0");
                });

            migrationBuilder.CreateTable(
                name: "Parts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Article = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Unit = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Parts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Suppliers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Contact = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Suppliers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RoleId = table.Column<string>(type: "TEXT", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    EmployeeId = table.Column<int>(type: "INTEGER", nullable: true),
                    UserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: true),
                    SecurityStamp = table.Column<string>(type: "TEXT", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumber = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUsers_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MaintenanceRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EquipmentId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    IntervalDays = table.Column<int>(type: "INTEGER", nullable: true),
                    IntervalHours = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    WarningDays = table.Column<int>(type: "INTEGER", nullable: true),
                    WarningHours = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    BaselineDateUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    BaselineHours = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceRules", x => x.Id);
                    table.CheckConstraint("CK_MaintenanceRule_Interval", "([IntervalDays] IS NOT NULL OR [IntervalHours] IS NOT NULL) AND ([IntervalDays] IS NULL OR [IntervalDays] > 0) AND ([IntervalHours] IS NULL OR [IntervalHours] > 0)");
                    table.CheckConstraint("CK_MaintenanceRule_Thresholds", "[BaselineHours] >= 0 AND ([WarningDays] IS NULL OR [WarningDays] >= 0) AND ([WarningHours] IS NULL OR [WarningHours] >= 0)");
                    table.ForeignKey(
                        name: "FK_MaintenanceRules_Equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Purchases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SupplierId = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExpectedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ReceivedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ReceiptStoredFileName = table.Column<string>(type: "TEXT", maxLength: 260, nullable: true),
                    ReceiptOriginalFileName = table.Column<string>(type: "TEXT", maxLength: 260, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Purchases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Purchases_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderKey = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "TEXT", nullable: true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    RoleId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EntityType = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    EntityId = table.Column<int>(type: "INTEGER", nullable: false),
                    Action = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Details = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    OccurredAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EngineHourReadings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EquipmentId = table.Column<int>(type: "INTEGER", nullable: false),
                    Hours = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    RecordedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Source = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    CorrectionReason = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    RecordedByUserId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EngineHourReadings", x => x.Id);
                    table.CheckConstraint("CK_EngineHourReading_Hours", "[Hours] >= 0");
                    table.ForeignKey(
                        name: "FK_EngineHourReadings_AspNetUsers_RecordedByUserId",
                        column: x => x.RecordedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EngineHourReadings_Equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RepairRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EquipmentId = table.Column<int>(type: "INTEGER", nullable: false),
                    AuthorUserId = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    EngineHours = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    DecisionReason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RepairRequests", x => x.Id);
                    table.CheckConstraint("CK_RepairRequest_EngineHours", "[EngineHours] >= 0");
                    table.ForeignKey(
                        name: "FK_RepairRequests_AspNetUsers_AuthorUserId",
                        column: x => x.AuthorUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RepairRequests_Equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StatusHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EntityType = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    EntityId = table.Column<int>(type: "INTEGER", nullable: false),
                    PreviousStatus = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    NewStatus = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    ChangedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ChangedByUserId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatusHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StatusHistories_AspNetUsers_ChangedByUserId",
                        column: x => x.ChangedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkOrders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EquipmentId = table.Column<int>(type: "INTEGER", nullable: false),
                    RepairRequestId = table.Column<int>(type: "INTEGER", nullable: true),
                    MaintenanceRuleId = table.Column<int>(type: "INTEGER", nullable: true),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PlannedStartUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PlannedEndUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ActualStartUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ActualEndUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Result = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CancellationReason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "BLOB", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrders", x => x.Id);
                    table.CheckConstraint("CK_WorkOrder_Plan", "[PlannedStartUtc] IS NULL OR [PlannedEndUtc] IS NULL OR [PlannedEndUtc] > [PlannedStartUtc]");
                    table.ForeignKey(
                        name: "FK_WorkOrders_Equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkOrders_MaintenanceRules_MaintenanceRuleId",
                        column: x => x.MaintenanceRuleId,
                        principalTable: "MaintenanceRules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkOrders_RepairRequests_RepairRequestId",
                        column: x => x.RepairRequestId,
                        principalTable: "RepairRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MaintenanceRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaintenanceRuleId = table.Column<int>(type: "INTEGER", nullable: false),
                    WorkOrderId = table.Column<int>(type: "INTEGER", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EngineHours = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceRecords", x => x.Id);
                    table.CheckConstraint("CK_MaintenanceRecord_EngineHours", "[EngineHours] >= 0");
                    table.ForeignKey(
                        name: "FK_MaintenanceRecords_MaintenanceRules_MaintenanceRuleId",
                        column: x => x.MaintenanceRuleId,
                        principalTable: "MaintenanceRules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaintenanceRecords_WorkOrders_WorkOrderId",
                        column: x => x.WorkOrderId,
                        principalTable: "WorkOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PartRequirements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WorkOrderId = table.Column<int>(type: "INTEGER", nullable: false),
                    PartId = table.Column<int>(type: "INTEGER", nullable: true),
                    CustomName = table.Column<string>(type: "TEXT", nullable: true),
                    Quantity = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    ReservedQuantity = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    IssuedQuantity = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Comment = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartRequirements", x => x.Id);
                    table.CheckConstraint("CK_PartRequirement_Quantities", "[Quantity] > 0 AND [ReservedQuantity] >= 0 AND [IssuedQuantity] >= 0");
                    table.ForeignKey(
                        name: "FK_PartRequirements_Parts_PartId",
                        column: x => x.PartId,
                        principalTable: "Parts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PartRequirements_WorkOrders_WorkOrderId",
                        column: x => x.WorkOrderId,
                        principalTable: "WorkOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkStages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WorkOrderId = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    PlannedStartUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PlannedEndUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ActualStartUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ActualEndUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EndReason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkStages", x => x.Id);
                    table.CheckConstraint("CK_WorkStage_Plan", "[PlannedEndUtc] > [PlannedStartUtc]");
                    table.ForeignKey(
                        name: "FK_WorkStages_WorkOrders_WorkOrderId",
                        column: x => x.WorkOrderId,
                        principalTable: "WorkOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PurchaseLines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PurchaseId = table.Column<int>(type: "INTEGER", nullable: false),
                    PartId = table.Column<int>(type: "INTEGER", nullable: false),
                    PartRequirementId = table.Column<int>(type: "INTEGER", nullable: true),
                    OrderedQuantity = table.Column<decimal>(type: "TEXT", precision: 18, scale: 3, nullable: false),
                    ReceivedQuantity = table.Column<decimal>(type: "TEXT", precision: 18, scale: 3, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseLines", x => x.Id);
                    table.CheckConstraint("CK_PurchaseLine_Values", "[OrderedQuantity] > 0 AND [ReceivedQuantity] >= 0 AND [ReceivedQuantity] <= [OrderedQuantity] AND [UnitPrice] >= 0");
                    table.ForeignKey(
                        name: "FK_PurchaseLines_PartRequirements_PartRequirementId",
                        column: x => x.PartRequirementId,
                        principalTable: "PartRequirements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseLines_Parts_PartId",
                        column: x => x.PartId,
                        principalTable: "Parts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseLines_Purchases_PurchaseId",
                        column: x => x.PurchaseId,
                        principalTable: "Purchases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MechanicAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WorkStageId = table.Column<int>(type: "INTEGER", nullable: false),
                    EmployeeId = table.Column<int>(type: "INTEGER", nullable: false),
                    PlannedStartUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PlannedEndUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ActualStartUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ActualEndUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsCancelled = table.Column<bool>(type: "INTEGER", nullable: false),
                    CancellationReason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MechanicAssignments", x => x.Id);
                    table.CheckConstraint("CK_MechanicAssignment_Plan", "[PlannedEndUtc] > [PlannedStartUtc]");
                    table.ForeignKey(
                        name: "FK_MechanicAssignments_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MechanicAssignments_WorkStages_WorkStageId",
                        column: x => x.WorkStageId,
                        principalTable: "WorkStages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WorkOrderId = table.Column<int>(type: "INTEGER", nullable: false),
                    WorkStageId = table.Column<int>(type: "INTEGER", nullable: true),
                    EmployeeId = table.Column<int>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkLogs_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkLogs_WorkOrders_WorkOrderId",
                        column: x => x.WorkOrderId,
                        principalTable: "WorkOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkLogs_WorkStages_WorkStageId",
                        column: x => x.WorkStageId,
                        principalTable: "WorkStages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StockBatches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PartId = table.Column<int>(type: "INTEGER", nullable: false),
                    PurchaseLineId = table.Column<int>(type: "INTEGER", nullable: false),
                    ReceivedQuantity = table.Column<decimal>(type: "TEXT", precision: 18, scale: 3, nullable: false),
                    AvailableQuantity = table.Column<decimal>(type: "TEXT", precision: 18, scale: 3, nullable: false),
                    ReservedQuantity = table.Column<decimal>(type: "TEXT", precision: 18, scale: 3, nullable: false),
                    UnitCost = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    ReceivedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "BLOB", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockBatches", x => x.Id);
                    table.CheckConstraint("CK_StockBatch_Values", "[ReceivedQuantity] > 0 AND [AvailableQuantity] >= 0 AND [ReservedQuantity] >= 0 AND [ReservedQuantity] <= [AvailableQuantity] AND [UnitCost] >= 0");
                    table.ForeignKey(
                        name: "FK_StockBatches_Parts_PartId",
                        column: x => x.PartId,
                        principalTable: "Parts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockBatches_PurchaseLines_PurchaseLineId",
                        column: x => x.PurchaseLineId,
                        principalTable: "PurchaseLines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StockMovements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    StockBatchId = table.Column<int>(type: "INTEGER", nullable: false),
                    WorkOrderId = table.Column<int>(type: "INTEGER", nullable: true),
                    PartRequirementId = table.Column<int>(type: "INTEGER", nullable: true),
                    ReversesMovementId = table.Column<int>(type: "INTEGER", nullable: true),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Quantity = table.Column<decimal>(type: "TEXT", precision: 18, scale: 3, nullable: false),
                    UnitCost = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockMovements", x => x.Id);
                    table.CheckConstraint("CK_StockMovement_Values", "[Quantity] > 0 AND [UnitCost] >= 0");
                    table.ForeignKey(
                        name: "FK_StockMovements_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockMovements_PartRequirements_PartRequirementId",
                        column: x => x.PartRequirementId,
                        principalTable: "PartRequirements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockMovements_StockBatches_StockBatchId",
                        column: x => x.StockBatchId,
                        principalTable: "StockBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockMovements_StockMovements_ReversesMovementId",
                        column: x => x.ReversesMovementId,
                        principalTable: "StockMovements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockMovements_WorkOrders_WorkOrderId",
                        column: x => x.WorkOrderId,
                        principalTable: "WorkOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_EmployeeId",
                table: "AspNetUsers",
                column: "EmployeeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityType_EntityId_OccurredAtUtc",
                table: "AuditLogs",
                columns: new[] { "EntityType", "EntityId", "OccurredAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EngineHourReadings_EquipmentId",
                table: "EngineHourReadings",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EngineHourReadings_RecordedByUserId",
                table: "EngineHourReadings",
                column: "RecordedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Equipments_InventoryNumber",
                table: "Equipments",
                column: "InventoryNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Equipments_RegistrationNumber",
                table: "Equipments",
                column: "RegistrationNumber",
                unique: true,
                filter: "[RegistrationNumber] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRecords_MaintenanceRuleId",
                table: "MaintenanceRecords",
                column: "MaintenanceRuleId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRecords_WorkOrderId",
                table: "MaintenanceRecords",
                column: "WorkOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRules_EquipmentId",
                table: "MaintenanceRules",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_MechanicAssignments_EmployeeId_PlannedStartUtc_PlannedEndUtc",
                table: "MechanicAssignments",
                columns: new[] { "EmployeeId", "PlannedStartUtc", "PlannedEndUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MechanicAssignments_WorkStageId",
                table: "MechanicAssignments",
                column: "WorkStageId");

            migrationBuilder.CreateIndex(
                name: "IX_PartRequirements_PartId",
                table: "PartRequirements",
                column: "PartId");

            migrationBuilder.CreateIndex(
                name: "IX_PartRequirements_WorkOrderId",
                table: "PartRequirements",
                column: "WorkOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Parts_Article",
                table: "Parts",
                column: "Article",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseLines_PartId",
                table: "PurchaseLines",
                column: "PartId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseLines_PartRequirementId",
                table: "PurchaseLines",
                column: "PartRequirementId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseLines_PurchaseId",
                table: "PurchaseLines",
                column: "PurchaseId");

            migrationBuilder.CreateIndex(
                name: "IX_Purchases_SupplierId",
                table: "Purchases",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_RepairRequests_AuthorUserId",
                table: "RepairRequests",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RepairRequests_EquipmentId",
                table: "RepairRequests",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_StatusHistories_ChangedByUserId",
                table: "StatusHistories",
                column: "ChangedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StatusHistories_EntityType_EntityId_ChangedAtUtc",
                table: "StatusHistories",
                columns: new[] { "EntityType", "EntityId", "ChangedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_StockBatches_PartId",
                table: "StockBatches",
                column: "PartId");

            migrationBuilder.CreateIndex(
                name: "IX_StockBatches_PurchaseLineId",
                table: "StockBatches",
                column: "PurchaseLineId");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_CreatedByUserId",
                table: "StockMovements",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_PartRequirementId",
                table: "StockMovements",
                column: "PartRequirementId");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_ReversesMovementId",
                table: "StockMovements",
                column: "ReversesMovementId");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_StockBatchId_CreatedAtUtc",
                table: "StockMovements",
                columns: new[] { "StockBatchId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_WorkOrderId",
                table: "StockMovements",
                column: "WorkOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkLogs_EmployeeId",
                table: "WorkLogs",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkLogs_WorkOrderId",
                table: "WorkLogs",
                column: "WorkOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkLogs_WorkStageId",
                table: "WorkLogs",
                column: "WorkStageId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrders_EquipmentId",
                table: "WorkOrders",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrders_MaintenanceRuleId",
                table: "WorkOrders",
                column: "MaintenanceRuleId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrders_RepairRequestId",
                table: "WorkOrders",
                column: "RepairRequestId",
                unique: true,
                filter: "[RepairRequestId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_WorkStages_WorkOrderId",
                table: "WorkStages",
                column: "WorkOrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "EngineHourReadings");

            migrationBuilder.DropTable(
                name: "MaintenanceRecords");

            migrationBuilder.DropTable(
                name: "MechanicAssignments");

            migrationBuilder.DropTable(
                name: "StatusHistories");

            migrationBuilder.DropTable(
                name: "StockMovements");

            migrationBuilder.DropTable(
                name: "WorkLogs");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "StockBatches");

            migrationBuilder.DropTable(
                name: "WorkStages");

            migrationBuilder.DropTable(
                name: "PurchaseLines");

            migrationBuilder.DropTable(
                name: "PartRequirements");

            migrationBuilder.DropTable(
                name: "Purchases");

            migrationBuilder.DropTable(
                name: "Parts");

            migrationBuilder.DropTable(
                name: "WorkOrders");

            migrationBuilder.DropTable(
                name: "Suppliers");

            migrationBuilder.DropTable(
                name: "MaintenanceRules");

            migrationBuilder.DropTable(
                name: "RepairRequests");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "Equipments");

            migrationBuilder.DropTable(
                name: "Employees");
        }
    }
}
