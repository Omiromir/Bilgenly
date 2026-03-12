import { useNavigate } from 'react-router';
import { LandingButton } from './LandingButton';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#111827] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <p className="font-['Montserrat',sans-serif] text-[15px] font-medium text-[#2191F6]">Try it now</p>
          <h2 className="mt-2 font-['Montserrat',sans-serif] text-[34px] font-bold leading-[1.2] text-[#F3F4F6] sm:text-[44px]">
            Ready to level up your
            <br />
            learning experience?
          </h2>
          <p className="mt-3 font-['Montserrat',sans-serif] text-[13px] text-white/85">
            Unlock AI-powered quiz creation and watch your students actually enjoy studying.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LandingButton
            variant="primary"
            size="md"
            className="hover:-translate-y-[1px]"
            onClick={() => navigate('/signup')}
          >
            Get started now
          </LandingButton>
          <button className="h-11 cursor-pointer rounded-xl border-2 border-white px-6 font-['Montserrat',sans-serif] text-[15px] text-white transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-white hover:text-[#111827] active:translate-y-0 active:scale-[0.98]">
            Learn more
          </button>
        </div>
      </div>
    </section>
  );
}
