export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <p className="font-['Montserrat',sans-serif] text-[22px] font-extrabold tracking-[-0.02em] text-white">
              Bilgenly
            </p>
            <p className="mt-3 max-w-[240px] font-['Inter',sans-serif] text-[13px] leading-[1.65] text-[#94A3B8]">
              AI-powered quiz generation platform for modern educators and students worldwide.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-['Montserrat',sans-serif] text-[13px] font-bold uppercase tracking-[0.1em] text-[#64748B]">
              Product
            </h4>
            <ul className="mt-4 space-y-2.5 font-['Inter',sans-serif] text-[14px] text-[#94A3B8]">
              <li><a href="#features" className="transition-colors duration-150 hover:text-white">Features</a></li>
              <li><a href="#pricing" className="transition-colors duration-150 hover:text-white">Pricing</a></li>
              <li><a href="#how-it-works" className="transition-colors duration-150 hover:text-white">How It Works</a></li>
              <li><a href="#faqs" className="transition-colors duration-150 hover:text-white">FAQs</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-['Montserrat',sans-serif] text-[13px] font-bold uppercase tracking-[0.1em] text-[#64748B]">
              Company
            </h4>
            <ul className="mt-4 space-y-2.5 font-['Inter',sans-serif] text-[14px] text-[#94A3B8]">
              <li><a href="#about" className="transition-colors duration-150 hover:text-white">About Us</a></li>
              <li><a href="#features" className="transition-colors duration-150 hover:text-white">Features</a></li>
              <li><a href="#pricing" className="transition-colors duration-150 hover:text-white">Plans</a></li>
              <li><a href="#faqs" className="transition-colors duration-150 hover:text-white">Support</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-['Montserrat',sans-serif] text-[13px] font-bold uppercase tracking-[0.1em] text-[#64748B]">
              Legal
            </h4>
            <ul className="mt-4 space-y-2.5 font-['Inter',sans-serif] text-[14px] text-[#94A3B8]">
              <li><a href="#" className="transition-colors duration-150 hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="transition-colors duration-150 hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="transition-colors duration-150 hover:text-white">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-5 border-t border-[#1E293B] pt-8 sm:flex-row sm:items-center">
          <p className="font-['Inter',sans-serif] text-[13px] text-[#64748B]">
            &copy; 2026 Bilgenly. All rights reserved.
          </p>
          <div className="flex gap-5 font-['Inter',sans-serif] text-[13px] text-[#64748B]">
            <a href="#" className="transition-colors duration-150 hover:text-white">Twitter</a>
            <a href="#" className="transition-colors duration-150 hover:text-white">LinkedIn</a>
            <a href="#" className="transition-colors duration-150 hover:text-white">Facebook</a>
          </div>
        </div>
      </div>

      {/* Bottom brand strip */}
      <div className="border-t border-[#1E293B] bg-gradient-to-r from-[#2563EB] to-[#4F46E5] px-4 py-3 text-center">
        <p className="font-['Inter',sans-serif] text-[13px] text-white/80">
          Built for educators and learners worldwide &mdash; with &hearts; by the Bilgenly team
        </p>
      </div>
    </footer>
  );
}
