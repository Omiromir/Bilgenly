import { ChevronRight, Upload } from "lucide-react";
import { cn } from "../../../components/ui/utils";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardButton,
  DashboardSurface,
  dashboardPageCenteredClassName,
  dashboardTextareaVariants,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import { teacherQuizSteps } from "../../../features/dashboard/mock/teacherWorkspace";

export function TeacherGenerateQuizPage() {
  const meta = useDashboardPageMeta();

  return (
    <div className={dashboardPageCenteredClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Generate Quiz with AI"}
        subtitle="Upload your lecture materials and let AI create comprehensive quiz questions"
        align="center"
      />

      <div className="flex items-center justify-center gap-5">
        {teacherQuizSteps.map((item, index) => (
          <div key={item.step} className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${item.active ? "bg-[var(--dashboard-brand)] text-white" : "bg-[var(--dashboard-surface-muted)] text-[var(--dashboard-text-soft)]"}`}
              >
                {item.step}
              </div>
              <span
                className={`text-[1.02rem] ${
                  item.active ? "font-medium text-[var(--dashboard-brand)]" : "text-[var(--dashboard-text-soft)]"
                }`}
              >
                {item.label}
              </span>
            </div>
            {index < teacherQuizSteps.length - 1 ? (
              <ChevronRight className="h-5 w-5 text-slate-400" />
            ) : null}
          </div>
        ))}
      </div>

      <DashboardSurface asChild radius="xl" padding="lg">
        <section>
          <div className="rounded-[22px] border border-dashed border-[var(--dashboard-border)] px-6 py-18 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center text-slate-500">
              <Upload className="h-14 w-14" strokeWidth={1.7} />
            </div>
            <h2 className="mt-5 text-[2rem] font-medium text-[var(--dashboard-text-strong)]">
              Upload Lecture Materials
            </h2>
            <p className="mt-2 text-[1.02rem] text-slate-500">
              Drag and drop or click to browse
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Supports PDF, TXT, DOCX (Max 50MB)
            </p>
          </div>
        </section>
      </DashboardSurface>

      <DashboardSurface asChild radius="xl" padding="lg">
        <section>
          <h2 className="text-[2rem] font-medium text-[var(--dashboard-text-strong)]">
            Or paste text content
          </h2>
          <textarea
            placeholder="Paste your lecture notes, article, or any educational content here..."
            className={cn(dashboardTextareaVariants({ size: "lg" }), "mt-5")}
          />

          <div className="mt-5 flex justify-end">
            <DashboardButton type="button" size="lg">
              Continue with Text
            </DashboardButton>
          </div>
        </section>
      </DashboardSurface>
    </div>
  );
}
