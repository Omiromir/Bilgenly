import { motion } from 'motion/react';

export interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  position: { left: number; top: number };
}

export function BenefitCard({ icon, title, description, position }: BenefitCardProps) {
  return (
    <motion.div
      className="absolute cursor-default"
      style={{ left: position.left, top: position.top }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Icon */}
      <div className="absolute left-0 top-[12.45px]">{icon}</div>

      {/* Title */}
      <p className="absolute left-[78.45px] top-0 font-['Montserrat',sans-serif] font-bold text-[14px] text-[#2563EB] tracking-[0.7px] leading-[2.5] w-[217.909px]">
        {title}
      </p>

      {/* Description */}
      <p className="absolute left-[78.45px] top-[33.62px] font-['Montserrat',sans-serif] text-[10px] text-[#2563EB] tracking-[0.5px] leading-[1.54] w-[217.909px]">
        {description}
      </p>
    </motion.div>
  );
}