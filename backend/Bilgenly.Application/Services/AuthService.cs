using BCrypt.Net;
using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Bilgenly.Application.Services;

public class AuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;
    private static readonly HashSet<string> AllowedAvatars = new()
    {
        "avatar_1", "avatar_2", "avatar_3", "avatar_4"
    };

    private static readonly string DummyPasswordHash =
        BCrypt.Net.BCrypt.HashPassword("timing-equalization-placeholder");
    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }
    public async Task<User?> GetUserByIdAsync(Guid userId)
        => await _userRepository.GetByIdAsync(userId);

    public async Task<(AuthResponseDto? Response, string? Error)> RegisterAsync(RegisterDto dto)
    {
        if (!Enum.TryParse<UserRole>(dto.Role, out var role))
            return (null, $"Role '{dto.Role}' does not exist. Available roles: Student, Teacher, Moderator");
        if (role == UserRole.Moderator)
            return (null, "You cannot register as moderator");

        var email = (dto.Email ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(email))
            return (null, "Email address is required");
        if (email.Length > 254)
            return (null, "Email must be 254 characters or fewer");

        if (await _userRepository.ExistsByEmailAsync(email))
            return (null, "Email is already taken");
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = dto.Username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role,
            CreatedAt = DateTime.UtcNow,
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        return (new AuthResponseDto
        {
            UserId = user.Id.ToString(),
            Token = GenerateToken(user),
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString(),
            OnboardingCompleted = true,
        }, null);
    }

    public async Task<(AuthResponseDto? Response, string? Error)> LoginAsync(LoginDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(dto.Email);

        var passwordIsValid =
            BCrypt.Net.BCrypt.Verify(dto.Password, user?.PasswordHash ?? DummyPasswordHash);

        if (user is null || !passwordIsValid)
            return (null, "Invalid email or password");

        if (user.IsSuspended)
            return (null, "Your account has been suspended. Please contact support.");

        return (new AuthResponseDto
        {
            UserId = user.Id.ToString(),
            Token = GenerateToken(user),
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString(),
            OnboardingCompleted = true,
        }, null);
    }

    private string GenerateToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    public async Task<(AuthResponseDto? Response, string? Error)> UpdateProfileAsync(
        Guid userId, UpdateProfileDto dto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null) return (null, "User not found");

        if (!string.IsNullOrWhiteSpace(dto.Username))
        {
            var trimmedUsername = dto.Username.Trim();
            if (trimmedUsername.Length < 2)
                return (null, "Full name must be at least 2 characters.");
            if (trimmedUsername.Length > 50)
                return (null, "Full name must be 50 characters or fewer.");
            user.Username = trimmedUsername;
        }

        if (dto.Bio is not null)
        {
            var trimmedBio = dto.Bio.Trim();
            if (trimmedBio.Length > 280)
                return (null, "Bio must be 280 characters or fewer.");
            user.Bio = trimmedBio;
        }

        if (dto.AvatarUrl is not null)
        {
            if (!AllowedAvatars.Contains(dto.AvatarUrl))
                return (null, "Invalid avatar selection");

            user.AvatarUrl = dto.AvatarUrl;
        }

        await _userRepository.SaveChangesAsync();

        return (new AuthResponseDto
        {
            UserId = user.Id.ToString(),
            Token = GenerateToken(user),
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString()
        }, null);
    }
    public async Task<(bool Success, string? Error)> ChangePasswordAsync(
        Guid userId, ChangePasswordDto dto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null) return (false, "User not found");

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return (false, "Current password is incorrect");

        if (dto.NewPassword.Length < 8)
            return (false, "New password must be at least 8 characters");

        if (dto.CurrentPassword == dto.NewPassword)
            return (false, "New password must be different from current password");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _userRepository.SaveChangesAsync();

        return (true, null);
    }
    public async Task<(bool Success, string? Error)> DeleteAccountAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null) return (false, "User not found");
        if (user.Role == UserRole.Moderator) return (false, "Moderator accounts cannot be self-deleted");

        await _userRepository.DeleteAsync(user);
        await _userRepository.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(AuthResponseDto? Response, string? Error)> UpdateRoleAsync(
        Guid userId, UpdateRoleDto dto)
    {
        if (!Enum.TryParse<UserRole>(dto.Role, out var role))
            return (null, $"Role '{dto.Role}' does not exist");

        if (role == UserRole.Moderator)
            return (null, "Cannot set moderator role");

        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null) return (null, "User not found");

        user.Role = role;
        await _userRepository.SaveChangesAsync();

        return (new AuthResponseDto
        {
            UserId = user.Id.ToString(),
            Token = GenerateToken(user),
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString(),
            OnboardingCompleted = true,
        }, null);
    }
    
    }
