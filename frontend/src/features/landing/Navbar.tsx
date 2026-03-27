import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import logo from "../../assets/logo.png";
import { LandingButton } from "./LandingButton";
import { BilgenlyLogo } from "../../components/shared/BilgenlyLogo";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleAuthNavigation = (path: "/signin" | "/signup") => {
    setIsMenuOpen(false);
    navigate(path);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={
        isScrolled
          ? "fixed inset-x-0 top-0 z-50 border-b border-white/30 bg-white/70 shadow-[0_8px_24px_rgba(17,24,39,0.12)] backdrop-blur-xl transition-all duration-300"
          : "fixed inset-x-0 top-0 z-50 border-b border-[#E5E7EB] bg-white transition-all duration-300"
      }
    >
      <div className="mx-auto flex h-20 w-full max-w-[1248px] items-center justify-between px-4 sm:px-6 md:h-[98px] lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3"
          onClick={() => {
            setIsMenuOpen(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <BilgenlyLogo  />
        </Link>

        <div className="hidden items-center gap-[35px] font-['Montserrat',sans-serif] text-[16px] text-[#374151] md:flex">
          <a href="#about" className="transition-colors hover:text-[#2191F6]">
            About us
          </a>
          <a
            href="#features"
            className="transition-colors hover:text-[#2191F6]"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="transition-colors hover:text-[#2191F6]"
          >
            How it works
          </a>
          <a href="#pricing" className="transition-colors hover:text-[#2191F6]">
            Pricing
          </a>
          <a href="#faqs" className="transition-colors hover:text-[#2191F6]">
            Faqs
          </a>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <button
            className="hidden font-['Montserrat',sans-serif] text-[16px] font-bold text-[#4B5563] transition-all duration-200 ease-out  hover:text-[#111827] md:inline lg:text-[20px]"
            onClick={() => handleAuthNavigation("/signin")}
            type="button"
          >
            Log in
          </button>
          <LandingButton
            variant="primary"
            size="sm"
            className="hidden  md:inline-flex"
            onClick={() => handleAuthNavigation("/signup")}
          >
            Get started
          </LandingButton>
          <button
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#D1D5DB] text-[#111827] transition-colors hover:bg-[#F3F4F6] md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span className="relative h-4 w-5">
              <span
                className={`absolute left-0 top-1/2 h-[2px] w-5 rounded bg-current transition-all duration-200 ${
                  isMenuOpen
                    ? "-translate-y-1/2 rotate-45"
                    : "-translate-y-[7px]"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 h-[2px] w-5 -translate-y-1/2 rounded bg-current transition-opacity duration-200 ${
                  isMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 h-[2px] w-5 rounded bg-current transition-all duration-200 ${
                  isMenuOpen
                    ? "-translate-y-1/2 -rotate-45"
                    : "translate-y-[5px]"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-[#111827]/20 transition-opacity duration-300 md:hidden ${isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`absolute left-4 right-4 top-[88px] rounded-2xl border border-white/60 bg-white/90 p-4 shadow-[0_16px_40px_rgba(17,24,39,0.2)] backdrop-blur-xl transition-all duration-300 ${
            isMenuOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-3 opacity-0"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="space-y-1">
            <a
              href="#about"
              className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#374151] transition-colors hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              onClick={() => setIsMenuOpen(false)}
            >
              About us
            </a>
            <a
              href="#features"
              className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#374151] transition-colors hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#374151] transition-colors hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              onClick={() => setIsMenuOpen(false)}
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#374151] transition-colors hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#faqs"
              className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#374151] transition-colors hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQs
            </a>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-[#E5E7EB] pt-4">
            {" "}
            <button
              className="h-10 flex-1 rounded-lg border border-[#D1D5DB] px-3 text-[14px] font-semibold text-[#4B5563] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
              onClick={() => handleAuthNavigation("/signin")}
              type="button"
            >
              Log in
            </button>
            <LandingButton
              variant="primary"
              size="sm"
              className="!h-10 !flex-1 !px-4 !text-[14px]"
              onClick={() => handleAuthNavigation("/signup")}
            >
              Get started
            </LandingButton>
          </div>
        </div>
      </div>
    </nav>
  );
}
