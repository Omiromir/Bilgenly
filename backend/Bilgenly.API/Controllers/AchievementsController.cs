using Bilgenly.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bilgenly.API.Controllers;

[ApiController]
[Route("api/achievements")]
[Authorize(Roles = "Student")]
public class AchievementsController : ControllerBase
{
    private readonly AchievementsService _achievementsService;

    public AchievementsController(AchievementsService achievementsService)
    {
        _achievementsService = achievementsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAchievements([FromQuery] Guid? classId = null)
    {
        var studentId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _achievementsService.GetAchievementsAsync(studentId, classId);
        return Ok(result);
    }
}