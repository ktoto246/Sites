namespace WebApplication1.ViewModels;

public sealed class DashboardViewModel
{
    public int NewRequests { get; init; }
    public int ActiveWorkOrders { get; init; }
    public int WaitingForParts { get; init; }
    public int OverdueMaintenance { get; init; }
    public IReadOnlyList<DashboardBarViewModel> RepairStatusBars { get; init; } = [];
    public IReadOnlyList<DashboardAlertViewModel> Alerts { get; init; } = [];
}

public sealed class DashboardBarViewModel
{
    public string Label { get; init; } = "";
    public int Value { get; init; }
}

public sealed class DashboardAlertViewModel
{
    public string Title { get; init; } = "";
    public string Description { get; init; } = "";
    public string LinkController { get; init; } = "";
    public string LinkAction { get; init; } = "Index";
}
