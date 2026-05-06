namespace WebApplication2.DTOs
{
    public class RequestResponseDto
    {
        public int Id { get; set; }
        public string CropName { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
        public decimal Weight { get; set; }
        public decimal? Moisture { get; set; }
        public decimal? Weediness { get; set; }
        public DateTime DesiredDate { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string StageName { get; set; } = string.Empty;
        public int StagePercent { get; set; }
        public string? Comments { get; set; }
        public string? AdminComment { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
    }
    public class ServiceDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }
}