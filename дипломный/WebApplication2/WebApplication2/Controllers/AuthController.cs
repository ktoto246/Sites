using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using WebApplication2.DTOs;
using Dapper;

namespace WebApplication2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly string _connectionString;

        public AuthController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { message = "Заполните все поля!" });

            using var db = new SqlConnection(_connectionString);
            var sql = "SELECT Код as Id, ФИО_или_Название as Name, Почта as Email, Роль as Role FROM Пользователи WHERE Почта = @Email AND Пароль = @Password";
            var user = await db.QueryFirstOrDefaultAsync(sql, new { dto.Email, dto.Password });

            if (user == null)
            {
                return Unauthorized(new { message = "Неверный логин или пароль" });
            }

            return Ok(new { id = user.Id, name = user.Name, role = user.Role });
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Пожалуйста, заполните все обязательные поля!" });

            using var db = new SqlConnection(_connectionString);

            var checkSql = "SELECT Код FROM Пользователи WHERE Почта = @Email";
            var existingUser = await db.QueryFirstOrDefaultAsync<int?>(checkSql, new { dto.Email });

            if (existingUser != null)
            {
                return BadRequest(new { message = "Пользователь с таким E-mail уже существует." });
            }

            var insertSql = @"INSERT INTO Пользователи (ФИО_или_Название, Телефон, Почта, Пароль) 
                              VALUES (@Name, @Phone, @Email, @Password)";

            await db.ExecuteAsync(insertSql, dto);

            return Ok(new { message = "Регистрация прошла успешно! Теперь вы можете войти." });
        }

        [HttpGet("profile/{id}")]
        public async Task<IActionResult> GetProfile(int id)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = "SELECT ФИО_или_Название as Name, Телефон as Phone, Почта as Email, ДатаРегистрации as RegistrationDate FROM Пользователи WHERE Код = @Id";
            var user = await db.QueryFirstOrDefaultAsync(sql, new { Id = id });

            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            return Ok(new { name = user.Name, phone = user.Phone, email = user.Email, registrationDate = user.RegistrationDate });
        }

        [HttpPut("{id}/profile")]
        public async Task<IActionResult> UpdateProfile(int id, [FromBody] UserUpdateDto dto)
        {
            using var db = new SqlConnection(_connectionString);
            try
            {
                var sql = "UPDATE Пользователи SET ФИО_или_Название = @Name, Почта = @Email, Телефон = @Phone WHERE Код = @Id";
                await db.ExecuteAsync(sql, new { dto.Name, dto.Email, dto.Phone, Id = id });
                return Ok(new { message = "Профиль успешно обновлен!" });
            }
            catch (SqlException ex) when (ex.Number == 2627 || ex.Message.Contains("UNIQUE"))
            {
                return BadRequest(new { message = "Этот email уже используется другим пользователем!" });
            }
        }
    }
}