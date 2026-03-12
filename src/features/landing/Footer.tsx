export function Footer() {
  return (
    <footer className="bg-[#111827] text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-['Anonymous_Pro',monospace] text-[24px] font-bold">Bilgenly</p>
            <p className="mt-3 max-w-[260px] font-['Inter',sans-serif] text-[14px] leading-relaxed text-[#9CA3AF]">
              AI-powered quiz generation platform for modern educators and students.
            </p>
          </div>

          <div>
            <h4 className="font-['Montserrat',sans-serif] text-[16px] font-bold">Product</h4>
            <ul className="mt-4 space-y-2 font-['Inter',sans-serif] text-[14px] text-[#9CA3AF]">
              <li><a href="#features" className="transition-colors hover:text-white">Features</a></li>
              <li><a href="#pricing" className="transition-colors hover:text-white">Pricing</a></li>
              <li><a href="#how-it-works" className="transition-colors hover:text-white">How it Works</a></li>
              <li><a href="#faqs" className="transition-colors hover:text-white">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-['Montserrat',sans-serif] text-[16px] font-bold">Company</h4>
            <ul className="mt-4 space-y-2 font-['Inter',sans-serif] text-[14px] text-[#9CA3AF]">
              <li><a href="#about" className="transition-colors hover:text-white">About Us</a></li>
              <li><a href="#features" className="transition-colors hover:text-white">Features</a></li>
              <li><a href="#pricing" className="transition-colors hover:text-white">Plans</a></li>
              <li><a href="#faqs" className="transition-colors hover:text-white">Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-['Montserrat',sans-serif] text-[16px] font-bold">Legal</h4>
            <ul className="mt-4 space-y-2 font-['Inter',sans-serif] text-[14px] text-[#9CA3AF]">
              <li><a href="#" className="transition-colors hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[#374151] pt-7">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="font-['Inter',sans-serif] text-[14px] text-[#9CA3AF]">
              © 2026 Bilgenly. All rights reserved.
            </p>
            <div className="flex gap-6 font-['Inter',sans-serif] text-[14px] text-[#9CA3AF]">
              <a href="#" className="transition-colors hover:text-white">Twitter</a>
              <a href="#" className="transition-colors hover:text-white">LinkedIn</a>
              <a href="#" className="transition-colors hover:text-white">Facebook</a>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#2563EB] px-4 py-4 text-center">
        <p className="font-['Segoe_UI',sans-serif] text-[13px] text-[rgba(255,255,255,0.7)] sm:text-[15px]">
          Made for educators and learners worldwide.
        </p>
      </div>
    </footer>
  );
}
