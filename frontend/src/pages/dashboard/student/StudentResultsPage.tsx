import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Award,
  CheckCircle2,
  Clock3,
  TrendingUp,
} from "../../../components/icons/AppIcons";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { useStudentAttempts } from "../../../app/providers/StudentAttemptsProvider";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { getQuizFeedbackPolicy } from "../../../features/quiz-session/feedbackPolicy";
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
  formatAttemptDtoDuration,
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
  const { classes } = useTeacherClasses();
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

  /**
   * Look up `maxAttempts` for each assignment from the classes provider.
   * Needed so we can decide whether the detailed review is locked for an
   * assigned-quiz result row.
   */
  const assignmentMaxAttemptsById = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const teacherClass of classes) {
      for (const assignment of teacherClass.assignedQuizzes) {
        map.set(assignment.assignmentId, assignment.maxAttempts);
      }
    }
    return map;
  }, [classes]);

  /**
   * Count completed attempts per assignment. Used to compute whether the
   * student has exhausted their attempts for a given assignment.
   */
  const completedAttemptsByAssignmentId = useMemo(() => {
    const map = new Map<string, number>();
    for (const attempt of completedAttempts) {
      if (!attempt.assignmentId) continue;
      map.set(attempt.assignmentId, (map.get(attempt.assignmentId) ?? 0) + 1);
    }
    return map;
  }, [completedAttempts]);

  // Map backendAttemptId → points-based percentage from local session.
  // Used to override the backend's (correctAnswers/totalQuestions)-based score
  // with the accurate (earnedPoints/totalPoints)-based score wherever possible.
  const sessionPercentageByAttemptId = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of completedSessions) {
      if (session.backendAttemptId) {
        map.set(session.backendAttemptId, getQuizSessionResultSummary(session).percentage);
      }
    }
    return map;
  }, [completedSessions]);

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

    // Prefer session-based percentage (points-accurate) over backend score
    // (which uses correctAnswers/totalQuestions instead of earnedPoints/totalPoints).
    const percentages = attemptSummaries.map((attempt) =>
      sessionPercentageByAttemptId.get(attempt.attemptId) ?? attempt.score,
    );
    const latestScore = percentages[0];
    const averageScore = Math.round(
      percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
    );

    // Best score: pick the actual attempt to also surface which quiz/when —
    // a bare lifetime max becomes meaningless once a student has ever scored
    // 100% on any quiz (it just sits there forever with no context).
    let bestScore = percentages[0];
    let bestAttemptIndex = 0;
    for (let i = 1; i < percentages.length; i += 1) {
      if (percentages[i] > bestScore) {
        bestScore = percentages[i];
        bestAttemptIndex = i;
      }
    }
    const bestAttempt = attemptSummaries[bestAttemptIndex];
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
        // Show the quiz title + date so it's clear WHERE the personal best
        // came from, instead of a fossilised lifetime number with no context.
        note: bestAttempt
          ? `${bestAttempt.quizTitle} · ${formatQuizAttemptDate(bestAttempt.dateTaken)}`
          : bestScore === 100
            ? "Perfect result unlocked."
            : "Your strongest attempt so far.",
      },
      {
        label: "Latest Score",
        value: formatQuizScore(latestScore),
        note: `Recorded ${formatQuizAttemptDate(attemptSummaries[0]?.dateTaken ?? new Date().toISOString())}`,
      },
    ];
  }, [attemptSummaries, sessionPercentageByAttemptId]);

  const progressData = useMemo(
    () =>
      attemptSummaries
        .slice(0, 10)
        .reverse()
        .map((attempt, index) => ({
          label: `#${index + 1}`,
          value: sessionPercentageByAttemptId.get(attempt.attemptId) ?? attempt.score,
          quizTitle: attempt.quizTitle,
          date: attempt.dateTaken ? new Date(attempt.dateTaken).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        })),
    [attemptSummaries, sessionPercentageByAttemptId],
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
                // Use correct/total as a reasonable proxy when the local session
                // is not available (e.g. after a hard refresh or on a new device).
                // This keeps the Score row visible so the user sees meaningful data.
                earnedPoints: attempt.correctAnswers,
                totalPoints: attempt.totalQuestions,
              };
          const hasDetailedReview =
            Boolean(matchedSession) || attempt.questions.length > 0;

          // Detailed review for assigned quizzes is locked until the student
          // has used all attempts. For self-practice quizzes the review is
          // always open.
          const assignmentId =
            matchedSession?.assignmentContext?.assignmentId ?? attempt.assignmentId ?? null;
          const isAssigned = Boolean(assignmentId);
          const maxAttempts = assignmentId
            ? (assignmentMaxAttemptsById.get(assignmentId) ?? null)
            : null;
          const attemptsUsed = assignmentId
            ? (completedAttemptsByAssignmentId.get(assignmentId) ?? 0)
            : 0;
          const reviewPolicy = getQuizFeedbackPolicy({
            sourceType: matchedSession?.sourceType,
            viewerRole: "student",
            isAssigned,
            attemptsUsed,
            maxAttempts,
            hasInProgressAttempt: false,
          });
          const reviewUnlocked = reviewPolicy.showDetailedReview;

          return {
            attempt,
            session: matchedSession,
            result,
            hasDetailedReview,
            reviewUnlocked,
            reviewLockReason: reviewPolicy.lockReason,
            reviewHref:
              hasDetailedReview && reviewUnlocked
                ? buildSessionLink(
                    matchedSession?.id ?? attempt.id,
                    matchedSession?.quizId ?? attempt.quizId,
                    matchedSession?.assignmentContext?.assignmentId,
                  )
                : null,
            retakeHref: buildQuizLink(
              attempt.quizId,
              matchedSession?.assignmentContext?.assignmentId ?? attempt.assignmentId,
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
          <div className="h-[300px] animate-pulse rounded-2xl bg-[var(--dashboard-surface-muted)]" />
        ) : progressData.length ? (
          <>
            {/* Score band legend */}
            <div className="mb-4 flex items-center gap-4 text-xs text-[var(--dashboard-text-faint)]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Great (≥80%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                OK (60–79%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
                Needs work (&lt;60%)
              </span>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData} margin={{ top: 16, right: 16, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                    {/* Reference zones via stop colours */}
                  </defs>

                  {/* Horizontal reference bands */}
                  <CartesianGrid stroke="var(--dashboard-border-soft)" strokeDasharray="4 4" vertical={false} />

                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--dashboard-text-faint)", fontSize: 12, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "var(--dashboard-text-faint)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                    width={38}
                    ticks={[0, 25, 50, 60, 75, 80, 100]}
                  />

                  <Tooltip
                    content={(props: TooltipProps<number, string>) => {
                      const { active, payload } = props;
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { label: string; value: number; quizTitle: string; date: string };
                      const pct = d.value;
                      const color = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#f87171";
                      const grade = pct >= 80 ? "🏆 Great" : pct >= 60 ? "👍 OK" : "📚 Keep going";
                      return (
                        <div className="min-w-[180px] rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-elevated)] px-4 py-3 shadow-xl">
                          <p className="mb-1 truncate text-xs font-semibold text-[var(--dashboard-text-muted)]">
                            {d.date}
                          </p>
                          <p className="mb-2 truncate text-sm font-bold text-[var(--dashboard-text-strong)]">
                            {d.quizTitle}
                          </p>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-2xl font-extrabold" style={{ color }}>
                              {pct}%
                            </span>
                            <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: `${color}22`, color }}>
                              {grade}
                            </span>
                          </div>
                          {/* Mini progress bar */}
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--dashboard-border-soft)]">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                          </div>
                        </div>
                      );
                    }}
                    cursor={{ stroke: "#6366f1", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#scoreGradient)"
                    dot={(dotProps: { cx: number; cy: number; payload: { value: number } }) => {
                      const { cx, cy, payload } = dotProps;
                      const pct = payload.value;
                      const color = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#f87171";
                      return (
                        <circle
                          key={`dot-${cx}-${cy}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={color}
                          stroke="#fff"
                          strokeWidth={2.5}
                        />
                      );
                    }}
                    activeDot={{ r: 8, stroke: "#6366f1", strokeWidth: 2.5, fill: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
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
            {recentResults.map(({
              attempt,
              session,
              result,
              reviewHref,
              retakeHref,
              hasDetailedReview,
              reviewUnlocked,
              reviewLockReason,
            }) => (
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
                      : formatAttemptDtoDuration(attempt)}
                  </div>
                  <div className={dashboardIconTextRowClassName}>
                    <TrendingUp className="h-4 w-4 text-[var(--dashboard-brand)]" />
                    Percentage: {formatQuizScore(result.percentage)}
                  </div>
                </div>

                <div className="mt-5 rounded-[12px] border border-[var(--dashboard-border)] bg-[var(--dashboard-brand-soft-alt)] px-4 py-3 text-sm text-[var(--dashboard-text-strong)]">
                  {!hasDetailedReview
                    ? "Detailed per-question review is not available from the current backend summary payload yet. You can still reopen the quiz from your library or class workspace to view the overall result."
                    : reviewUnlocked
                      ? "Review feedback is saved with this attempt. Open the result to revisit each answer, explanation, and any Review Request context tied to this assigned quiz."
                      : (reviewLockReason ??
                          "This is an assigned quiz — detailed review unlocks after you've used all your attempts.")}
                </div>

                <div className="mt-5 flex gap-3">
                  {reviewHref ? (
                    <DashboardButton asChild type="button" size="lg" className="flex-1">
                      <Link to={reviewHref}>Review Answers</Link>
                    </DashboardButton>
                  ) : (
                    <DashboardButton type="button" size="lg" className="flex-1" disabled>
                      {hasDetailedReview && !reviewUnlocked
                        ? "Review locked until attempts used"
                        : "Review Answers"}
                    </DashboardButton>
                  )}
                  <DashboardButton asChild type="button" variant="secondary" size="lg">
                    <Link to={retakeHref}>
                      {(session?.assignmentContext || attempt.assignmentId) ? "Open Assigned Quiz" : "Retake Quiz"}
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
