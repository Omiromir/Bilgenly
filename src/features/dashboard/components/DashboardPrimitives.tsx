import { Slot } from "@radix-ui/react-slot";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../components/ui/utils";

export const dashboardPageClassName = "space-y-8";
export const dashboardPageNarrowClassName = "mx-auto max-w-[980px] space-y-8";
export const dashboardPageCenteredClassName =
  "mx-auto max-w-[920px] space-y-8 pt-2";
export const dashboardPageIntroClassName = "space-y-2";
export const dashboardPageTitleClassName =
  "text-[2.75rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)] md:text-[3rem]";
export const dashboardPageSubtitleClassName =
  "max-w-3xl text-[1.02rem] leading-7 text-[var(--dashboard-text-soft)]";
export const dashboardSectionStackClassName = "space-y-4";
export const dashboardStatsGridClassName =
  "grid gap-5 md:grid-cols-2 xl:grid-cols-4";
export const dashboardSplitGridClassName = "grid gap-6 xl:grid-cols-[1fr_1fr]";
export const dashboardSectionDividerClassName =
  "border-[var(--dashboard-border-soft)]";
export const dashboardMetaTextClassName =
  "text-sm text-[var(--dashboard-text-soft)]";
export const dashboardIconTextRowClassName =
  "inline-flex items-center gap-2 text-sm text-[var(--dashboard-text-soft)]";
export const dashboardInsetBlockClassName =
  "rounded-[18px] border border-[var(--dashboard-border-soft)] bg-white px-5 py-4";
export const dashboardInvertedInsetBlockClassName =
  "rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-4";
export const dashboardTextToneClassName = {
  brand: "text-[var(--dashboard-brand)]",
  accent: "text-[var(--dashboard-brand-strong)]",
  success: "text-[var(--dashboard-success)]",
  warning: "text-[var(--dashboard-warning)]",
  danger: "text-[var(--dashboard-danger)]",
} as const;
export const dashboardFillToneClassName = {
  brand: "bg-[var(--dashboard-brand)]",
  accent: "bg-[var(--dashboard-brand-strong)]",
  success: "bg-[var(--dashboard-success)]",
  warning: "bg-[var(--dashboard-warning)]",
  danger: "bg-[var(--dashboard-danger)]",
} as const;

export const dashboardSurfaceVariants = cva("border", {
  variants: {
    variant: {
      card: "dashboard-card",
      muted: "dashboard-card-muted",
      accent:
        "bg-[var(--dashboard-brand-soft-alt)] border-[var(--dashboard-border-soft)]",
      hero: "dashboard-hero border-transparent text-white shadow-[var(--dashboard-shadow-brand)]",
    },
    radius: {
      md: "rounded-[18px]",
      lg: "rounded-[24px]",
      xl: "rounded-[28px]",
      "2xl": "rounded-[32px]",
    },
    padding: {
      none: "",
      sm: "p-5",
      md: "p-6",
      lg: "p-8",
      xl: "p-10",
    },
  },
  defaultVariants: {
    variant: "card",
    radius: "lg",
    padding: "md",
  },
});

interface DashboardSurfaceProps
  extends ComponentProps<"div">,
    VariantProps<typeof dashboardSurfaceVariants> {
  asChild?: boolean;
}

export function DashboardSurface({
  asChild = false,
  className,
  variant,
  radius,
  padding,
  ...props
}: DashboardSurfaceProps) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(
        dashboardSurfaceVariants({ variant, radius, padding }),
        className,
      )}
      {...props}
    />
  );
}

