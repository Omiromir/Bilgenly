import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { BrowserMockup } from './BrowserMockup';
import { LandingButton } from './LandingButton';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative scroll-mt-24 px-4 pb-16 pt-[120px] sm:px-6 sm:pb-20 sm:pt-[145px] lg:px-8 lg:pt-[163px]">
      <div className="mx-auto max-w-[1200px] text-center">
        <motion.h1
          className="mx-auto max-w-[848px] font-['Montserrat',sans-serif] text-[32px] font-bold leading-[1.25] tracking-[0.08em] text-[#02080E] sm:text-[44px] sm:tracking-[0.12em] lg:text-[54px] lg:tracking-[0.19em]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Learn <span className="text-[#2191F6]">Smarter</span>, Play <span className="text-[#2191F6]">Harder</span>{' '}
          with AI
        </motion.h1>

        <motion.p
          className="mx-auto mt-8 max-w-[470px] font-['Roboto',sans-serif] text-[16px] font-medium leading-[1.8] text-[#4B5563] sm:mt-12 sm:text-[20px] sm:leading-[2] sm:tracking-[1px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          Create, share, and discover quizzes in seconds
          <br />
          for study or practice anytime.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:gap-[37px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <LandingButton
            variant="primary"
            size="md"
            className="w-full max-w-[240px] rounded-[15px] sm:min-w-[169px]"
            onClick={() => navigate('/signup')}
          >
            Get started
          </LandingButton>
          <LandingButton variant="secondary" size="md" className="w-full max-w-[240px] rounded-[15px] sm:min-w-[169px]">
            watch demo
          </LandingButton>
        </motion.div>

        <motion.div
          className="relative mt-10 sm:mt-[92px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <BrowserMockup />
          <div className="pointer-events-none absolute -bottom-7 left-1/2 h-20 w-[92%] -translate-x-1/2 rounded-[24px] bg-white blur-[18px] sm:-bottom-10 sm:h-28 sm:rounded-[32px] sm:blur-[22px]" />
        </motion.div>

        <div className="pointer-events-none mx-auto -mt-3 h-[88px] w-[98%] max-w-[1320px] rounded-[28px] bg-white shadow-[0_24px_70px_rgba(255,255,255,1)] sm:-mt-6 sm:h-[140px] sm:rounded-[40px] sm:shadow-[0_44px_110px_rgba(255,255,255,1)]" />
      </div>
    </section>
  );
}
