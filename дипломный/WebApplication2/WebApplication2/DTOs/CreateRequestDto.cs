namespace WebApplication2.DTOs
{
    public class CreateRequestDto
    {
        public int UserId { get; set; }
        public int CropId { get; set; }
        public decimal Weight { get; set; }
        public decimal? Moisture { get; set; }
        public decimal? Weediness { get; set; }
        public DateTime DesiredDate { get; set; }
        public string? Comments { get; set; }
    }
}
