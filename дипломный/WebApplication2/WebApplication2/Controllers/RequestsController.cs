using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using WebApplication2.DTOs;
using Dapper;
using System.Threading.Tasks;

namespace WebApplication2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RequestsController : ControllerBase
    {
        private readonly string _connectionString;

        public RequestsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] RequestCreateDto dto)
        {
            if (dto.Weight < 5 || dto.Weight > 500)
            {
                return BadRequest(new { message = "Недопустимый объем! Минимальная партия — 5 тонн, максимальная — 500 тонн." });
            }

            using var db = new SqlConnection(_connectionString);

            var countSql = "SELECT COUNT(*) FROM Заявки WHERE КодПользователя = @UserId AND ЖелаемаяДата = @DesiredDate AND КодСтатуса NOT IN (5, 6)";
            var activeRequestsToday = await db.ExecuteScalarAsync<int>(countSql, new { UserId = dto.UserId, DesiredDate = dto.DesiredDate });

            if (activeRequestsToday >= 3)
            {
                return BadRequest(new { message = "Лимит исчерпан! Вы не можете подать больше 3 активных заявок на одну и ту же дату." });
            }

            var sql = @"
                INSERT INTO Заявки (КодПользователя, КодКультуры, ВесВТоннах, Влажность, Сорность, ЖелаемаяДата, Комментарий, ЗапросХранение, ДниХранения, ЗапросЖД) 
                VALUES (@UserId, @CropId, @Weight, @Moisture, @Weediness, @DesiredDate, @Comments, @RequestStorage, @StorageDays, @RequestTrain)";

            await db.ExecuteAsync(sql, dto);
            return Ok(new { message = "Заявка создана" });
        }

        [HttpGet]
        public async Task<IActionResult> GetRequests([FromQuery] int? userId)
        {
            using var db = new SqlConnection(_connectionString);
            string sql = @"
    SELECT z.Код as Id, k.Название as CropName, s.Название as StatusName, 
           z.ВесВТоннах as Weight, z.Влажность as Moisture, z.Сорность as Weediness, 
           z.ФактВесПриёмки as FactIntakeWeight,
           z.ФактВес as FactWeight, z.ФактВлажность as FactMoisture, z.ФактСорность as FactWeediness,
           z.ЗапросХранение as RequestStorage, z.ДниХранения as StorageDays, z.ЗапросЖД as RequestTrain,
           z.ЖелаемаяДата as DesiredDate, p.ФИО_или_Название as UserName,
           e.Название as StageName, e.ПроцентЗавершения as StagePercent,
           z.Комментарий as Comments, z.КомментарийАдмина as AdminComment,
           z.СтатусОплаты as PaymentStatus, z.ИтоговаяСумма as TotalAmount
    FROM Заявки z
    JOIN Культуры k ON z.КодКультуры = k.Код
    JOIN Статусы s ON z.КодСтатуса = s.Код
    JOIN Пользователи p ON z.КодПользователя = p.Код
    JOIN Этапы e ON z.КодЭтапа = e.Код";

            if (userId.HasValue) sql += " WHERE z.КодПользователя = @userId";
            sql += " ORDER BY z.ДатаСоздания DESC";

            var requests = await db.QueryAsync<RequestResponseDto>(sql, new { userId });
            return Ok(requests);
        }

        [HttpPut("{id}/pay")]
        public async Task<IActionResult> PayRequest(int id)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = "UPDATE Заявки SET СтатусОплаты = 'Оплачено' WHERE Код = @Id AND СтатусОплаты = 'Ожидает оплаты'";
            var affected = await db.ExecuteAsync(sql, new { Id = id });

            if (affected == 0)
                return BadRequest(new { message = "Заявка не найдена или еще не рассчитана менеджером." });

            return Ok(new { message = "Оплата успешно произведена!" });
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = "UPDATE Заявки SET КодСтатуса = @StatusId, КодЭтапа = @StageId, КомментарийАдмина = @AdminComment WHERE Код = @Id";
            await db.ExecuteAsync(sql, new { StatusId = dto.StatusId, StageId = dto.StageId, AdminComment = dto.AdminComment, Id = id });
            return Ok(new { message = "Статус успешно обновлен!" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id, [FromQuery] int userId)
        {
            using var db = new SqlConnection(_connectionString);

            var checkSql = "SELECT КодСтатуса FROM Заявки WHERE Код = @Id AND КодПользователя = @userId";
            var statusId = await db.QueryFirstOrDefaultAsync<int?>(checkSql, new { Id = id, userId });

            if (statusId == null)
            {
                return BadRequest(new { message = "Заявка не найдена или у вас нет прав на её удаление!" });
            }

            if (statusId != 1)
            {
                return BadRequest(new { message = "Нельзя удалить заявку, которая уже принята в работу!" });
            }

            var sql = "DELETE FROM Заявки WHERE Код = @Id AND КодПользователя = @userId";
            await db.ExecuteAsync(sql, new { Id = id, userId });

            return Ok(new { message = "Заявка успешно отменена!" });
        }
        [HttpGet("{id}/services")]
        public async Task<IActionResult> GetRequestServices(int id)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"SELECT uz.КодУслуги as ServiceId, u.Название as Name, uz.Объем as Volume, uz.Сумма as Sum 
                        FROM УслугиЗаявки uz 
                        JOIN Услуги u ON uz.КодУслуги = u.Код 
                        WHERE uz.КодЗаявки = @Id";
            return Ok(await db.QueryAsync(sql, new { Id = id }));
        }

        [HttpPut("{id}/calculate")]
        public async Task<IActionResult> CalculateRequest(int id, [FromBody] CalculateDto dto)
        {
            using var db = new SqlConnection(_connectionString);
            await db.ExecuteAsync("UPDATE Заявки SET ИтоговаяСумма = @TotalAmount, СтатусОплаты = 'Ожидает оплаты' WHERE Код = @Id", new { dto.TotalAmount, Id = id });

            await db.ExecuteAsync("DELETE FROM УслугиЗаявки WHERE КодЗаявки = @Id", new { Id = id });

            foreach (var s in dto.Services)
            {
                await db.ExecuteAsync("INSERT INTO УслугиЗаявки (КодЗаявки, КодУслуги, Объем, Сумма) VALUES (@Id, @ServiceId, @Volume, @Sum)",
                    new { Id = id, s.ServiceId, s.Volume, s.Sum });
            }

            return Ok(new { message = "Счет выставлен с детализацией!" });
        }

        [HttpPut("{id}/weighing")]
        public async Task<IActionResult> SaveWeighing(int id, [FromBody] WeighingDto dto)
        {
            using var db = new SqlConnection(_connectionString);
            await db.ExecuteAsync("UPDATE Заявки SET ФактВесПриёмки = @FactIntakeWeight WHERE Код = @Id", new { dto.FactIntakeWeight, Id = id });
            return Ok(new { message = "Вес с весовой зафиксирован!" });
        }
      
        [HttpPut("{id}/lab")]
        public async Task<IActionResult> SaveLabResults(int id, [FromBody] LabResultsDto dto)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = "UPDATE Заявки SET ФактВес = @FactWeight, ФактВлажность = @FactMoisture, ФактСорность = @FactWeediness WHERE Код = @Id";
            await db.ExecuteAsync(sql, new { dto.FactWeight, dto.FactMoisture, dto.FactWeediness, Id = id });
            return Ok(new { message = "Данные лаборатории сохранены!" });
        }
        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetHistory(int id)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = "SELECT Действие as Action, Текст as Text, Дата as Date FROM ИсторияЗаявок WHERE КодЗаявки = @Id ORDER BY Дата DESC";
            return Ok(await db.QueryAsync(sql, new { Id = id }));
        }
    }
    public class LabResultsDto
    {
        public decimal FactWeight { get; set; }
        public decimal FactMoisture { get; set; }
        public decimal FactWeediness { get; set; }
    }
    public class ServiceItemDto
    {
        public int ServiceId { get; set; }
        public decimal Volume { get; set; }
        public decimal Sum { get; set; }
    }

    public class CalculateDto
    {
        public decimal TotalAmount { get; set; }
        public List<ServiceItemDto> Services { get; set; } = new();
    }

    public class WeighingDto
    {
        public decimal FactIntakeWeight { get; set; }
    }

    public class RequestCreateDto
    {
        public int UserId { get; set; }
        public int CropId { get; set; }
        public decimal Weight { get; set; }
        public decimal? Moisture { get; set; }
        public decimal? Weediness { get; set; }
        public string DesiredDate { get; set; }
        public string Comments { get; set; }
        public bool RequestStorage { get; set; }
        public int? StorageDays { get; set; }
        public bool RequestTrain { get; set; }
    }
}