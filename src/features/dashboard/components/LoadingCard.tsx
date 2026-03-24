import { DashboardSurface } from "./DashboardPrimitives";

export function LoadingCard() {
  return (
    <DashboardSurface radius="lg" padding="sm">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-40 rounded-full bg-[var(--dashboard-border)]" />
        <div className="h-4 w-full rounded-full bg-[var(--dashboard-surface-muted)]" />
        <div className="h-4 w-4/5 rounded-full bg-[var(--dashboard-surface-muted)]" />
        <div className="h-10 w-32 rounded-2xl bg-[var(--dashboard-brand-soft)]" />
      </div>
    </DashboardSurface>
  );
}
