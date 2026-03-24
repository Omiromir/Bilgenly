import type { LucideIcon } from "lucide-react";
import { cn } from "../../../components/ui/utils";
import {
  DashboardSurface,
  dashboardIconChipVariants,
} from "./DashboardPrimitives";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconClassName,
}: StatCardProps) {
  return (
    <DashboardSurface asChild radius="xl" padding="md">
      <article>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-[var(--dashboard-text-soft)]">{title}</p>
          <p className="text-[2.35rem] font-semibold tracking-tight text-[var(--dashboard-text-strong)]">
            {value}
          </p>
          {change ? (
            <p className="text-sm text-[var(--dashboard-brand)]">{change}</p>
          ) : null}
        </div>

        <div
          className={cn(
            dashboardIconChipVariants({ tone: "dark", size: "lg" }),
            iconClassName,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      </article>
    </DashboardSurface>
  );
}
