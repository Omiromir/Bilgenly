import {
  Award,
  BarChart3,
  CircleDot,
  TrendingUp,
  Users,
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardSurface,
  dashboardPageClassName,
  dashboardSectionStackClassName,
  dashboardStatsGridClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import {
  teacherAnalyticsSummary,
  teacherCompletionStatus,
  teacherScoreTrend,
  teacherStudentsNeedingSupport,
  teacherTopicPerformance,
} from "../../../features/dashboard/mock/teacherWorkspace";

const summaryIcons = [TrendingUp, Users, CircleDot, Award] as const;

export function TeacherAnalyticsPage() {
  const meta = useDashboardPageMeta();

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Analytics"}
        subtitle="Track student performance and identify areas for improvement"
      />

      <div className={dashboardStatsGridClassName}>
        {teacherAnalyticsSummary.map((item, index) => {
          const Icon = summaryIcons[index];

          return (
            <StatCard
              key={item.title}
              title={item.title}
              value={item.value}
              change={item.change ?? ""}
              icon={Icon}
              iconClassName={item.iconColor}
            />
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Score Trends Over Time">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teacherScoreTrend} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="#E8EDF6" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#62708B", fontSize: 12 }} axisLine={{ stroke: "#D9E1EF" }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#62708B", fontSize: 12 }} axisLine={{ stroke: "#D9E1EF" }} tickLine={false} />
                <Line type="monotone" dataKey="value" stroke="#5B4CF0" strokeWidth={2.5} dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-[var(--dashboard-brand)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--dashboard-brand)]" />
            Average Score
          </div>
        </SectionCard>

        <SectionCard title="Performance by Topic">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teacherTopicPerformance} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="#E8EDF6" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#62708B", fontSize: 12 }} axisLine={{ stroke: "#D9E1EF" }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#62708B", fontSize: 12 }} axisLine={{ stroke: "#D9E1EF" }} tickLine={false} />
                <Bar dataKey="value" fill="#5146DF" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-[var(--dashboard-brand)]">
            <span className="h-3 w-3 bg-[var(--dashboard-brand)]" />
            Average Score
          </div>
        </SectionCard>

        <SectionCard title="Quiz Completion Status">
          <div className="flex h-[300px] items-center justify-center">
            <div className="relative h-[210px] w-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={teacherCompletionStatus}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={0}
                    outerRadius={100}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {teacherCompletionStatus.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-28 w-28 rounded-full bg-white" />
              </div>
            </div>
          </div>
          <div className="-mt-2 text-center text-[1.02rem] font-medium text-[var(--dashboard-brand)]">
            Completed 82%
          </div>
        </SectionCard>

        <SectionCard title="Students Needing Support">
          <div className={dashboardSectionStackClassName}>
            {teacherStudentsNeedingSupport.map((student) => (
              <DashboardSurface
                asChild
                key={student.name}
                variant="accent"
                radius="md"
                padding="sm"
                className="border-[var(--dashboard-border)]"
              >
                <article>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[1.05rem] font-semibold text-[var(--dashboard-text-strong)]">
                      {student.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">{student.issue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[1.8rem] font-semibold text-[var(--dashboard-brand-strong)]">
                      {student.score}
                    </p>
                    <button
                      type="button"
                      className="mt-1 text-sm font-medium text-[var(--dashboard-brand)]"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                </article>
              </DashboardSurface>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
