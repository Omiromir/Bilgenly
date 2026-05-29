import { useMemo, useState } from "react";
import { Trophy } from "../../../components/icons/AppIcons";
import { Skeleton } from "../../../components/ui/skeleton";
import { CtaPanel } from "../../../features/dashboard/components/CtaPanel";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardSurface,
  dashboardPageClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import {
  useAchievementsQuery,
  type AchievementsDto,
  type LeaderboardEntryDto,
  type UserBadgeDto,
} from "../../../features/gamification/api";
import { resolveAvatarUrl } from "../../../features/profile/avatars";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useStudentAttempts } from "../../../app/providers/StudentAttemptsProvider";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { getQuizSessionResultSummary } from "../../../features/quiz-session/quizSessionUtils";

/* ─── Badge icon mapping ────────────────────────────────────────────────────── */

interface BadgeMeta {
  emoji: string;
  gradient: string;     // tailwind gradient classes
  glow: string;         // box-shadow colour for earned glow
  tier: "bronze" | "silver" | "gold" | "legendary";
}

const TIER_RING: Record<BadgeMeta["tier"], string> = {
  bronze:    "ring-2 ring-amber-700/60",
  silver:    "ring-2 ring-slate-400/70",
  gold:      "ring-2 ring-yellow-400/80",
  legendary: "ring-2 ring-purple-400/80",
};

const TIER_LABEL: Record<BadgeMeta["tier"], { text: string; cls: string }> = {
  bronze:    { text: "Bronze",    cls: "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30" },
  silver:    { text: "Silver",    cls: "text-slate-500 bg-slate-100 dark:text-slate-300 dark:bg-slate-700/40" },
  gold:      { text: "Gold",      cls: "text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30" },
  legendary: { text: "Legendary", cls: "text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30" },
};

function getBadgeMeta(badge: UserBadgeDto): BadgeMeta {
  const t = badge.title.toLowerCase();
  const d = badge.description.toLowerCase();

  // Perfect score
  if (t.includes("perfect") || d.includes("100%") || d.includes("perfect"))
    return { emoji: "👑", gradient: "from-purple-500 to-pink-500", glow: "rgba(168,85,247,0.5)", tier: "legendary" };

  // High average score (>=85, >=95)
  if (t.includes("elite") || d.includes("95") || d.includes("90"))
    return { emoji: "💎", gradient: "from-cyan-400 to-blue-600", glow: "rgba(34,211,238,0.5)", tier: "gold" };
  if (t.includes("sharp") || t.includes("scholar") || d.includes("85") || d.includes("80"))
    return { emoji: "🔥", gradient: "from-orange-400 to-red-500", glow: "rgba(249,115,22,0.5)", tier: "silver" };
  if (t.includes("average") || t.includes("score") || d.includes("average"))
    return { emoji: "🎯", gradient: "from-green-400 to-emerald-600", glow: "rgba(52,211,153,0.4)", tier: "bronze" };

  // Quiz count milestones
  if (d.includes("50") || t.includes("veteran") || t.includes("master"))
    return { emoji: "⚡", gradient: "from-yellow-300 to-orange-500", glow: "rgba(251,191,36,0.5)", tier: "gold" };
  if (d.includes("25") || t.includes("dedicated"))
    return { emoji: "🏋️", gradient: "from-indigo-400 to-violet-600", glow: "rgba(129,140,248,0.5)", tier: "silver" };
  if (d.includes("10") || t.includes("experienced"))
    return { emoji: "📚", gradient: "from-teal-400 to-cyan-600", glow: "rgba(45,212,191,0.4)", tier: "bronze" };
  if (d.includes("5") || t.includes("active"))
    return { emoji: "⭐", gradient: "from-amber-400 to-yellow-500", glow: "rgba(251,191,36,0.4)", tier: "bronze" };

  // First quiz / starter
  if (t.includes("first") || t.includes("starter") || t.includes("begin") || d.includes("first"))
    return { emoji: "🚀", gradient: "from-sky-400 to-blue-600", glow: "rgba(56,189,248,0.4)", tier: "bronze" };

  // Streak / consistency
  if (t.includes("streak") || d.includes("streak") || t.includes("consistent"))
    return { emoji: "🔥", gradient: "from-orange-400 to-red-500", glow: "rgba(249,115,22,0.5)", tier: "silver" };

  // Generic fallback
  return { emoji: "🏅", gradient: "from-slate-400 to-slate-600", glow: "rgba(100,116,139,0.4)", tier: "bronze" };
}

