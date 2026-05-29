import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import demoSrc from "../../assets/demo.mp4";

// ─────────────────────────────────────────────
// Preview player — lives inside BrowserMockup
// ─────────────────────────────────────────────

interface DemoVideoPreviewProps {
  onExpand: () => void;
}

export function DemoVideoPreview({ onExpand }: DemoVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Lazy-load: only call video.load() once the mockup scrolls into view.
  // preload="none" prevents the browser from fetching anything upfront.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            video.load();
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "300px" }, // start fetching 300 px before entering viewport
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onExpand();
      }
    },
    [onExpand],
  );

  return (
    <div
      ref={wrapperRef}
      role="button"
      tabIndex={0}
      aria-label="Play full demo video"
      className="group relative h-full w-full cursor-pointer overflow-hidden bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onExpand}
      onKeyDown={handleKeyDown}
    >
      {/* ── Skeleton shimmer — visible until video has data ── */}
      <AnimatePresence>
        {!isReady && (
          <motion.div
            key="skeleton"
            className="pointer-events-none absolute inset-0 overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900" />
            {/* Travelling shimmer line */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            />
            {/* Fake UI skeleton lines */}
            <div className="absolute left-6 top-6 space-y-3">
              <div className="h-3 w-48 rounded-full bg-white/8" />
              <div className="h-3 w-64 rounded-full bg-white/5" />
            </div>
            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-3">
              {[72, 52, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-white/5"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Actual video — muted autoplay loop for ambient preview ── */}
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        tabIndex={-1}
        onCanPlay={() => setIsReady(true)}
      >
        <source src={demoSrc} type="video/mp4" />
      </video>

      {/* ── Hover overlay ── */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-black/30"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* ── Play button — always visible at low opacity on mobile, hover on desktop ── */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        animate={{ opacity: isHovered ? 1 : 0.45 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:h-16 sm:w-16"
          animate={{ scale: isHovered ? 1 : 0.88 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          {/* Play triangle */}
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 translate-x-0.5 fill-slate-900 sm:h-6 sm:w-6"
            aria-hidden="true"
          >
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </motion.div>
      </motion.div>

      {/* ── "Expand" pill — only on hover ── */}
      <motion.div
        className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/85 backdrop-blur-sm"
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 4 }}
        transition={{ duration: 0.2 }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="currentColor" aria-hidden="true">
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
        </svg>
        Full screen
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Fullscreen modal
// ─────────────────────────────────────────────

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoVideoModal({ isOpen, onClose }: DemoVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // ESC to close + body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  // Pause video when modal closes to avoid ghost audio
  useEffect(() => {
    if (!isOpen) {
      videoRef.current?.pause();
    }
  }, [isOpen]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const panelVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, scale: 0.93, y: 20 }, visible: { opacity: 1, scale: 1, y: 0 } };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="video-modal-backdrop"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.25 }}
          onClick={onClose}
          aria-modal="true"
          role="dialog"
          aria-label="Demo video"
        >
          {/* Blurred dark backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Ambient glow behind the panel */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(33,145,246,0.3) 40%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />

          {/* Panel */}
          <motion.div
            key="video-modal-panel"
            className="relative z-10 w-full max-w-5xl"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video wrapper with subtle border + shadow */}
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.7)] ring-1 ring-inset ring-white/5">
              <video
                ref={videoRef}
                className="block w-full"
                controls
                autoPlay
                playsInline
                preload="auto"
              >
                <source src={demoSrc} type="video/mp4" />
                Your browser does not support the video element.
              </video>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close video"
              className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90 ring-1 ring-white/15 backdrop-blur-sm transition-colors duration-150 hover:bg-white/20 active:scale-95 sm:-right-4 sm:-top-4"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </motion.div>

          {/* Keyboard hint */}
          <motion.p
            className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/30 select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            aria-hidden="true"
          >
            Press <kbd className="mx-1 rounded border border-white/20 px-1.5 py-0.5 font-mono text-[10px] text-white/40">ESC</kbd> to close
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
