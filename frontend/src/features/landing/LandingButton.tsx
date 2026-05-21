import clsx from 'clsx';

export interface LandingButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function LandingButton({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled,
  ariaLabel,
  className
}: LandingButtonProps) {
  const baseClasses =
    "inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-['Montserrat',sans-serif] font-bold tracking-[-0.01em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/60 focus-visible:ring-offset-2";

  const variantClasses = {
    primary:
      'rounded-xl bg-[#2191F6] text-white shadow-[0_4px_14px_rgba(33,145,246,0.35)] hover:-translate-y-[2px] hover:bg-[#1a7de0] hover:shadow-[0_8px_24px_rgba(33,145,246,0.45)] active:translate-y-0 active:scale-[0.97] active:shadow-[0_2px_8px_rgba(33,145,246,0.25)]',
    secondary:
      'rounded-xl border border-[#D1D5DB] bg-white text-[#374151] shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-[2px] hover:border-[#2191F6]/40 hover:bg-[#F8FAFF] hover:text-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(33,145,246,0.12)] active:translate-y-0 active:scale-[0.97] dark:border-[#2a3858] dark:bg-[#18233b] dark:text-[#dde6f7] dark:hover:border-[#7a72ff]/50 dark:hover:bg-[#1b2944] dark:hover:text-[#7a72ff]',
    ghost:
      'rounded-lg bg-transparent text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] active:scale-[0.97] dark:text-[#9aa8c6] dark:hover:bg-[#1b2944] dark:hover:text-[#f5f8ff]',
  };

  const sizeClasses = {
    sm: 'h-10 px-4 text-[14px] leading-none sm:h-[45px] sm:px-[20px] sm:text-[18px]',
    md: 'h-10 px-4 text-[14px] leading-none sm:h-[45px] sm:px-[25px] sm:text-[20px]',
    lg: 'h-11 px-6 text-[16px] leading-none sm:h-[52px] sm:px-8 sm:text-[20px]'
  };

  return (
    <button
      type="button"
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
