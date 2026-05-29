using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;

namespace Bilgenly.Application.Services;

public class ClassService
{
    private readonly IClassRepository _classRepository;
    private readonly IQuizRepository _quizRepository;
    private readonly IClassInvitationRepository _invitationRepository;

    public ClassService(IClassRepository classRepository, IQuizRepository quizRepository, IClassInvitationRepository invitationRepository)
    {
        _classRepository = classRepository;
        _quizRepository = quizRepository;
        _invitationRepository = invitationRepository;
    }

    private static string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var random = new Random();
        return new string(Enumerable.Range(0, 6)
            .Select(_ => chars[random.Next(chars.Length)]).ToArray());
    }

    public async Task<ClassDto> CreateClassAsync(CreateClassDto dto, Guid teacherId)
    {
        var classEntity = new Class
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Subject = dto.Subject,
            Description = dto.Description,
            TeacherId = teacherId,
            InviteCode = GenerateInviteCode(),
            IsArchived = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _classRepository.AddAsync(classEntity);
        await _classRepository.SaveChangesAsync();

        return MapToDto(classEntity);
    }

    public async Task<IEnumerable<ClassDto>> GetMyClassesAsTeacherAsync(Guid teacherId)
    {
        var classes = (await _classRepository.GetByTeacherIdAsync(teacherId)).ToList();

        // Load pending invitations sequentially — DbContext is not thread-safe
        var invitationsByClassId = new Dictionary<Guid, IEnumerable<ClassInvitation>>();
        foreach (var c in classes)
            invitationsByClassId[c.Id] = await _invitationRepository.GetByClassIdAsync(c.Id);

        return classes.Select(c =>
        {
            var dto = MapToDto(c);
            dto.PendingInvitations = (invitationsByClassId.TryGetValue(c.Id, out var invitations) ? invitations : [])
                .Where(i => i.Status == "pending")
                .Select(i => new PendingInvitationDto
                {
                    Id = i.Id,
                    RecipientEmail = i.RecipientEmail,
                    CreatedAt = i.CreatedAt,
                })
                .ToList();
            return dto;
        });
    }

    public async Task<IEnumerable<ClassDto>> GetMyClassesAsStudentAsync(Guid studentId)
    {
        var classes = await _classRepository.GetByStudentIdAsync(studentId);
        return classes.Select(MapToDto);
    }

    public async Task<(ClassDto? Result, string? Error)> UpdateClassAsync(
        Guid classId, CreateClassDto dto, Guid teacherId)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity is null) return (null, "Class not found");
        if (classEntity.TeacherId != teacherId) return (null, "Access denied");

        classEntity.Name = dto.Name;
        classEntity.Subject = dto.Subject;
        classEntity.Description = dto.Description;
        classEntity.UpdatedAt = DateTime.UtcNow;

        await _classRepository.SaveChangesAsync();
        var refreshedClass = await _classRepository.GetByIdAsync(classEntity.Id);
        return (MapToDto(refreshedClass ?? classEntity), null);
    }

    public async Task<(bool Success, string? Error)> ArchiveClassAsync(
        Guid classId, Guid teacherId)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity is null) return (false, "Class not found");
        if (classEntity.TeacherId != teacherId) return (false, "Access denied");

        classEntity.IsArchived = !classEntity.IsArchived;
        classEntity.UpdatedAt = DateTime.UtcNow;

        await _classRepository.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DeleteClassAsync(
        Guid classId, Guid teacherId)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity is null) return (false, "Class not found");
        if (classEntity.TeacherId != teacherId) return (false, "Access denied");

        _classRepository.Remove(classEntity);
        await _classRepository.SaveChangesAsync();
        return (true, null);
    }
    public async Task<(bool Success, string? Error)> RemoveStudentAsync(
        Guid classId, Guid studentId, Guid teacherId)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity is null)
            return (false, "Class not found");

        if (classEntity.TeacherId != teacherId)
            return (false, "You are not the teacher of this class");

        var classStudent = await _classRepository.GetClassStudentAsync(classId, studentId);
        if (classStudent is null)
            return (false, "Student is not in this class");

        _classRepository.RemoveClassStudent(classStudent);
        await _classRepository.SaveChangesAsync();

        return (true, null);
    }
    public async Task<(ClassDto? Result, string? Error)> JoinClassAsync(
        string inviteCode, Guid studentId)
    {
        var classEntity = await _classRepository.GetByInviteCodeAsync(inviteCode);
        if (classEntity is null) return (null, "Invalid invite code");
        if (classEntity.IsArchived) return (null, "Class is archived");

        var alreadyJoined = classEntity.ClassStudents
            .Any(cs => cs.StudentId == studentId);
        if (alreadyJoined) return (null, "Already joined this class");

        classEntity.ClassStudents.Add(new ClassStudent
        {
            ClassId = classEntity.Id,
            StudentId = studentId,
            JoinedAt = DateTime.UtcNow
        });
        classEntity.UpdatedAt = DateTime.UtcNow;

        await _classRepository.SaveChangesAsync();
        return (MapToDto(classEntity), null);
    }
    public async Task<(AssignmentDto? Result, string? Error)> AssignQuizAsync(
        Guid classId, AssignQuizDto dto, Guid teacherId, string teacherName)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity is null) return (null, "Class not found");
        if (classEntity.TeacherId != teacherId) return (null, "Access denied");

        var quiz = await _quizRepository.GetByIdAsync(dto.QuizId);
        if (quiz is null) return (null, "Quiz not found");
        if (quiz.UserId != teacherId) return (null, "You can only assign quizzes that belong to your account.");

        var alreadyAssigned = classEntity.Assignments
            .Any(a => a.QuizId == dto.QuizId && a.Status == "active");
        if (alreadyAssigned) return (null, "Quiz already assigned to this class");

        var status = dto.Deadline.HasValue && dto.Deadline < DateTime.UtcNow
            ? "expired"
            : "active";

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            ClassId = classId,
            QuizId = dto.QuizId,
            AssignedAt = DateTime.UtcNow,
            Deadline = dto.Deadline,
            MaxAttempts = dto.MaxAttempts,
            AllowLateSubmissions = dto.AllowLateSubmissions,
            AssignedBy = teacherId.ToString(),
            AssignedByName = teacherName,
            Visibility = "class-members",
            Status = status
        };

        await _classRepository.AddAssignmentAsync(assignment);
        await _classRepository.SaveChangesAsync();

        return (MapAssignmentToDto(assignment, quiz), null);
    }
    public async Task<(bool Success, string? Error)> RemoveAssignmentAsync(
        Guid classId, Guid assignmentId, Guid teacherId)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity is null) return (false, "Class not found");
        if (classEntity.TeacherId != teacherId) return (false, "Access denied");

        var assignment = classEntity.Assignments.FirstOrDefault(a => a.Id == assignmentId);
        if (assignment is null) return (false, "Assignment not found");

        _classRepository.RemoveAssignment(assignment);
        await _classRepository.SaveChangesAsync();
        return (true, null);
    }

    /// <summary>
    /// Increments the MaxAttempts cap on an assignment by one, giving every
    /// student in the class one extra opportunity to retake the quiz.
    /// If MaxAttempts was null (unlimited), it stays unlimited.
    /// </summary>
    public async Task<(int? NewMaxAttempts, string? Error)> GrantExtraAttemptAsync(
        Guid classId, Guid assignmentId, Guid teacherId)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity is null) return (null, "Class not found");
        if (classEntity.TeacherId != teacherId) return (null, "Access denied");

        var assignment = classEntity.Assignments.FirstOrDefault(a => a.Id == assignmentId);
        if (assignment is null) return (null, "Assignment not found");

        // If attempts are already unlimited, there is nothing to grant.
        if (assignment.MaxAttempts is null)
            return (null, null); // success — unlimited means student can always retry

        assignment.MaxAttempts += 1;
        await _classRepository.SaveChangesAsync();
        return (assignment.MaxAttempts, null);
    }

    private AssignmentDto MapAssignmentToDto(Assignment a, Quiz quiz) => new()
    {
        Id = a.Id,
        AssignmentId = a.Id.ToString(),
        ClassId = a.ClassId,
        QuizId = a.QuizId,
        Title = quiz.Title,
        Topic = quiz.Topic,
        QuestionCount = quiz.Questions.Count,
        AssignedAt = a.AssignedAt,
        Deadline = a.Deadline,
        MaxAttempts = a.MaxAttempts,
        AllowLateSubmissions = a.AllowLateSubmissions,
        AssignedBy = a.AssignedBy,
        AssignedByName = a.AssignedByName,
        Visibility = a.Visibility,
        Status = a.Status
    };
    private ClassDto MapToDto(Class c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Subject = c.Subject,
        Description = c.Description,
        TeacherName = c.Teacher?.Username ?? string.Empty,
        InviteCode = c.InviteCode,
        IsArchived = c.IsArchived,
        StudentCount = c.ClassStudents.Count,
        QuizCount = c.Assignments.Count, 
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt,
        Students = c.ClassStudents.Select(cs => new ClassStudentDto
        {
            StudentId = cs.StudentId,
            Username = cs.Student?.Username ?? "",
            Email = cs.Student?.Email ?? "",
            JoinedAt = cs.JoinedAt
        }).ToList(),
        Quizzes = c.Assignments.Select(a => new ClassQuizDto
        {
            AssignmentId = a.Id,
            QuizId = a.QuizId,
            QuizTitle = a.Quiz?.Title ?? "",
            Topic = a.Quiz?.Topic ?? "",
            QuestionCount = a.Quiz?.Questions.Count ?? 0,
            AssignedAt = a.AssignedAt,
            Deadline = a.Deadline,
            MaxAttempts = a.MaxAttempts,
            AllowLateSubmissions = a.AllowLateSubmissions,
            AssignedBy = a.AssignedBy,
            AssignedByName = a.AssignedByName,
            Visibility = a.Visibility,
            Status = a.Status,
        }).ToList()
    };
}