/* ─── Avatar component ──────────────────────────────────────────────────────── */

function Avatar({
  username,
  avatarUrl,
  size = 40,
  className = "",
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = username.slice(0, 2).toUpperCase();
  // Deterministic hue from username
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;

  const resolvedSrc = resolveAvatarUrl(avatarUrl);
  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={username}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: `hsl(${hue},55%,50%)`,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── Podium component ──────────────────────────────────────────────────────── */

const PODIUM_MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_HEIGHTS = ["h-24", "h-16", "h-12"];
const PODIUM_COLORS = [
  "from-yellow-400/30 to-yellow-600/20 border-yellow-400/50",
  "from-slate-300/30 to-slate-500/20 border-slate-400/50",
  "from-amber-600/30 to-amber-800/20 border-amber-600/50",
];
const PODIUM_ORDER = [1, 0, 2]; // silver, gold, bronze display order

function PodiumEntry({ entry, position }: { entry: LeaderboardEntryDto; position: 0 | 1 | 2 }) {
  const isFirst = position === 0;
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Medal */}
      <span className="text-2xl">{PODIUM_MEDALS[position]}</span>

      {/* Avatar */}
      <div className={`relative ${isFirst ? "ring-4 ring-yellow-400/60 rounded-full" : ""}`}>
        <Avatar
          username={entry.username}
          avatarUrl={entry.avatarUrl}
          size={isFirst ? 64 : 52}
        />
        {entry.isCurrentUser && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--dashboard-brand)] text-[10px] font-bold text-white shadow">
            You
          </span>
        )}
      </div>

      {/* Name */}
      <p className={`max-w-[80px] truncate text-center text-xs font-bold ${entry.isCurrentUser ? "text-[var(--dashboard-brand)]" : "text-[var(--dashboard-text-strong)]"}`}>
        {entry.isCurrentUser ? "You" : entry.username}
      </p>

      {/* Score */}
      <p className="text-sm font-semibold text-[var(--dashboard-text-soft)]">
        {Math.round(entry.averageScore)}%
      </p>

      {/* Pedestal */}
      <div className={`w-20 rounded-t-lg border bg-gradient-to-b ${PODIUM_COLORS[position]} ${PODIUM_HEIGHTS[position]}`} />
    </div>
  );
}

/* ─── Skeletons ─────────────────────────────────────────────────────────────── */

