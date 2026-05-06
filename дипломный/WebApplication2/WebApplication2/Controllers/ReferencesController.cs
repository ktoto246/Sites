using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using WebApplication2.DTOs;
using WebApplication2.Models;

namespace WebApplication2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReferencesController : ControllerBase
    {
        private readonly string _connectionString;

        public ReferencesController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!; 
        }

        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<ReferenceItem>>> GetUsers()
        {
            using var db = new SqlConnection(_connectionString);
            var users = await db.QueryAsync<ReferenceItem>("SELECT Код as Id, ФИО_или_Название as Name FROM Пользователи WHERE Роль = 'client' ORDER BY ФИО_или_Название");
            return Ok(users);
        }

        [HttpGet("crops")]
        public async Task<IActionResult> GetCrops()
        {
            using var db = new SqlConnection(_connectionString);
            var crops = await db.QueryAsync("SELECT Код as Id, Название as Name, НормаВлажности as BaseMoisture, НормаСорности as BaseWeediness FROM Культуры ORDER BY Название");
            return Ok(crops);
        }
        [HttpGet("services")]
        public async Task<IActionResult> GetServices()
        {
            using var db = new SqlConnection(_connectionString);
            var services = await db.QueryAsync("SELECT Код as Id, Название as Name, Цена as Price, ЕдиницаИзмерения as Unit FROM Услуги");
            return Ok(services);
        }
        [HttpGet("statuses")]
        public async Task<IActionResult> GetStatuses()
        {
            using var db = new SqlConnection(_connectionString);
            var statuses = await db.QueryAsync("SELECT Код as Id, Название as Name FROM Статусы ORDER BY Код");
            return Ok(statuses);
        }

        [HttpGet("stages")]
        public async Task<IActionResult> GetStages()
        {
            using var db = new SqlConnection(_connectionString);
            var stages = await db.QueryAsync("SELECT Код as Id, Название as Name FROM Этапы ORDER BY Код");
            return Ok(stages);
        }
    }
}