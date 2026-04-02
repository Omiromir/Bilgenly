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

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public async Task<(AuthResponseDto? Response, string? Error)> RegisterAsync(RegisterDto dto)
    {
        if (!Enum.TryParse<UserRole>(dto.Role, out var role))
            return (null, $"Role '{dto.Role}' does not exist. Available roles: Student, Teacher, Moderator");
        if (role == UserRole.Moderator)
            return (null, "You cannot register as moderator");
        if (await _userRepository.ExistsByEmailAsync(dto.Email))
            return (null, "Email is already taken");
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role
        };

        await _userRepository.AddAsync(user);
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

    public async Task<(AuthResponseDto? Response, string? Error)> LoginAsync(LoginDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(dto.Email);
        if (user is null)
            return (null, "No account found with this email");
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return (null, "Incorrect password");

        return (new AuthResponseDto
        {
            UserId = user.Id.ToString(),
            Token = GenerateToken(user),
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString()
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
    
    }
