import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { DashboardPageHeader } from "./DashboardPageHeader";
import {
  DashboardButton,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardPageClassName,
} from "./DashboardPrimitives";

interface DashboardPlaceholderPageProps {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
}

export function DashboardPlaceholderPage({
  title,
  description,
  ctaLabel,
  ctaTo,
}: DashboardPlaceholderPageProps) {
  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader title={title} subtitle={description} />

      <DashboardSurface asChild radius="2xl" padding="lg">
        <section>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className={dashboardIconChipVariants({ tone: "brand", size: "xl" })}>
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-[var(--dashboard-text-strong)]">
                  Coming soon
                </h2>
                <p className="mt-2 text-base leading-7 text-[var(--dashboard-text-soft)]">
                  This page is part of the new dashboard foundation. The layout,
                  routing, and navigation are live now, and the detailed workflow
                  UI can be added next without changing the shell structure.
                </p>
              </div>
            </div>

            {ctaLabel && ctaTo ? (
              <DashboardButton asChild size="lg">
                <Link to={ctaTo}>
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </DashboardButton>
            ) : null}
          </div>
        </section>
      </DashboardSurface>
    </div>
  );
}
