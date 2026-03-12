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
        <h3 className="font-['Montserrat',sans-serif] text-[14px] font-bold leading-[2.5] tracking-[0.7px] text-[#2563EB]">
          {title}
        </h3>
        <p className="font-['Montserrat',sans-serif] text-[10px] leading-[1.54] tracking-[0.5px] text-[#2563EB]">
          {description}
        </p>
      </div>
    </motion.article>
  );
}
