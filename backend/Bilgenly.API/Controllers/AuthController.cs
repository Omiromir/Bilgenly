using Bilgenly.Application.DTOs;
using Bilgenly.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bilgenly.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController  : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var (result, error) = await _authService.RegisterAsync(dto);
        if (result is null)
            return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var(result, error ) = await _authService.LoginAsync(dto);
        if (result is null)
            return Unauthorized(new { message = error });
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user = await _authService.GetUserByIdAsync(userId);
        // Treat suspended/deleted users as fully unauthenticated. This is what
        // the frontend polls for liveness — returning 401 here is the trigger
        // that boots a suspended/deleted user out of their live session.
        if (user is null) return Unauthorized(new { message = "Account not found." });
        if (user.IsSuspended)
        {
            var reason = string.IsNullOrWhiteSpace(user.SuspensionReason)
                ? "Your account has been suspended."
                : $"Your account has been suspended: {user.SuspensionReason}";
            return Unauthorized(new { message = reason, suspended = true });
        }

        return Ok(new {
            userId = user.Id.ToString(),
            email = user.Email,
            username = user.Username,
            role = user.Role.ToString(),
            bio = user.Bio,
            avatarUrl = user.AvatarUrl,
            createdAt = user.CreatedAt,
            onboardingCompleted = true
        });
    }
    [HttpPatch("role")]
    [Authorize]
    public async Task<IActionResult> UpdateRole([FromBody] UpdateRoleDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (result, error) = await _authService.UpdateRoleAsync(userId, dto);
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }
    [HttpPatch("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (result, error) = await _authService.UpdateProfileAsync(userId, dto);
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }
    [HttpPatch("password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, error) = await _authService.ChangePasswordAsync(userId, dto);

        if (!success)
            return BadRequest(new { message = error });

        return Ok(new { message = "Password updated successfully" });
    }

    [HttpDelete("account")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, error) = await _authService.DeleteAccountAsync(userId);

        if (!success)
            return BadRequest(new { message = error });

        return Ok(new { message = "Account deleted successfully" });
    }

}
