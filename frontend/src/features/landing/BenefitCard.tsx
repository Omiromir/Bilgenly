import { motion, useReducedMotion } from 'motion/react';

export interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function BenefitCard({ icon, title, description }: BenefitCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      className="group flex items-start gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(37,99,235,0.10)] dark:border-[#2a3858] dark:bg-[#18233b] dark:shadow-[0_1px_4px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_6px_20px_rgba(122,114,255,0.12)]"
      whileHover={shouldReduceMotion ? undefined : { y: -3 }}
      transition={{ duration: 0.18 }}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <h3 className="font-['Montserrat',sans-serif] text-[16px] font-bold leading-[1.4] tracking-[0.2px] text-[#111827] sm:text-[17px] dark:text-[#f5f8ff]">
          {title}
        </h3>
        <p className="mt-1.5 font-['Inter',sans-serif] text-[13px] leading-[1.65] text-[#6B7280] sm:text-[14px] dark:text-[#9aa8c6]">
          {description}
        </p>
      </div>
    </motion.article>
  );
}