function HeroSkeleton() {
  return (
    <DashboardSurface variant="hero" radius="2xl" padding="lg" className="overflow-hidden">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl flex-1">
          <Skeleton className="h-10 w-56 rounded-xl bg-white/20" />
          <Skeleton className="mt-4 h-5 w-72 rounded-lg bg-white/15" />
          <div className="mt-8 grid gap-10 sm:grid-cols-3">
            {["Average Score", "Quizzes Done", "Badges Earned"].map((label) => (
              <div key={label}>
                <p className="text-sm text-white/80">{label}</p>
                <Skeleton className="mt-2 h-9 w-20 rounded-lg bg-white/20" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden h-40 w-40 shrink-0 items-center justify-center rounded-[28px] bg-white/12 lg:flex">
          <Trophy className="h-20 w-20 text-white/30" />
        </div>
      </div>
    </DashboardSurface>
  );
}

function BadgeCardSkeleton() {
  return (
    <DashboardSurface radius="md" padding="sm" className="border border-[var(--dashboard-border-soft)]">
      <div className="flex items-start gap-3">
        <Skeleton className="h-14 w-14 shrink-0 rounded-2xl bg-[var(--dashboard-surface-accent)]" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-3/4 rounded-md bg-[var(--dashboard-surface-accent)]" />
          <Skeleton className="h-3 w-full rounded-md bg-[var(--dashboard-surface-accent)]" />
          <Skeleton className="h-3 w-2/3 rounded-md bg-[var(--dashboard-surface-accent)]" />
        </div>
      </div>
    </DashboardSurface>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

const LEADERBOARD_TOP_N = 10;

export function StudentBadgesPage() {
  const meta = useDashboardPageMeta();
  const { currentUser } = useAuth();
  const { classes } = useTeacherClasses();
  const { data, isLoading, error } = useAchievementsQuery();
  const [leaderboardClassFilter, setLeaderboardClassFilter] = useState<string>("all");

  // Use session-based (earnedPoints/totalPoints) percentages to compute average —
  // same method as My Results page, so both pages always agree.
  const { attempts: allAttempts } = useStudentAttempts();
  const { getCompletedSessionsForRole } = useQuizSessions();
  const completedSessions = getCompletedSessionsForRole("student");

  const correctedAverageScore = useMemo(() => {
    const completed = allAttempts.filter((a) => a.isCompleted);
    if (!completed.length) return null;

    const sessionPctById = new Map<string, number>();
    for (const session of completedSessions) {
      if (session.backendAttemptId) {
        sessionPctById.set(session.backendAttemptId, getQuizSessionResultSummary(session).percentage);
      }
    }
    const scores = completed.map((a) => sessionPctById.get(a.id) ?? a.score);
    return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  }, [allAttempts, completedSessions]);

  const studentClasses = useMemo(
    () =>
      classes.filter((cls) =>
        cls.students.some(
          (s) =>
            s.status === "joined" &&
            (s.linkedUserId === currentUser?.id ||
              s.email.toLowerCase() === (currentUser?.email ?? "").toLowerCase()),
        ),
      ),
    [classes, currentUser?.email, currentUser?.id],
  );

  const classMembersForFilter = useMemo(() => {
    if (leaderboardClassFilter === "all") return null;
    const target = studentClasses.find((cls) => cls.id === leaderboardClassFilter);
    if (!target) return null;
    const memberUserIds = new Set<string>();
    for (const s of target.students) {
      if (s.status !== "joined") continue;
      if (s.linkedUserId) memberUserIds.add(s.linkedUserId);
    }
    return { memberUserIds };
  }, [leaderboardClassFilter, studentClasses]);

  const filteredLeaderboard = useMemo(() => {
    if (!data) return [];
    if (!classMembersForFilter) return data.leaderboard;
    return data.leaderboard.filter(
      (e) => classMembersForFilter.memberUserIds.has(e.userId) || e.isCurrentUser,
    );
  }, [classMembersForFilter, data]);

  // Re-rank entries locally after filtering so medals and #N reflect the filtered order
  const rerankedLeaderboard = useMemo(
    () => filteredLeaderboard.map((entry, i) => ({ ...entry, localRank: i + 1 })),
    [filteredLeaderboard],
  );
  const topEntries = useMemo(() => rerankedLeaderboard.slice(0, LEADERBOARD_TOP_N), [rerankedLeaderboard]);
  const currentUserEntry = useMemo(
    () => rerankedLeaderboard.find((e) => e.isCurrentUser),
    [rerankedLeaderboard],
  );
  const currentUserOutsideTop = useMemo(
    () => currentUserEntry && currentUserEntry.localRank > LEADERBOARD_TOP_N,
    [currentUserEntry],
  );


  const rankLabel = data?.rank ? `#${data.rank}` : "Unranked";
  // Prefer corrected (session-based) average; fall back to backend value.
  const displayAverage = correctedAverageScore ?? (data?.averageScore !== undefined ? Math.round(data.averageScore) : null);
  const formattedScore = displayAverage !== null ? `${displayAverage}%` : "—";

  // Podium: top 3 in display order [silver, gold, bronze]
  const podiumEntries = topEntries.slice(0, 3);

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Achievements"}
        subtitle={meta?.subtitle ?? "Track your badges, rank up, and compete with classmates"}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <HeroSkeleton />
      ) : (
        <CtaPanel
          title={`Your Rank: ${rankLabel}`}
          description={
            error
              ? error
              : data
                ? `Average score: ${formattedScore}. ${data.badgesEarned} of ${data.totalBadges} badges earned.`
                : "No achievements yet."
          }
          variant="gradient"
          aside={
            <div className="hidden h-40 w-40 items-center justify-center rounded-[28px] bg-white/12 lg:flex">
              <Trophy className="h-20 w-20 text-white/85" />
            </div>
          }
          actions={
            <div className="grid gap-10 text-white sm:grid-cols-3">
              <div>
                <p className="text-sm text-white/80">Average Score</p>
                <p className="mt-1 text-[2rem] font-semibold">{formattedScore}</p>
              </div>
              <div>
                <p className="text-sm text-white/80">Quizzes Done</p>
                <p className="mt-1 text-[2rem] font-semibold">{data?.quizzesDone ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-white/80">Badges Earned</p>
                <p className="mt-1 text-[2rem] font-semibold">{data?.badgesEarned ?? 0}</p>
              </div>
            </div>
          }
        />
      )}

      {/* ── Badges ───────────────────────────────────────────────────────── */}
      <SectionCard title="Your Badges">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-[var(--dashboard-text-soft)]">
            Earn badges by completing quizzes and hitting score milestones.
          </p>
          {isLoading ? (
            <Skeleton className="h-4 w-24 rounded-md bg-[var(--dashboard-surface-accent)]" />
          ) : data ? (
            <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
              {data.badgesEarned}/{data.totalBadges} earned
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <BadgeCardSkeleton key={i} />)}
          </div>
        ) : data && data.badges.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.badges.map((badge) => {
              const m = getBadgeMeta(badge);
              const tierInfo = TIER_LABEL[m.tier];
              return (
                <div
                  key={badge.badgeId}
                  className={`relative overflow-hidden rounded-2xl border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] p-4 transition-transform hover:-translate-y-0.5 ${TIER_RING[m.tier]}`}
                  style={{ boxShadow: `0 0 18px ${m.glow}, 0 2px 8px rgba(0,0,0,0.08)` }}
                >
                  {/* Background shimmer accent */}
                  <div
                    className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${m.gradient} opacity-15 blur-xl`}
                  />

                  <div className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${m.gradient} text-3xl shadow-md`}
                    >
                      {m.emoji}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[var(--dashboard-text-strong)]">{badge.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tierInfo.cls}`}>
                          {tierInfo.text}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-[var(--dashboard-text-soft)]">
                        {badge.description}
                      </p>
                      {badge.earnedAt ? (
                        <p className="mt-2 text-xs text-[var(--dashboard-text-faint)]">
                          Earned {new Date(badge.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-10 text-center">
            <p className="text-4xl">🏅</p>
            <p className="mt-3 font-semibold text-[var(--dashboard-text-strong)]">No badges yet</p>
            <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
              Complete your first quiz to start earning badges.
            </p>
          </div>
        )}
      </SectionCard>

      {/* ── Leaderboard ──────────────────────────────────────────────────── */}
      <SectionCard
        title="Class Leaderboard"
        actions={
          studentClasses.length > 0 ? (
            <Select value={leaderboardClassFilter} onValueChange={setLeaderboardClassFilter}>
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {studentClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-3">
                <Skeleton className="h-10 w-10 rounded-full bg-[var(--dashboard-surface-accent)]" />
                <Skeleton className="h-4 w-36 rounded-md bg-[var(--dashboard-surface-accent)]" />
                <Skeleton className="ml-auto h-6 w-16 rounded-lg bg-[var(--dashboard-surface-accent)]" />
              </div>
            ))}
          </div>
        ) : topEntries.length > 0 ? (
          <div className="space-y-6">

            {/* Podium (top 3) */}
            {podiumEntries.length >= 2 ? (
              <div className="flex items-end justify-center gap-4 pb-2 pt-4">
                {PODIUM_ORDER.map((pos) => {
                  const entry = podiumEntries[pos];
                  if (!entry) return null;
                  return <PodiumEntry key={entry.userId} entry={entry} position={pos as 0 | 1 | 2} />;
                })}
              </div>
            ) : null}

            {/* Full ranking list */}
            <div className="space-y-2">
              {topEntries.map((entry) => {
                const isTop3 = entry.localRank <= 3;
                const rankEmoji = entry.localRank === 1 ? "🥇" : entry.localRank === 2 ? "🥈" : entry.localRank === 3 ? "🥉" : null;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                      entry.isCurrentUser
                        ? "border-[var(--dashboard-brand)]/40 bg-[var(--dashboard-brand-soft-alt)]"
                        : "border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)]"
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-8 shrink-0 text-center">
                      {rankEmoji ? (
                        <span className="text-xl">{rankEmoji}</span>
                      ) : (
                        <span className="text-sm font-bold text-[var(--dashboard-text-faint)]">
                          #{entry.localRank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar
                      username={entry.username}
                      avatarUrl={entry.avatarUrl}
                      size={36}
                    />

                    {/* Name */}
                    <p className={`flex-1 truncate text-sm font-semibold ${entry.isCurrentUser ? "text-[var(--dashboard-brand)]" : "text-[var(--dashboard-text-strong)]"}`}>
                      {entry.isCurrentUser ? `${entry.username} (You)` : entry.username}
                    </p>

                    {/* Score */}
                    <span className={`text-sm font-bold tabular-nums ${isTop3 ? "text-[var(--dashboard-warning)]" : "text-[var(--dashboard-text-soft)]"}`}>
                      {Math.round(entry.averageScore)}%
                    </span>
                  </div>
                );
              })}

              {/* Current user outside top N */}
              {currentUserOutsideTop && currentUserEntry ? (
                <>
                  <div className="flex items-center gap-2 py-1">
                    <div className="h-px flex-1 border-t border-dashed border-[var(--dashboard-border-soft)]" />
                    <span className="text-xs text-[var(--dashboard-text-faint)]">your position</span>
                    <div className="h-px flex-1 border-t border-dashed border-[var(--dashboard-border-soft)]" />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-[var(--dashboard-brand)]/40 bg-[var(--dashboard-brand-soft-alt)] px-4 py-3">
                    <div className="w-8 shrink-0 text-center">
                      <span className="text-sm font-bold text-[var(--dashboard-text-faint)]">
                        #{currentUserEntry.localRank}
                      </span>
                    </div>
                    <Avatar username={currentUserEntry.username} avatarUrl={currentUserEntry.avatarUrl} size={36} />
                    <p className="flex-1 truncate text-sm font-semibold text-[var(--dashboard-brand)]">
                      {currentUserEntry.username} (You)
                    </p>
                    <span className="text-sm font-bold tabular-nums text-[var(--dashboard-text-soft)]">
                      {Math.round(currentUserEntry.averageScore)}%
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-[var(--dashboard-text-faint)]">
              Showing top {Math.min(LEADERBOARD_TOP_N, topEntries.length)} students · Ranked by average quiz score
            </p>
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-8 text-center">
            <p className="text-3xl">🏆</p>
            <p className="mt-3 font-semibold text-[var(--dashboard-text-strong)]">No leaderboard yet</p>
            <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
              {leaderboardClassFilter !== "all"
                ? "No classmates from this class have qualifying scores yet."
                : "Leaderboard appears once classes have completed quizzes."}
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
