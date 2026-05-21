import { motion, useReducedMotion } from 'motion/react';

export interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  image: string;
}

const stepAlts: Record<number, string> = {
  1: "Upload your lecture notes, PDFs, or presentations",
  2: "AI analyzes your content and generates quiz questions",
  3: "Customize question difficulty and share with your class",
  4: "View real-time analytics and student progress dashboards",
};

export function StepCard({ stepNumber, title, description, image }: StepCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E8F0FE] bg-white shadow-[0_2px_12px_rgba(37,99,235,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_28px_rgba(37,99,235,0.14)] dark:border-[#2a3858] dark:bg-[#18233b] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_28px_rgba(122,114,255,0.14)]"
      whileHover={shouldReduceMotion ? undefined : { y: -5 }}
      transition={{ duration: 0.2 }}
    >
      {/* Step number pill */}
      <div className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]">
        <span className="font-['Montserrat',sans-serif] text-[13px] font-bold text-white">
          {stepNumber}
        </span>
      </div>

      {/* Image area */}
      <div className="flex h-[160px] w-full items-center justify-center bg-[#F0F5FF] px-6 pt-10 pb-4 dark:bg-[#1b2944]">
        <img
          alt={stepAlts[stepNumber] ?? title}
          className="max-h-[120px] w-auto object-contain"
          src={image}
          width={160}
          height={120}
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-['Montserrat',sans-serif] text-[15px] font-bold leading-[1.35] text-[#111827] sm:text-[16px] dark:text-[#f5f8ff]">
          {title}
        </h3>
        <p className="mt-2 font-['Inter',sans-serif] text-[13px] leading-[1.65] text-[#6B7280] dark:text-[#9aa8c6]">
          {description}
        </p>
      </div>

      {/* Bottom accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#2563EB] to-[#6366F1] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </motion.article>
  );
}
