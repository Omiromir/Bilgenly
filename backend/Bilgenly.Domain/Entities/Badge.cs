namespace Bilgenly.Domain.Entities;

public class Badge
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public int RequiredValue { get; set; }
}