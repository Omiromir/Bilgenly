import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getDashboardPathByRole } from "../../../lib/auth";
import { BilgenlyLogo } from "../../../components/shared/BilgenlyLogo";
import { progressMap, totalSteps } from "../content";
import { onboardingStyles } from "../styles";
import {
  ExperienceStep,
  GoalStep,
  LoadingStep,
  PaceStep,
  RecommendationsStep,
  ReminderStep,
  RoleStep,
  WelcomeStep,
} from "./Steps";
import type { SelectedAnswers, StepKey } from "../types";

export function BilgenlyOnboarding() {
  const [step, setStep] = useState<StepKey>("welcome");
  const [selected, setSelected] = useState<SelectedAnswers>({});
  const [reminderTime, setReminderTime] = useState("12:00 PM");
  const [loadingPct, setLoadingPct] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  const { signInAsRole } = useAuth();
  const navigate = useNavigate();

  const go = (next: StepKey) => {
    setFadeIn(false);
    setTimeout(() => {
      setStep(next);
      setFadeIn(true);
    }, 220);
  };

  useEffect(() => {
    if (step !== "loading") {
      return undefined;
    }

    setLoadingPct(0);

    const interval = setInterval(() => {
      setLoadingPct((current) => {
        if (current >= 100) {
          clearInterval(interval);
          setTimeout(() => go("recommendations"), 400);
          return 100;
        }

        return current + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [step]);

  const handleFinishOnboarding = () => {
    if (!selected.role) {
      return;
    }

    signInAsRole(selected.role);
    navigate(getDashboardPathByRole(selected.role));
  };

  const progress = progressMap[step] || 0;
  const isWelcomeStep = step === "welcome";

  return (
    <div
      className="onboarding-page"
      style={{
        minHeight: "100dvh",
        background: "#f8f7ff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        padding: "0",
      }}
    >
      <style>{onboardingStyles}</style>

      {isWelcomeStep ? (
        <section
          className="welcome-screen"
          style={{
            width: "100%",
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            padding: "28px 0 40px",
          }}
        >
          <div
            className="onboarding-shell"
            style={{
              width: "100%",
              maxWidth: 440,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BilgenlyLogo size={30} />
          </div>

          <div className="welcome-screen__content">
            <div
              className={fadeIn ? "fade welcome-screen__inner" : "welcome-screen__inner"}
              style={{ opacity: fadeIn ? 1 : 0 }}
            >
              <WelcomeStep go={go} />
            </div>
          </div>
        </section>
      ) : (
        <>
          <div
            className="onboarding-shell onboarding-header"
            style={{
              width: "100%",
              maxWidth: 440,
              padding: "28px 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
              }}
            >
              <BilgenlyLogo size={30} />
            </div>

            {progress > 0 && (
              <span style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>
                Step {progress} of {totalSteps}
              </span>
            )}
          </div>

          {progress > 0 && (
            <div
              className="onboarding-shell onboarding-progress"
              style={{
                width: "100%",
                maxWidth: 440,
                margin: "12px 0 0",
                padding: "0",
              }}
            >
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(progress / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div
            className="onboarding-shell onboarding-card-wrap"
            style={{
              width: "100%",
              maxWidth: 440,
              marginTop: 24,
              padding: "0 0 60px",
            }}
          >
            <div
              className={fadeIn ? "fade card" : "card"}
              style={{ opacity: fadeIn ? 1 : 0 }}
            >
              {step === "role" && (
                <RoleStep go={go} selected={selected} setSelected={setSelected} />
              )}
              {step === "goal" && (
                <GoalStep go={go} selected={selected} setSelected={setSelected} />
              )}
              {step === "experience" && (
                <ExperienceStep
                  go={go}
                  selected={selected}
                  setSelected={setSelected}
                />
              )}
              {step === "pace" && (
                <PaceStep go={go} selected={selected} setSelected={setSelected} />
              )}
              {step === "reminder" && (
                <ReminderStep
                  go={go}
                  reminderTime={reminderTime}
                  setReminderTime={setReminderTime}
                />
              )}
              {step === "loading" && <LoadingStep loadingPct={loadingPct} />}
              {step === "recommendations" && (
                <RecommendationsStep onContinue={handleFinishOnboarding} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
