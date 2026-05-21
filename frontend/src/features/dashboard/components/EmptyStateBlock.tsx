import type { LucideIcon } from "../../../components/icons/AppIcons";
import { Sparkles } from "../../../components/icons/AppIcons";
import type { ReactNode } from "react";
import { cn } from "../../../components/ui/utils";
import {
  DashboardSurface,
  dashboardIconChipVariants,
} from "./DashboardPrimitives";

interface EmptyStateBlockProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  /** "centered" stacks icon + text centred; "inline" keeps horizontal layout (default) */
  layout?: "inline" | "centered";
}

export function EmptyStateBlock({
  title,
  description,
  icon: Icon = Sparkles,
  action,
  className,
  layout = "inline",
}: EmptyStateBlockProps) {
  if (layout === "centered") {
    return (
      <DashboardSurface
        variant="muted"
        radius="xl"
        padding="lg"
        className={cn(
          "border border-[var(--dashboard-border-soft)]",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className={dashboardIconChipVariants({ tone: "brand", size: "xl" })} aria-hidden="true">
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[1.1rem] font-semibold tracking-tight text-[var(--dashboard-text-strong)]">
              {title}
            </h3>
            <p className="mx-auto max-w-sm text-sm leading-[1.7] text-[var(--dashboard-text-soft)]">
              {description}
            </p>
          </div>
          {action ? <div className="pt-1">{action}</div> : null}
        </div>
      </DashboardSurface>
    );
  }

  return (
    <DashboardSurface
      variant="muted"
      radius="xl"
      padding="md"
      className={cn(
        "border border-[var(--dashboard-border-soft)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={cn(dashboardIconChipVariants({ tone: "brand", size: "lg" }), "shrink-0")}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-[1.05rem] font-semibold tracking-tight text-[var(--dashboard-text-strong)]">
            {title}
          </h3>
          <p className="max-w-2xl text-sm leading-[1.7] text-[var(--dashboard-text-soft)]">
            {description}
          </p>
          {action ? <div className="pt-3">{action}</div> : null}
        </div>
      </div>
    </DashboardSurface>
  );
}
