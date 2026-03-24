import type { Dispatch, SetStateAction } from "react";
import {
  experienceOptions,
  goalOptions,
  paceOptions,
  recommendations,
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
  reminderTime: string;
  setReminderTime: Dispatch<SetStateAction<string>>;
}

interface LoadingStepProps {
  loadingPct: number;
}

function ChoiceList({
  options,
  selectedValue,
  onSelect,
}: {
  options: ChoiceOption[];
  selectedValue?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`option-row ${selectedValue === option.id ? "selected" : ""}`}
          onClick={() => onSelect(option.id)}
        >
          <div className="option-copy">
            <div className="label">{option.label}</div>
            <div className="sub">{option.sub}</div>
          </div>
          <span className="radio-dot" />
        </button>
      ))}
    </>
  );
}

export function WelcomeStep({ go }: SharedStepProps) {
  return (
    <div className="welcome-step">
      <h1 className="welcome-title">Welcome to Bilgenly!</h1>
      <p className="welcome-subtitle">
        Your AI study companion is ready.
        <br />
        Let&apos;s set up your personalized experience.
      </p>
      <button
        className="btn-primary"
        type="button"
        onClick={() => go("role")}
        style={{ maxWidth: 260 }}
      >
        Get started
      </button>
    </div>
  );
}

export function RoleStep({ go, selected, setSelected }: ChoiceStepProps) {
  return (
    <div>
      <h2 className="step-title">Which describes you best?</h2>
      <p className="step-subtitle">
        We&apos;ll set up the right dashboard and tools for your role.
      </p>
      <ChoiceList
        options={roleOptions}
        selectedValue={selected.role}
        onSelect={(role) => setSelected((current) => ({ ...current, role }))}
      />
      <button
        className="btn-primary"
        style={{ marginTop: 6 }}
        type="button"
        onClick={() => go("goal")}
        disabled={!selected.role}
      >
        Continue
      </button>
    </div>
  );
}

export function GoalStep({ go, selected, setSelected }: ChoiceStepProps) {
  return (
    <div>
      <h2 className="step-title">What&apos;s your main goal?</h2>
      <p className="step-subtitle">
        We&apos;ll focus your experience around what matters most to you.
      </p>
      <ChoiceList
        options={goalOptions}
        selectedValue={selected.goal}
        onSelect={(goal) => setSelected((current) => ({ ...current, goal }))}
      />
      <button
        className="btn-primary"
        style={{ marginTop: 6 }}
        type="button"
        onClick={() => go("experience")}
        disabled={!selected.goal}
      >
        Continue
      </button>
    </div>
  );
}

export function ExperienceStep({
  go,
  selected,
  setSelected,
}: ChoiceStepProps) {
  return (
    <div>
      <h2 className="step-title">
        How familiar are you with digital learning tools?
      </h2>
      <p className="step-subtitle">
        We&apos;ll adjust the onboarding and interface complexity for you.
      </p>
      <ChoiceList
        options={experienceOptions}
        selectedValue={selected.experience}
        onSelect={(experience) =>
          setSelected((current) => ({ ...current, experience }))
        }
      />
      <button
        className="btn-primary"
        style={{ marginTop: 6 }}
        type="button"
        onClick={() => go("pace")}
        disabled={!selected.experience}
      >
        Continue
      </button>
    </div>
  );
}

export function PaceStep({ go, selected, setSelected }: ChoiceStepProps) {
  return (
    <div>
      <h2 className="step-title">How often do you want to practice?</h2>
      <p className="step-subtitle">
        Your points and streaks will be calibrated to your pace.
      </p>
      <ChoiceList
        options={paceOptions}
        selectedValue={selected.pace}
        onSelect={(pace) => setSelected((current) => ({ ...current, pace }))}
      />
      <button
        className="btn-primary"
        style={{ marginTop: 6 }}
        type="button"
        onClick={() => go("reminder")}
        disabled={!selected.pace}
      >
        Continue
      </button>
    </div>
  );
}

export function ReminderStep({
  go,
  reminderTime,
  setReminderTime,
}: ReminderStepProps) {
  return (
    <div className="step-centered">
      <h2 className="step-title">Set a daily study reminder</h2>
      <p className="step-subtitle step-subtitle-tight">
        Stay consistent and earn streak points - we&apos;ll nudge you at the right
        time.
      </p>

      <div className="reminder-box">
        <span style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>
          Daily reminder at
        </span>
        <select
          className="time-select"
          value={reminderTime}
          onChange={(event) => setReminderTime(event.target.value)}
        >
          {reminderTimes.map((time) => (
            <option key={time}>{time}</option>
          ))}
        </select>
      </div>

      <button
        className="btn-primary"
        style={{ marginBottom: 12 }}
        type="button"
        onClick={() => go("loading")}
      >
        Save and continue
      </button>
      <div style={{ textAlign: "center" }}>
        <button className="skip-link" type="button" onClick={() => go("loading")}>
          I&apos;ll do this later
        </button>
      </div>
    </div>
  );
}

export function LoadingStep({ loadingPct }: LoadingStepProps) {
  return (
    <div className="step-centered loading-step">
      <div
        style={{
          position: "relative",
          width: 80,
          height: 80,
          margin: "0 auto 24px",
        }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="#e8e4f8"
            strokeWidth="5"
          />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="url(#spinGrad)"
            strokeWidth="5"
            strokeDasharray={`${
              (2 * Math.PI * 34 * loadingPct) / 100
            } ${2 * Math.PI * 34 * (1 - loadingPct / 100)}`}
            strokeLinecap="round"
            strokeDashoffset={2 * Math.PI * 34 * 0.25}
            style={{ transition: "stroke-dasharray 0.1s linear" }}
          />
          <defs>
            <linearGradient id="spinGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#6D28D9" />
            </linearGradient>
          </defs>
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: "#7C3AED",
          }}
        >
          {loadingPct}%
        </div>
      </div>
      <h2 className="step-title">Building your learning space...</h2>
      <p className="step-subtitle step-subtitle-tight">
        Our AI is personalizing your dashboard and quizzes.
      </p>
    </div>
  );
}

interface RecommendationsStepProps {
  onContinue: () => void;
}

export function RecommendationsStep({
  onContinue,
}: RecommendationsStepProps) {
  return (
    <div>
      <div className="step-centered recommendations-header">
        <h2 className="step-title step-title-lg">You&apos;re all set</h2>
        <p className="step-subtitle step-subtitle-tight">
          Here&apos;s where to start - your AI dashboard is ready.
        </p>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((recommendation, index) => (
          <div key={index} className="rec-card" style={{ flex: 1 }}>
            <span
              className="tag"
              style={{
                background: `${recommendation.tagColor}15`,
                color: recommendation.tagColor,
                marginBottom: 8,
                display: "block",
              }}
            >
              {recommendation.tag}
            </span>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1a1a2e",
                lineHeight: 1.3,
                marginBottom: 4,
              }}
            >
              {recommendation.title}
            </div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {recommendation.sub}
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              {recommendation.time}
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        style={{ marginBottom: 12 }}
        type="button"
        onClick={onContinue}
      >
        Go to my dashboard
      </button>
    </div>
  );
}
