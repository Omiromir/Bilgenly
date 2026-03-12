import { motion } from 'motion/react';

export interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  image: string;
}

export function StepCard({ stepNumber, title, description, image }: StepCardProps) {
  return (
    <motion.article
      className="relative min-h-[340px] rounded-[15px] bg-white px-5 pb-5 pt-10 shadow-[0px_4px_4px_rgba(0,0,0,0.25)] sm:min-h-[372px]"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute left-1/2 top-0 grid h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-[#2563EB] bg-white">
        <span className="font-['Montserrat',sans-serif] text-[24px] font-bold tracking-[1.2px] text-[#2563EB]">
          {stepNumber}
        </span>
      </div>
      <div className="mx-auto h-[133px] w-full max-w-[227px] overflow-hidden">
        <img alt="" className="h-full w-full object-contain" src={image} />
      </div>
      <h3 className="mt-10 text-center font-['Montserrat',sans-serif] text-[15px] font-bold text-[#2563EB] sm:mt-14 sm:text-[16px]">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-[176px] text-center font-['Montserrat',sans-serif] text-[12px] leading-normal text-[#111827]">
        {description}
      </p>
    </motion.article>
  );
}
