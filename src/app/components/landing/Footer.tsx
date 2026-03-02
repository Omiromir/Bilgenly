export function Footer() {
  return (
    <footer className="relative bg-[#111827] text-white py-16">
      <div className="max-w-[1440px] mx-auto px-24">
        <div className="grid grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <p className="font-['Anonymous_Pro',monospace] text-[24px] font-bold mb-4">Bilgenly</p>
            <p className="font-['Inter',sans-serif] text-[14px] text-[#9CA3AF] leading-relaxed">
              AI-powered quiz generation platform for modern educators and students.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-['Montserrat',sans-serif] font-bold text-[16px] mb-4">Product</h4>
            <ul className="space-y-2 font-['Inter',sans-serif] text-[14px] text-[#9CA3AF]">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#faqs" className="hover:text-white transition-colors">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-['Montserrat',sans-serif] font-bold text-[16px] mb-4">Company</h4>
            <ul className="space-y-2 font-['Inter',sans-serif] text-[14px] text-[#9CA3AF]">
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#careers" className="hover:text-white transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-['Montserrat',sans-serif] font-bold text-[16px] mb-4">Legal</h4>
            <ul className="space-y-2 font-['Inter',sans-serif] text-[14px] text-[#9CA3AF]">
              <li>
                <a href="#privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#374151]">
          <div className="flex justify-between items-center">
            <p className="font-['Inter',sans-serif] text-[14px] text-[#9CA3AF]">
              © 2026 Bilgenly. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#twitter" className="text-[#9CA3AF] hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#linkedin" className="text-[#9CA3AF] hover:text-white transition-colors">
                LinkedIn
              </a>
              <a href="#facebook" className="text-[#9CA3AF] hover:text-white transition-colors">
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
