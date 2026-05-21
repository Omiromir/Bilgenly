import missionIcon from "../../assets/mvv-1.png";
import visionIcon from "../../assets/mvv-2.png";
import valuesIcon from "../../assets/mvv-3.png";

const cards = [
  {
    icon: missionIcon,
    title: "Mission",
    accent: "from-[#2191F6] to-[#6366F1]",
    text: "We help educators create better learning experiences in minutes, not hours.",
  },
  {
    icon: visionIcon,
    title: "Vision",
    accent: "from-[#6366F1] to-[#8B5CF6]",
    text: "We envision classrooms where AI supports every student with personalized practice.",
  },
  {
    icon: valuesIcon,
    title: "Values",
    accent: "from-[#2191F6] to-[#06B6D4]",
    text: "We build with clarity, accessibility, and practical impact for teachers and learners.",
  },
];

export function MVVSection() {
  return (
    <section
      id="about"
      className="relative scroll-mt-24 overflow-hidden bg-[#F8FAFF] px-4 py-20 sm:px-6 sm:py-28 lg:px-8 dark:bg-[#111b2f]"
    >
      {/* Ambient background decoration */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-48 -top-24 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(33,145,246,0.09)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(102,179,255,0.07)_0%,transparent_65%)]" />
        <div className="absolute -bottom-32 -right-40 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.09)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(122,114,255,0.07)_0%,transparent_65%)]" />
        <div
          className="absolute inset-0 opacity-[0.018] dark:opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #2563EB 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1200px]">
        <div className="text-center">
          <p className="font-['Inter',sans-serif] text-[13px] font-semibold uppercase tracking-[0.12em] text-[#2191F6] dark:text-[#66b3ff]">
            Our Philosophy
          </p>
          <h2 className="mt-3 font-['Montserrat',sans-serif] text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-[#111827] [text-wrap:balance] sm:text-[36px] lg:text-[44px] dark:text-[#f5f8ff]">
            The Ideas That Drive{" "}
            <span className="bg-gradient-to-r from-[#2191F6] to-[#6366F1] bg-clip-text text-transparent">
              Everything We Do
            </span>
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="group relative overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_8px_32px_rgba(33,145,246,0.12)] dark:border-[#2a3858] dark:bg-[#18233b] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_8px_32px_rgba(122,114,255,0.14)]"
            >
              {/* Top gradient line */}
              <div
                className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${card.accent} rounded-t-3xl`}
              />

              <div className="flex h-[100px] items-center justify-center">
                <div className="relative flex items-center justify-center rounded-2xl p-4 dark:bg-white dark:shadow-[0_4px_24px_rgba(33,145,246,0.18)]">
                  <img
                    src={card.icon}
                    alt={`Illustration representing our ${card.title.toLowerCase()}`}
                    width={82}
                    height={82}
                    className="max-h-[82px] w-auto object-contain"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3
                  className={`bg-gradient-to-r ${card.accent} bg-clip-text font-['Montserrat',sans-serif] text-[22px] font-extrabold text-transparent sm:text-[26px]`}
                >
                  Our {card.title}
                </h3>
                <div className="mt-3 h-px w-12 bg-gradient-to-r from-[#2191F6] to-transparent" />
                <p className="mt-4 font-['Inter',sans-serif] text-[14px] leading-[1.7] text-[#6B7280] dark:text-[#9aa8c6]">
                  {card.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
