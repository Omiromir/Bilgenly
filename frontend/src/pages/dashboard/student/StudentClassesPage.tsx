import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BookOpen, Play } from "../../../components/icons/AppIcons";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useNotifications } from "../../../app/providers/NotificationsProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { useStudentAttempts } from "../../../app/providers/StudentAttemptsProvider";
import { Dialog } from "../../../components/ui/dialog";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardModalBody,
  DashboardModalContent,
  DashboardModalFooter,
  DashboardModalHeader,
} from "../../../features/dashboard/components/DashboardModal";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSearchField,
  DashboardSurface,
  dashboardPageClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { EmptyStateBlock } from "../../../features/dashboard/components/EmptyStateBlock";
import { LoadingCard } from "../../../features/dashboard/components/LoadingCard";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import {
  StudentClassCard,
  StudentClassDetailsPanel,
  StudentClassesEmptyState,
  StudentClassesSearchEmptyState,
} from "../../../features/dashboard/components/classes/StudentClassesComponents";
import { buildStudentQuizLibrarySources } from "../../../features/dashboard/components/quiz-library/studentQuizLibrarySources";
import type {
  StudentAssignedQuizLibraryItem,
} from "../../../features/dashboard/components/quiz-library/studentQuizLibrarySources";
import type { QuizCardAction } from "../../../features/dashboard/components/quiz-library/quizLibraryTypes";
import { useQuizLibrary } from "../../../app/providers/QuizLibraryProvider";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import { useQuizLauncher } from "../../../features/quiz-session/useQuizLauncher";

function getAssignedQuizActionLabel(item: StudentAssignedQuizLibraryItem) {
  return item.assignmentState.primaryActionLabel;
}

