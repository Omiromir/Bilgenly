using Bilgenly.Application.DTOs;
using Bilgenly.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bilgenly.API.Controllers;

[ApiController]
[Route("api/moderation")]
[Authorize]
public class ModerationController : ControllerBase
{
    private readonly ModerationService _moderationService;

    public ModerationController(ModerationService moderationService)
    {
        _moderationService = moderationService;
    }

    [HttpGet("dashboard")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _moderationService.GetDashboardAsync();
        return Ok(result);
    }

    [HttpGet("reports")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> GetReports()
    {
        var results = await _moderationService.GetAllReportsAsync();
        return Ok(results);
    }

    [HttpPost("reports")]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)
    {
        var reporterId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (result, error) = await _moderationService.CreateReportAsync(dto, reporterId);
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPut("reports/{id:guid}")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> ReviewReport(Guid id, [FromBody] ReviewReportDto dto)
    {
        var moderatorId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (result, error) = await _moderationService.ReviewReportAsync(id, dto, moderatorId);
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpGet("users/suspended")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> GetSuspendedUsers()
    {
        var results = await _moderationService.GetSuspendedUsersAsync();
        return Ok(results);
    }

    [HttpPut("users/{id:guid}/suspend")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> SuspendUser(Guid id, [FromBody] SuspendUserDto dto)
    {
        var moderatorId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (result, error) = await _moderationService.SuspendUserAsync(id, dto, moderatorId);
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPut("users/{id:guid}/unsuspend")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> UnsuspendUser(Guid id)
    {
        var moderatorId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var error = await _moderationService.UnsuspendUserAsync(id, moderatorId);
        if (error is not null) return BadRequest(new { message = error });
        return Ok();
    }

    [HttpGet("quizzes/hidden")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> GetHiddenQuizzes()
    {
        var results = await _moderationService.GetHiddenQuizzesAsync();
        return Ok(results);
    }

    [HttpPut("quizzes/{id:guid}/hide")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> HideQuiz(Guid id, [FromBody] HideQuizDto dto)
    {
        var moderatorId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (result, error) = await _moderationService.HideQuizAsync(id, dto, moderatorId);
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPut("quizzes/{id:guid}/unhide")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> UnhideQuiz(Guid id)
    {
        var moderatorId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var error = await _moderationService.UnhideQuizAsync(id, moderatorId);
        if (error is not null) return BadRequest(new { message = error });
        return Ok();
    }

    [HttpGet("quizzes")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> GetAllQuizzes()
    {
        var results = await _moderationService.GetAllQuizzesAsync();
        return Ok(results);
    }

    [HttpGet("users")]
    [Authorize(Roles = "Moderator")]
    public async Task<IActionResult> GetAllUsers()
    {
        var results = await _moderationService.GetAllUsersAsync();
        return Ok(results);
    }
}
