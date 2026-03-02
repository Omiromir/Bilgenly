export interface MVVCardProps {
  type: 'mission' | 'vision' | 'values';
  icon: React.ReactNode;
  title: string;
  description: string;
  position: { left: number; top: number };
}

export function MVVCard({ icon, title, description, position }: MVVCardProps) {
  return (
    <div className="relative">
      {/* Icon */}
      <div className="absolute" style={{ left: position.left, top: position.top }}>
        {icon}
      </div>

      {/* Title with decorative elements */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[431px] flex flex-col items-center">
        <p className="font-['Segoe_UI',sans-serif] font-bold text-[40px] text-center tracking-[2.4px] leading-[64px]">
          <span className="text-black">Our </span>
          <span className="text-[#2563EB]">{title}</span>
        </p>
      </div>

      {/* Description */}
      <p className="absolute top-[534px] font-['Inter',sans-serif] text-[12px] text-[#4B5563] leading-normal w-[247px]">
        {description}
      </p>

      {/* Decorative Lines and Diamond */}
      <div className="absolute top-[495px]">
        <svg className="block w-[113px] h-[2px]" fill="none" preserveAspectRatio="none" viewBox="0 0 113 2">
          <path fill="#2563EB" d="M0 1h113" />
        </svg>
      </div>

      <div className="absolute top-[482px] left-[44.5px] h-6 w-6">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <path d="M12 0L24 12L12 24L0 12L12 0Z" fill="#111827" />
        </svg>
      </div>
    </div>
  );
}
