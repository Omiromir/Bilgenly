import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../app/providers/AuthProvider";
import { saveMyPreferences } from "../../dashboard/api/preferencesApi";
import {
  buildOnboardingDraftOwnerKey,
  clearOnboardingDraft,
  getOnboardingDraft,
  getRegistrationDraft,
  saveOnboardingDraft,
} from "../../auth/registrationDraft";
import { getDashboardPathByRole } from "../../../lib/auth";
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
import type { OnboardingAnswers } from "../../auth/types";
import type { StepKey } from "../types";

const backMap: Partial<Record<StepKey, StepKey>> = {
  role: "welcome",
  goal: "role",
  experience: "goal",
  pace: "experience",
  reminder: "pace",
};

function getSafeInitialStep(step?: StepKey): StepKey {
  if (!step || step === "signup" || step === "email") {
    return "welcome";
  }

  return step === "loading" ? "recommendations" : step;
}

function hasRequiredAnswers(answers: OnboardingAnswers): answers is OnboardingAnswers & {
  experience: string;
  goal: string;
  pace: string;
  role: "teacher" | "student";
} {
  return Boolean(
    answers.role &&
      answers.goal &&
      answers.experience &&
      answers.pace,
  );
}

export function BilgenlyOnboarding() {
  const navigate = useNavigate();
  const registrationDraft = getRegistrationDraft();
  const {
    completeOnboardingForAuthenticatedUser,
    completeRegistration,
    currentUser,
    isAuthenticated,
    onboardingCompleted,
  } = useAuth();
  const draftOwnerKey = buildOnboardingDraftOwnerKey({
    registrationEmail: registrationDraft?.email,
    userEmail: currentUser?.email,
    userId: currentUser?.id,
  });
  const persistedDraft = getOnboardingDraft();
  const isDraftOwnerValid =
    !persistedDraft?.ownerKey || persistedDraft.ownerKey === draftOwnerKey;
  const safePersistedDraft = isDraftOwnerValid ? persistedDraft : null;
  const [step, setStep] = useState<StepKey>(() => getSafeInitialStep(safePersistedDraft?.step));
  const [selected, setSelected] = useState<OnboardingAnswers>(() => safePersistedDraft?.answers ?? {});
  const [reminderTime, setReminderTime] = useState(
    () => safePersistedDraft?.reminderTime ?? "12:00 PM",
  );
  const [loadingPct, setLoadingPct] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isAuthenticatedIncompleteUser = isAuthenticated && !onboardingCompleted;

  const go = (next: StepKey) => {
    setFadeIn(false);
    setTimeout(() => {
      setStep(next);
      setFadeIn(true);
    }, 220);
  };

  const handleBack = () => {
    const prev = backMap[step];
    if (prev) go(prev);
  };

  useEffect(() => {
    if (persistedDraft && !isDraftOwnerValid) {
      clearOnboardingDraft();
      setStep("welcome");
      setSelected({});
      setReminderTime("12:00 PM");
      setSubmitError(null);
    }
  }, [isDraftOwnerValid, persistedDraft]);

  useEffect(() => {
    saveOnboardingDraft({
      answers: selected,
      ownerKey: draftOwnerKey ?? undefined,
      reminderTime,
      step,
      updatedAt: new Date().toISOString(),
    });
  }, [draftOwnerKey, reminderTime, selected, step]);

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

  const handleReminderContinue = () => {
    setSelected((current) => ({
      ...current,
      reminderTime,
    }));
    go("loading");
  };

  const handleReminderSkip = () => {
    setSelected((current) => ({
      ...current,
      reminderTime: null,
    }));
    go("loading");
  };

  const handleFinishOnboarding = async () => {
    if (!hasRequiredAnswers(selected)) {
      setSubmitError("Choose your role and complete the required onboarding steps to continue.");
      return;
    }

    const finalAnswers = {
      experience: selected.experience,
      goal: selected.goal,
      pace: selected.pace,
      reminderTime: selected.reminderTime ?? null,
      role: selected.role,
    };

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const completedUser = registrationDraft
        ? await completeRegistration({
            onboarding: finalAnswers,
            registration: registrationDraft,
          })
        : isAuthenticatedIncompleteUser
          ? await completeOnboardingForAuthenticatedUser(finalAnswers)
          : null;

      if (!completedUser) {
        throw new Error("Your registration draft is missing. Please start from sign up again.");
      }

      clearOnboardingDraft();

      // Persist study reminder time to user preferences if set
      if (finalAnswers.reminderTime) {
        saveMyPreferences({
          themeMode: "system",
          language: "en",
          dateFormat: "MM/DD/YYYY",
          timeZone: "UTC",
          notifyEmailQuizAssignments: true,
          notifyEmailGradingUpdates: true,
          notifyEmailAchievementAlerts: true,
          notifyEmailDeadlineReminders: true,
          notifyPushRealTimeUpdates: true,
          notifyPushWeeklySummaries: true,
          studyReminderTime: finalAnswers.reminderTime,
        }).catch(() => {/* non-critical */});
      }

      navigate(getDashboardPathByRole(finalAnswers.role), { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  const progress = progressMap[step] || 0;

  return (
    <div className="ob-page">
      <style>{onboardingStyles}</style>

      {/* Loading is full-screen standalone */}
      {step === "loading" && <LoadingStep loadingPct={loadingPct} />}

      {/* Welcome is full-screen standalone */}
      {step === "welcome" && <WelcomeStep go={go} />}

      {/* All other steps use the progress bar layout */}
      {step !== "welcome" && step !== "loading" && (
        <>
          {/* Full-width top bar */}
          <div className="ob-topbar">
            {backMap[step] && (
              <button
                className="ob-back-btn"
                type="button"
                onClick={handleBack}
                aria-label="Go back"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {progress > 0 && (
              <div className="ob-progress-track">
                <div className="ob-progress-fill" style={{ width: `${(progress / totalSteps) * 100}%` }} />
              </div>
            )}
          </div>

          <div className="ob-content">
            <div
              className={fadeIn ? "ob-inner ob-fade" : "ob-inner"}
              style={{ opacity: fadeIn ? 1 : 0 }}
            >
              {step === "role" && <RoleStep go={go} selected={selected} setSelected={setSelected} />}
              {step === "goal" && <GoalStep go={go} selected={selected} setSelected={setSelected} />}
              {step === "experience" && <ExperienceStep go={go} selected={selected} setSelected={setSelected} />}
              {step === "pace" && <PaceStep go={go} selected={selected} setSelected={setSelected} />}
              {step === "reminder" && (
                <ReminderStep
                  go={go}
                  reminderTime={reminderTime}
                  setReminderTime={setReminderTime}
                  onContinue={handleReminderContinue}
                  onSkip={handleReminderSkip}
                />
              )}
              {step === "recommendations" && (
                <RecommendationsStep
                  onContinue={handleFinishOnboarding}
                  isLoading={isSubmitting}
                  error={submitError}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
