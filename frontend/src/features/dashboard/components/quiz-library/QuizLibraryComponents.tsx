import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  Eye,
  Globe2,
  Lock,
  RotateCcw,
  SearchX,
  UserRound,
} from "../../../../components/icons/AppIcons";
import { cn } from "../../../../components/ui/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { EmptyStateBlock } from "../EmptyStateBlock";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSearchField,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardIconTextRowClassName,
  dashboardPageSubtitleClassName,
  dashboardSelectVariants,
  dashboardTabVariants,
} from "../DashboardPrimitives";
import type {
  QuizAssignmentContext,
  QuizCardAction,
  QuizCardMetadataItem,
  QuizLibraryFilterDefinition,
  QuizLibraryItem,
  QuizLibraryTab,
} from "./quizLibraryTypes";
import type { StudentAssignedQuizLibraryItem } from "./studentQuizLibrarySources";
import {
  getStatusLabel,
  getVisibilityLabel,
} from "./quizLibraryUtils";
import { formatTeacherClassDate } from "../classes/teacherClassesUtils";

const statusToneMap = {
  draft: "warning",
  generated: "brand",
  edited: "info",
  "published-private": "success",
  "published-public": "success",
  archived: "neutral",
} as const;

interface LibraryTabsProps<TTab extends string> {
  tabs: QuizLibraryTab<TTab>[];
  activeTab: TTab;
  onChange: (tab: TTab) => void;
}

export function LibraryTabs<TTab extends string>({
  tabs,
  activeTab,
  onChange,
}: LibraryTabsProps<TTab>) {
  return (
    <DashboardSurface radius="xl" padding="sm">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                dashboardTabVariants({ active: isActive }),
                "w-auto min-w-[168px] justify-between",
              )}
              onClick={() => onChange(tab.id)}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  isActive
                    ? "bg-white/16 text-white"
                    : "bg-[var(--dashboard-surface-muted)] text-[var(--dashboard-text-soft)]",
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </DashboardSurface>
  );
}

interface QuizFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: QuizLibraryFilterDefinition[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  helperText?: string;
}

export function QuizFilterBar({
  searchValue,
  onSearchChange,
  filters,
  hasActiveFilters = false,
  onClearFilters,
  helperText,
}: QuizFilterBarProps) {
  return (
    <DashboardSurface asChild radius="lg" padding="md">
      <section className="space-y-3">
        <div className="flex flex-col gap-3">
          <DashboardSearchField
            containerClassName="w-full"
            placeholder="Search quizzes, creators, topics, or tags..."
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />

          <div className="flex flex-wrap items-center gap-2.5">
            {filters.map((filter) => (
              <label key={filter.id} className="min-w-[132px]">
                <select
                  value={filter.value}
                  onChange={(event) => filter.onChange(event.target.value)}
                  className={cn(
                    dashboardSelectVariants({ size: "md" }),
                    "min-w-[132px] border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] text-sm",
                  )}
                  aria-label={filter.label}
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            {hasActiveFilters && onClearFilters ? (
              <DashboardButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="rounded-full px-4"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </DashboardButton>
            ) : null}
          </div>
        </div>

        {helperText ? (
          <p className={dashboardPageSubtitleClassName}>{helperText}</p>
        ) : null}
      </section>
    </DashboardSurface>
  );
}

interface LibrarySectionHeaderProps {
  title: string;
  description: string;
  resultCount: number;
}

export function LibrarySectionHeader({
  title,
  description,
  resultCount,
}: LibrarySectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-[1.85rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--dashboard-text-soft)]">
          {description}
        </p>
      </div>

      <DashboardBadge tone="info" size="md">
        {resultCount} {resultCount === 1 ? "quiz" : "quizzes"}
      </DashboardBadge>
    </div>
  );
}

interface StatusBadgeProps {
  status: QuizLibraryItem["status"];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <DashboardBadge tone={statusToneMap[status]} className="capitalize">
      {getStatusLabel(status)}
    </DashboardBadge>
  );
}

interface VisibilityBadgeProps {
  visibility: QuizLibraryItem["visibility"];
}

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const Icon = visibility === "public" ? Globe2 : Lock;

  return (
    <DashboardBadge tone={visibility === "public" ? "info" : "neutral"}>
      <Icon className="h-3.5 w-3.5" />
      {getVisibilityLabel(visibility)}
    </DashboardBadge>
  );
}

