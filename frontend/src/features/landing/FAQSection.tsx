import { FAQAccordionItem } from './FAQAccordionItem';

export interface FAQSectionProps {
  expandedItems: Set<number>;
  onToggle: (index: number) => void;
}

const faqs = [
  {
    question: 'How accurate is the AI quiz generation?',
    answer:
      "Our AI achieves 95%+ accuracy by analyzing your content with advanced NLP models trained specifically for educational material. Every question is relevant and properly structured.",
  },
  {
    question: 'Can students really create quizzes too?',
    answer:
      'Yes! Students can create custom quizzes from their notes to test their own understanding and share with classmates for collaborative learning.',
  },
  {
    question: 'Are there limits on quiz creation?',
    answer:
      'Free accounts can create up to 5 AI quizzes per month. Pro plans offer unlimited quiz creation with advanced features and analytics.',
  },
  {
    question: 'What languages do you support?',
    answer:
      'We currently support English, with additional language support planned for future releases.',
  },
  {
    question: 'How do you protect student data and privacy?',
    answer:
      'We use bank-level encryption, comply with FERPA and GDPR regulations, and never share student data with third parties. Your privacy is our top priority.',
  },
  {
    question: 'What kind of support do you offer?',
    answer:
      'We provide email support, comprehensive documentation, and video tutorials. Pro users get priority support with faster response times.',
  },
];

export function FAQSection({ expandedItems, onToggle }: FAQSectionProps) {
  return (
    <section id="faqs" className="relative scroll-mt-24 w-full overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {/* Background decorations */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Soft gradient from top (coming from pricing bg) */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#F8FAFF] to-transparent dark:from-[#111b2f]" />
        {/* Ambient blue glow — centered bottom */}
        <div className="absolute bottom-0 left-1/2 h-[360px] w-[500px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(33,145,246,0.05)_0%,transparent_70%)]" />
        {/* Cross pattern — very subtle */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(#2563EB 1px, transparent 1px), linear-gradient(90deg, #2563EB 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[800px]">
        <div className="text-center">
          <p className="font-['Inter',sans-serif] text-[13px] font-semibold uppercase tracking-[0.12em] text-[#2191F6] dark:text-[#66b3ff]">
            FAQ
          </p>
          <h2 className="mt-3 font-['Montserrat',sans-serif] text-[28px] font-extrabold tracking-[-0.02em] text-[#111827] [text-wrap:balance] sm:text-[42px] dark:text-[#f5f8ff]">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 font-['Inter',sans-serif] text-[16px] text-[#6B7280] dark:text-[#9aa8c6]">
            Everything you need to know about Bilgenly
          </p>
        </div>

        <div className="mt-12 divide-y divide-[#F3F4F6] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:divide-[#2a3858] dark:border-[#2a3858] dark:bg-[#18233b] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
          {faqs.map((faq, index) => (
            <FAQAccordionItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={expandedItems.has(index)}
              onToggle={() => onToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

