import {
  Award,
  CheckCircle2,
  Clock3,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardButton,
  dashboardIconTextRowClassName,
  dashboardPageClassName,
  dashboardStatsGridClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import {
  studentDetailedResults,
  studentResultSummary,
  studentScoreProgress,
} from "../../../features/dashboard/mock/studentWorkspace";

const summaryIcons = [TrendingUp, CheckCircle2, Award, Clock3] as const;
const summaryColors = [
  "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
  "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
] as const;

export function StudentResultsPage() {
  const meta = useDashboardPageMeta();
  const recent = studentDetailedResults[0];

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "My Results"}
        subtitle="Track your progress and identify areas for improvement"
      />

      <div className={dashboardStatsGridClassName}>
        {studentResultSummary.map((item, index) => {
          const Icon = summaryIcons[index];

          return (
            <StatCard
              key={item.label}
              title={item.label}
              value={item.value}
              change={item.note}
              icon={Icon}
              iconClassName={summaryColors[index]}
            />
          );
        })}
      </div>

      <SectionCard title="Score Progress">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={studentScoreProgress}
              margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
            >
              <CartesianGrid stroke="#E8EDF6" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#62708B", fontSize: 12 }}
                axisLine={{ stroke: "#D9E1EF" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#62708B", fontSize: 12 }}
                axisLine={{ stroke: "#D9E1EF" }}
                tickLine={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#5B4CF0"
                strokeWidth={2.5}
                dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-[var(--dashboard-brand)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--dashboard-brand)]" />
          Score %
        </div>
      </SectionCard>

      <SectionCard title="Recent Quiz Results">
        <article className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[1.18rem] font-semibold text-[var(--dashboard-text-strong)]">
                {recent.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">{recent.date}</p>
            </div>
            <div className="text-right">
              <p className="text-[2rem] font-semibold text-[var(--dashboard-brand)]">
                {recent.score}
              </p>
              <p className="text-sm text-[var(--dashboard-text-soft)]">{recent.correct}/20 correct</p>
            </div>
          </div>

          <div className="grid gap-4 text-sm text-[var(--dashboard-text-soft)] md:grid-cols-2">
            <div className={dashboardIconTextRowClassName}>
              <CheckCircle2 className="h-4 w-4 text-[var(--dashboard-brand)]" />
              Correct: {recent.correct}
            </div>
            <div className={dashboardIconTextRowClassName}>
              <Award className="h-4 w-4 text-[var(--dashboard-brand-strong)]" />
              Incorrect: {recent.incorrect}
            </div>
            <div className={dashboardIconTextRowClassName}>
              <Clock3 className="h-4 w-4 text-[var(--dashboard-brand)]" />
              Time: {recent.duration}
            </div>
          </div>

          <div className="rounded-[12px] border border-[var(--dashboard-border)] bg-[var(--dashboard-brand-soft-alt)] px-4 py-3 text-sm text-[var(--dashboard-text-strong)]">
            {recent.feedback}
          </div>

          <div className="flex gap-3">
            <DashboardButton type="button" size="lg" className="flex-1">
              Review Answers
            </DashboardButton>
            <DashboardButton type="button" variant="secondary" size="lg">
              Retake Quiz
            </DashboardButton>
          </div>
        </article>
      </SectionCard>
    </div>
  );
}
