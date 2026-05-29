import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import type {
  AdminAnalyticsDto,
  ModerationQuizDto,
  ModerationUserDto,
} from "../../../features/dashboard/api/moderationApi";
import {
  deleteQuizByModerator,
  deleteUserByModerator,
  getAdminAnalytics,
  getAllQuizzesForModeration,
  getAllUsersForModeration,
  suspendUser,
  unsuspendUser,
} from "../../../features/dashboard/api/moderationApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import {
  BookOpen,
  ShieldCheck,
  TrendingUp,
  Users,
} from "../../../components/icons/AppIcons";

type AdminTab = "overview" | "users" | "quizzes";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Distinct, calm hues for the role pie. Avoids the AI-typical violet. */
const ROLE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-[var(--dashboard-text-strong)]">{label}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="text-[var(--dashboard-text-soft)]">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ background: entry.color ?? "#888" }}
          />
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

interface AdminStatCardProps {
  label: string;
  value: number;
  delta?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "danger";
}

function AdminStatCard({ label, value, delta, icon: Icon, tone = "default" }: AdminStatCardProps) {
  const toneStyles: Record<NonNullable<AdminStatCardProps["tone"]>, string> = {
    default: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  };

  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--dashboard-text-soft)]">
          {label}
        </span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${toneStyles[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-[var(--dashboard-text-strong)]">
          {value.toLocaleString()}
        </span>
        {delta && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

export function ModeratorDashboardPage() {
  const meta = useDashboardPageMeta();
  const [analytics, setAnalytics] = useState<AdminAnalyticsDto | null>(null);
  const [allQuizzes, setAllQuizzes] = useState<ModerationQuizDto[]>([]);
  const [allUsers, setAllUsers] = useState<ModerationUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const [quizSearch, setQuizSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [suspendModal, setSuspendModal] = useState<{
    userId: string | null;
    reason: string;
    suspendedUntil: string;
  }>({ userId: null, reason: "", suspendedUntil: "" });
  const [deleteUserPending, setDeleteUserPending] = useState<ModerationUserDto | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteQuizPending, setDeleteQuizPending] = useState<ModerationQuizDto | null>(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);

  // Initial load: pull all three in parallel so the dashboard renders cohesively.
  useEffect(() => {
    void Promise.allSettled([
      getAdminAnalytics(),
      getAllQuizzesForModeration(),
      getAllUsersForModeration(),
    ]).then(([analyticsResult, quizzesResult, usersResult]) => {
      if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value);
      else setError("Unable to load admin analytics.");
      if (quizzesResult.status === "fulfilled") setAllQuizzes(quizzesResult.value);
      if (usersResult.status === "fulfilled") setAllUsers(usersResult.value);
      setLoading(false);
    });
  }, []);

  async function refreshAnalytics() {
    try {
      const fresh = await getAdminAnalytics();
      setAnalytics(fresh);
    } catch {
      // analytics refresh is best-effort; the underlying mutation already showed a toast
    }
  }

  async function handleUnsuspendUser(userId: string) {
    try {
      await unsuspendUser(userId);
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isSuspended: false } : u))
      );
      toast.success("User restored.");
      void refreshAnalytics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to restore user.");
    }
  }

  async function handleSuspendUser(
    userId: string,
    reason: string,
    suspendedUntil?: string
  ) {
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;
    if (user.role === "Moderator") {
      // Defense in depth — the UI already hides the button.
      setSuspendModal({ userId: null, reason: "", suspendedUntil: "" });
      return;
    }
    try {
      await suspendUser(userId, {
        reason,
        suspendedUntil: suspendedUntil ? new Date(suspendedUntil).toISOString() : undefined,
      });
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                isSuspended: true,
                suspendedAt: new Date().toISOString(),
                suspensionReason: reason,
                suspendedUntil: suspendedUntil
                  ? new Date(suspendedUntil).toISOString()
                  : null,
              }
            : u
        )
      );
      toast.success(`${user.username} has been suspended.`);
      setSuspendModal({ userId: null, reason: "", suspendedUntil: "" });
      void refreshAnalytics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to suspend user.");
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserPending) return;
    setIsDeletingUser(true);
    try {
      await deleteUserByModerator(deleteUserPending.id);
      const username = deleteUserPending.username;
      setAllUsers((prev) => prev.filter((u) => u.id !== deleteUserPending.id));
      setDeleteUserPending(null);
      toast.success(`Deleted ${username}.`);
      void refreshAnalytics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete user.");
    } finally {
      setIsDeletingUser(false);
    }
  }

  async function handleDeleteQuiz() {
    if (!deleteQuizPending) return;
    setIsDeletingQuiz(true);
    const deletedId = deleteQuizPending.id;
    const title = deleteQuizPending.title;
    try {
      await deleteQuizByModerator(deletedId);
      // Pinpoint live removal: drop the exact quiz row from local state so the
      // list updates instantly without a refetch.
      setAllQuizzes((prev) => prev.filter((q) => q.id !== deletedId));
      setDeleteQuizPending(null);
      toast.success(`Quiz "${title}" was deleted.`);
      // Broadcast so any open Quiz Library tabs in the same browser session
      // know to re-fetch and drop the deleted quiz from their cached state.
      // Without this, the user could see the quiz disappear from the admin
      // panel but linger in the regular library until a hard refresh.
      window.dispatchEvent(
        new CustomEvent("bilgenly:quiz-deleted", { detail: { quizId: deletedId } }),
      );
      void refreshAnalytics();
      // Defense in depth: also refetch the admin quiz list from backend so
      // the table reflects the actual server state, not just the optimistic
      // filter. If the optimistic update raced with a concurrent change, the
      // refetch reconciles it.
      try {
        const fresh = await getAllQuizzesForModeration();
        setAllQuizzes(fresh);
      } catch {
        // refetch is best-effort — the optimistic filter already updated the UI
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete quiz.");
    } finally {
      setIsDeletingQuiz(false);
    }
  }

  const filteredAllQuizzes = useMemo(
    () =>
      allQuizzes.filter(
        (q) =>
          q.title.toLowerCase().includes(quizSearch.toLowerCase()) ||
          q.creatorName.toLowerCase().includes(quizSearch.toLowerCase())
      ),
    [allQuizzes, quizSearch]
  );

  const filteredAllUsers = useMemo(
    () =>
      allUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase())
      ),
    [allUsers, userSearch]
  );

  /** Build the combined users/quizzes growth series for the area chart. */
  const combinedSeries = useMemo(() => {
    if (!analytics) return [];
    return analytics.usersOverTime.map((point, index) => ({
      date: formatShortDate(point.date),
      users: point.value,
      quizzes: analytics.quizzesOverTime[index]?.value ?? 0,
    }));
  }, [analytics]);

  const pieData = useMemo(
    () =>
      analytics?.roleBreakdown.map((slice, idx) => ({
        name: slice.role,
        value: slice.count,
        color: ROLE_COLORS[idx % ROLE_COLORS.length],
      })) ?? [],
    [analytics]
  );

  const tabs: { key: AdminTab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users", count: allUsers.length },
    { key: "quizzes", label: "Quizzes", count: allQuizzes.length },
  ];

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={meta?.title ?? "Admin Dashboard"}
        subtitle={meta?.subtitle ?? "Manage users, quizzes, and platform analytics from one place."}
        badge={meta?.badge}
      />

      {error && (
        <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-[16px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="flex gap-2 border-b border-[var(--dashboard-border-soft)] overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-[var(--dashboard-accent)] text-[var(--dashboard-accent)]"
                    : "border-transparent text-[var(--dashboard-text-soft)] hover:text-[var(--dashboard-text-main)]"
                }`}
              >
                {tab.label}
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span className="rounded-full bg-[var(--dashboard-surface-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--dashboard-text-soft)]">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AdminStatCard
                  label="Total Users"
                  value={analytics?.totalUsers ?? 0}
                  delta={
                    analytics?.newUsersLast7Days
                      ? `+${analytics.newUsersLast7Days} this week`
                      : undefined
                  }
                  icon={Users}
                />
                <AdminStatCard
                  label="Total Quizzes"
                  value={analytics?.totalQuizzes ?? 0}
                  delta={
                    analytics?.newQuizzesLast7Days
                      ? `+${analytics.newQuizzesLast7Days} this week`
                      : undefined
                  }
                  icon={BookOpen}
                  tone="success"
                />
                <AdminStatCard
                  label="Suspended"
                  value={analytics?.suspendedUsers ?? 0}
                  icon={ShieldCheck}
                  tone={(analytics?.suspendedUsers ?? 0) > 0 ? "danger" : "default"}
                />
                <AdminStatCard
                  label="Teachers"
                  value={analytics?.totalTeachers ?? 0}
                  icon={TrendingUp}
                  tone="warning"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <SectionCard
                  title="Growth — last 30 days"
                  description="Daily new users and quizzes joining the platform."
                  className="lg:col-span-2"
                >
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={combinedSeries}
                        margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                      >
                        <defs>
                          <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="quizzesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--dashboard-border-soft)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "var(--dashboard-text-soft)" }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "var(--dashboard-text-soft)" }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="users"
                          name="New users"
                          stroke="#2563eb"
                          strokeWidth={2}
                          fill="url(#usersGradient)"
                        />
                        <Area
                          type="monotone"
                          dataKey="quizzes"
                          name="New quizzes"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#quizzesGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>

                <SectionCard
                  title="User roles"
                  description="Distribution of accounts on the platform."
                >
                  <div className="flex h-[300px] w-full flex-col items-center justify-center">
                    {pieData.length === 0 ? (
                      <p className="text-sm text-[var(--dashboard-text-soft)]">
                        No users yet.
                      </p>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height="70%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={45}
                              outerRadius={80}
                              paddingAngle={3}
                              stroke="var(--dashboard-surface-elevated)"
                              strokeWidth={2}
                            >
                              {pieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-3 flex flex-wrap justify-center gap-3">
                          {pieData.map((entry) => (
                            <div
                              key={entry.name}
                              className="flex items-center gap-1.5 text-xs text-[var(--dashboard-text-soft)]"
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: entry.color }}
                              />
                              <span className="font-medium text-[var(--dashboard-text-strong)]">
                                {entry.name}
                              </span>
                              <span>· {entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <SectionCard
              title="Users"
              description="Search, suspend, or remove user accounts."
            >
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-[8px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface)] px-3 py-2 text-sm text-[var(--dashboard-text-strong)] placeholder-[var(--dashboard-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--dashboard-accent)]"
                />
              </div>
              {filteredAllUsers.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--dashboard-text-soft)]">
                  {userSearch ? "No users match your search." : "No users found."}
                </p>
              ) : (
                <div className="divide-y divide-[var(--dashboard-border-soft)]">
                  {filteredAllUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                            {user.username}
                          </p>
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {user.role}
                          </span>
                          {user.isSuspended && (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              SUSPENDED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--dashboard-text-soft)]">
                          {user.email} · Joined {formatDate(user.createdAt)}
                        </p>
                        {user.isSuspended && user.suspensionReason && (
                          <p className="text-xs text-[var(--dashboard-text-faint)]">
                            Reason: {user.suspensionReason}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {suspendModal.userId === user.id ? (
                          <div className="w-full space-y-3 rounded-[8px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] p-3 sm:w-auto">
                            <input
                              type="text"
                              placeholder="Suspension reason"
                              value={suspendModal.reason}
                              onChange={(e) =>
                                setSuspendModal({ ...suspendModal, reason: e.target.value })
                              }
                              className="w-full rounded-[6px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface)] px-2 py-1 text-xs text-[var(--dashboard-text-strong)] placeholder-[var(--dashboard-text-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--dashboard-accent)]"
                            />
                            <input
                              type="date"
                              value={suspendModal.suspendedUntil}
                              onChange={(e) =>
                                setSuspendModal({
                                  ...suspendModal,
                                  suspendedUntil: e.target.value,
                                })
                              }
                              className="w-full rounded-[6px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface)] px-2 py-1 text-xs text-[var(--dashboard-text-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--dashboard-accent)]"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleSuspendUser(
                                    user.id,
                                    suspendModal.reason,
                                    suspendModal.suspendedUntil
                                  )
                                }
                                disabled={!suspendModal.reason}
                                className="flex-1 rounded-[6px] bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:bg-slate-300"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() =>
                                  setSuspendModal({
                                    userId: null,
                                    reason: "",
                                    suspendedUntil: "",
                                  })
                                }
                                className="flex-1 rounded-[6px] border border-[var(--dashboard-border-soft)] px-2 py-1 text-xs font-medium text-[var(--dashboard-text-soft)] hover:text-[var(--dashboard-text-main)]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {user.role !== "Moderator" && !user.isSuspended && (
                              <button
                                onClick={() =>
                                  setSuspendModal({
                                    userId: user.id,
                                    reason: "",
                                    suspendedUntil: "",
                                  })
                                }
                                className="rounded-[8px] bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                              >
                                Suspend
                              </button>
                            )}

                            {user.isSuspended && (
                              <button
                                onClick={() => handleUnsuspendUser(user.id)}
                                className="rounded-[8px] border border-[var(--dashboard-border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--dashboard-text-soft)] hover:text-[var(--dashboard-text-main)]"
                              >
                                Unsuspend
                              </button>
                            )}

                            {user.role !== "Moderator" && (
                              <button
                                onClick={() => setDeleteUserPending(user)}
                                className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {activeTab === "quizzes" && (
            <SectionCard
              title="Quizzes"
              description="View every quiz on the platform and remove problematic content."
            >
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search by title or creator name…"
                  value={quizSearch}
                  onChange={(e) => setQuizSearch(e.target.value)}
                  className="w-full rounded-[8px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface)] px-3 py-2 text-sm text-[var(--dashboard-text-strong)] placeholder-[var(--dashboard-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--dashboard-accent)]"
                />
              </div>
              {filteredAllQuizzes.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--dashboard-text-soft)]">
                  {quizSearch ? "No quizzes match your search." : "No quizzes found."}
                </p>
              ) : (
                <div className="divide-y divide-[var(--dashboard-border-soft)]">
                  {filteredAllQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1 space-y-0.5">
                        <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                          {quiz.title}
                        </p>
                        <p className="text-xs text-[var(--dashboard-text-soft)]">
                          By {quiz.creatorName} ({quiz.creatorEmail}) · {quiz.questionsCount}{" "}
                          questions · {formatDate(quiz.createdAt)}
                        </p>
                        <p className="text-xs text-[var(--dashboard-text-faint)]">
                          Status: {quiz.status}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => setDeleteQuizPending(quiz)}
                          className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}
        </>
      )}

      <AlertDialog
        open={Boolean(deleteUserPending)}
        onOpenChange={(open) => {
          if (!open) setDeleteUserPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUserPending
                ? `This will permanently delete "${deleteUserPending.username}" (${deleteUserPending.email}) and all their data — quizzes, attempts, and class memberships. This cannot be undone.`
                : "This will permanently delete the user account."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingUser}
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteUser();
              }}
            >
              {isDeletingUser ? "Deleting…" : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteQuizPending)}
        onOpenChange={(open) => {
          if (!open) setDeleteQuizPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteQuizPending
                ? `This will permanently delete "${deleteQuizPending.title}" by ${deleteQuizPending.creatorName}, including all its questions and attempt history. This cannot be undone.`
                : "This will permanently delete the quiz."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingQuiz}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingQuiz}
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteQuiz();
              }}
            >
              {isDeletingQuiz ? "Deleting…" : "Delete quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
