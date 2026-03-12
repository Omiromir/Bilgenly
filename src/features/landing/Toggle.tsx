import { motion } from 'motion/react';
import clsx from 'clsx';

export interface ToggleProps {
  options: [string, string];
  selected: 0 | 1;
  onChange: (index: 0 | 1) => void;
  ariaLabel?: string;
}

export function Toggle({ options, selected, onChange, ariaLabel }: ToggleProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel || 'Toggle options'}
      className="relative mx-auto h-[48px] w-full max-w-[360px] rounded-[50px] bg-[rgba(217,217,217,0.4)] sm:h-[55px]"
    >
      <motion.div
        className="absolute top-0 h-full w-[52.78%] rounded-[50px] bg-[#2563EB]"
        animate={{
          left: selected === 0 ? '0%' : '47.22%'
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
      {options.map((option, index) => (
        <button
          key={index}
          role="tab"
          aria-selected={selected === index}
          onClick={() => onChange(index as 0 | 1)}
          className={clsx(
            "absolute top-0 z-10 h-full w-[52.78%] font-['Montserrat',sans-serif] text-[14px] font-semibold leading-[1.2] transition-all duration-200 ease-out sm:text-[19.2px] sm:leading-[30.72px]",
            index === 0 ? 'left-0' : 'left-[47.22%]',
            selected === index ? 'text-white' : 'text-[#878484] hover:text-[#5F6368]'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
