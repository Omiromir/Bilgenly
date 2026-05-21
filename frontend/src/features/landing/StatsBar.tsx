const stats = [
  { value: "10k+", label: "Educators Worldwide" },
  { value: "500k+", label: "Quizzes Generated" },
  { value: "95%", label: "AI Accuracy Rate" },
  { value: "4.9★", label: "Average Rating" },
];

export function StatsBar() {
  return (
    <div className="relative overflow-hidden border-y border-[#F3F4F6] bg-white px-4 py-7 sm:px-6 lg:px-8 dark:border-[#2a3858] dark:bg-[#0d1424]">
      {/* Subtle gradient side fades */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent dark:from-[#0d1424]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent dark:from-[#0d1424]"
      />

      <div className="mx-auto max-w-[1200px]">
        {/* 2-col grid on mobile, single row on sm+ */}
        <div className="grid grid-cols-2 gap-6 sm:flex sm:items-center sm:justify-center sm:gap-0">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center justify-center sm:contents">
              {/* Separator only on sm+ between items */}
              {i > 0 && (
                <div
                  aria-hidden="true"
                  className="mx-10 hidden h-10 w-px shrink-0 bg-[#E5E7EB] sm:block lg:mx-14 dark:bg-[#2a3858]"
                />
              )}
              <div className="text-center">
                <p className="font-['Montserrat',sans-serif] text-[22px] font-extrabold leading-none tracking-[-0.02em] text-[#111827] sm:text-[28px] dark:text-[#f5f8ff]">
                  {stat.value}
                </p>
                <p className="mt-1.5 font-['Inter',sans-serif] text-[12px] font-medium text-[#6B7280] sm:text-[13px] dark:text-[#9aa8c6]">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
