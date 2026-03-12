const freeFeatures = [
  '5 AI quizzes per month',
  'Basic analytics',
  'Public library access',
  'Community features',
  'Mobile app access'
];
const proFeatures = ['Unlimited AI quizzes', 'Advanced analytics', 'Priority support', 'Export capabilities'];

function PricingCard({
  name,
  price,
  suffix,
  subtitle,
  features,
  highlighted
}: {
  name: string;
  price: string;
  suffix: string;
  subtitle: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <article
      className={
        highlighted
          ? 'relative rounded-2xl border-2 border-[#2563EB] bg-white p-6 shadow-[0_8px_30px_rgba(37,99,235,0.2)] sm:p-8'
          : 'rounded-2xl border-2 border-[#F3F4F6] bg-white p-6 sm:p-8'
      }
    >
      {highlighted && (
        <span className="absolute -top-3 right-6 rounded-full bg-[#8322F3] px-4 py-1 text-[12px] font-bold text-white">
          Most Popular
        </span>
      )}
      <h3 className="font-['Segoe_UI',sans-serif] text-[19px] font-bold text-[#111827]">{name}</h3>
      <div className="mt-4 flex items-end">
        <span className="font-['Segoe_UI',sans-serif] text-[46px] font-bold leading-none text-[#2563EB]">{price}</span>
        <span className="mb-1 font-['Segoe_UI',sans-serif] text-[18px] text-[#4B5563]">{suffix}</span>
      </div>
      <p className="mt-3 font-['Segoe_UI',sans-serif] text-[15px] text-[#111827]">{subtitle}</p>
      <ul className="mt-6 space-y-3 border-y border-[#F3F4F6] py-4">
        {features.map((feature) => (
          <li key={feature} className="font-['Segoe_UI',sans-serif] text-[15px] text-[#111827]">
            <span className="mr-2 text-[#8322F3]">+</span>
            {feature}
          </li>
        ))}
      </ul>
      <button
        className={
          highlighted
            ? "mt-6 h-11 w-full rounded-lg bg-[#2563EB] font-['Segoe_UI',sans-serif] text-[16px] font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:brightness-105 active:translate-y-0 active:scale-[0.98]"
            : "mt-6 h-11 w-full rounded-lg border-2 border-[#2563EB] bg-white font-['Segoe_UI',sans-serif] text-[16px] font-bold text-[#2563EB] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-[#EFF6FF] active:translate-y-0 active:scale-[0.98]"
        }
      >
        {highlighted ? 'Start Free Trial' : 'Get Started'}
      </button>
    </article>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-center font-['Montserrat',sans-serif] text-[32px] font-bold uppercase text-[#111827] sm:text-[48px]">
          Simple, Transparent Pricing
        </h2>
        <p className="mt-3 text-center font-['Segoe_UI',sans-serif] text-[17px] text-[#4B5563]">
          Start free, upgrade when you&apos;re ready
        </p>

        <div className="mx-auto mt-12 grid max-w-[900px] grid-cols-1 gap-8 md:grid-cols-2">
          <PricingCard
            name="Free"
            price="$0"
            suffix="/forever"
            subtitle="Perfect for trying out the platform"
            features={freeFeatures}
          />
          <PricingCard
            name="Pro"
            price="$9"
            suffix="/month"
            subtitle="For serious educators and learners"
            features={proFeatures}
            highlighted
          />
        </div>
      </div>
    </section>
  );
}
