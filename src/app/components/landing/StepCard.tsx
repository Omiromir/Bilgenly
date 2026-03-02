import { motion } from 'motion/react';

export interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  image: string;
  position: { left: number };
}

export function StepCard({ stepNumber, title, description, image, position }: StepCardProps) {
  return (
    <motion.div
      className="absolute"
      style={{ left: position.left, top: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-[372px] w-[228px]">
        {/* Card Background */}
        <div className="absolute top-[36px] left-0 bg-white h-[372px] w-[228px] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transform scale-y-[-1]" />

        {/* Badge Background (White Circle) */}
        <div className="absolute top-0 left-[78px] w-[72px] h-[72px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 72 72">
            <circle cx="36" cy="36" fill="white" r="36" />
          </svg>
        </div>

        {/* Badge Border (Blue Circle) */}
        <div className="absolute top-[10px] left-[88px] w-[52px] h-[52px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24.5" stroke="#2563EB" strokeWidth="3" fill="none" />
          </svg>
        </div>

        {/* Step Number */}
        <p className="absolute top-[20px] left-[99px] font-['Montserrat',sans-serif] font-bold text-[24px] text-[#2563EB] tracking-[1.2px] leading-[30.72px]">
          {stepNumber}
        </p>

        {/* Image */}
        <div className="absolute top-[72px] left-0 h-[133px] w-[227px] overflow-hidden flex items-center justify-center">
          <img alt="" className="max-w-none h-[113.56%] w-[99.83%]" src={image} />
        </div>

        {/* Title */}
        <p className="absolute top-[258px] left-[28px] font-['Montserrat',sans-serif] font-bold text-[16px] text-[#2563EB] leading-normal">
          {title}
        </p>

        {/* Description */}
        <p className="absolute top-[299px] left-1/2 -translate-x-1/2 font-['Montserrat',sans-serif] text-[12px] text-black text-center leading-normal w-[176px]">
          {description}
        </p>
      </div>
    </motion.div>
  );
}