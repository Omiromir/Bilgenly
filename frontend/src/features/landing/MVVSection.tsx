import missionIcon from "../../assets/mvv-1.png";
import visionIcon from "../../assets/mvv-2.png";
import valuesIcon from "../../assets/mvv-3.png";

const cards = [
  {
    icon: missionIcon,
    title: "mission",
    text: "We help educators create better learning experiences in minutes, not hours.",
  },
  {
    icon: visionIcon,
    title: "vision",
    text: "We envision classrooms where AI supports every student with personalized practice.",
  },
  {
    icon: valuesIcon,
    title: "values",
    text: "We build with clarity, accessibility, and practical impact for teachers and learners.",
  },
];

function Divider() {
  return (
    <div className="mx-auto mt-5 flex w-full max-w-[220px] items-center justify-center gap-3">
      <div className="h-px flex-1 bg-[#6CA9FF]" />
      <div className="h-4 w-4 rotate-45 bg-[#111827]" />
      <div className="h-px flex-1 bg-[#6CA9FF]" />
    </div>
  );
}

export function MVVSection() {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-[#f5f7fc] px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-center font-['Montserrat',sans-serif] text-[24px] font-bold leading-tight tracking-[0.02em] text-[#111827] sm:text-[32px] lg:text-[40px]">
          The Philosophy That Drive{" "}
          <span className="mt-1 inline-block rounded-xl bg-[#2191F6] px-3 py-1 text-white">
            Everything We Do
          </span>
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-14 md:grid-cols-3 md:gap-10">
          {cards.map((card) => (
            <article
              key={card.title}
              className="flex flex-col items-center text-center"
            >
              <div className="flex h-[116px] items-center justify-center sm:h-[132px]">
                <img
                  src={card.icon}
                  alt={`Illustration for our ${card.title}`}
                  className="max-h-[104px] w-auto object-contain sm:max-h-[118px]"
                />
              </div>

              <h3 className="mt-6 font-['Montserrat',sans-serif] text-[28px] font-bold leading-[1.15] text-[#111827] sm:text-[36px]">
                Our <span className="text-[#2563EB]">{card.title}</span>
              </h3>

              <Divider />

              <p className="mt-6 max-w-[260px] font-['Montserrat',sans-serif] text-[13px] leading-[1.5] text-[#6B7280] sm:text-[14px]">
                {card.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
