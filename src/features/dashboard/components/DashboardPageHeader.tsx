import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "../../../components/ui/utils";
import {
  DashboardBadge,
  DashboardButton,
  dashboardPageSubtitleClassName,
  dashboardPageTitleClassName,
} from "./DashboardPrimitives";

interface DashboardPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  badge?: string;
  ctaLabel?: string;
  ctaTo?: string;
  className?: string;
  align?: "start" | "center";
  actions?: ReactNode;
}

export function DashboardPageHeader({
  eyebrow,
  title,
  subtitle,
  badge,
  ctaLabel,
  ctaTo,
  className,
  align = "start",
  actions,
}: DashboardPageHeaderProps) {
  const resolvedActions =
    actions ??
    (ctaLabel && ctaTo ? (
      <DashboardButton asChild variant="secondary" size="lg">
        <Link to={ctaTo}>{ctaLabel}</Link>
      </DashboardButton>
    ) : null);

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center"
          ? "items-center text-center"
          : "lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className={cn("space-y-3", align === "center" && "items-center")}>
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-brand)]">
            {eyebrow}
          </p>
        ) : null}

        <div
          className={cn(
            "flex flex-wrap items-center gap-3",
            align === "center" ? "justify-center" : "justify-start",
          )}
        >
          <h1 className={cn(dashboardPageTitleClassName, "md:text-5xl")}>
            {title}
          </h1>
          {badge ? (
            <DashboardBadge size="md">
              {badge}
            </DashboardBadge>
          ) : null}
        </div>

        <p
          className={cn(
            dashboardPageSubtitleClassName,
            "text-lg leading-8",
            align === "center" ? "mx-auto text-center" : "text-left",
          )}
        >
          {subtitle}
        </p>
      </div>

      {resolvedActions ? (
        <div
          className={cn(
            "shrink-0",
            align === "center" ? "flex justify-center pt-2" : "flex justify-start lg:justify-end",
          )}
        >
          {resolvedActions}
        </div>
      ) : null}
    </div>
  );
}
