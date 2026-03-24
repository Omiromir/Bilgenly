import {
  BookOpen,
  CalendarDays,
  EllipsisVertical,
  FileText,
  Users,
} from "lucide-react";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSearchField,
  DashboardSurface,
  dashboardIconTextRowClassName,
  dashboardPageClassName,
  dashboardSelectVariants,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import { teacherLibraryItems } from "../../../features/dashboard/mock/teacherWorkspace";

const statusTone = {
  published: "success",
  draft: "warning",
  archived: "neutral",
} as const;

export function TeacherQuizLibraryPage() {
  const meta = useDashboardPageMeta();

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Quiz Library"}
        subtitle="Manage all your quizzes in one place"
        actions={
          <DashboardButton type="button" size="lg">
            Create New Quiz
          </DashboardButton>
        }
      />

      <DashboardSurface asChild radius="lg" padding="md">
        <section>
        <div className="flex flex-col gap-4 lg:flex-row">
          <DashboardSearchField
            containerClassName="flex-1"
            placeholder="Search quizzes..."
          />
          <select className={dashboardSelectVariants({ size: "md" }) + " min-w-[126px]"}>
            <option>All Status</option>
          </select>
          <select className={dashboardSelectVariants({ size: "md" }) + " min-w-[156px]"}>
            <option>All Categories</option>
          </select>
        </div>
        </section>
      </DashboardSurface>

      <div className="grid gap-6 xl:grid-cols-3 md:grid-cols-2">
        {teacherLibraryItems.map((item) => (
          <DashboardSurface
            asChild
            key={item.title}
            radius="lg"
            padding="md"
          >
            <article>
            <div className="flex items-start justify-between gap-4">
              <DashboardBadge tone={statusTone[item.status]} className="capitalize">
                {item.status}
              </DashboardBadge>
              <button
                type="button"
                className="text-[var(--dashboard-text-faint)] transition hover:text-[var(--dashboard-text)]"
              >
                <EllipsisVertical className="h-5 w-5" />
              </button>
            </div>

            <h2 className="mt-6 text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--dashboard-text-soft)]">{item.category}</p>

            <div className="mt-5 space-y-2.5 text-sm text-[var(--dashboard-text-soft)]">
              <div className={dashboardIconTextRowClassName}>
                <FileText className="h-4 w-4" />
                {item.questions}
              </div>
              <div className={dashboardIconTextRowClassName}>
                <Users className="h-4 w-4" />
                {item.students}
              </div>
              <div className={dashboardIconTextRowClassName}>
                <CalendarDays className="h-4 w-4" />
                {item.date}
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--dashboard-border-soft)] pt-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--dashboard-text-soft)]">Avg Score</span>
                <span className="text-[1.75rem] font-semibold text-[var(--dashboard-success)]">
                  {item.averageScore}
                </span>
              </div>
              <div className="mt-4 flex gap-2.5">
                <DashboardButton type="button" size="lg" className="flex-1">
                  View Details
                </DashboardButton>
                <DashboardButton type="button" variant="secondary" size="lg">
                  Edit
                </DashboardButton>
              </div>
            </div>
            </article>
          </DashboardSurface>
        ))}
      </div>
    </div>
  );
}
