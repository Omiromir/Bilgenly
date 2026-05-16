import { useEffect, useState } from "react";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import type {
  ModeratorDashboardDto,
  ReportDto,
  SuspendedUserDto,
  HiddenQuizDto,
  ModerationQuizDto,
  ModerationUserDto,
} from "../../../features/dashboard/api/moderationApi";
import {
  getModeratorDashboard,
  getAllReports,
  reviewReport,
  getSuspendedUsers,
  unsuspendUser,
  getHiddenQuizzes,
  unhideQuiz,
  getAllQuizzesForModeration,
  getAllUsersForModeration,
  hideQuiz,
  suspendUser,
} from "../../../features/dashboard/api/moderationApi";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    reviewed: "bg-emerald-100 text-emerald-700",
    dismissed: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-500"}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[14px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] p-5">
      <span className={`text-3xl font-bold ${accent ?? "text-[var(--dashboard-text-strong)]"}`}>
        {value}
      </span>
      <span className="text-sm text-[var(--dashboard-text-soft)]">{label}</span>
    </div>
  );
}

export function ModeratorDashboardPage() {
  const meta = useDashboardPageMeta();
  const [stats, setStats] = useState<ModeratorDashboardDto | null>(null);
  const [reports, setReports] = useState<ReportDto[]>([]);
  const [suspendedUsers, setSuspendedUsers] = useState<SuspendedUserDto[]>([]);
  const [hiddenQuizzes, setHiddenQuizzes] = useState<HiddenQuizDto[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<ModerationQuizDto[]>([]);
  const [allUsers, setAllUsers] = useState<ModerationUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "reports" | "users" | "quizzes" | "all-quizzes" | "all-users"
  >("reports");

  const [quizSearch, setQuizSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [suspendModal, setSuspendModal] = useState<{
    userId: string | null;
    reason: string;
    suspendedUntil: string;
  }>({ userId: null, reason: "", suspendedUntil: "" });

  useEffect(() => {
    Promise.allSettled([
      getModeratorDashboard(),
      getAllReports(),
      getSuspendedUsers(),
      getHiddenQuizzes(),
      getAllQuizzesForModeration(),
      getAllUsersForModeration(),
    ]).then(
      ([
        dashboardResult,
        reportsResult,
        usersResult,
        quizzesResult,
        allQuizzesResult,
        allUsersResult,
      ]) => {
        if (dashboardResult.status === "fulfilled") setStats(dashboardResult.value);
        else setError("Unable to load dashboard data.");
        if (reportsResult.status === "fulfilled") setReports(reportsResult.value);
        if (usersResult.status === "fulfilled") setSuspendedUsers(usersResult.value);
        if (quizzesResult.status === "fulfilled") setHiddenQuizzes(quizzesResult.value);
        if (allQuizzesResult.status === "fulfilled") setAllQuizzes(allQuizzesResult.value);
        if (allUsersResult.status === "fulfilled") setAllUsers(allUsersResult.value);
        setLoading(false);
      }
    );
  }, []);

  async function handleReviewReport(reportId: string, status: "reviewed" | "dismissed") {
    try {
      const updated = await reviewReport(reportId, { status });
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
      if (stats) {
        setStats({
          ...stats,
          pendingReportsCount: Math.max(0, stats.pendingReportsCount - 1),
          recentReports: stats.recentReports.filter((r) => r.id !== reportId),
        });
      }
    } catch {
      // error handled silently
    }
  }

  async function handleUnsuspendUser(userId: string) {
    try {
      await unsuspendUser(userId);
      setSuspendedUsers((prev) => prev.filter((u) => u.id !== userId));
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isSuspended: false } : u))
      );
      if (stats) {
        setStats({ ...stats, activeSuspensionsCount: Math.max(0, stats.activeSuspensionsCount - 1) });
      }
    } catch {
      // error handled silently
    }
  }

  async function handleUnhideQuiz(quizId: string) {
    try {
      await unhideQuiz(quizId);
      setHiddenQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      setAllQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, isHidden: false } : q))
      );
      if (stats) {
        setStats({ ...stats, hiddenQuizzesCount: Math.max(0, stats.hiddenQuizzesCount - 1) });
      }
    } catch {
      // error handled silently
    }
  }

  async function handleHideQuiz(quizId: string) {
    try {
      const quiz = allQuizzes.find((q) => q.id === quizId);
      if (quiz) {
        await hideQuiz(quizId, { moderationNote: "" });
        setAllQuizzes((prev) =>
          prev.map((q) =>
            q.id === quizId
              ? { ...q, isHidden: true, hiddenAt: new Date().toISOString() }
              : q
          )
        );
        if (stats) {
          setStats({ ...stats, hiddenQuizzesCount: stats.hiddenQuizzesCount + 1 });
        }
      }
    } catch {
      // error handled silently
    }
  }

  async function handleSuspendUser(
    userId: string,
    reason: string,
    suspendedUntil?: string
  ) {
    try {
      const user = allUsers.find((u) => u.id === userId);
      if (user) {
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
        if (stats) {
          setStats({
            ...stats,
            activeSuspensionsCount: stats.activeSuspensionsCount + 1,
          });
        }
        setSuspendModal({ userId: null, reason: "", suspendedUntil: "" });
      }
    } catch {
      // error handled silently
    }
  }

  const filteredAllQuizzes = allQuizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(quizSearch.toLowerCase()) ||
      q.creatorName.toLowerCase().includes(quizSearch.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const tabs = [
    {
      key: "reports" as const,
      label: "Reports",
      count: reports.filter((r) => r.status === "pending").length,
    },
    {
      key: "users" as const,
      label: "Suspended Users",
      count: suspendedUsers.length,
    },
    {
      key: "quizzes" as const,
      label: "Hidden Quizzes",
      count: hiddenQuizzes.length,
    },
    { key: "all-quizzes" as const, label: "All Quizzes", count: 0 },
    { key: "all-users" as const, label: "All Users", count: 0 },
  ];

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={meta?.title ?? "Moderator Dashboard"}
        subtitle={meta?.subtitle ?? "Review reports, manage suspensions, and moderate content."}
        badge={meta?.badge}
      />

      {error && (
        <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-[var(--dashboard-text-soft)]">Loading dashboard…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Pending Reports"
              value={stats?.pendingReportsCount ?? 0}
              accent={stats && stats.pendingReportsCount > 0 ? "text-amber-600" : undefined}
            />
            <StatCard
              label="Active Suspensions"
              value={stats?.activeSuspensionsCount ?? 0}
              accent={stats && stats.activeSuspensionsCount > 0 ? "text-red-500" : undefined}
            />
            <StatCard label="Hidden Quizzes" value={stats?.hiddenQuizzesCount ?? 0} />
          </div>

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
                {tab.count > 0 && (
                  <span className="rounded-full bg-[var(--dashboard-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "reports" && (
            <SectionCard title="Reports" description="User-submitted content and conduct reports.">
              {reports.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--dashboard-text-soft)]">
                  No reports yet.
                </p>
              ) : (
                <div className="divide-y divide-[var(--dashboard-border-soft)]">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={report.status} />
                          <span className="text-xs text-[var(--dashboard-text-faint)]">
                            {report.category}
                          </span>
                          <span className="text-xs text-[var(--dashboard-text-faint)]">
                            {formatDate(report.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                          {report.reportedQuizTitle
                            ? `Quiz: "${report.reportedQuizTitle}"`
                            : report.reportedUserName
                              ? `User: ${report.reportedUserName}`
                              : "Unknown target"}
                        </p>
                        <p className="text-sm text-[var(--dashboard-text-soft)]">{report.reason}</p>
                        <p className="text-xs text-[var(--dashboard-text-faint)]">
                          By: {report.reporterName}
                        </p>
                      </div>
                      {report.status === "pending" && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => handleReviewReport(report.id, "reviewed")}
                            className="rounded-[8px] bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => handleReviewReport(report.id, "dismissed")}
                            className="rounded-[8px] border border-[var(--dashboard-border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--dashboard-text-soft)] hover:text-[var(--dashboard-text-main)]"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {activeTab === "users" && (
            <SectionCard title="Suspended Users" description="Currently suspended accounts.">
              {suspendedUsers.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--dashboard-text-soft)]">
                  No suspended users.
                </p>
              ) : (
                <div className="divide-y divide-[var(--dashboard-border-soft)]">
                  {suspendedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                          {user.username}
                        </p>
                        <p className="text-xs text-[var(--dashboard-text-soft)]">{user.email}</p>
                        {user.suspensionReason && (
                          <p className="text-xs text-[var(--dashboard-text-faint)]">
                            Reason: {user.suspensionReason}
                          </p>
                        )}
                        {user.suspendedUntil && (
                          <p className="text-xs text-[var(--dashboard-text-faint)]">
                            Until: {formatDate(user.suspendedUntil)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnsuspendUser(user.id)}
                        className="rounded-[8px] border border-[var(--dashboard-border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--dashboard-text-soft)] hover:text-[var(--dashboard-text-main)]"
                      >
                        Unsuspend
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {activeTab === "quizzes" && (
            <SectionCard title="Hidden Quizzes" description="Quizzes hidden from the public library.">
              {hiddenQuizzes.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--dashboard-text-soft)]">
                  No hidden quizzes.
                </p>
              ) : (
                <div className="divide-y divide-[var(--dashboard-border-soft)]">
                  {hiddenQuizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between py-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                          {quiz.title}
                        </p>
                        <p className="text-xs text-[var(--dashboard-text-soft)]">
                          By: {quiz.authorName} · {formatDate(quiz.createdAt)}
                        </p>
                        {quiz.moderationNote && (
                          <p className="text-xs text-[var(--dashboard-text-faint)]">
                            Note: {quiz.moderationNote}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnhideQuiz(quiz.id)}
                        className="rounded-[8px] border border-[var(--dashboard-border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--dashboard-text-soft)] hover:text-[var(--dashboard-text-main)]"
                      >
                        Unhide
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {activeTab === "all-quizzes" && (
            <SectionCard title="All Quizzes" description="View and manage all quizzes in the system.">
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
                    <div key={quiz.id} className="flex items-center justify-between py-4">
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                            {quiz.title}
                          </p>
                          {quiz.isHidden && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              HIDDEN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--dashboard-text-soft)]">
                          By: {quiz.creatorName} ({quiz.creatorEmail}) · {quiz.questionsCount}{" "}
                          questions · {formatDate(quiz.createdAt)}
                        </p>
                        <p className="text-xs text-[var(--dashboard-text-faint)]">
                          Status: {quiz.status} · {quiz.isPublic ? "Public" : "Private"}
                        </p>
                      </div>
                      <div className="ml-4 flex shrink-0 gap-2">
                        {quiz.isHidden ? (
                          <button
                            onClick={() => handleUnhideQuiz(quiz.id)}
                            className="rounded-[8px] border border-[var(--dashboard-border-soft)] px-3 py-1.5 text-xs font-medium text-[var(--dashboard-text-soft)] hover:text-[var(--dashboard-text-main)]"
                          >
                            Unhide
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHideQuiz(quiz.id)}
                            className="rounded-[8px] bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Hide
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {activeTab === "all-users" && (
            <SectionCard title="All Users" description="View and manage all users in the system.">
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
                    <div key={user.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                            {user.username}
                          </p>
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {user.role}
                          </span>
                          {user.isSuspended && (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              SUSPENDED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--dashboard-text-soft)]">{user.email}</p>
                        {user.isSuspended && user.suspensionReason && (
                          <p className="text-xs text-[var(--dashboard-text-faint)]">
                            Reason: {user.suspensionReason}
                          </p>
                        )}
                      </div>

                      {suspendModal.userId === user.id ? (
                        <div className="mt-4 w-full space-y-3 rounded-[8px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] p-3 sm:mt-0 sm:w-auto">
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
                              setSuspendModal({ ...suspendModal, suspendedUntil: e.target.value })
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
                                setSuspendModal({ userId: null, reason: "", suspendedUntil: "" })
                              }
                              className="flex-1 rounded-[6px] border border-[var(--dashboard-border-soft)] px-2 py-1 text-xs font-medium text-[var(--dashboard-text-soft)] hover:text-[var(--dashboard-text-main)]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSuspendModal({ userId: user.id, reason: "", suspendedUntil: "" })}
                          disabled={user.isSuspended}
                          className="rounded-[8px] bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:bg-slate-300"
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
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
