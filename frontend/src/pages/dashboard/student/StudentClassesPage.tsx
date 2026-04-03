import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BookOpen, Play } from "../../../components/icons/AppIcons";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSearchField,
  DashboardSurface,
  dashboardPageClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
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
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";

function getAssignedQuizActionLabel(practiceState?: string) {
  if (practiceState === "completed") {
    return "View Quiz";
  }

  if (practiceState === "in-progress") {
    return "Continue Quiz";
  }

  return "Start Quiz";
}

export function StudentClassesPage() {
  const meta = useDashboardPageMeta();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { classes, getStudentMemberships } = useTeacherClasses();
  const { quizzes } = useQuizLibrary();
  const studentViewer = currentUser?.role === "student" ? currentUser : null;
  const studentIdentity = useMemo(
    () => ({
      userId: studentViewer?.id,
      email: studentViewer?.email,
    }),
    [studentViewer?.email, studentViewer?.id],
  );
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const studentSources = useMemo(
    () => buildStudentQuizLibrarySources(classes, quizzes, studentIdentity),
    [classes, quizzes, studentIdentity],
  );
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

  const getAssignedActions = (
    item: StudentAssignedQuizLibraryItem,
  ): QuizCardAction[] => [
    {
      label: getAssignedQuizActionLabel(item.practiceState),
      icon: Play,
    },
    {
      label: "Open Library",
      icon: BookOpen,
      variant: "secondary",
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
          "See every class you have joined, along with the quizzes unlocked through that membership."
        }
        actions={
          <DashboardButton
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => navigate("/dashboard/student/notifications")}
          >
            Review Invitations
          </DashboardButton>
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
          <p className="text-sm font-medium text-[var(--dashboard-text-soft)]">Pending invitations</p>
          <p className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
            {studentSources.pendingMemberships.length}
          </p>
        </DashboardSurface>
      </div>

      {studentSources.pendingMemberships.length ? (
        <div className="rounded-[22px] border border-[var(--dashboard-warning-soft)] bg-[var(--dashboard-warning-soft)]/45 px-5 py-4">
          <p className="text-sm leading-6 text-[var(--dashboard-warning)]">
            {studentSources.pendingMemberships.length}{" "}
            {studentSources.pendingMemberships.length === 1 ? "class invitation is" : "class invitations are"}{" "}
            still waiting in Notifications. Accept them there to add more classes to this workspace automatically.
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

          {!joinedMemberships.length ? (
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
          onOpenClass={() =>
            navigate("/dashboard/student/quiz-library", {
              state: { libraryTab: "assigned" },
            })
          }
        />
      </div>
    </div>
  );
}