export const dashboardButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition outline-none disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "dashboard-button-primary text-white",
        secondary: "dashboard-button-secondary",
        soft: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)] hover:bg-[#e7f1ff]",
        ghost:
          "text-[var(--dashboard-text-soft)] hover:bg-[var(--dashboard-surface-muted)] hover:text-[var(--dashboard-text)]",
        inverse:
          "bg-white text-[var(--dashboard-brand)] shadow-sm hover:bg-[var(--dashboard-surface-muted)]",
        hero:
          "border border-white/20 bg-white/10 text-white hover:bg-white/15",
        danger:
          "bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger)] hover:bg-[#ffe7ee]",
      },
      size: {
        xs: "h-9 rounded-[12px] px-3.5 text-sm",
        sm: "h-10 rounded-[14px] px-4 text-sm",
        md: "h-11 rounded-2xl px-5 text-sm",
        lg: "h-12 rounded-[18px] px-5 text-[15px]",
        xl: "h-14 rounded-[20px] px-6 text-base",
        icon: "h-12 w-12 rounded-2xl",
        iconSm: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface DashboardButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof dashboardButtonVariants> {
  asChild?: boolean;
}

export function DashboardButton({
  asChild = false,
  className,
  variant,
  size,
  ...props
}: DashboardButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(dashboardButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export const dashboardBadgeVariants = cva(
  "inline-flex items-center rounded-full font-semibold",
  {
    variants: {
      tone: {
        brand: "dashboard-badge",
        info: "dashboard-badge-soft",
        success:
          "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success)]",
        warning:
          "bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning)]",
        danger:
          "bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger)]",
        neutral:
          "bg-[var(--dashboard-surface-muted)] text-[var(--dashboard-text-soft)]",
        white: "bg-white/12 text-white ring-1 ring-white/15",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      tone: "brand",
      size: "sm",
    },
  },
);

interface DashboardBadgeProps
  extends ComponentProps<"span">,
    VariantProps<typeof dashboardBadgeVariants> {}

export function DashboardBadge({
  className,
  tone,
  size,
  ...props
}: DashboardBadgeProps) {
  return (
    <span
      className={cn(dashboardBadgeVariants({ tone, size }), className)}
      {...props}
    />
  );
}

export const dashboardIconChipVariants = cva(
  "flex shrink-0 items-center justify-center",
  {
    variants: {
      tone: {
        brand: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
        accent:
          "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
        success:
          "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success)]",
        warning:
          "bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning)]",
        danger:
          "bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger)]",
        dark: "bg-[var(--dashboard-text-strong)] text-white",
        white: "bg-white/12 text-white",
      },
      size: {
        sm: "h-8 w-8 rounded-xl",
        md: "h-10 w-10 rounded-xl",
        lg: "h-12 w-12 rounded-2xl",
        xl: "h-14 w-14 rounded-[20px]",
      },
    },
    defaultVariants: {
      tone: "brand",
      size: "md",
    },
  },
);

export const dashboardInputVariants = cva(
  "dashboard-input w-full border outline-none transition focus:border-[var(--dashboard-brand)] focus:bg-white disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      size: {
        sm: "h-10 rounded-[12px] px-4 text-sm",
        md: "h-12 rounded-[14px] px-4 text-[15px]",
        lg: "h-14 rounded-2xl px-4 text-base",
        otp: "h-[52px] w-[52px] rounded-[14px] px-0 text-center text-lg font-medium text-[var(--dashboard-text-strong)]",
      },
      withIcon: {
        true: "pl-12",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      withIcon: false,
    },
  },
);

export const dashboardSelectVariants = cva(
  "dashboard-input border outline-none transition focus:border-[var(--dashboard-brand)] focus:bg-white",
  {
    variants: {
      size: {
        sm: "h-10 rounded-[12px] px-4 text-sm",
        md: "h-12 rounded-[14px] px-4 text-[15px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export const dashboardTextareaVariants = cva(
  "dashboard-input w-full resize-none border outline-none transition focus:border-[var(--dashboard-brand)] focus:bg-white",
  {
    variants: {
      size: {
        md: "min-h-[160px] rounded-[18px] px-4 py-4 text-[15px] leading-7",
        lg: "min-h-[180px] rounded-[18px] px-4 py-4 text-base leading-7",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export const dashboardTabVariants = cva(
  "flex w-full items-center gap-3 text-left font-semibold transition",
  {
    variants: {
      active: {
        true: "dashboard-nav-active text-white",
        false:
          "text-[var(--dashboard-text-strong)] hover:bg-[var(--dashboard-surface-muted)]",
      },
      size: {
        sm: "rounded-xl px-4 py-3 text-sm",
        md: "rounded-2xl px-4 py-3 text-[15px]",
      },
    },
    defaultVariants: {
      active: false,
      size: "md",
    },
  },
);

interface DashboardSearchFieldProps extends ComponentProps<"input"> {
  containerClassName?: string;
  inputClassName?: string;
  size?: VariantProps<typeof dashboardInputVariants>["size"];
}

export function DashboardSearchField({
  containerClassName,
  inputClassName,
  size = "md",
  ...props
}: DashboardSearchFieldProps) {
  const iconClassName =
    size === "lg"
      ? "left-4 h-5 w-5"
      : "left-4 h-4.5 w-4.5";

  return (
    <div className={cn("relative", containerClassName)}>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--dashboard-text-faint)]",
          iconClassName,
        )}
      />
      <input
        type="search"
        className={cn(
          dashboardInputVariants({ size, withIcon: true }),
          inputClassName,
        )}
        {...props}
      />
    </div>
  );
}
