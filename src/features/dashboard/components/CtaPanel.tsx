import type { ReactNode } from "react";
import { cn } from "../../../components/ui/utils";
import { DashboardSurface } from "./DashboardPrimitives";

interface CtaPanelProps {
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
  variant?: "gradient" | "surface";
}

export function CtaPanel({
  title,
  description,
  actions,
  aside,
  className,
  variant = "surface",
}: CtaPanelProps) {
  return (
    <DashboardSurface
      asChild
      variant={variant === "gradient" ? "hero" : "card"}
      radius="2xl"
      padding="lg"
      className={cn("overflow-hidden", className)}
    >
      <section>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-semibold tracking-tight">{title}</h2>
          <p
            className={cn(
              "mt-4 text-lg leading-8",
              variant === "gradient"
                ? "text-white/86"
                : "text-[var(--dashboard-text-soft)]"
            )}
          >
            {description}
          </p>
          {actions ? <div className="mt-8 flex flex-wrap gap-4">{actions}</div> : null}
        </div>

        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      </section>
    </DashboardSurface>
  );
}
