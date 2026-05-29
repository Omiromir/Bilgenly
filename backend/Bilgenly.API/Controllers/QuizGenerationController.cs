using Bilgenly.Application.DTOs;
using Bilgenly.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bilgenly.API.Controllers;

[ApiController]
[Route("api/quiz-generation")]
[Authorize]
public class QuizGenerationController : ControllerBase
{
    private readonly QuizGenerationService _generationService;
    private readonly QuizService _quizService;

    public QuizGenerationController(QuizGenerationService generationService, QuizService quizService)
    {
        _generationService = generationService;
        _quizService = quizService;
    }

    [HttpPost("from-text")]
    public async Task<IActionResult> GenerateFromText([FromBody] GenerateQuizConfigDto config)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (result, error) = await _generationService.GenerateFromTextAsync(config, userId);
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPost("from-pdf")]
    public async Task<IActionResult> GenerateFromPdf(
        IFormFile file,
        [FromForm] string title,
        [FromForm] string topic,
        [FromForm] string topicFocus,
        [FromForm] int questionCount = 5,
        [FromForm] string questionType = "MCQ",
        [FromForm] string additionalInstructions = "")
    {
        if (file.Length == 0)
            return BadRequest(new { message = "File is empty" });

        if (!file.FileName.EndsWith(".pdf"))
            return BadRequest(new { message = "Only PDF files allowed" });

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        var config = new GenerateQuizConfigDto
        {
            Title = title,
            Topic = topic,
            TopicFocus = topicFocus,
            QuestionCount = questionCount,
            QuestionType = questionType,
            AdditionalInstructions = additionalInstructions,
            SourceType = "pdf"
        };

        var (result, error) = await _generationService.GenerateFromPdfAsync(
            ms.ToArray(), config, userId);

        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPut("{quizId}/review")]
    public async Task<IActionResult> SaveAfterReview(
        Guid quizId, [FromBody] UpdateGeneratedQuizDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (result, error) = await _generationService.UpdateAfterReviewAsync(quizId, dto, userId);
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpGet("{quizId}/review")]
    public async Task<IActionResult> GetForReview(Guid quizId)
    {
        // Returns the full quiz (questions + answers) so the frontend review
        // stage can populate the editor without a separate /api/quizzes/{id} call.
        var quiz = await _quizService.GetQuizAsync(quizId);
        if (quiz is null) return NotFound(new { message = "Quiz not found" });
        return Ok(quiz);
    }
}