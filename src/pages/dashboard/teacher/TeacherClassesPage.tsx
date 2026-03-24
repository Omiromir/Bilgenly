import { EllipsisVertical, UserPlus, Users } from "lucide-react";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardButton,
  DashboardSearchField,
  DashboardSurface,
  dashboardPageClassName,
  dashboardSectionStackClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import {
  teacherClasses,
  teacherClassSummary,
  teacherTopStudents,
} from "../../../features/dashboard/mock/teacherWorkspace";

export function TeacherClassesPage() {
  const meta = useDashboardPageMeta();

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Classes"}
        subtitle="Manage your classes and students"
        actions={
          <DashboardButton type="button" size="lg">
            <span className="text-lg leading-none">+</span>
            Create Class
          </DashboardButton>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {teacherClassSummary.map((item) => (
          <StatCard
            key={item.label}
            title={item.label}
            value={item.value}
            change={item.change ?? ""}
            icon={Users}
            iconClassName={item.iconColor}
          />
        ))}
      </div>

      <SectionCard
        title="Your Classes"
        actions={
          <DashboardSearchField
            containerClassName="w-full min-w-0 sm:w-[260px]"
            placeholder="Search classes..."
          />
        }
      >
        <div className="space-y-0">
          {teacherClasses.map((item, index) => (
            <article
              key={item.name}
              className={`flex flex-col gap-5 px-0 py-6 lg:flex-row lg:items-center lg:justify-between ${index < teacherClasses.length - 1 ? "border-b border-[var(--dashboard-border-soft)]" : ""}`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
                    {item.name}
                  </h3>
                  {item.active ? (
                    <span className="rounded-full bg-[var(--dashboard-success-soft)] px-3 py-1 text-xs font-medium text-[var(--dashboard-success)]">
                      Active
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-6 text-sm text-[var(--dashboard-text-soft)]">
                  <span>{item.students}</span>
                  <span>{item.quizzes}</span>
                  <span>{item.avgScore}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <DashboardButton type="button" variant="soft" size="lg">
                  <UserPlus className="h-4 w-4" />
                  Add Students
                </DashboardButton>
                <button
                  type="button"
                  className="text-[var(--dashboard-text-faint)] transition hover:text-[var(--dashboard-text)]"
                >
                  <EllipsisVertical className="h-5 w-5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Top Performing Students">
        <div className={dashboardSectionStackClassName}>
          {teacherTopStudents.map((student) => (
            <DashboardSurface asChild key={student.name} radius="md" padding="sm">
              <article className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[var(--dashboard-text-strong)]">{student.name}</h3>
                <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">{student.className}</p>
              </div>
              <span className="text-lg font-semibold text-[var(--dashboard-success)]">
                {student.score}
              </span>
              </article>
            </DashboardSurface>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
