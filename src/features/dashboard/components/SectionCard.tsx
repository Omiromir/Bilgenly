import type { ReactNode } from "react";
import { cn } from "../../../components/ui/utils";
import {
  DashboardSurface,
  dashboardSectionDividerClassName,
} from "./DashboardPrimitives";

interface SectionCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <DashboardSurface
      asChild
      radius="xl"
      padding="none"
      className={className}
    >
      <section>
        <div
          className={cn(
            "flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between",
            dashboardSectionDividerClassName,
            "border-b",
          )}
        >
          <div>
            <h2 className="text-[1.6rem] font-semibold tracking-tight text-[var(--dashboard-text-strong)]">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        <div className={cn("p-6", contentClassName)}>{children}</div>
      </section>
    </DashboardSurface>
  );
}
