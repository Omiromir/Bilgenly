using Bilgenly.Application.DTOs;
using Bilgenly.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bilgenly.API.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class AttemptController : ControllerBase
{
    private readonly AttemptService _attemptService;

    public AttemptController(AttemptService attemptService)
    {
        _attemptService = attemptService;
    }

    [HttpPost("quizzes/{quizId}/attempt")]
    public async Task<IActionResult> StartAttempt(Guid quizId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var (result, error) = await _attemptService.StartAttemptAsync(quizId, userId);
        if (result is null)
        {
            // Route to the most semantically correct HTTP status:
            //   404 — quiz genuinely does not exist
            //   403 — quiz exists but is hidden/inaccessible
            //   409 — business-rule conflict (attempts exhausted, stale in-progress, etc.)
            if (error == "Quiz not found")
                return NotFound(new { message = error });

            if (error == "This quiz is not available.")
                return StatusCode(403, new { message = error });

            return Conflict(new { message = error });
        }

        return Ok(result);
    }

    
    [HttpPost("attempts/{attemptId}/submit")]
    public async Task<IActionResult> SubmitAttempt(Guid attemptId, SubmitAttemptDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var (result, error) = await _attemptService.SubmitAttemptAsync(attemptId, userId, dto);
        if (result is null)
            return BadRequest(new { message = error });

        return Ok(result);
    }
    [HttpGet("attempts/quiz/{quizId}")]
    public async Task<IActionResult> GetAttemptsByQuiz(Guid quizId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var attempts = await _attemptService.GetAttemptsByQuizAsync(quizId, userId);
        return Ok(attempts);
    }

    [HttpGet("attempts/my")]
    public async Task<IActionResult> GetMyAttempts()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var attempts = await _attemptService.GetMyAttemptsAsync(userId);
        return Ok(attempts);
    }
}