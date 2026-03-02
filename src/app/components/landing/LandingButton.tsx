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
  const baseClasses = 'font-bold transition-all duration-150 ease-in-out cursor-pointer inline-block text-center';

  const variantClasses = {
    primary: 'bg-[#2191F6] text-white rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] hover:brightness-110 active:scale-[0.98]',
    secondary: 'bg-[#D9D9D9] text-black rounded-[15px] hover:bg-[#C5C5C5] active:scale-[0.98]',
    ghost: 'bg-transparent text-[#4B5563] hover:text-[#111827]'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-[25px] py-[10px] text-[20px]',
    lg: 'px-8 py-3 text-xl'
  };

  const fontClasses = {
    primary: "font-['Montserrat',sans-serif]",
    secondary: "font-['Montserrat',sans-serif]",
    ghost: "font-['Montserrat',sans-serif]"
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fontClasses[variant],
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
