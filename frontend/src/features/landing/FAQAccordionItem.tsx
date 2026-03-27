import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

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
  variant = '1'
}: FAQAccordionItemProps) {
  const questions = {
    '1': 'How accurate is the AI quiz generation?',
    '2': 'Can students really create quizzes too?',
    '3': 'Are there limits on quiz creation?',
    '4': 'What languages do you support?',
    '5': 'How do you protect student data and privacy?',
    '6': 'What devices and platforms are supported?',
    '7': 'What kind of support do you offer?'
  };

  const displayQuestion = question || questions[variant];

  return (
    <div className={clsx('relative w-full', isOpen && 'bg-[#F9FAFB]')}>
      <div className="relative border-b border-[#F3F4F6]">
        <button
          className="flex w-full items-center justify-between px-6 py-[23px] text-left transition-all duration-200 ease-in-out hover:bg-[#F9FAFB]"
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          <span className="font-['Segoe_UI',sans-serif] text-[16px] font-bold leading-[25.6px] text-[#111827]">
            {displayQuestion}
          </span>

          <motion.span
            className="font-['Segoe_UI',sans-serif] text-[24px] font-bold leading-[38.4px] text-[#2563EB]"
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            +
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && answer && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.3, ease: 'easeInOut' },
                opacity: { duration: 0.2, ease: 'easeInOut' }
              }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-5 text-[14px] leading-normal text-[#4B5563]">
                {answer}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}