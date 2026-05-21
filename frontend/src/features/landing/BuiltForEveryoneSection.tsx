import svgPaths from "../../imports/svg-lz8yvnizs1";
import { BenefitCard } from './BenefitCard';
import { Toggle } from './Toggle';

export interface BuiltForEveryoneSectionProps {
  selectedAudience: 'teachers' | 'students';
  onToggle: (audience: 'teachers' | 'students') => void;
}

const teacherBenefits = [
  { title: 'Save 5+ Hours Weekly', description: 'Stop spending hours creating quizzes manually. Our AI does it in seconds.', path: svgPaths.p48030f0 },
  { title: 'Track Student Progress', description: 'Visual dashboards show exactly where each student stands.', path: svgPaths.p1344f300 },
  { title: 'Manage Classes Easily', description: 'One-click invites and seamless class organization.', path: svgPaths.p20bfae00 },
  { title: 'Reuse Quiz Banks', description: 'Build your library and modify quizzes for future classes.', path: svgPaths.p13733b80 },
  { title: 'Class Performance Insights', description: 'Identify struggling topics and adjust your teaching accordingly.', path: svgPaths.pc0f2680 },
  { title: 'Multiple Upload Formats', description: 'PDFs, text, and documents. We support them all.', path: svgPaths.p2dcaff00 },
];

const studentBenefits = [
  { title: 'Unlimited Practice', description: 'Access thousands of quizzes across all subjects.', path: svgPaths.p48030f0 },
  { title: 'Earn Badges & Rewards', description: 'Climb leaderboards and unlock achievements.', path: svgPaths.p1344f300 },
  { title: 'Track Your Progress', description: 'See your improvement over time with detailed analytics.', path: svgPaths.p20bfae00 },
  { title: 'Create Your Own Quizzes', description: 'Students can create and publish quizzes too.', path: svgPaths.p13733b80 },
  { title: 'Smart Search', description: 'Find the perfect quiz for any topic instantly.', path: svgPaths.pc0f2680 },
  { title: 'Study Anywhere', description: 'Seamless experience across all your devices.', path: svgPaths.p2dcaff00 },
];

function BenefitIcon({ pathData }: { pathData: string }) {
  return (
    <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#DBEAFE] dark:from-[#1b2944] dark:to-[#162038]">
      <svg className="h-[26px] w-[26px]" fill="none" viewBox="0 0 62.2596 59.7692">
        <path d={pathData} fill="#2563EB" />
      </svg>
    </div>
  );
}

export function BuiltForEveryoneSection({ selectedAudience, onToggle }: BuiltForEveryoneSectionProps) {
  const benefits = selectedAudience === 'teachers' ? teacherBenefits : studentBenefits;

  return (
    <section id="features" className="relative scroll-mt-24 overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {/* Background decorations */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Gradient wash from top — blends from MVV section */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#F8FAFF] to-transparent dark:from-[#111b2f]" />
        <div className="absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(122,114,255,0.06)_0%,transparent_70%)]" />
        <div className="absolute -left-24 bottom-0 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(33,145,246,0.07)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(102,179,255,0.05)_0%,transparent_70%)]" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(37,99,235,0.04)_0%,transparent_65%)]" />
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #2563EB 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1200px]">
        <div className="text-center">
          <p className="font-['Inter',sans-serif] text-[13px] font-semibold uppercase tracking-[0.12em] text-[#2191F6] dark:text-[#66b3ff]">
            Features
          </p>
          <h2 className="mt-3 font-['Montserrat',sans-serif] text-[28px] font-extrabold tracking-[-0.02em] text-[#111827] [text-wrap:balance] sm:text-[42px] dark:text-[#f5f8ff]">
            Built for Everyone
          </h2>
          <p className="mt-3 font-['Inter',sans-serif] text-[16px] text-[#6B7280] dark:text-[#9aa8c6]">
            Tailored features for teachers and students alike
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Toggle
            options={['For Teachers', 'For Students']}
            selected={selectedAudience === 'teachers' ? 0 : 1}
            onChange={(index) => onToggle(index === 0 ? 'teachers' : 'students')}
            ariaLabel="Select audience type"
          />
        </div>

        <div className="mx-auto mt-12 grid max-w-[1060px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <BenefitCard
              key={benefit.title}
              icon={<BenefitIcon pathData={benefit.path} />}
              title={benefit.title}
              description={benefit.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
