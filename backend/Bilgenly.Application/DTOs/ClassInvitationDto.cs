namespace Bilgenly.Application.DTOs;

public class ClassInvitationDto
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
}

public class SendClassInvitationDto
{
    public string Email { get; set; } = string.Empty;
}

public class SendBulkClassInvitationsDto
{
    public IList<string> Emails { get; set; } = new List<string>();
}

public class RevokeClassInvitationDto
{
    public string Email { get; set; } = string.Empty;
}
