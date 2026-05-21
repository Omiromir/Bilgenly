import { BookOpen, CalendarDays, SearchX, UserRound, Users } from "../../../../components/icons/AppIcons";
import { cn } from "../../../../components/ui/utils";
import type { StudentClassMembershipRecord } from "../../../../app/providers/TeacherClassesProvider";
import { EmptyStateBlock } from "../EmptyStateBlock";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardInsetBlockClassName,
  dashboardMetaTextClassName,
} from "../DashboardPrimitives";
import { AssignedQuizCard } from "../quiz-library/QuizLibraryComponents";
import type { StudentAssignedQuizLibraryItem } from "../quiz-library/studentQuizLibrarySources";
import type { QuizCardAction } from "../quiz-library/quizLibraryTypes";
import { formatTeacherClassDate } from "./teacherClassesUtils";

function getTeacherDisplayName(membershipRecord: StudentClassMembershipRecord) {
  const teacherName = membershipRecord.teacherClass.teacherName?.trim();

  if (teacherName) {
    return teacherName;
  }

  const latestAssignmentTeacherName = membershipRecord.teacherClass.assignedQuizzes
    .map((assignment) => assignment.assignedByName?.trim())
    .find((value) => Boolean(value));

  return latestAssignmentTeacherName || "Teacher name unavailable";
}

interface StudentClassCardProps {
  membershipRecord: StudentClassMembershipRecord;
  isSelected?: boolean;
  onOpen: () => void;
}

export function StudentClassCard({
  membershipRecord,
  isSelected = false,
  onOpen,
}: StudentClassCardProps) {
  const { teacherClass, membership } = membershipRecord;
  const joinedMembersCount = teacherClass.students.filter(
    (student) => student.status === "joined",
  ).length;
  const summaryRows = [
    teacherClass.assignedQuizzes.length > 0
      ? `${teacherClass.assignedQuizzes.length} ${
          teacherClass.assignedQuizzes.length === 1
            ? "assigned quiz"
            : "assigned quizzes"
        }`
      : null,
    `Joined ${formatTeacherClassDate(membership.joinedAt ?? membership.invitedAt)}`,
    joinedMembersCount > 0 ? `${joinedMembersCount} members` : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className={cn(
        "cursor-pointer border transition-[colors,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-brand)] focus-visible:ring-offset-1",
        isSelected &&
          "border-[var(--dashboard-brand)] shadow-[0_18px_40px_rgba(43,122,243,0.12)]",
      )}
      role="button"
      aria-label={teacherClass.name}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <article className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {teacherClass.subject ? (
            <DashboardBadge tone="info">{teacherClass.subject}</DashboardBadge>
          ) : null}
        </div>

        <div className="space-y-2">
          <h3 className="text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
            {teacherClass.name}
          </h3>
          <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
            {teacherClass.description ||
              "Your teacher has not added a class description yet."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {summaryRows.map((item) => (
            <DashboardBadge
              key={`${teacherClass.id}-${item}`}
              tone="neutral"
              size="md"
            >
              {item}
            </DashboardBadge>
          ))}
        </div>
      </article>
    </DashboardSurface>
  );
}

export function StudentClassesEmptyState() {
  return (
    <EmptyStateBlock
      title="No joined classes yet"
      description="Accept a class invite from Notifications to unlock a class workspace with assigned quizzes and teacher context."
      icon={Users}
    />
  );
}

export function StudentClassesSearchEmptyState({
  searchValue,
  onReset,
}: {
  searchValue: string;
  onReset: () => void;
}) {
  return (
    <EmptyStateBlock
      title="No classes match your search"
      description={`No joined classes matched "${searchValue.trim()}".`}
      icon={SearchX}
      action={
        <DashboardButton type="button" variant="secondary" size="lg" onClick={onReset}>
          Clear search
        </DashboardButton>
      }
    />
  );
}

interface StudentClassDetailsPanelProps {
  membershipRecord: StudentClassMembershipRecord | null;
  assignedItems: StudentAssignedQuizLibraryItem[];
  onOpenClass?: () => void;
  getAssignedActions: (item: StudentAssignedQuizLibraryItem) => QuizCardAction[];
  teacherNameByClassId?: Record<string, string>;
}

export function StudentClassDetailsPanel({
  membershipRecord,
  assignedItems,
  onOpenClass,
  getAssignedActions,
  teacherNameByClassId = {},
}: StudentClassDetailsPanelProps) {
  if (!membershipRecord) {
    return (
      <EmptyStateBlock
        title="Choose a class"
        description="Select a class to see teacher context, joined status, and all assigned quizzes in one place."
        icon={BookOpen}
        className="h-full"
      />
    );
  }

  const { teacherClass, membership } = membershipRecord;
  const teacherDisplayName =
    teacherNameByClassId[teacherClass.id]?.trim() ||
    getTeacherDisplayName(membershipRecord);

  return (
    <DashboardSurface radius="xl" padding="md" className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {teacherClass.subject ? (
            <DashboardBadge tone="info">{teacherClass.subject}</DashboardBadge>
          ) : null}
        </div>

        <div>
          <h2 className="text-[1.7rem] font-semibold tracking-[-0.03em] text-[var(--dashboard-text-strong)]">
            {teacherClass.name}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--dashboard-text-soft)]">
            {teacherClass.description ||
              "This class becomes your dedicated place for assigned quizzes, teacher guidance, and class-based learning."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Teacher</p>
          <p className="mt-2 text-lg font-semibold text-[var(--dashboard-text-strong)]">
            {teacherDisplayName}
          </p>
        </div>
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Joined</p>
          <p className="mt-2 text-lg font-semibold text-[var(--dashboard-text-strong)]">
            {formatTeacherClassDate(membership.joinedAt ?? membership.invitedAt)}
          </p>
        </div>
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Assigned quizzes</p>
          <p className="mt-2 text-lg font-semibold text-[var(--dashboard-text-strong)]">
            {assignedItems.length}
          </p>
        </div>
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Invite code</p>
          <p className="mt-2 text-lg font-semibold tracking-[0.12em] text-[var(--dashboard-text-strong)]">
            {teacherClass.inviteCode}
          </p>
        </div>
      </div>

      <div className="rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-3 text-sm text-[var(--dashboard-text-soft)]">
            <UserRound className="h-4 w-4" />
            {teacherDisplayName}
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--dashboard-text-soft)]">
            <CalendarDays className="h-4 w-4" />
            Last activity {formatTeacherClassDate(teacherClass.updatedAt)}
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--dashboard-text-soft)]">
            <BookOpen className="h-4 w-4" />
            {assignedItems.length} {assignedItems.length === 1 ? "assigned quiz" : "assigned quizzes"} ready
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--dashboard-text-strong)]">
              Assigned Quizzes
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              Assigned quizzes stay separate from public discovery, so it is always clear what belongs to this class.
            </p>
          </div>
          {onOpenClass ? (
            <DashboardButton type="button" variant="secondary" size="sm" onClick={onOpenClass}>
              Open in Library
            </DashboardButton>
          ) : null}
        </div>

        {assignedItems.length ? (
          <div className="space-y-4">
            {assignedItems.map((item) => (
              <div key={item.assignmentContext.assignmentId} className="w-full">
                <AssignedQuizCard
                  item={item}
                  actions={getAssignedActions(item)}
                  badgeLabel={teacherClass.subject || undefined}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateBlock
            title="No class quizzes available yet"
            description="You are already in this class, but there are no assigned quizzes available here yet."
            icon={BookOpen}
          />
        )}
      </div>
    </DashboardSurface>
  );
}
