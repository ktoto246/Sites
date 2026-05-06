using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace WebApplication2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FinanceController : ControllerBase
    {
        private readonly string _connectionString;

        public FinanceController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!; 
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetFinanceStats()
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    ISNULL(SUM(CASE WHEN СтатусОплаты = 'Оплачено' THEN ИтоговаяСумма ELSE 0 END), 0) as TotalEarned,
                    ISNULL(SUM(CASE WHEN СтатусОплаты = 'Ожидает оплаты' THEN ИтоговаяСумма ELSE 0 END), 0) as PendingAmount
                FROM Заявки
                WHERE КодСтатуса <> 6";
            var stats = await db.QueryFirstOrDefaultAsync(sql);
            return Ok(stats);
        }
    }
}