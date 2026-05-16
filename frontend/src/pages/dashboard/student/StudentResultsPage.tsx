import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Award,
  CheckCircle2,
  Clock3,
  TrendingUp,
} from "../../../components/icons/AppIcons";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useStudentAttempts } from "../../../app/providers/StudentAttemptsProvider";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardButton,
  DashboardSearchField,
  DashboardSurface,
  dashboardIconTextRowClassName,
  dashboardPageClassName,
  dashboardStatsGridClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { EmptyStateBlock } from "../../../features/dashboard/components/EmptyStateBlock";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import { buildQuizSessionPath, buildQuizSessionSearch } from "../../../features/quiz-session/quizRouting";
import {
  formatDurationFromSeconds,
  formatQuizAttemptDate,
  formatQuizAttemptDuration,
  formatQuizPoints,
  formatQuizScore,
  getQuizSessionResultSummary,
} from "../../../features/quiz-session/quizSessionUtils";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import { useMyAnalytics } from "../../../features/dashboard/hooks/useDashboardAnalytics";

const summaryIcons = [TrendingUp, CheckCircle2, Award, Clock3] as const;
const summaryColors = [
  "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
  "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
] as const;

function buildSessionLink(sessionId: string, quizId: string, assignmentId?: string) {
  return `${buildQuizSessionPath("student", quizId)}${buildQuizSessionSearch({
    sessionId,
    assignmentId,
  })}`;
}

function buildQuizLink(quizId: string, assignmentId?: string) {
  return `${buildQuizSessionPath("student", quizId)}${buildQuizSessionSearch({
    assignmentId,
  })}`;
}

