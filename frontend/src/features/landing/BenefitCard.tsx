import { motion } from 'motion/react';

export interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <motion.article
      className="flex items-start gap-4 p-2"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="shrink-0">{icon}</div>
      <div>
        <h3 className="font-['Montserrat',sans-serif] text-[17px] font-bold leading-[1.6] tracking-[0.4px] text-[#2563EB] sm:text-[18px]">
          {title}
        </h3>
        <p className="font-['Montserrat',sans-serif] text-[13px] leading-[1.7] tracking-[0.2px] text-[#2563EB] sm:text-[14px]">
          {description}
        </p>
      </div>
    </motion.article>
  );
}
