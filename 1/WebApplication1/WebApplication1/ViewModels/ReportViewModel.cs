namespace WebApplication1.ViewModels;

public sealed class ReportViewModel
{
    public DateTime From { get; init; }
    public DateTime To { get; init; }
    public int Repairs { get; init; }
    public int Completed { get; init; }
    public int Overdue { get; init; }
    public decimal PurchasedCost { get; init; }
    public decimal UsedCost { get; init; }
    public decimal LossCost { get; init; }
    public IReadOnlyList<DashboardBarViewModel> MechanicLoad { get; init; } = [];
}
