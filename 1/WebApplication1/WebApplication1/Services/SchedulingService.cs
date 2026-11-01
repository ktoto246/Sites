using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models.Entities;

namespace WebApplication1.Services;

public sealed class SchedulingService(ApplicationDbContext db)
{
    public async Task<string?> GetConflictAsync(int equipmentId, IEnumerable<int> mechanicIds, DateTime startUtc, DateTime endUtc, int? excludedWorkOrderId = null)
    {
        if (endUtc <= startUtc) return "Дата окончания должна быть позже даты начала.";
        var ids = mechanicIds.Distinct().ToArray();
        if (ids.Length == 0) return "Назначьте хотя бы одного механика.";

        var inactive = await db.Employees.IgnoreQueryFilters().Where(employee => ids.Contains(employee.Id) && !employee.IsActive).Select(employee => employee.FullName).ToListAsync();
        if (inactive.Count > 0) return $"Недоступные механики: {string.Join(", ", inactive)}.";

        var equipmentBusy = await db.WorkOrders.IgnoreQueryFilters().AnyAsync(order => order.EquipmentId == equipmentId && order.Id != excludedWorkOrderId && order.Status != WorkOrderStatus.Completed && order.Status != WorkOrderStatus.Cancelled);
        if (equipmentBusy) return "Техника уже находится в активном ремонте или на техническом обслуживании.";

        var overlapping = await db.MechanicAssignments
            .Include(assignment => assignment.WorkStage).ThenInclude(stage => stage.WorkOrder)
            .Include(assignment => assignment.Employee)
            .Where(assignment => ids.Contains(assignment.EmployeeId) && !assignment.IsCancelled && assignment.WorkStage.Status != StageStatus.Completed && assignment.WorkStage.Status != StageStatus.Cancelled && assignment.PlannedStartUtc < endUtc && startUtc < assignment.PlannedEndUtc)
            .OrderBy(assignment => assignment.PlannedStartUtc)
            .FirstOrDefaultAsync();
        return overlapping is null ? null : $"Механик «{overlapping.Employee.FullName}» занят с {overlapping.PlannedStartUtc.ToLocalTime():dd.MM HH:mm} до {overlapping.PlannedEndUtc.ToLocalTime():dd.MM HH:mm}.";
    }
}
