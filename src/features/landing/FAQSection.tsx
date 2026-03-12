import { FAQAccordionItem } from './FAQAccordionItem';

export interface FAQSectionProps {
  expandedItems: Set<number>;
  onToggle: (index: number) => void;
}

export function FAQSection({ expandedItems, onToggle }: FAQSectionProps) {
  const faqs = [
    {
      variant: '1' as const,
      question: 'How accurate is the AI quiz generation?',
      answer:
        "Our AI achieves 95%+ accuracy by analyzing your content with advanced NLP models trained specifically for educational material. Every question is relevant and properly structured."
    },
    {
      variant: '2' as const,
      question: 'Can students really create quizzes too?',
      answer:
        'Yes! Students can create custom quizzes from their notes to test their own understanding and share with classmates for collaborative learning.'
    },
    {
      variant: '3' as const,
      question: 'Are there limits on quiz creation?',
      answer:
        'Free accounts can create up to 10 quizzes per month. Premium plans offer unlimited quiz creation with advanced features and analytics.'
    },
    {
      variant: '4' as const,
      question: 'What languages do you support?',
      answer:
        'We currently support English, Spanish, French, German, and Mandarin Chinese, with more languages being added regularly based on user demand.'
    },
    {
      variant: '5' as const,
      question: 'How do you protect student data and privacy?',
      answer:
        'We use bank-level encryption, comply with FERPA and GDPR regulations, and never share student data with third parties. Your privacy is our top priority.'
    },
    {
      variant: '6' as const,
      question: 'What devices and platforms are supported?',
      answer:
        'Bilgenly works on all modern browsers (Chrome, Firefox, Safari, Edge) and is fully responsive on desktop, tablet, and mobile devices.'
    },
    {
      variant: '7' as const,
      question: 'What kind of support do you offer?',
      answer:
        'We provide 24/7 email support, comprehensive documentation, video tutorials, and live chat support for premium users.'
    }
  ];

  return (
    <section id="faqs" className="scroll-mt-24 w-full px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[900px]">
        <h2 className="text-center font-['Montserrat',sans-serif] text-[32px] font-bold text-[#111827] sm:text-[40px]">
          Frequently Asked Questions
        </h2>
        <p className="mt-4 text-center font-['Montserrat',sans-serif] text-[15px] text-[#4B5563] sm:text-[18px]">
          Everything you need to know about our platform
        </p>

        <div className="mt-10 space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="overflow-hidden rounded-lg bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
              <FAQAccordionItem
                variant={faq.variant}
                question={faq.question}
                answer={faq.answer}
                isOpen={expandedItems.has(index)}
                onToggle={() => onToggle(index)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
