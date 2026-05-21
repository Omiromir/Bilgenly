import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { LandingButton } from "./LandingButton";
import { BilgenlyLogo } from "../../components/shared/BilgenlyLogo";
import { useAuth } from "../../app/providers/AuthProvider";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { defaultRedirectPath, isAuthenticated, onboardingCompleted } = useAuth();

  const handleAuthNavigation = (path: "/signin" | "/signup") => {
    setIsMenuOpen(false);

    if (isAuthenticated) {
      navigate(defaultRedirectPath);
      return;
    }

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
          ? "fixed inset-x-0 top-0 z-50 border-b border-white/30 bg-white/70 shadow-[0_8px_24px_rgba(17,24,39,0.12)] backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 dark:border-[#2a3858]/60 dark:bg-[#0d1424]/90 dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          : "fixed inset-x-0 top-0 z-50 border-b border-[#E5E7EB] bg-white transition-[background-color,border-color,box-shadow] duration-300 dark:border-[#2a3858] dark:bg-[#0d1424]"
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

        <div className="hidden items-center gap-7 font-['Montserrat',sans-serif] text-[15px] font-semibold text-[#374151] md:flex">
          {[
            { href: "#about", label: "About us" },
            { href: "#features", label: "Features" },
            { href: "#how-it-works", label: "How it works" },
            { href: "#pricing", label: "Pricing" },
            { href: "#faqs", label: "FAQs" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="group relative py-1 text-[#4B5563] transition-colors duration-200 hover:text-[#1D4ED8] dark:text-[#9aa8c6] dark:hover:text-[#7a72ff]"
            >
              {label}
              <span className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-[#2191F6] transition-transform duration-200 ease-out group-hover:scale-x-100 dark:bg-[#7a72ff]" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {isAuthenticated ? (
            <LandingButton
              variant="primary"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => handleAuthNavigation("/signup")}
            >
              {onboardingCompleted ? "Open dashboard" : "Continue setup"}
            </LandingButton>
          ) : (
            <>
              <button
                className="hidden items-center rounded-lg px-3 py-1.5 font-['Montserrat',sans-serif] text-[15px] font-semibold text-[#4B5563] transition-all duration-200 ease-out hover:bg-[#F3F4F6] hover:text-[#111827] active:scale-[0.97] md:inline-flex dark:text-[#9aa8c6] dark:hover:bg-[#1b2944] dark:hover:text-[#f5f8ff]"
                onClick={() => handleAuthNavigation("/signin")}
                type="button"
              >
                Log in
              </button>
              <LandingButton
                variant="primary"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => handleAuthNavigation("/signup")}
              >
                Get started
              </LandingButton>
            </>
          )}
          <button
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#D1D5DB] text-[#111827] transition-colors hover:bg-[#F3F4F6] md:hidden dark:border-[#2a3858] dark:text-[#dde6f7] dark:hover:bg-[#1b2944]"
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
        className={`fixed inset-0 z-40 bg-[#111827]/20 transition-opacity duration-300 md:hidden dark:bg-black/50 ${isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`absolute left-4 right-4 top-[88px] rounded-2xl border border-white/60 bg-white/90 p-4 shadow-[0_16px_40px_rgba(17,24,39,0.2)] backdrop-blur-xl transition-all duration-300 dark:border-[#2a3858]/70 dark:bg-[#111b2f]/95 dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] ${
            isMenuOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-3 opacity-0"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="space-y-0.5">
            {[
              { href: "#about", label: "About us" },
              { href: "#features", label: "Features" },
              { href: "#how-it-works", label: "How it works" },
              { href: "#pricing", label: "Pricing" },
              { href: "#faqs", label: "FAQs" },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-['Montserrat',sans-serif] text-[15px] font-semibold text-[#374151] transition-all duration-150 hover:bg-[#EFF6FF] hover:text-[#1D4ED8] active:scale-[0.98] dark:text-[#9aa8c6] dark:hover:bg-[#1b2944] dark:hover:text-[#7a72ff]"
                onClick={() => setIsMenuOpen(false)}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-[#E5E7EB] pt-4 dark:border-[#2a3858]">
            {isAuthenticated ? (
              <LandingButton
                variant="primary"
                size="sm"
                className="!h-10 !w-full !px-4 !text-[14px]"
                onClick={() => handleAuthNavigation("/signup")}
              >
                {onboardingCompleted ? "Open dashboard" : "Continue setup"}
              </LandingButton>
            ) : (
              <>
                <button
                  className="h-10 flex-1 rounded-lg border border-[#D1D5DB] px-3 font-['Montserrat',sans-serif] text-[14px] font-semibold text-[#4B5563] transition-all duration-150 hover:border-[#2191F6] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] active:scale-[0.97] dark:border-[#2a3858] dark:text-[#9aa8c6] dark:hover:border-[#7a72ff] dark:hover:bg-[#1b2944] dark:hover:text-[#7a72ff]"
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
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
