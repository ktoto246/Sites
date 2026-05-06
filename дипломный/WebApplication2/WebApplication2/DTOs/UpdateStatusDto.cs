namespace WebApplication2.DTOs
{
    public class UpdateStatusDto
    {
        public int StatusId { get; set; }
        public int StageId { get; set; }
        public string? AdminComment { get; set; }
    }
}
