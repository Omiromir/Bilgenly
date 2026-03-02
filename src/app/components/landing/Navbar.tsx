import { LandingButton } from './LandingButton';


export function Navbar() {
  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 bg-white h-[98px] shadow-[0px_4px_4px_0px_rgba(17,24,39,0.05)] z-50"
    >
      <div className="max-w-[1440px] mx-auto h-full relative">
        {/* Logo */}
        <div className="absolute left-[96px] top-[17px] flex items-center gap-4">
          <div className="h-[64px] w-[55px] overflow-hidden">
            <img
              alt="Bilgenly logo"
              className="h-[146.14%] w-[449.09%] object-cover -ml-[65.45%] -mt-[26.97%]"
              src={"../../../assets/logo.png"}
            />
          </div>
          <p className="font-['Anonymous_Pro',monospace] text-[28px] text-[#041320] font-bold leading-normal">
            Bilgenly
          </p>
        </div>

        {/* Navigation Menu */}
        <div className="absolute left-[485px] top-[39px] flex gap-[35px] items-center font-['Montserrat',sans-serif] text-[16px] text-[#111827]">
          <a href="#about" className="hover:text-[#2191F6] transition-colors">
            about us
          </a>
          <a href="#features" className="hover:text-[#2191F6] transition-colors">
            features
          </a>
          <a href="#how-it-works" className="hover:text-[#2191F6] transition-colors">
            how it works
          </a>
          <a href="#pricing" className="hover:text-[#2191F6] transition-colors">
            pricing
          </a>
          <a href="#faqs" className="hover:text-[#2191F6] transition-colors">
            faqs
          </a>
        </div>

        {/* Auth Section */}
        <div className="absolute right-[96px] top-[27px] flex gap-[20px] items-center">
          <button className="font-['Montserrat',sans-serif] font-bold text-[20px] text-[#4B5563] hover:text-[#111827] transition-colors">
            Log in
          </button>
          <div className="h-[45px] w-[169px]">
            <LandingButton variant="primary">Get started</LandingButton>
          </div>
        </div>
      </div>
    </nav>
  );
}
