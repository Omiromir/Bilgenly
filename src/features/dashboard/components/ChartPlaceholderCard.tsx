import { cn } from "../../../components/ui/utils";
import { DashboardSurface } from "./DashboardPrimitives";

interface ChartPlaceholderCardProps {
  title: string;
  description: string;
  bars?: number[];
  className?: string;
}

export function ChartPlaceholderCard({
  title,
  description,
  bars = [48, 72, 64, 88, 56, 76],
  className,
}: ChartPlaceholderCardProps) {
  return (
    <DashboardSurface
      asChild
      radius="xl"
      padding="md"
      className={className}
    >
      <article>
      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-[var(--dashboard-text-strong)]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
          {description}
        </p>
      </div>

      <div className="mt-8 flex h-48 items-end gap-3 rounded-[24px] bg-[var(--dashboard-surface-muted)] px-4 py-5">
        {bars.map((height, index) => (
          <div key={`${title}-${index}`} className="flex flex-1 flex-col items-center gap-3">
            <div
              className="w-full rounded-t-2xl"
              style={{
                height: `${height}%`,
                background: "linear-gradient(180deg, var(--dashboard-brand-bright) 0%, var(--dashboard-brand-strong) 100%)",
              }}
            />
            <div className="h-2 w-8 rounded-full bg-[var(--dashboard-border)]" />
          </div>
        ))}
      </div>
      </article>
    </DashboardSurface>
  );
}
