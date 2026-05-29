using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;
using Bilgenly.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bilgenly.API.Controllers;

[ApiController]
[Route("api/classes")]
[Authorize]
public class ClassController : ControllerBase
{
    private readonly ClassService _classService;
    private readonly IClassRepository _classRepository;
    private readonly ClassInvitationService _classInvitationService;
    private readonly IUserRepository _userRepository;

    public ClassController(ClassService classService, IClassRepository classRepository, ClassInvitationService classInvitationService, IUserRepository userRepository)
    {
        _classService = classService;
        _classInvitationService = classInvitationService;
        _classRepository = classRepository;
        _userRepository = userRepository;
    }

    [HttpGet("student-search")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> SearchStudents([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return Ok(new List<object>());

        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var students = await _userRepository.SearchStudentsAsync(q.Trim(), teacherId);

        var result = students.Select(u => new
        {
            id = u.Id,
            username = u.Username,
            email = u.Email,
            avatarUrl = u.AvatarUrl,
        });

        return Ok(result);
    }

    [HttpPost("{classId:guid}/invite")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> SendInvitations(Guid classId, [FromBody] SendBulkClassInvitationsDto dto)
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (sent, failed, error) = await _classInvitationService.SendInvitationsAsync(classId, dto.Emails, teacherId);
        if (error is not null) return BadRequest(new { message = error });
        return Ok(new { sent, failed });
    }

    [HttpGet("{classId:guid}/invitations")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetInvitations(Guid classId)
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var results = await _classInvitationService.GetInvitationsForClassAsync(classId, teacherId);
        return Ok(results);
    }

    [HttpDelete("{classId}/students/{studentId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> RemoveStudent(Guid classId, Guid studentId)
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, error) = await _classService.RemoveStudentAsync(classId, studentId, teacherId);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "Student removed from class" });
    }

    [HttpDelete("{classId:guid}/invitations/{invitationId:guid}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> RevokeInvitation(Guid classId, Guid invitationId)
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity is null) return NotFound(new { message = "Class not found" });
        if (classEntity.TeacherId != teacherId) return Forbid();

        var invitation = await _classInvitationService.GetInvitationByIdAsync(invitationId);
        if (invitation is null || invitation.ClassId != classId)
            return NotFound(new { message = "Invitation not found" });

        await _classInvitationService.DeleteInvitationAsync(invitation);
        return Ok(new { message = "Invitation revoked" });
    }
    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> CreateClass(CreateClassDto dto)
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _classService.CreateClassAsync(dto, teacherId);
        return Ok(result);
    }

    [HttpGet("teacher")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetMyClassesAsTeacher()
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _classService.GetMyClassesAsTeacherAsync(teacherId);
        return Ok(result);
    }

    [HttpGet("student")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyClassesAsStudent()
    {
        var studentId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _classService.GetMyClassesAsStudentAsync(studentId);
        return Ok(result);
    }

    [HttpPut("{classId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UpdateClass(Guid classId, CreateClassDto dto)
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (result, error) = await _classService.UpdateClassAsync(classId, dto, teacherId);
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPatch("{classId}/archive")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> ArchiveClass(Guid classId)
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, error) = await _classService.ArchiveClassAsync(classId, teacherId);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "Class archive status updated" });
    }

    [HttpDelete("{classId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteClass(Guid classId)
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, error) = await _classService.DeleteClassAsync(classId, teacherId);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "Class deleted" });
    }

    [HttpPost("join")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> JoinClass([FromBody] JoinClassRequest dto)
    {
        var studentId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (result, error) = await _classService.JoinClassAsync(dto.InviteCode, studentId); 
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }
    [HttpDelete("{classId}/assignments/{assignmentId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> RemoveAssignment(Guid classId, Guid assignmentId)
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, error) = await _classService.RemoveAssignmentAsync(classId, assignmentId, teacherId);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "Assignment removed" });
    }

    /// <summary>
    /// Grants one extra attempt to all students for the given assignment by
    /// incrementing its MaxAttempts cap. If the assignment has no cap
    /// (unlimited attempts) the endpoint returns a success with unlimited=true.
    /// </summary>
    [HttpPatch("{classId}/assignments/{assignmentId}/grant-attempt")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GrantExtraAttempt(Guid classId, Guid assignmentId)
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (newMaxAttempts, error) = await _classService.GrantExtraAttemptAsync(classId, assignmentId, teacherId);
        if (error is not null) return BadRequest(new { message = error });

        return Ok(new
        {
            message = "Extra attempt granted",
            maxAttempts = newMaxAttempts,
            unlimited = newMaxAttempts is null
        });
    }
    [HttpPost("{classId}/assignments")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> AssignQuiz(Guid classId, [FromBody] AssignQuizDto dto)
    {
        var teacherId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var teacherName = User.FindFirst(ClaimTypes.Name)!.Value;
        var (result, error) = await _classService.AssignQuizAsync(classId, dto, teacherId, teacherName);
        if (result is null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpGet("{classId}/assignments")]
    [Authorize(Roles = "Teacher, Student")]
    public async Task<IActionResult> GetAssignments(Guid classId)
    {
        var assignments = await _classRepository.GetAssignmentsByClassIdAsync(classId);
        return Ok(assignments.Select(a => new AssignmentDto
        {
            Id = a.Id,
            AssignmentId = a.Id.ToString(),
            ClassId = a.ClassId,
            QuizId = a.QuizId,
            Title = a.Quiz?.Title ?? "",
            Topic = a.Quiz?.Topic ?? "",
            QuestionCount = a.Quiz != null ? a.Quiz.Questions.Count : 0,
            AssignedAt = a.AssignedAt,
            Deadline = a.Deadline,
            MaxAttempts = a.MaxAttempts,
            AllowLateSubmissions = a.AllowLateSubmissions,
            AssignedBy = a.AssignedBy,
            AssignedByName = a.AssignedByName,
            Visibility = a.Visibility,
            Status = a.Status
        }));
    }
}

public class JoinClassRequest
{
    public string InviteCode { get; set; } = string.Empty;
}