interface QuizSourceBadgeProps {
  label: string;
}

export function QuizSourceBadge({ label }: QuizSourceBadgeProps) {
  return <DashboardBadge tone="brand">{label}</DashboardBadge>;
}

interface ClassAssignmentMetaProps {
  assignmentContext: QuizAssignmentContext;
}

export function ClassAssignmentMeta({
  assignmentContext,
}: ClassAssignmentMetaProps) {
  const assignedDate = formatTeacherClassDate(assignmentContext.assignedAt);

  return (
    <div className="rounded-[20px] bg-[var(--dashboard-surface-muted)] px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={dashboardIconTextRowClassName}>
          <BookOpen className="h-4 w-4" />
          <span>{assignmentContext.className}</span>
        </div>
        <div className={dashboardIconTextRowClassName}>
          <UserRound className="h-4 w-4" />
          <span>{assignmentContext.assignedByName}</span>
        </div>
        <div className={dashboardIconTextRowClassName}>
          <CalendarDays className="h-4 w-4" />
          <span>Assigned {assignedDate}</span>
        </div>
        <div className={dashboardIconTextRowClassName}>
          <Eye className="h-4 w-4" />
          <span>Visible through class membership</span>
        </div>
      </div>
    </div>
  );
}

interface QuizMetadataRowProps {
  item: QuizCardMetadataItem;
}

export function QuizMetadataRow({ item }: QuizMetadataRowProps) {
  const Icon = item.icon;

  return (
    <div className={dashboardIconTextRowClassName}>
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </div>
  );
}

interface QuizCardProps {
  item: QuizLibraryItem;
  metadata: QuizCardMetadataItem[];
  actions: QuizCardAction[];
  badgeLabel?: string;
}

