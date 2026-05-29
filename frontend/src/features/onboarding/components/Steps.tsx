import { useRef, useState, useEffect, type Dispatch, type SetStateAction } from "react";
import logoPng from "../../../assets/logo.png";
import {
  experienceOptions,
  getGoalOptionsForRole,
  paceOptions,
  reminderTimes,
  roleOptions,
} from "../content";
import type { ChoiceOption, SelectedAnswers, StepKey } from "../types";

interface SharedStepProps {
  go: (next: StepKey) => void;
}
interface ChoiceStepProps extends SharedStepProps {
  selected: SelectedAnswers;
  setSelected: Dispatch<SetStateAction<SelectedAnswers>>;
}
interface ReminderStepProps extends SharedStepProps {
  onContinue: () => void;
  onSkip: () => void;
  reminderTime: string;
  setReminderTime: Dispatch<SetStateAction<string>>;
}
interface LoadingStepProps {
  loadingPct: number;
}

// Auto-advancing choice list — selects then advances after brief delay
function ChoiceList({
  options,
  selectedValue,
  onSelect,
  onAdvance,
}: {
  options: ChoiceOption[];
  selectedValue?: string;
  onSelect: (id: string) => void;
  onAdvance: (id: string) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = (id: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onSelect(id);
    timerRef.current = setTimeout(() => onAdvance(id), 280);
  };

  return (
    <div className="ob-options">
      {options.map((option, i) => (
        <button
          key={option.id}
          type="button"
          className={`ob-option${selectedValue === option.id ? " selected" : ""}`}
          onClick={() => handleClick(option.id)}
        >
          <div className="ob-option-icon">{option.emoji}</div>
          <div className="ob-option-text">
            <div className="ob-option-label">{option.label}</div>
            {option.sub && <div className="ob-option-sub">{option.sub}</div>}
          </div>
          <div className="ob-option-badge">{i + 1}</div>
        </button>
      ))}
    </div>
  );
}

export function WelcomeStep({ go }: SharedStepProps) {
  return (
    <div className="ob-welcome-page">
      <div className="ob-welcome-card">
        <div className="ob-welcome-logo">
          <img src={logoPng} alt="Bilgenly" width={44} height={44} />
        </div>
        <h1 className="ob-welcome-title">Welcome to Bilgenly!</h1>
        <p className="ob-welcome-subtitle">
          To personalize your experience, we'll ask you a few quick questions.
        </p>
        <button
          className="ob-btn-primary"
          type="button"
          onClick={() => go("role")}
          style={{ marginTop: 0 }}
        >
          Get started
        </button>
      </div>
    </div>
  );
}

export function RoleStep({ go, selected, setSelected }: ChoiceStepProps) {
  return (
    <div>
      <h2 className="ob-step-title">Which describes you best?</h2>
      <p className="ob-step-subtitle">Choose your role — we'll set up the right dashboard for you.</p>
      <ChoiceList
        options={roleOptions}
        selectedValue={selected.role}
        onSelect={(role) => setSelected((c) => ({ ...c, role }))}
        onAdvance={() => go("goal")}
      />
    </div>
  );
}

export function GoalStep({ go, selected, setSelected }: ChoiceStepProps) {
  const goalOptions = getGoalOptionsForRole(selected.role);
  return (
    <div>
      <h2 className="ob-step-title">What's your main goal?</h2>
      <p className="ob-step-subtitle">We'll focus your experience around what matters most.</p>
      <ChoiceList
        options={goalOptions}
        selectedValue={selected.goal}
        onSelect={(goal) => setSelected((c) => ({ ...c, goal }))}
        onAdvance={() => go("experience")}
      />
    </div>
  );
}

export function ExperienceStep({ go, selected, setSelected }: ChoiceStepProps) {
  return (
    <div>
      <h2 className="ob-step-title">How familiar are you with digital learning tools?</h2>
      <p className="ob-step-subtitle">We'll adjust the interface complexity for you.</p>
      <ChoiceList
        options={experienceOptions}
        selectedValue={selected.experience}
        onSelect={(experience) => setSelected((c) => ({ ...c, experience }))}
        onAdvance={() => go("pace")}
      />
    </div>
  );
}

export function PaceStep({ go, selected, setSelected }: ChoiceStepProps) {
  return (
    <div>
      <h2 className="ob-step-title">How often do you want to practice?</h2>
      <p className="ob-step-subtitle">Your streaks will be calibrated to your pace.</p>
      <ChoiceList
        options={paceOptions}
        selectedValue={selected.pace}
        onSelect={(pace) => setSelected((c) => ({ ...c, pace }))}
        onAdvance={() => go("reminder")}
      />
    </div>
  );
}

function TimePickerDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll selected item into view when opening
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (open && listRef.current) {
      const selected = listRef.current.querySelector("[aria-selected='true']") as HTMLElement | null;
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [open]);

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* Trigger button */}
      <button
        type="button"
        className="ob-reminder-select-wrap"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ cursor: "pointer", userSelect: "none", minWidth: 160, justifyContent: "space-between" }}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>{value}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          style={{ color: "#4F46E5", flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown list — always opens upward */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Select reminder time"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            minWidth: 180,
            maxHeight: 260,
            overflowY: "auto",
            background: "#fff",
            border: "1.5px solid #E5E7EB",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.13)",
            padding: "6px 0",
            zIndex: 100,
            listStyle: "none",
            margin: 0,
          }}
        >
          {options.map((t) => {
            const isSelected = t === value;
            return (
              <li
                key={t}
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(t); setOpen(false); }}
                style={{
                  padding: "9px 18px",
                  fontSize: 14,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "#4F46E5" : "#111827",
                  background: isSelected ? "#EEF2FF" : "transparent",
                  cursor: "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#F5F3FF";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {t}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ReminderStep({ onContinue, onSkip, reminderTime, setReminderTime }: ReminderStepProps) {
  return (
    <div className="ob-reminder-body">
      <span className="ob-reminder-icon">🔔</span>
      <h2 className="ob-step-title">Set a daily study reminder</h2>
      <p className="ob-step-subtitle" style={{ marginBottom: 32 }}>
        Stay consistent — we'll nudge you at the right time. You can always change this later.
      </p>
      <TimePickerDropdown
        value={reminderTime}
        onChange={setReminderTime}
        options={reminderTimes}
      />
      <div className="ob-reminder-footer">
        <button className="ob-btn-later" type="button" onClick={onSkip}>
          I'll do this later
        </button>
        <button className="ob-btn-save" type="button" onClick={onContinue}>
          Save reminder
        </button>
      </div>
    </div>
  );
}

export function LoadingStep({ loadingPct: _ }: LoadingStepProps) {
  return (
    <div className="ob-loading-page">
      <div className="ob-loading-logo-wrap">
        <img src={logoPng} alt="Bilgenly" width={56} height={56} />
      </div>
      <p className="ob-loading-text">
        Customizing your experience
        <span className="ob-loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </p>
    </div>
  );
}

interface RecommendationsStepProps {
  onContinue: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function RecommendationsStep({ onContinue, isLoading, error }: RecommendationsStepProps) {
  return (
    <div className="ob-done-wrap">
      <div className="ob-done-icon">🎉</div>
      <h2 className="ob-done-title">You're all set!</h2>
      <p className="ob-done-sub">
        Your personalized dashboard is ready.<br />Let's get started.
      </p>
      {error && <p className="ob-error">{error}</p>}
      <button
        className="ob-btn-primary"
        type="button"
        onClick={onContinue}
        disabled={isLoading}
        style={{ marginTop: 36 }}
      >
        {isLoading ? "Creating account…" : "Go to my dashboard"}
      </button>
    </div>
  );
}
