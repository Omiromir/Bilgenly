import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useQuizLibrary } from "../../../app/providers/QuizLibraryProvider";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { useSettings } from "../../../app/providers/SettingsProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { updateProfile as updateProfileRequest } from "../../profile/api";
import { isStaticAvatarId } from "../../profile/avatars";
import { getProfileInitials } from "../settings/userSettings";
import type {
  ProfileActivityItem,
  ProfileField,
  ProfileFormErrors,
  ProfileFormValues,
  ProfileStat,
  ProfileSummary,
} from "../profile/profileTypes";
import { useDashboardViewer } from "./useDashboardViewer";
import { useMyAnalytics } from "./useDashboardAnalytics";
import {
  formatQuizScore,
  getQuizSessionResultSummary,
} from "../../quiz-session/quizSessionUtils";

const MAX_BIO_LENGTH = 280;
const MAX_FULLNAME_LENGTH = 40;
const MIN_FULLNAME_LENGTH = 2;
const MAX_LOCATION_LENGTH = 60;

interface ProfileActivityEvent {
  title: string;
  description: string;
  timestamp: string;
}

interface UseProfileResult {
  profile: ProfileSummary | null;
  formValues: ProfileFormValues;
  formErrors: ProfileFormErrors;
  isEditing: boolean;
  isSaving: boolean;
  isDirty: boolean;
  canSave: boolean;
  startEditing: () => void;
  cancelEditing: () => void;
  saveProfile: () => Promise<void>;
  updateField: <TField extends keyof ProfileFormValues>(
    field: TField,
    value: ProfileFormValues[TField],
  ) => void;
  selectStaticAvatar: (avatarId: string) => void;
}

function buildRoleLabel(role: string | null | undefined) {
  switch (role) {
    case "teacher":
      return "Teacher";
    case "student":
      return "Student";
    case "moderator":
      return "Moderator";
    default:
      return "User";
  }
}

function buildProfileFormValues(profile: {
  fullName: string;
  email: string;
  bio: string;
  location: string;
  avatarUrl: string | null;
}): ProfileFormValues {
  return {
    fullName: profile.fullName,
    email: profile.email,
    bio: profile.bio,
    location: profile.location,
    avatarUrl: profile.avatarUrl,
  };
}

function validateEmail(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "Email is required.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(normalizedValue)
    ? undefined
    : "Enter a valid email address.";
}