export function QuizCard({
  item,
  metadata,
  actions,
  badgeLabel,
}: QuizCardProps) {
  return (
    <DashboardSurface asChild radius="xl" padding="md" className="h-full">
      <article className="flex h-full flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={item.status} />
            <VisibilityBadge visibility={item.visibility} />
            {badgeLabel ? (
              <DashboardBadge tone="brand">
                {badgeLabel}
              </DashboardBadge>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-faint)]">
            {item.topic} / {item.difficulty}
          </p>
          <h3 className="mt-3 text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
            {item.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
            {item.description}
          </p>
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {metadata.map((meta) => (
            <QuizMetadataRow key={`${item.id}-${meta.label}`} item={meta} />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={`${item.id}-${tag}`}
              className="rounded-full bg-[var(--dashboard-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--dashboard-text-soft)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5 border-t border-[var(--dashboard-border-soft)] pt-5">
          {actions.map((action, index) => {
            const Icon = action.icon;

            return (
              <DashboardButton
                key={`${item.id}-${action.label}`}
                type="button"
                size="lg"
                variant={action.variant ?? (index === 0 ? "primary" : "secondary")}
                className={cn(index === 0 && actions.length < 3 && "flex-1")}
                onClick={action.onClick}
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </DashboardButton>
            );
          })}
        </div>
      </article>
    </DashboardSurface>
  );
}

interface AssignedQuizCardProps {
  item: StudentAssignedQuizLibraryItem;
  actions: QuizCardAction[];
  badgeLabel?: string;
}

export function AssignedQuizCard({
  item,
  actions,
  badgeLabel,
}: AssignedQuizCardProps) {
  const assignedDate = formatTeacherClassDate(item.assignmentContext.assignedAt);

  return (
    <DashboardSurface asChild radius="xl" padding="md" className="h-full">
      <article className="flex h-full flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <QuizSourceBadge label="Assigned" />
            <VisibilityBadge visibility={item.visibility} />
            {badgeLabel ? (
              <DashboardBadge tone="info">
                {badgeLabel}
              </DashboardBadge>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-faint)]">
            {item.topic} / {item.difficulty}
          </p>
          <h3 className="mt-3 text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
            {item.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
            {item.description}
          </p>
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          <QuizMetadataRow
            item={{ icon: BookOpen, label: `${item.questionCount} questions` }}
          />
          <QuizMetadataRow
            item={{ icon: CalendarDays, label: `Assigned ${assignedDate}` }}
          />
          <QuizMetadataRow item={{ icon: UserRound, label: item.assignmentContext.assignedByName }} />
          <QuizMetadataRow
            item={{
              icon: RotateCcw,
              label:
                item.practiceProgressLabel ??
                (item.practiceState === "in-progress"
                  ? "In progress"
                  : item.practiceState === "completed"
                    ? "Completed"
                    : "Ready to start"),
            }}
          />
        </div>

        <div className="mt-5">
          <ClassAssignmentMeta assignmentContext={item.assignmentContext} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={`${item.assignmentContext.assignmentId}-${tag}`}
              className="rounded-full bg-[var(--dashboard-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--dashboard-text-soft)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5 border-t border-[var(--dashboard-border-soft)] pt-5">
          {actions.map((action, index) => {
            const Icon = action.icon;

            return (
              <DashboardButton
                key={`${item.assignmentContext.assignmentId}-${action.label}`}
                type="button"
                size="lg"
                variant={action.variant ?? (index === 0 ? "primary" : "secondary")}
                className={cn(index === 0 && actions.length < 3 && "flex-1")}
                onClick={action.onClick}
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </DashboardButton>
            );
          })}
        </div>
      </article>
    </DashboardSurface>
  );
}

interface QuizGridProps {
  items: QuizLibraryItem[];
  renderCard: (item: QuizLibraryItem) => ReactNode;
  className?: string;
}

export function QuizGrid({ items, renderCard, className }: QuizGridProps) {
  return (
    <div className={cn("grid gap-5 md:grid-cols-2 2xl:grid-cols-3", className)}>
      {items.map((item) => renderCard(item))}
    </div>
  );
}

interface SearchEmptyStateProps {
  title: string;
  description: string;
}

export function SearchEmptyState({
  title,
  description,
}: SearchEmptyStateProps) {
  return (
    <EmptyStateBlock
      title={title}
      description={description}
      icon={SearchX}
      className="border-dashed"
    />
  );
}

interface EmptyAssignedQuizzesStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyAssignedQuizzesState({
  title,
  description,
  action,
}: EmptyAssignedQuizzesStateProps) {
  return (
    <EmptyStateBlock
      title={title}
      description={description}
      icon={BookOpen}
      action={action}
      className="border-dashed"
    />
  );
}

interface QuizPreviewDialogProps {
  item: QuizLibraryItem | null;
  metadata: QuizCardMetadataItem[];
  actions: QuizCardAction[];
  onOpenChange: (open: boolean) => void;
}

export function QuizPreviewDialog({
  item,
  metadata,
  actions,
  onOpenChange,
}: QuizPreviewDialogProps) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      {item ? (
        <DialogContent className="max-w-2xl rounded-[28px] border-[var(--dashboard-border-soft)] p-0">
          <div className="overflow-hidden rounded-[28px]">
            <div className="border-b border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-6 py-5">
              <DialogHeader className="gap-3 text-left">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={item.status} />
                  <VisibilityBadge visibility={item.visibility} />
                  {item.isRecommended ? (
                    <DashboardBadge tone="brand">Recommended</DashboardBadge>
                  ) : null}
                  {item.isSaved ? (
                    <DashboardBadge tone="info">Saved</DashboardBadge>
                  ) : null}
                </div>
                <DialogTitle className="text-[1.65rem] font-semibold tracking-[-0.03em] text-[var(--dashboard-text-strong)]">
                  {item.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
                  {item.description}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {metadata.map((meta) => (
                  <div
                    key={`${item.id}-preview-${meta.label}`}
                    className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-white px-4 py-3"
                  >
                    <QuizMetadataRow item={meta} />
                  </div>
                ))}
              </div>

              <div className="rounded-[22px] bg-[var(--dashboard-surface-muted)] px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className={dashboardIconChipVariants({ tone: "brand", size: "sm" })}>
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                      {item.sourceLabel}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                      {item.note ?? `Last updated ${item.updatedAt}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={`${item.id}-preview-tag-${tag}`}
                    className="rounded-full bg-[var(--dashboard-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--dashboard-text-soft)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <DialogFooter className="border-t border-[var(--dashboard-border-soft)] px-6 py-5 sm:justify-start">
              {actions.slice(0, 3).map((action, index) => {
                const Icon = action.icon;

                return (
                  <DashboardButton
                    key={`${item.id}-preview-action-${action.label}`}
                    type="button"
                    size="lg"
                    variant={action.variant ?? (index === 0 ? "primary" : "secondary")}
                    onClick={action.onClick}
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </DashboardButton>
                );
              })}
            </DialogFooter>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
