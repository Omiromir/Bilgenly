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
    "inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-['Montserrat',sans-serif] font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50";

  const variantClasses = {
    primary:
      'rounded-xl bg-[#2191F6] text-white shadow-[0_6px_16px_rgba(37,99,235,0.3)] hover:-translate-y-[1px] hover:brightness-105 active:translate-y-0 active:scale-[0.98]',
    secondary:
      'rounded-xl bg-[#E5E7EB] text-[#111827] hover:-translate-y-[1px] hover:bg-[#D1D5DB] active:translate-y-0 active:scale-[0.98]',
    ghost: 'bg-transparent text-[#4B5563] hover:-translate-y-[1px] hover:text-[#111827]'
  };

  const sizeClasses = {
    sm: 'h-10 px-4 text-[14px] leading-none sm:h-[45px] sm:px-[20px] sm:text-[18px]',
    md: 'h-10 px-4 text-[14px] leading-none sm:h-[45px] sm:px-[25px] sm:text-[20px]',
    lg: 'h-11 px-6 text-[16px] leading-none sm:h-[52px] sm:px-8 sm:text-[20px]'
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
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
