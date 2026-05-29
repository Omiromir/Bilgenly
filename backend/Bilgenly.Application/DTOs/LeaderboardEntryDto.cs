namespace Bilgenly.Application.DTOs;

public class LeaderboardEntryDto
{
    public int Rank { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public double AverageScore { get; set; }
    public bool IsCurrentUser { get; set; }
    public string? AvatarUrl { get; set; }
}