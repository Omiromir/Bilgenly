import svgPaths from '../../../imports/svg-lz8yvnizs1';

export interface BrowserMockupProps {
  url?: string;
  children?: React.ReactNode;
}

export function BrowserMockup({ url = 'bilgenly.com', children }: BrowserMockupProps) {
  return (
    <div className="relative w-[1030px]">
      {/* Top Bar */}
      <div className="bg-[#4B5563] h-[56px] rounded-tl-[50px] rounded-tr-[50px] flex items-center justify-between px-6 py-1">
        {/* Left Buttons */}
        <div className="flex gap-6 items-center">
          {/* macOS Window Controls */}
          <div className="relative h-3 w-[52px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 52 12">
              <g id="OS">
                <path
                  clipRule="evenodd"
                  d={svgPaths.p2ca50880}
                  fill="#ED6A5E"
                  fillRule="evenodd"
                />
                <path
                  clipRule="evenodd"
                  d={svgPaths.pdd4ef00}
                  fill="#F4BF4F"
                  fillRule="evenodd"
                />
                <path
                  clipRule="evenodd"
                  d={svgPaths.p8a40a00}
                  fill="#61C554"
                  fillRule="evenodd"
                />
              </g>
            </svg>
          </div>

          {/* Navigation Arrows */}
          <div className="flex gap-3 items-center">
            {/* Left Arrow */}
            <div className="relative h-5 w-5">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                <g>
                  <path
                    clipRule="evenodd"
                    d={svgPaths.p33cb2080}
                    fill="#8C8C8C"
                    fillRule="evenodd"
                  />
                </g>
              </svg>
            </div>

            {/* Right Arrow */}
            <div className="relative h-5 w-5">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                <g>
                  <g>
                    <path
                      clipRule="evenodd"
                      d={svgPaths.p3d1f7880}
                      fill="black"
                      fillOpacity="0.1"
                      fillRule="evenodd"
                    />
                    <path d={svgPaths.p3ebb9600} stroke="black" strokeOpacity="0.1" strokeWidth="0.0625" />
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Address Bar */}
        <div className="bg-[#F1F1F1] h-7 w-[480px] rounded-lg flex items-center gap-2 px-2 py-1">
          <div className="flex items-center gap-1 flex-1">
            {/* Lock Icon */}
            <div className="relative h-4 w-4">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <g>
                  <path d={svgPaths.p3221d880} fill="#8C8C8C" />
                </g>
              </svg>
            </div>
            <p className="font-['Inter',sans-serif] text-[13px] text-[#151515]">{url}</p>
          </div>

          {/* Refresh Icon */}
          <div className="relative h-4 w-4">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
              <g clipPath="url(#clip0_2_494)">
                <path
                  clipRule="evenodd"
                  d={svgPaths.p1991a080}
                  fill="#8C8C8C"
                  fillRule="evenodd"
                />
                <path
                  clipRule="evenodd"
                  d={svgPaths.p3a37da80}
                  fill="#8C8C8C"
                  fillRule="evenodd"
                />
              </g>
              <defs>
                <clipPath id="clip0_2_494">
                  <rect fill="white" height="16" width="16" />
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>

        {/* Right Buttons */}
        <div className="flex gap-5 items-center">
          {/* Share Icon */}
          <div className="relative h-5 w-5">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
              <g>
                <path
                  clipRule="evenodd"
                  d={svgPaths.p398fb480}
                  fill="#8C8C8C"
                  fillRule="evenodd"
                />
                <path
                  clipRule="evenodd"
                  d={svgPaths.paf12d00}
                  fill="#8C8C8C"
                  fillRule="evenodd"
                />
                <path
                  clipRule="evenodd"
                  d={svgPaths.p1b62c80}
                  fill="#8C8C8C"
                  fillRule="evenodd"
                />
              </g>
            </svg>
          </div>

          {/* New Tab Icon */}
          <div className="relative h-5 w-5">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
              <g>
                <path d={svgPaths.p29007880} fill="#8C8C8C" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-[rgba(135,132,132,0.15)] h-[267px]">{children}</div>
    </div>
  );
}