export function StudentResultsPage() {
  const meta = useDashboardPageMeta();
  const analyticsState = useMyAnalytics();
  const { getCompletedSessionsForRole } = useQuizSessions();
  const {
    attempts,
    isLoading: attemptsLoading,
    error: attemptsError,
  } = useStudentAttempts();
  const completedSessions = getCompletedSessionsForRole("student");
  const isLoading = analyticsState.isLoading || attemptsLoading;
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const attemptSummaries = analyticsState.data?.attempts ?? [];
  const completedAttempts = useMemo(
    () =>
      [...attempts]
        .filter((attempt) => attempt.isCompleted)
        .sort(
          (left, right) =>
            new Date(right.dateTaken).getTime() - new Date(left.dateTaken).getTime(),
        ),
    [attempts],
  );

  const summary = useMemo(() => {
    if (!attemptSummaries.length) {
      return [
        {
          label: "Average Score",
          value: "--",
          note: "Complete a quiz to see your trend.",
        },
        {
          label: "Quizzes Completed",
          value: "0",
          note: "Your finished attempts will appear here.",
        },
        {
          label: "Best Score",
          value: "--",
          note: "No attempts yet.",
        },
        {
          label: "Latest Score",
          value: "--",
          note: "Start with any library or class quiz.",
        },
      ];
    }

    const percentages = attemptSummaries.map((attempt) => attempt.score);
    const latestScore = percentages[0];
    const averageScore = Math.round(analyticsState.data?.averageScore ?? 0);
    const bestScore = Math.max(...percentages);
    const completedCount = attemptSummaries.length;

    return [
      {
        label: "Average Score",
        value: formatQuizScore(averageScore),
        note: `${completedCount} completed ${completedCount === 1 ? "quiz" : "quizzes"}`,
      },
      {
        label: "Quizzes Completed",
        value: String(completedCount),
        note: "Across class and self-study attempts.",
      },
      {
        label: "Best Score",
        value: formatQuizScore(bestScore),
        note:
          bestScore === 100
            ? "Perfect result unlocked."
            : "Your strongest attempt so far.",
      },
      {
        label: "Latest Score",
        value: formatQuizScore(latestScore),
        note: `Recorded ${formatQuizAttemptDate(attemptSummaries[0]?.dateTaken ?? new Date().toISOString())}`,
      },
    ];
  }, [analyticsState.data?.averageScore, attemptSummaries]);

  const progressData = useMemo(
    () =>
      attemptSummaries
        .slice(0, 6)
        .reverse()
        .map((attempt, index) => ({
          label: `Attempt ${index + 1}`,
          value: attempt.score,
        })),
    [attemptSummaries],
  );

  const recentResults = useMemo(
    () => {
      const usedSessionIds = new Set<string>();

      return completedAttempts
        .filter((attempt) => {
          const query = deferredSearch.trim().toLowerCase();

          if (!query) {
            return true;
          }

          return [
            attempt.quizTitle,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        })
        .slice(0, 5)
        .map((attempt) => {
          const matchedSession =
            completedSessions.find(
              (session) => {
                if (usedSessionIds.has(session.id)) return false;
                return session.backendAttemptId === attempt.id || session.id === attempt.id;
              },
            ) ?? null;
          if (matchedSession) {
            usedSessionIds.add(matchedSession.id);
          }
          const result = matchedSession
            ? getQuizSessionResultSummary(matchedSession)
            : {
                percentage: attempt.score,
                correctCount: attempt.correctAnswers,
                incorrectCount: Math.max(attempt.totalQuestions - attempt.correctAnswers, 0),
                totalQuestions: attempt.totalQuestions,
                earnedPoints: 0,
                totalPoints: 0,
              };
          const hasDetailedReview =
            Boolean(matchedSession) || attempt.questions.length > 0;

          return {
            attempt,
            session: matchedSession,
            result,
            hasDetailedReview,
            reviewHref: hasDetailedReview
              ? buildSessionLink(
                  matchedSession?.id ?? attempt.id,
                  matchedSession?.quizId ?? attempt.quizId,
                  matchedSession?.assignmentContext?.assignmentId,
                )
              : null,
            retakeHref: buildQuizLink(
              attempt.quizId,
              matchedSession?.assignmentContext?.assignmentId,
            ),
          };
        });
    },
    [completedAttempts, completedSessions, deferredSearch],
  );

  if ((analyticsState.error || attemptsError) && !completedAttempts.length) {
    return (
      <div className={dashboardPageClassName}>
        <DashboardPageHeader
          title={meta?.title ?? "My Results"}
          subtitle="Track real quiz attempts, review what you missed, and jump back into practice from one place."
        />

        <EmptyStateBlock
          title="Unable to load backend results"
          description={analyticsState.error ?? attemptsError ?? "Unable to load backend results."}
          icon={TrendingUp}
          className="border-dashed"
        />
      </div>
    );
  }

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "My Results"}
        subtitle="Track real quiz attempts, review what you missed, and jump back into practice from one place."
      />

      <div className={dashboardStatsGridClassName}>
        {isLoading
          ? summaryIcons.map((_, index) => (
              <DashboardSurface key={index} asChild radius="xl" padding="md">
                <article>
                  <div className="flex items-start justify-between gap-4">
                    <div className="animate-pulse space-y-3 flex-1">
                      <div className="h-3.5 w-28 rounded-full bg-[var(--dashboard-border)]" />
                      <div className="h-9 w-20 rounded-xl bg-[var(--dashboard-surface-muted)]" />
                      <div className="h-3 w-36 rounded-full bg-[var(--dashboard-surface-muted)]" />
                    </div>
                    <div className="animate-pulse h-12 w-12 rounded-2xl bg-[var(--dashboard-surface-muted)]" />
                  </div>
                </article>
              </DashboardSurface>
            ))
          : summary.map((item, index) => {
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
        {isLoading ? (
          <div className="h-[260px] animate-pulse rounded-2xl bg-[var(--dashboard-surface-muted)]" />
        ) : progressData.length ? (
          <>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={progressData}
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
                    stroke="#16B59D"
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
          </>
        ) : (
          <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-6">
            <p className="font-semibold text-[var(--dashboard-text-strong)]">
              No score data yet
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              Finish your first quiz and the recent score trend will appear here automatically.
            </p>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Recent Quiz Results"
        description="Search by quiz title, topic, or source to jump straight to the result or assigned quiz review you want."
        contentClassName="space-y-5"
      >
        <DashboardSearchField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search results by quiz title, topic, or source..."
          inputClassName="border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)]"
        />

        {isLoading ? (
          <div className="space-y-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-48 rounded-full bg-[var(--dashboard-border)]" />
                    <div className="h-3.5 w-28 rounded-full bg-[var(--dashboard-surface-muted)]" />
                  </div>
                  <div className="h-9 w-14 rounded-xl bg-[var(--dashboard-surface-muted)]" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-3.5 w-36 rounded-full bg-[var(--dashboard-surface-muted)]" />
                  <div className="h-3.5 w-28 rounded-full bg-[var(--dashboard-surface-muted)]" />
                  <div className="h-3.5 w-24 rounded-full bg-[var(--dashboard-surface-muted)]" />
                  <div className="h-3.5 w-32 rounded-full bg-[var(--dashboard-surface-muted)]" />
                </div>
                <div className="h-10 w-full rounded-xl bg-[var(--dashboard-surface-muted)]" />
                <div className="flex gap-3">
                  <div className="h-11 flex-1 rounded-2xl bg-[var(--dashboard-border)]" />
                  <div className="h-11 w-32 rounded-2xl bg-[var(--dashboard-surface-muted)]" />
                </div>
              </div>
            ))}
          </div>
        ) : recentResults.length ? (
          <div className="space-y-5">
            {recentResults.map(({ attempt, session, result, reviewHref, retakeHref, hasDetailedReview }) => (
              <article
                key={attempt.id}
                className="rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[1.18rem] font-semibold text-[var(--dashboard-text-strong)]">
                      {attempt.quizTitle}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                      {formatQuizAttemptDate(attempt.dateTaken)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[2rem] font-semibold text-[var(--dashboard-brand)]">
                      {formatQuizScore(result.percentage)}
                    </p>
                    {result.totalPoints ? (
                      <p className="text-sm text-[var(--dashboard-text-soft)]">
                        Score: {formatQuizPoints(result.earnedPoints, result.totalPoints)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 text-sm text-[var(--dashboard-text-soft)] md:grid-cols-2">
                  {result.totalQuestions ? (
                    <div className={dashboardIconTextRowClassName}>
                      <CheckCircle2 className="h-4 w-4 text-[var(--dashboard-brand)]" />
                      Correct answers: {`${result.correctCount}/${result.totalQuestions}`}
                    </div>
                  ) : null}
                  {result.totalPoints ? (
                    <div className={dashboardIconTextRowClassName}>
                      <Award className="h-4 w-4 text-[var(--dashboard-brand-strong)]" />
                      Score: {formatQuizPoints(result.earnedPoints, result.totalPoints)}
                    </div>
                  ) : null}
                  <div className={dashboardIconTextRowClassName}>
                    <Clock3 className="h-4 w-4 text-[var(--dashboard-brand)]" />
                    Time: {session
                      ? formatQuizAttemptDuration(session)
                      : formatDurationFromSeconds(attempt.durationSeconds)}
                  </div>
                  <div className={dashboardIconTextRowClassName}>
                    <TrendingUp className="h-4 w-4 text-[var(--dashboard-brand)]" />
                    Percentage: {formatQuizScore(result.percentage)}
                  </div>
                </div>

                <div className="mt-5 rounded-[12px] border border-[var(--dashboard-border)] bg-[var(--dashboard-brand-soft-alt)] px-4 py-3 text-sm text-[var(--dashboard-text-strong)]">
                  {hasDetailedReview
                    ? "Review feedback is saved with this attempt. Open the result to revisit each answer, explanation, and any Review Request context tied to this assigned quiz."
                    : "Detailed per-question review is not available from the current backend summary payload yet. You can still reopen the quiz from your library or class workspace to view the overall result."}
                </div>

                <div className="mt-5 flex gap-3">
                  {reviewHref ? (
                    <DashboardButton asChild type="button" size="lg" className="flex-1">
                      <Link to={reviewHref}>Review Answers</Link>
                    </DashboardButton>
                  ) : (
                    <DashboardButton type="button" size="lg" className="flex-1" disabled>
                      Review Answers
                    </DashboardButton>
                  )}
                  <DashboardButton asChild type="button" variant="secondary" size="lg">
                    <Link to={retakeHref}>
                      {session?.assignmentContext ? "Open Assigned Quiz" : "Retake Quiz"}
                    </Link>
                  </DashboardButton>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-6">
            <p className="font-semibold text-[var(--dashboard-text-strong)]">
              {search.trim() ? "No quiz results match this search" : "No completed quiz attempts yet"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              {search.trim()
                ? "Try a different title, topic, or source keyword to find the result you need."
                : "Start a quiz from your library or classes, finish it, and the full results history will appear here."}
            </p>
            {!search.trim() ? (
              <DashboardButton asChild type="button" size="lg" className="mt-5">
                <Link to="/dashboard/student/quiz-library">Open Quiz Library</Link>
              </DashboardButton>
            ) : null}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
