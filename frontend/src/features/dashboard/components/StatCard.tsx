import type { LucideIcon } from "../../../components/icons/AppIcons";
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
  
  changeTone?: "positive" | "negative" | "neutral";
}


function resolveChangeTone(
  change: string,
  override?: "positive" | "negative" | "neutral",
): "positive" | "negative" | "neutral" {
  if (override) return override;
  if (!change) return "neutral";
  if (change.startsWith("+")) return "positive";
  if (change.startsWith("-")) return "negative";
  return "neutral";
}

const changeToneClass: Record<"positive" | "negative" | "neutral", string> = {
  positive: "text-[var(--dashboard-success)]",
  negative: "text-[var(--dashboard-danger)]",
  neutral:  "text-[var(--dashboard-brand)]",
};

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconClassName,
  changeTone,
}: StatCardProps) {
  const tone = resolveChangeTone(change, changeTone);

  return (
    <DashboardSurface asChild radius="xl" padding="md">
      <article>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <p className="truncate text-sm font-medium text-[var(--dashboard-text-soft)]">
              {title}
            </p>
            <p
              className="text-[2.2rem] font-semibold leading-none tracking-tight text-[var(--dashboard-text-strong)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {value}
            </p>
            {change ? (
              <p className={cn("text-sm font-medium", changeToneClass[tone])}>
                {change}
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              dashboardIconChipVariants({ tone: "brand", size: "lg" }),
              iconClassName,
            )}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </article>
    </DashboardSurface>
  );
}
