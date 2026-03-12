import svgPaths from "../../imports/svg-lz8yvnizs1";
import { BenefitCard } from './BenefitCard';
import { Toggle } from './Toggle';

export interface BuiltForEveryoneSectionProps {
  selectedAudience: 'teachers' | 'students';
  onToggle: (audience: 'teachers' | 'students') => void;
}

const teacherBenefits = [
  {
    title: 'Save 5+ Hours Weekly',
    description: 'Stop spending hours creating quizzes manually. Our AI does it in seconds.',
    path: svgPaths.p48030f0
  },
  {
    title: 'Track Student Progress',
    description: 'Visual dashboards show exactly where each student stands.',
    path: svgPaths.p1344f300
  },
  {
    title: 'Manage Classes Easily',
    description: 'One-click invites and seamless class organization.',
    path: svgPaths.p20bfae00
  },
  {
    title: 'Reuse Quiz Banks',
    description: 'Build your library and modify quizzes for future classes.',
    path: svgPaths.p13733b80
  },
  {
    title: 'Class Performance Insights',
    description: 'Identify struggling topics and adjust your teaching accordingly.',
    path: svgPaths.pc0f2680
  },
  {
    title: 'Multiple Upload Formats',
    description: 'PDFs, text, and documents. We support them all.',
    path: svgPaths.p2dcaff00
  }
];

const studentBenefits = [
  {
    title: 'Unlimited Practice',
    description: 'Access thousands of quizzes across all subjects.',
    path: svgPaths.p48030f0
  },
  {
    title: 'Earn Badges & Rewards',
    description: 'Climb leaderboards and unlock achievements.',
    path: svgPaths.p1344f300
  },
  {
    title: 'Track Your Progress',
    description: 'See your improvement over time with detailed analytics.',
    path: svgPaths.p20bfae00
  },
  {
    title: 'Create Your Own Quizzes',
    description: 'Students can create and publish quizzes too.',
    path: svgPaths.p13733b80
  },
  {
    title: 'Smart Search',
    description: 'Find the perfect quiz for any topic instantly.',
    path: svgPaths.pc0f2680
  },
  {
    title: 'Study Anywhere',
    description: 'Seamless experience across all your devices.',
    path: svgPaths.p2dcaff00
  }
];

function BenefitIcon({ pathData }: { pathData: string }) {
  return (
    <div className="grid h-[59.769px] w-[62.26px] place-items-center rounded-[5px] bg-[rgba(37,99,235,0.3)]">
      <svg className="h-[28px] w-[28px]" fill="none" viewBox="0 0 62.2596 59.7692">
        <path d={pathData} fill="#2563EB" />
      </svg>
    </div>
  );
}

export function BuiltForEveryoneSection({ selectedAudience, onToggle }: BuiltForEveryoneSectionProps) {
  const benefits = selectedAudience === 'teachers' ? teacherBenefits : studentBenefits;

  return (
    <section id="features" className="scroll-mt-24 min-h-[100svh] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-center font-['Montserrat',sans-serif] text-[30px] font-bold leading-[1.25] text-[#111827] sm:text-[36px] sm:leading-[64px]">
          Built for Everyone
        </h2>
        <p className="mt-2 text-center font-['Montserrat',sans-serif] text-[15px] leading-[1.6] text-[#4B5563] sm:text-[19.2px] sm:leading-[30.72px]">
          Tailored features for teachers and students
        </p>

        <div className="mt-8">
          <Toggle
            options={['for teachers', 'for students']}
            selected={selectedAudience === 'teachers' ? 0 : 1}
            onChange={(index) => onToggle(index === 0 ? 'teachers' : 'students')}
            ariaLabel="Select audience type"
          />
        </div>

        <div className="mx-auto mt-16 grid max-w-[1020px] grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
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
