using Bilgenly.Application.DTOs;
using Bilgenly.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bilgenly.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizController : ControllerBase
{
    private readonly QuizService _quizService;

    public QuizController(QuizService quizService)
    {
        _quizService = quizService;
    }
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteQuiz(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, error) = await _quizService.DeleteQuizAsync(id, userId);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "Quiz deleted" });
    }
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateQuiz(CreateQuizDto dto)
    {
        var userId = Guid .Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var username = User.FindFirst(ClaimTypes.Name)!.Value;

        var quiz = await _quizService.CreateQuizAsync(dto, userId, username);
        return Ok(quiz);
    }

    [HttpGet("My")]
    [Authorize]
    public async Task<IActionResult> GetMyQuizzes()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var quizzes = await _quizService.GetMyQuizzesAsync(userId);
        return Ok(quizzes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var quiz = await _quizService.GetQuizAsync(id);
        if (quiz is null) return NotFound(new { message = "Quiz not found" });
        return Ok(quiz);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateQuiz(Guid id, [FromBody] UpdateQuizDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (result, error) = await _quizService.UpdateQuizAsync(id, dto, userId);
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }
}