import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../../components/ui/utils";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

interface DashboardModalContentProps
  extends Omit<ComponentProps<typeof DialogContent>, "children"> {
  children: ReactNode;
}

export function DashboardModalContent({
  className,
  children,
  ...props
}: DashboardModalContentProps) {
  return (
    <DialogContent
      className={cn(
        "flex min-h-0 max-h-[82vh] flex-col overflow-hidden rounded-[24px] border-[var(--dashboard-border-soft)] p-0 shadow-[0_24px_80px_rgba(18,32,58,0.18)]",
        className,
      )}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

interface DashboardModalHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  descriptionClassName?: string;
}

export function DashboardModalHeader({
  title,
  description,
  className,
  descriptionClassName,
}: DashboardModalHeaderProps) {
  return (
    <div
      className={cn(
        "border-b border-[var(--dashboard-border-soft)] bg-white px-6 py-5",
        className,
      )}
    >
      <DialogHeader className="gap-3 text-left">
        <DialogTitle className="text-[1.85rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
          {title}
        </DialogTitle>
        {description ? (
          <DialogDescription
            className={cn(
              "text-[15px] leading-6 text-[var(--dashboard-text-soft)]",
              descriptionClassName,
            )}
          >
            {description}
          </DialogDescription>
        ) : null}
      </DialogHeader>
    </div>
  );
}

export function DashboardModalBody({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--dashboard-bg-elevated)] px-6 py-5 [scrollbar-gutter:stable]",
        className,
      )}
      {...props}
    />
  );
}

export function DashboardModalFooter({
  className,
  ...props
}: ComponentProps<typeof DialogFooter>) {
  return (
    <DialogFooter
      className={cn(
        "border-t border-[var(--dashboard-border-soft)] bg-white px-6 py-4 sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
