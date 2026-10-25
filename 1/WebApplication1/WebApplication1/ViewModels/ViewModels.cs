using WebApplication1.Models;

namespace WebApplication1.ViewModels;

public class DashboardViewModel
{
    public string Role { get; set; } = "dispatcher";
    public int EquipmentCount { get; set; }
    public int ActiveRequests { get; set; }
    public int UpcomingMaintenance { get; set; }
    public int LowStockParts { get; set; }
    public decimal MonthPurchases { get; set; }
    public List<MaintenanceRequest> RecentRequests { get; set; } = new();
    public List<MaintenancePlan> UpcomingPlans { get; set; } = new();
    public List<Equipment> Equipment { get; set; } = new();
}

public class EquipmentDetailsViewModel
{
    public Equipment Equipment { get; set; } = new();
    public List<MaintenanceRequest> Requests { get; set; } = new();
    public List<MaintenancePlan> Plans { get; set; } = new();
}

public class ReportsViewModel
{
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public int TotalRequests { get; set; }
    public int CompletedRequests { get; set; }
    public int InProgressRequests { get; set; }
    public decimal TotalSpend { get; set; }
    public List<ReportItem> Statuses { get; set; } = new();
    public List<ReportItem> Monthly { get; set; } = new();
    public List<ReportItem> EquipmentWorkload { get; set; } = new();
}

public class ReportItem
{
    public string Label { get; set; } = "";
    public int Count { get; set; }
    public decimal Amount { get; set; }
}
public class RequestDetailsViewModel
{
    public MaintenanceRequest Request { get; set; } = new();
    public List<Part> AvailableParts { get; set; } = new();
}


