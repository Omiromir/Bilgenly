import svgPaths from '../../../imports/svg-lz8yvnizs1';
import { motion } from 'motion/react';
import { useScrollAnimation } from './useScrollAnimation';

export function MVVSection() {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section ref={ref} className="relative bg-[rgba(37,99,235,0.05)] h-[718px] w-full">
      {/* Section Title */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-[69px]"
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative">
          <div className="bg-[#2191F6] h-[64px] w-[406px] rounded-[15px] absolute left-1/2 -translate-x-1/2 top-[3px]" />
          <div className="relative flex flex-col items-center justify-center pt-[30px]">
            <p className="font-['Montserrat',sans-serif] font-bold text-[36px] text-center tracking-[2.16px] leading-[64px]">
              <span className="text-[#111827]">The Philosophy That Drive </span>
              <span className="text-white tracking-[2.16px]">Everything We Do</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* MVV Cards Container */}
      <div className="absolute left-[240px] top-[237px] w-[960px]">
        {/* Mission Card */}
        <div className="absolute left-0 top-0">
          <div className="relative h-[372px] w-[247px]">
            {/* Icon */}
            <div className="absolute left-[66px] top-[23px] h-[119.853px] w-[122.88px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 122.88 119.853">
                <g clipPath="url(#clip0_2_522)">
                  <g>
                    <path d={svgPaths.p1ec93300} fill="#111827" />
                    <path d={svgPaths.p39825680} fill="#2191F6" stroke="#2191F6" />
                  </g>
                  <circle cx="61" cy="60" fill="#2191F6" r="4" />
                </g>
                <defs>
                  <clipPath id="clip0_2_522">
                    <rect fill="white" height="119.853" width="122.88" />
                  </clipPath>
                </defs>
              </svg>
            </div>

            {/* Title */}
            <p className="absolute left-1/2 -translate-x-1/2 top-[194px] font-['Segoe_UI',sans-serif] font-bold text-[40px] text-center tracking-[2.4px] leading-[64px] whitespace-nowrap">
              <span className="text-black">Our </span>
              <span className="text-[#2563EB]">mission</span>
            </p>

            {/* Lines */}
            <div className="absolute top-[258px] left-0 h-0 w-[113px]">
              <svg className="block w-full h-[2px]" fill="none" preserveAspectRatio="none" viewBox="0 0 113 2">
                <path d={svgPaths.p29b10000} fill="#2563EB" />
              </svg>
            </div>
            <div className="absolute top-[258px] left-[136px] h-0 w-[113px]">
              <svg className="block w-full h-[2px]" fill="none" preserveAspectRatio="none" viewBox="0 0 113 2">
                <path d={svgPaths.pcd2b5f0} fill="#2563EB" />
              </svg>
            </div>

            {/* Diamond */}
            <div className="absolute top-[245px] left-[113px] h-6 w-6">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <path d="M12 0L24 12L12 24L0 12L12 0Z" fill="#111827" />
              </svg>
            </div>

            {/* Description */}
            <p className="absolute top-[297px] left-[1px] font-['Inter',sans-serif] text-[12px] text-[#4B5563] leading-normal w-[247px]">
              Of course, strengthening and developing the internal structure requires us to analyze experiments that
              are striking in their scale and grandiosity.
            </p>
          </div>
        </div>

        {/* Vision Card */}
        <div className="absolute left-[361px] top-0">
          <div className="relative h-[372px] w-[247px]">
            {/* Icon */}
            <div className="absolute left-[57px] top-[0px] h-[135px] w-[133px] overflow-clip">
              <div className="absolute inset-[0_0_0.01%_-4.42%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 138.886 134.992">
                  <g>
                    <path d={svgPaths.p20ca6480} fill="#111827" />
                  </g>
                </svg>
              </div>
              <div className="absolute left-[41px] top-[46px] w-[51px] h-[37px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 51 37">
                  <g>
                    <path d={svgPaths.p2304cdf0} fill="#2563EB" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Title */}
            <p className="absolute left-1/2 -translate-x-1/2 top-[194px] font-['Segoe_UI',sans-serif] font-bold text-[40px] text-center tracking-[2.4px] leading-[64px] whitespace-nowrap">
              <span className="text-black">Our </span>
              <span className="text-[#2563EB]">vision</span>
            </p>

            {/* Lines */}
            <div className="absolute top-[258px] left-0 h-0 w-[113px]">
              <svg className="block w-full h-[2px]" fill="none" preserveAspectRatio="none" viewBox="0 0 113 2">
                <path d={svgPaths.p29b10000} fill="#2563EB" />
              </svg>
            </div>
            <div className="absolute top-[258px] left-[136px] h-0 w-[113px]">
              <svg className="block w-full h-[2px]" fill="none" preserveAspectRatio="none" viewBox="0 0 113 2">
                <path d={svgPaths.pcd2b5f0} fill="#2563EB" />
              </svg>
            </div>

            {/* Diamond */}
            <div className="absolute top-[245px] left-[113px] h-6 w-6">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <path d="M12 0L24 12L12 24L0 12L12 0Z" fill="#111827" />
              </svg>
            </div>

            {/* Description */}
            <p className="absolute top-[297px] left-[0px] font-['Inter',sans-serif] text-[12px] text-[#4B5563] leading-normal w-[247px]">
              Of course, strengthening and developing the internal structure requires us to analyze experiments that
              are striking in their scale and grandiosity.
            </p>
          </div>
        </div>

        {/* Values Card */}
        <div className="absolute left-[723px] top-0">
          <div className="relative h-[372px] w-[247px]">
            {/* Icon */}
            <div className="absolute left-[62px] top-[18px] h-[154px] w-[122.88px] overflow-clip">
              <div className="absolute inset-[0_0.01%_-0.01%_0]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 122.872 53.2879">
                  <g>
                    <path clipRule="evenodd" d={svgPaths.pcea5e00} fill="#111827" fillRule="evenodd" />
                  </g>
                </svg>
              </div>
              <div className="absolute left-[0px] top-[82px] h-[44px] w-[24.5px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.5 45">
                  <path d="M0.5 0.5H25V44.5H0.5V0.5Z" fill="#2191F6" stroke="#2191F6" />
                </svg>
              </div>
              <div className="absolute left-[74px] top-[34px] w-[30px] h-[28.5px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 31.6971 29.9811">
                  <path d={svgPaths.p23a3c230} fill="#2563EB" stroke="#2563EB" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <p className="absolute left-1/2 -translate-x-1/2 top-[194px] font-['Segoe_UI',sans-serif] font-bold text-[40px] text-center tracking-[2.4px] leading-[64px] whitespace-nowrap">
              <span className="text-black">Our </span>
              <span className="text-[#2563EB]">values</span>
            </p>

            {/* Lines */}
            <div className="absolute top-[258px] left-0 h-0 w-[113px]">
              <svg className="block w-full h-[2px]" fill="none" preserveAspectRatio="none" viewBox="0 0 113 2">
                <path d={svgPaths.p29b10000} fill="#2563EB" />
              </svg>
            </div>
            <div className="absolute top-[258px] left-[136px] h-0 w-[113px]">
              <svg className="block w-full h-[2px]" fill="none" preserveAspectRatio="none" viewBox="0 0 113 2">
                <path d={svgPaths.pcd2b5f0} fill="#2563EB" />
              </svg>
            </div>

            {/* Diamond */}
            <div className="absolute top-[245px] left-[113px] h-6 w-6">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <path d="M12 0L24 12L12 24L0 12L12 0Z" fill="#111827" />
              </svg>
            </div>

            {/* Description */}
            <p className="absolute top-[297px] left-[-1px] font-['Inter',sans-serif] text-[12px] text-[#4B5563] leading-normal w-[247px]">
              Of course, strengthening and developing the internal structure requires us to analyze experiments that
              are striking in their scale and grandiosity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}