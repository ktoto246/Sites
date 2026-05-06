using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using WebApplication2.DTOs;

namespace WebApplication2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServicesController : ControllerBase
    {
        private readonly string _connectionString;

        public ServicesController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        [HttpGet]
        public async Task<IActionResult> GetServices()
        {
            using var db = new SqlConnection(_connectionString);
            var sql = "SELECT Код as Id, Название as Name, ЕдиницаИзмерения as Unit, Цена as Price FROM Услуги";
            var services = await db.QueryAsync<ServiceDto>(sql);
            return Ok(services);
        } 
    }
}