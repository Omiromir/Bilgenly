import { LandingButton } from './LandingButton';
import { BrowserMockup } from './BrowserMockup';
import svgPaths from '../../../imports/svg-lz8yvnizs1';
import { motion } from 'motion/react';

export function HeroSection() {
  return (
    <section className="relative h-[977px] w-full mt-[87px]">
      {/* Browser Mockup */}
      <motion.div
        className="absolute left-[197px] top-[625px]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <BrowserMockup />
      </motion.div>

      {/* Main Heading */}
      <motion.h1
        className="absolute left-1/2 -translate-x-1/2 top-[163px] font-['Montserrat',sans-serif] font-bold text-[64px] text-center text-[#02080E] leading-normal tracking-[12.16px] w-[848px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span>Learn </span>
        <span className="text-[#2191F6]">Smarter</span>
        <span>, Play </span>
        <span className="text-[#2191F6]">Harder</span>
        <span> with AI</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="absolute left-1/2 -translate-x-1/2 top-[354px] font-['Roboto',sans-serif] font-medium text-[20px] text-center text-[#4B5563] leading-[2] tracking-[1px] w-[470px]"
        style={{ fontVariationSettings: "'wdth' 100" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Create, share, and discover quizzes in seconds - for study or practice anytime.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        className="absolute left-[519px] top-[489px] flex gap-[37px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="h-[45px] w-[169px]">
          <LandingButton variant="primary">Get started</LandingButton>
        </div>
        <div className="h-[45px] w-[169px]">
          <LandingButton variant="secondary">watch demo</LandingButton>
        </div>
      </motion.div>

      {/* Decorative Line */}
      <div className="absolute left-[287.5px] top-[336px] h-0 w-[851.001px]">
        <div className="relative h-[2.96836px]">
          <svg className="block w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 851.001 2.96836">
            <path d={svgPaths.p6d67340} fill="#2563EB" />
          </svg>
        </div>
      </div>

      {/* Blur Effect */}
      <div className="absolute left-0 top-[954px] h-[209px] w-[1440px]">
        <div className="absolute -inset-[24.88%_3.61%]">
          <svg className="block w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1544 313">
            <g filter="url(#filter0_f_2_552)">
              <path d="M52 52H1492V156.5V261H52V52Z" fill="white" />
            </g>
            <defs>
              <filter
                colorInterpolationFilters="sRGB"
                filterUnits="userSpaceOnUse"
                height="313"
                id="filter0_f_2_552"
                width="1544"
                x="0"
                y="0"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_2_552" stdDeviation="26" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
    </section>
  );
}