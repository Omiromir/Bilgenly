import { HandHeart, Lightbulb, Target } from 'lucide-react';

const cards = [
  {
    icon: Target,
    title: 'mission',
    text: 'We help educators create better learning experiences in minutes, not hours.'
  },
  {
    icon: Lightbulb,
    title: 'vision',
    text: 'We envision classrooms where AI supports every student with personalized practice.'
  },
  {
    icon: HandHeart,
    title: 'values',
    text: 'We build with clarity, accessibility, and practical impact for teachers and learners.'
  }
];

export function MVVSection() {
  return (
    <section
      id="about"
      className="scroll-mt-24 min-h-[100svh] bg-[rgba(37,99,235,0.05)] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-center font-['Montserrat',sans-serif] text-[24px] font-bold leading-tight tracking-[0.02em] text-[#111827] sm:text-[32px] lg:text-[40px]">
          The Philosophy That Drive <span className="mt-1 inline-block rounded-xl bg-[#2191F6] px-3 py-1 text-white">Everything We Do</span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="text-center">
                <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border-2 border-[#111827] bg-white">
                  <Icon className="h-10 w-10 text-[#2563EB]" />
                </div>
                <h3 className="mt-6 font-['Segoe_UI',sans-serif] text-[28px] font-bold tracking-[0.03em] text-black sm:text-[34px]">
                  Our <span className="text-[#2563EB]">{card.title}</span>
                </h3>
                <div className="mx-auto mt-3 h-[2px] w-[180px] bg-[#2563EB]" />
                <p className="mx-auto mt-5 max-w-[250px] font-['Inter',sans-serif] text-[12px] leading-[1.45] text-[#4B5563]">
                  {card.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