export function StudentClassesPage() {
  const meta = useDashboardPageMeta();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    classes,
    error,
    getStudentMemberships,
    isLoading,
    joinClassByInviteCode,
  } = useTeacherClasses();
  const { quizzes } = useQuizLibrary();
  const { sessions } = useQuizSessions();
  const { openQuiz } = useQuizLauncher();
  const { getNotificationsForRecipientIdentity } = useNotifications();
  const studentViewer = currentUser?.role === "student" ? currentUser : null;
  const studentIdentity = useMemo(
    () => ({
      userId: studentViewer?.id,
      email: studentViewer?.email,
    }),
    [studentViewer?.email, studentViewer?.id],
  );
  const {
    attempts: allAttempts,
    isLoading: attemptsLoading,
    error: attemptsError,
  } = useStudentAttempts();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeError, setInviteCodeError] = useState("");
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const studentSources = useMemo(
    () =>
      buildStudentQuizLibrarySources(
        classes,
        quizzes,
        studentIdentity,
        sessions,
        allAttempts,
        attemptsLoading,
        attemptsError,
      ),
    [allAttempts, attemptsError, attemptsLoading, classes, quizzes, sessions, studentIdentity],
  );
  const notificationTeacherNameByClassId = useMemo(() => {
    if (!studentViewer) {
      return {};
    }

    return getNotificationsForRecipientIdentity(
      studentViewer.id,
      studentViewer.email,
    )
      .filter((notification) => notification.type === "class_invitation")
      .reduce<Record<string, string>>((accumulator, notification) => {
        const senderName = notification.senderName.trim();

        if (senderName) {
          accumulator[notification.relatedClassId] = senderName;
        }

        return accumulator;
      }, {});
  }, [
    getNotificationsForRecipientIdentity,
    studentViewer,
  ]);
  const joinedMemberships = useMemo(
    () =>
      studentViewer
        ? getStudentMemberships(studentIdentity).filter(
            ({ membership }) => membership.status === "joined",
          )
        : [],
    [getStudentMemberships, studentIdentity, studentViewer],
  );

  useEffect(() => {
    const requestedClassId =
      typeof location.state?.selectedClassId === "string"
        ? location.state.selectedClassId
        : null;

    if (!requestedClassId) {
      return;
    }

    setSelectedClassId(requestedClassId);
  }, [location.state]);

  useEffect(() => {
    if (!joinedMemberships.length) {
      setSelectedClassId(null);
      return;
    }

    if (
      selectedClassId &&
      joinedMemberships.some(({ teacherClass }) => teacherClass.id === selectedClassId)
    ) {
      return;
    }

    setSelectedClassId(joinedMemberships[0].teacherClass.id);
  }, [joinedMemberships, selectedClassId]);

  const filteredMemberships = joinedMemberships.filter(({ teacherClass }) => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [teacherClass.name, teacherClass.subject, teacherClass.description]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
  const selectedMembership =
    joinedMemberships.find(({ teacherClass }) => teacherClass.id === selectedClassId) ?? null;
  const selectedAssignedItems = studentSources.assigned.filter(
    (item) => item.assignmentContext.classId === selectedClassId,
  );
  const totalAssignedCount = joinedMemberships.reduce(
    (total, { teacherClass }) => total + teacherClass.assignedQuizzes.length,
    0,
  );

  const handleJoinClass = async () => {
    const normalizedInviteCode = inviteCode.trim().toUpperCase();

    if (!normalizedInviteCode) {
      setInviteCodeError("Invite code is required.");
      return;
    }

    try {
      setIsJoiningClass(true);
      const joinedClass = await joinClassByInviteCode(normalizedInviteCode);
      setSelectedClassId(joinedClass.id);
      setInviteCode("");
      setInviteCodeError("");
      setIsJoinDialogOpen(false);
      toast.success(`You joined ${joinedClass.name}.`);
    } catch (nextError) {
      setInviteCodeError(
        nextError instanceof Error ? nextError.message : "Unable to join class.",
      );
    } finally {
      setIsJoiningClass(false);
    }
  };

  const getAssignedActions = (
    item: StudentAssignedQuizLibraryItem,
  ): QuizCardAction[] => [
    {
      label: getAssignedQuizActionLabel(item),
      icon: Play,
      iconDisplay: "label-only",
      disabled:
        item.assignmentState.isLoading ||
        (!item.assignmentState.canStart &&
          !item.assignmentState.canResume &&
          !item.assignmentState.canReview),
      onClick: () =>
        openQuiz({
          quizId: item.id,
          viewerRole: "student",
          assignmentId: item.assignmentContext.assignmentId,
          preferredSession:
            item.assignmentState.canReview
              ? "completed"
              : item.assignmentState.canResume
                ? "in-progress"
                : undefined,
          navigationState: {
            launchSourceType: "classes",
            launchSourceLabel: `${item.assignmentContext.className} class workspace`,
            returnToPath: "/dashboard/student/classes",
            returnToLabel: "Back to classes",
          },
        }),
    },
    {
      label: "Open Library",
      icon: BookOpen,
      variant: "secondary",
      iconDisplay: "icon-only",
      onClick: () =>
        navigate("/dashboard/student/quiz-library", {
          state: { libraryTab: "assigned" },
        }),
    },
  ];

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "My Classes"}
        subtitle={
          meta?.subtitle ??
          "See every class you have joined, along with the assigned quizzes unlocked through that membership."
        }
        actions={
          <>
            <DashboardButton
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setIsJoinDialogOpen(true)}
            >
              Join with Code
            </DashboardButton>
            <DashboardButton
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate("/dashboard/student/notifications")}
            >
              Review Class Invites
            </DashboardButton>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardSurface variant="muted" radius="lg" padding="sm" className="space-y-2">
          <p className="text-sm font-medium text-[var(--dashboard-text-soft)]">Joined classes</p>
          <p className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
            {joinedMemberships.length}
          </p>
        </DashboardSurface>
        <DashboardSurface variant="muted" radius="lg" padding="sm" className="space-y-2">
          <p className="text-sm font-medium text-[var(--dashboard-text-soft)]">Assigned quizzes</p>
          <p className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
            {totalAssignedCount}
          </p>
        </DashboardSurface>
        <DashboardSurface variant="muted" radius="lg" padding="sm" className="space-y-2">
          <p className="text-sm font-medium text-[var(--dashboard-text-soft)]">Pending class invites</p>
          <p className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
            {studentSources.pendingMemberships.length}
          </p>
        </DashboardSurface>
      </div>

      {error ? (
        <EmptyStateBlock
          title="Unable to load your classes"
          description={error}
          icon={BookOpen}
        />
      ) : null}

      {studentSources.pendingMemberships.length ? (
        <div className="rounded-[22px] border border-[var(--dashboard-warning-soft)] bg-[var(--dashboard-warning-soft)]/45 px-5 py-4">
          <p className="text-sm leading-6 text-[var(--dashboard-warning)]">
            {studentSources.pendingMemberships.length}{" "}
            {studentSources.pendingMemberships.length === 1 ? "class invite is" : "class invites are"}{" "}
            still waiting in Notifications. Accept those class invites there to add more classes to this workspace automatically.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.25fr)]">
        <SectionCard title="Joined Classes" contentClassName="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <DashboardSearchField
              containerClassName="flex-1"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search classes, topics, or teacher notes..."
            />
            <DashboardBadge tone="info" size="md">
              {filteredMemberships.length} {filteredMemberships.length === 1 ? "class" : "classes"}
            </DashboardBadge>
          </div>

          {isLoading && joinedMemberships.length === 0 ? (
            <div className="space-y-3">
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : !joinedMemberships.length ? (
            <StudentClassesEmptyState />
          ) : !filteredMemberships.length ? (
            <StudentClassesSearchEmptyState
              searchValue={search}
              onReset={() => setSearch("")}
            />
          ) : (
            <div className="space-y-3">
              {filteredMemberships.map((membershipRecord) => (
                <StudentClassCard
                  key={membershipRecord.teacherClass.id}
                  membershipRecord={membershipRecord}
                  isSelected={membershipRecord.teacherClass.id === selectedClassId}
                  onOpen={() => setSelectedClassId(membershipRecord.teacherClass.id)}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <StudentClassDetailsPanel
          membershipRecord={selectedMembership}
          assignedItems={selectedAssignedItems}
          getAssignedActions={getAssignedActions}
          teacherNameByClassId={notificationTeacherNameByClassId}
          onOpenClass={() =>
            navigate("/dashboard/student/quiz-library", {
              state: { libraryTab: "assigned" },
            })
          }
        />
      </div>

      <Dialog
        open={isJoinDialogOpen}
        onOpenChange={(open) => {
          setIsJoinDialogOpen(open);
          if (!open) {
            setInviteCode("");
            setInviteCodeError("");
          }
        }}
      >
        <DashboardModalContent className="max-w-[560px]">
          <DashboardModalHeader
            title="Join a class"
            description="Enter your teacher's class invite code to add that class to this workspace."
          />

          <DashboardModalBody className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="invite-code-input"
                className="block text-sm font-medium text-[var(--dashboard-text-strong)]"
              >
                Invite code
              </label>
              <input
                id="invite-code-input"
                type="text"
                name="inviteCode"
                autoComplete="off"
                spellCheck={false}
                value={inviteCode}
                onChange={(event) => {
                  setInviteCode(event.target.value.toUpperCase());
                  if (inviteCodeError) {
                    setInviteCodeError("");
                  }
                }}
                placeholder="ABC123"
                aria-describedby={inviteCodeError ? "invite-code-error" : undefined}
                aria-invalid={!!inviteCodeError}
                className="h-14 w-full rounded-[18px] border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-elevated)] px-5 text-base tracking-[0.22em] text-[var(--dashboard-text-strong)] outline-none transition focus:border-[var(--dashboard-brand)] focus:bg-[var(--dashboard-surface-elevated)] focus-visible:ring-2 focus-visible:ring-[var(--dashboard-brand)] focus-visible:ring-offset-2"
              />
              {inviteCodeError ? (
                <p id="invite-code-error" className="text-sm text-[var(--dashboard-danger)]">
                  {inviteCodeError}
                </p>
              ) : null}
            </div>
          </DashboardModalBody>

          <DashboardModalFooter>
            <DashboardButton
              type="button"
              size="lg"
              variant="ghost"
              onClick={() => setIsJoinDialogOpen(false)}
            >
              Cancel
            </DashboardButton>
            <DashboardButton
              type="button"
              size="lg"
              onClick={handleJoinClass}
              disabled={isJoiningClass}
            >
              {isJoiningClass ? "Joining..." : "Join class"}
            </DashboardButton>
          </DashboardModalFooter>
        </DashboardModalContent>
      </Dialog>
    </div>
  );
}
