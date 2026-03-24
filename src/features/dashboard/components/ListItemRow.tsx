import type { ReactNode } from "react";
import { cn } from "../../../components/ui/utils";
import { DashboardSurface } from "./DashboardPrimitives";

interface ListItemRowProps {
  title: string;
  description?: string;
  meta?: string;
  trailing?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ListItemRow({
  title,
  description,
  meta,
  trailing,
  footer,
  className,
}: ListItemRowProps) {
  return (
    <DashboardSurface
      asChild
      radius="lg"
      padding="sm"
      className={cn(
        "transition hover:border-[var(--dashboard-border)] hover:bg-[var(--dashboard-surface-muted)]",
        className,
      )}
    >
      <article>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight text-[var(--dashboard-text-strong)]">
            {title}
          </h3>
          {description ? (
            <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">{description}</p>
          ) : null}
        </div>

        {trailing ? (
          <div className="shrink-0 text-sm font-medium text-[var(--dashboard-text-soft)]">
            {trailing}
          </div>
        ) : meta ? (
          <div className="shrink-0 text-sm font-medium text-[var(--dashboard-text-soft)]">{meta}</div>
        ) : null}
      </div>

      {footer ? <div className="mt-5">{footer}</div> : null}
      </article>
    </DashboardSurface>
  );
}
