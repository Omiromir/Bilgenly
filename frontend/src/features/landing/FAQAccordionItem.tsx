import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

export interface FAQAccordionItemProps {
  question: string;
  answer?: string;
  isOpen: boolean;
  onToggle: () => void;
  variant?: '1' | '2' | '3' | '4' | '5' | '6' | '7';
}

export function FAQAccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: FAQAccordionItemProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`transition-colors duration-150 ${isOpen ? 'bg-[#F8FAFF] dark:bg-[#1b2944]' : 'bg-white hover:bg-[#FAFBFF] dark:bg-[#18233b] dark:hover:bg-[#1b2944]'}`}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="font-['Montserrat',sans-serif] text-[15px] font-semibold leading-[1.5] text-[#111827] sm:text-[16px] dark:text-[#f5f8ff]">
          {question}
        </span>

        <motion.span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[#2563EB] dark:bg-[#2a3858] dark:text-[#7a72ff]"
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeInOut' }}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && answer && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    height: { duration: 0.28, ease: 'easeInOut' },
                    opacity: { duration: 0.2 },
                  }
            }
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-0">
              <p className="font-['Inter',sans-serif] text-[14px] leading-[1.75] text-[#6B7280] dark:text-[#9aa8c6]">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
