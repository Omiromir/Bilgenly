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
      className="relative bg-[rgba(217,217,217,0.4)] rounded-[50px] h-[55px] w-[360px]"
    >
      <motion.div
        className="absolute top-0 left-0 h-full bg-[#2563EB] rounded-[50px]"
        animate={{
          x: selected === 0 ? 0 : 170,
          width: 190
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
            "absolute top-0 h-full w-[190px] font-['Montserrat',sans-serif] font-semibold text-[19.2px] transition-colors z-10 leading-[30.72px]",
            index === 0 ? 'left-0' : 'right-0',
            selected === index ? 'text-white' : 'text-[#878484]'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