function validateFullName(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Full name is required.";
  if (trimmed.length < MIN_FULLNAME_LENGTH)
    return `Full name must be at least ${MIN_FULLNAME_LENGTH} characters.`;
  if (trimmed.length > MAX_FULLNAME_LENGTH)
    return `Full name must be ${MAX_FULLNAME_LENGTH} characters or fewer.`;
  if (!/^[\p{L}\p{N}\s'.-]+$/u.test(trimmed))
    return "Full name contains invalid characters.";
  return undefined;
}

function validateLocation(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length > MAX_LOCATION_LENGTH)
    return `Country must be ${MAX_LOCATION_LENGTH} characters or fewer.`;
  return undefined;
}

function validateProfileForm(values: ProfileFormValues): ProfileFormErrors {
  return {
    fullName: validateFullName(values.fullName),
    email: validateEmail(values.email),
    bio:
      values.bio.trim().length > MAX_BIO_LENGTH
        ? `Bio must be ${MAX_BIO_LENGTH} characters or fewer.`
        : undefined,
    location: validateLocation(values.location),
  };
}

function hasErrors(errors: ProfileFormErrors) {
  return Object.values(errors).some(Boolean);
}

function formatProfileValue(value: string | null | undefined, fallback = "Not provided") {
  return value?.trim() ? value.trim() : fallback;
}

function parseIsoTimestamp(timestamp: string) {
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function sortActivityEvents(events: ProfileActivityEvent[]) {
  return [...events].sort(
    (left, right) => parseIsoTimestamp(right.timestamp) - parseIsoTimestamp(left.timestamp),
  );
}

function buildTeacherStats(
  ownedQuizCount: number,
  activeClassCount: number,
  assignedQuizCount: number,
  joinedStudentCount: number,
): ProfileStat[] {
  return [
    { label: "Quizzes Created", value: String(ownedQuizCount), icon: "book" },
    { label: "Classes Active", value: String(activeClassCount), icon: "badge" },
    { label: "Assigned Quizzes", value: String(assignedQuizCount), icon: "trend" },
    { label: "Joined Students", value: String(joinedStudentCount), icon: "clock" },
  ];
}

function buildStudentStats(
  completedQuizCount: number,
  joinedClassCount: number,
  averageScore: number | null,
  badgesEarned: number,
): ProfileStat[] {
  return [
    { label: "Quizzes Completed", value: String(completedQuizCount), icon: "book" },
    { label: "Classes Joined", value: String(joinedClassCount), icon: "badge" },
    {
      label: "Average Score",
      value: averageScore === null ? "--" : formatQuizScore(averageScore),
      icon: "trend",
    },
    { label: "Badges Earned", value: String(badgesEarned), icon: "clock" },
  ];
}

function buildTeacherActivity(
  teacherName: string,
  quizzes: {
    id: string;
    title: string;
    updatedAt: string;
  }[],
  classes: {
    id: string;
    name: string;
    updatedAt: string;
    assignedQuizzes: {
      assignmentId: string;
      title: string;
      assignedAt: string;
    }[];
  }[],
  formatDateTime: (value: string | Date) => string,
): ProfileActivityItem[] {
  const events = sortActivityEvents([
    ...quizzes.map((quiz) => ({
      title: "Updated quiz",
      description: quiz.title,
      timestamp: quiz.updatedAt,
    })),
    ...classes.map((teacherClass) => ({
      title: "Updated class",
      description: teacherClass.name,
      timestamp: teacherClass.updatedAt,
    })),
    ...classes.flatMap((teacherClass) =>
      teacherClass.assignedQuizzes.map((assignment) => ({
        title: "Assigned quiz",
        description: `${assignment.title} in ${teacherClass.name}`,
        timestamp: assignment.assignedAt,
      })),
    ),
  ]).slice(0, 5);

  if (!events.length) {
    return [
      {
        title: "No activity yet",
        description: `${teacherName} has not created classes or quizzes yet.`,
        time: "Activity will appear here as you work.",
      },
    ];
  }

  return events.map((event) => ({
    title: event.title,
    description: event.description,
    time: formatDateTime(event.timestamp),
  }));
}

function buildStudentActivity(
  completedAttempts: {
    attemptId: string;
    quizTitle: string;
    score: number;
    dateTaken: string;
  }[],
  joinedClasses: {
    classId: string;
    className: string;
    joinedAt: string;
  }[],
  formatDateTime: (value: string | Date) => string,
): ProfileActivityItem[] {
  const events = sortActivityEvents([
    ...completedAttempts.map((attempt) => ({
      title: "Completed quiz",
      description: `${attempt.quizTitle} - ${formatQuizScore(attempt.score)}`,
      timestamp: attempt.dateTaken,
    })),
    ...joinedClasses.map((joinedClass) => ({
      title: "Joined class",
      description: joinedClass.className,
      timestamp: joinedClass.joinedAt,
    })),
  ]).slice(0, 5);

  if (!events.length) {
    return [
      {
        title: "No activity yet",
        description: "Activity will appear after you join classes or finish quizzes.",
        time: "Start with any quiz or class invite.",
      },
    ];
  }

  return events.map((event) => ({
    title: event.title,
    description: event.description,
    time: formatDateTime(event.timestamp),
  }));
}

export function useProfile(): UseProfileResult {
  const { role } = useAuth();
  const dashboardViewer = useDashboardViewer();
  const {
    settings,
    isHydrated,
    saveProfileSettings,
    formatDateTime,
  } = useSettings();
  const { classes } = useTeacherClasses();
  const { quizzes } = useQuizLibrary();
  const { getCompletedSessionsForRole } = useQuizSessions();
  const analyticsState = useMyAnalytics(role === "student");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const joinedTeacherClasses = useMemo(
    () =>
      role === "teacher"
        ? classes
        : [],
    [classes, role],
  );
  const joinedStudentClasses = useMemo(
    () =>
      role === "student"
        ? classes.filter((teacherClass) =>
            teacherClass.students.some((student) => student.status === "joined"),
          )
        : [],
    [classes, role],
  );
  const teacherOwnedQuizzes = useMemo(() => {
    if (role !== "teacher" || !dashboardViewer?.fullName) {
      return [];
    }

    return quizzes.filter(
      (quiz) =>
        quiz.ownerRole === "teacher" &&
        quiz.ownerName.trim().toLowerCase() ===
          dashboardViewer.fullName.trim().toLowerCase(),
    );
  }, [dashboardViewer?.fullName, quizzes, role]);
  const completedSessions = getCompletedSessionsForRole(role === "teacher" ? "teacher" : "student");

  const persistedProfile = useMemo<ProfileSummary | null>(() => {
    if (!dashboardViewer) {
      return null;
    }

    // Prefer backend-synced viewer data so the displayed profile survives a
    // page refresh on a different device / cleared localStorage.
    const joinedLabel = dashboardViewer.joinedLabel || "Member";
    const location = settings.profile.country;
    const fullName = dashboardViewer.fullName || settings.profile.fullName;
    const email = dashboardViewer.email || settings.profile.email;
    const bio = (dashboardViewer.bio ?? settings.profile.bio).trim();
    const avatarUrl = dashboardViewer.avatarUrl ?? settings.profile.avatarUrl;
    const personalInfo: ProfileField[] = [
      { label: "Full Name", value: formatProfileValue(fullName) },
      { label: "Email", value: formatProfileValue(email) },
      { label: "Country", value: formatProfileValue(location) },
    ];

    if (role === "teacher") {
      const joinedStudentCount = joinedTeacherClasses.reduce(
        (total, teacherClass) =>
          total +
          teacherClass.students.filter((student) => student.status === "joined").length,
        0,
      );
      const assignedQuizCount = joinedTeacherClasses.reduce(
        (total, teacherClass) => total + teacherClass.assignedQuizzes.length,
        0,
      );

      return {
        name: fullName,
        roleLabel: buildRoleLabel(role),
        email,
        joinedLabel,
        location: formatProfileValue(location),
        bio: bio || "Add a short bio from your profile page.",
        initials: getProfileInitials(fullName),
        avatarUrl,
        stats: buildTeacherStats(
          teacherOwnedQuizzes.length,
          joinedTeacherClasses.filter((teacherClass) => teacherClass.status === "active").length,
          assignedQuizCount,
          joinedStudentCount,
        ),
        activity: buildTeacherActivity(
          fullName,
          teacherOwnedQuizzes.map((quiz) => ({
            id: quiz.id,
            title: quiz.title,
            updatedAt: quiz.updatedAt,
          })),
          joinedTeacherClasses.map((teacherClass) => ({
            id: teacherClass.id,
            name: teacherClass.name,
            updatedAt: teacherClass.updatedAt,
            assignedQuizzes: teacherClass.assignedQuizzes.map((assignment) => ({
              assignmentId: assignment.assignmentId,
              title: assignment.title,
              assignedAt: assignment.assignedAt,
            })),
          })),
          formatDateTime,
        ),
        personalInfo,
      };
    }

    const analyticsAttempts = analyticsState.data?.attempts ?? [];
    const completedQuizCount = analyticsAttempts.length || completedSessions.length;
    const averageScore =
      analyticsAttempts.length > 0
        ? Math.round(analyticsState.data?.averageScore ?? 0)
        : completedSessions.length
          ? Math.round(
              completedSessions.reduce((total, session) => {
                return total + getQuizSessionResultSummary(session).percentage;
              }, 0) / completedSessions.length,
            )
          : null;
    const joinedClassCount = joinedStudentClasses.length;
    const studentActivityAttempts =
      analyticsAttempts.length > 0
        ? analyticsAttempts.map((attempt) => ({
            attemptId: attempt.attemptId,
            quizTitle: attempt.quizTitle,
            score: attempt.score,
            dateTaken: attempt.dateTaken,
          }))
        : completedSessions.map((session) => ({
            attemptId: session.id,
            quizTitle: session.quiz.title,
            score: getQuizSessionResultSummary(session).percentage,
            dateTaken: session.finishedAt ?? session.updatedAt,
          }));

    return {
      name: fullName,
      roleLabel: buildRoleLabel(role),
      email,
      joinedLabel,
      location: formatProfileValue(location),
      bio: bio || "Add a short bio from your profile page.",
      initials: getProfileInitials(fullName),
      avatarUrl,
      stats: buildStudentStats(
        completedQuizCount,
        joinedClassCount,
        averageScore,
        0,
      ),
      activity: buildStudentActivity(
        studentActivityAttempts,
        joinedStudentClasses.map((teacherClass) => {
          const joinedStudent =
            teacherClass.students.find((student) => student.status === "joined") ??
            teacherClass.students[0];

          return {
            classId: teacherClass.id,
            className: teacherClass.name,
            joinedAt: joinedStudent?.joinedAt ?? teacherClass.updatedAt,
          };
        }),
        formatDateTime,
      ),
      personalInfo,
    };
  }, [
    analyticsState.data?.attempts,
    analyticsState.data?.averageScore,
    completedSessions,
    dashboardViewer,
    formatDateTime,
    joinedStudentClasses,
    joinedTeacherClasses,
    role,
    settings.profile.avatarUrl,
    settings.profile.bio,
    settings.profile.country,
    settings.profile.dateFormat,
    settings.profile.email,
    settings.profile.fullName,
    settings.profile.language,
    settings.profile.phoneNumber,
    settings.profile.timeZone,
    teacherOwnedQuizzes,
  ]);

  const persistedFormValues = useMemo(
    () =>
      buildProfileFormValues({
        fullName: settings.profile.fullName,
        email: settings.profile.email,
        bio: settings.profile.bio,
        location: settings.profile.country,
        avatarUrl: settings.profile.avatarUrl,
      }),
    [
      settings.profile.avatarUrl,
      settings.profile.bio,
      settings.profile.country,
      settings.profile.email,
      settings.profile.fullName,
    ],
  );
  const [formValues, setFormValues] = useState<ProfileFormValues>(persistedFormValues);

  useEffect(() => {
    if (!isEditing) {
      setFormValues(persistedFormValues);
    }
  }, [isEditing, persistedFormValues]);

  const formErrors = useMemo(() => validateProfileForm(formValues), [formValues]);
  const isDirty =
    JSON.stringify(formValues) !== JSON.stringify(persistedFormValues);
  const canSave = isHydrated && isDirty && !hasErrors(formErrors) && !isSaving;

  const saveProfile = async () => {
    if (!canSave) {
      if (hasErrors(formErrors)) {
        toast.error("Please fix the highlighted profile fields.");
      }
      return;
    }

    setIsSaving(true);

    try {
      const trimmedFullName = formValues.fullName.trim();
      const trimmedBio = formValues.bio.trim();
      const avatarUrl = formValues.avatarUrl;

      const response = await updateProfileRequest({
        username: trimmedFullName,
        bio: trimmedBio,
        avatarUrl: isStaticAvatarId(avatarUrl) ? avatarUrl : null,
      });

      saveProfileSettings({
        ...settings.profile,
        fullName: response.username || trimmedFullName,
        email: settings.profile.email,
        bio: response.bio ?? trimmedBio,
        country: formValues.location.trim(),
        avatarUrl: response.avatarUrl ?? avatarUrl,
      });
      setIsEditing(false);
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profile: persistedProfile,
    formValues,
    formErrors,
    isEditing,
    isSaving,
    isDirty,
    canSave,
    startEditing: () => setIsEditing(true),
    cancelEditing: () => {
      setFormValues(persistedFormValues);
      setIsEditing(false);
    },
    saveProfile,
    updateField: (field, value) => {
      setFormValues((current) => ({
        ...current,
        [field]: value,
      } as ProfileFormValues));
    },
    selectStaticAvatar: (avatarId: string) => {
      setFormValues((current) => ({
        ...current,
        avatarUrl: avatarId,
      }));
      setIsEditing(true);
    },
  };
}
