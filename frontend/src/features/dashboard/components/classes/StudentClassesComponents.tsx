import { BookOpen, CalendarDays, SearchX, UserRound, Users } from "../../../../components/icons/AppIcons";
import { cn } from "../../../../components/ui/utils";
import type { StudentClassMembershipRecord } from "../../../../app/providers/TeacherClassesProvider";
import { mockTeacherUser } from "../../mock/mockUsers";
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

interface InvitationStatusBadgeProps {
  status: StudentClassMembershipRecord["membership"]["invitationStatus"];
}

export function InvitationStatusBadge({ status }: InvitationStatusBadgeProps) {
  const tone =
    status === "accepted"
      ? "success"
      : status === "declined"
        ? "danger"
        : status === "removed"
          ? "neutral"
          : "warning";
  const label =
    status === "accepted"
      ? "Accepted"
      : status === "declined"
        ? "Declined"
        : status === "removed"
          ? "Removed"
          : "Pending";

  return <DashboardBadge tone={tone}>{label}</DashboardBadge>;
}

interface MemberStatusBadgeProps {
  status: StudentClassMembershipRecord["membership"]["status"];
}

export function MemberStatusBadge({ status }: MemberStatusBadgeProps) {
  const tone =
    status === "joined"
      ? "success"
      : status === "declined"
        ? "danger"
        : status === "removed"
          ? "neutral"
          : "warning";
  const label =
    status === "joined"
      ? "Joined"
      : status === "declined"
        ? "Declined"
        : status === "removed"
          ? "Removed"
          : "Invited";

  return <DashboardBadge tone={tone}>{label}</DashboardBadge>;
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

  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className={cn(
        "cursor-pointer border transition",
        isSelected &&
          "border-[var(--dashboard-brand)] shadow-[0_18px_40px_rgba(43,122,243,0.12)]",
      )}
      role="button"
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
          <MemberStatusBadge status={membership.status} />
          <InvitationStatusBadge status={membership.invitationStatus} />
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
          <DashboardBadge tone="neutral" size="md">
            {teacherClass.assignedQuizzes.length}{" "}
            {teacherClass.assignedQuizzes.length === 1 ? "assigned quiz" : "assigned quizzes"}
          </DashboardBadge>
          <DashboardBadge tone="neutral" size="md">
            Joined {formatTeacherClassDate(membership.joinedAt ?? membership.invitedAt)}
          </DashboardBadge>
          <DashboardBadge tone="neutral" size="md">
            {teacherClass.students.filter((student) => student.status === "joined").length}{" "}
            members
          </DashboardBadge>
        </div>
      </article>
    </DashboardSurface>
  );
}

export function StudentClassesEmptyState() {
  return (
    <EmptyStateBlock
      title="No joined classes yet"
      description="Accept a class invitation from Notifications to unlock a class workspace with assignments and teacher context."
      icon={Users}
      className="border-dashed"
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
      className="border-dashed"
    />
  );
}

interface StudentClassDetailsPanelProps {
  membershipRecord: StudentClassMembershipRecord | null;
  assignedItems: StudentAssignedQuizLibraryItem[];
  onOpenClass?: () => void;
  getAssignedActions: (item: StudentAssignedQuizLibraryItem) => QuizCardAction[];
}

export function StudentClassDetailsPanel({
  membershipRecord,
  assignedItems,
  onOpenClass,
  getAssignedActions,
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

  return (
    <DashboardSurface radius="xl" padding="md" className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <MemberStatusBadge status={membership.status} />
          <InvitationStatusBadge status={membership.invitationStatus} />
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
              "This class becomes your dedicated place for teacher-assigned practice and class-based learning."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Teacher</p>
          <p className="mt-2 text-lg font-semibold text-[var(--dashboard-text-strong)]">
            {mockTeacherUser.fullName}
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
            {mockTeacherUser.fullName}
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--dashboard-text-soft)]">
            <CalendarDays className="h-4 w-4" />
            Last activity {formatTeacherClassDate(teacherClass.updatedAt)}
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--dashboard-text-soft)]">
            <BookOpen className="h-4 w-4" />
            {assignedItems.length} {assignedItems.length === 1 ? "quiz" : "quizzes"} ready
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
              Class-based learning stays separate from public discovery, so it is always clear what your teacher assigned here.
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
            title="No quizzes assigned yet"
            description="You are already in this class, but your teacher has not attached any quizzes to it yet."
            icon={BookOpen}
            className="border-dashed"
          />
        )}
      </div>
    </DashboardSurface>
  );
}
