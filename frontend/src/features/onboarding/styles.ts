export const onboardingStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .ob-page {
    min-height: 100dvh; background: #ffffff; display: flex; flex-direction: column;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* ── Top bar (back + progress) ── */
  .ob-topbar {
    width: 100%; padding: 22px 28px 0; display: flex; align-items: center; gap: 16px;
  }
  .ob-back-btn {
    background: none; border: none; cursor: pointer; display: flex; align-items: center;
    justify-content: center; width: 32px; height: 32px; min-width: 32px; border-radius: 8px;
    color: #6B7280; transition: background 0.15s, color 0.15s; padding: 0;
  }
  .ob-back-btn:hover { background: #F3F4F6; color: #111827; }
  .ob-back-btn:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
  .ob-progress-track {
    flex: 1; height: 6px; background: #E5E7EB; border-radius: 99px; overflow: hidden;
  }
  .ob-progress-fill {
    height: 100%; background: #4F46E5; border-radius: 99px; transition: width 0.4s ease;
  }

  /* ── Content ── */
  .ob-content {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    padding: 48px 24px 60px;
  }
  .ob-inner { width: 100%; max-width: 520px; }
  .ob-fade { animation: obFadeUp 0.25s ease forwards; }
  @keyframes obFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

  /* ── Step titles ── */
  .ob-step-title {
    font-size: 22px; font-weight: 700; color: #111827; text-align: center;
    letter-spacing: -0.02em; line-height: 1.3; margin-bottom: 6px;
  }
  .ob-step-subtitle {
    font-size: 14px; color: #6B7280; text-align: center; line-height: 1.6; margin-bottom: 28px;
  }

  /* ── Option rows ── */
  .ob-options { display: flex; flex-direction: column; gap: 10px; }
  .ob-option {
    width: 100%; display: flex; align-items: center; gap: 14px; padding: 14px 16px;
    border: 1.5px solid #E5E7EB; border-radius: 14px; background: #fff; cursor: pointer;
    transition: border-color 0.15s, background 0.15s, transform 0.1s; text-align: left;
    font-family: inherit;
  }
  .ob-option:hover { border-color: #A5B4FC; background: #F5F3FF; }
  .ob-option:active { transform: scale(0.99); }
  .ob-option:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
  .ob-option.selected { border-color: #4F46E5; background: #EEF2FF; }

  .ob-option-icon {
    width: 40px; height: 40px; min-width: 40px; border-radius: 10px; background: #F3F4F6;
    display: flex; align-items: center; justify-content: center; font-size: 20px;
    transition: background 0.15s;
  }
  .ob-option.selected .ob-option-icon { background: #E0E7FF; }

  .ob-option-text { flex: 1; min-width: 0; }
  .ob-option-label { font-size: 15px; font-weight: 600; color: #111827; line-height: 1.3; }
  .ob-option-sub { font-size: 13px; color: #6B7280; margin-top: 2px; line-height: 1.4; }

  .ob-option-badge {
    width: 28px; height: 28px; min-width: 28px; border-radius: 8px; background: #F3F4F6;
    color: #9CA3AF; font-size: 12px; font-weight: 700; display: flex; align-items: center;
    justify-content: center; transition: background 0.15s, color 0.15s;
  }
  .ob-option.selected .ob-option-badge { background: #4F46E5; color: #fff; }

  /* ── Primary button ── */
  .ob-btn-primary {
    width: 100%; height: 52px; border-radius: 12px; background: #4F46E5; color: #fff;
    border: none; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s; letter-spacing: 0.01em;
    margin-top: 20px;
  }
  .ob-btn-primary:hover { background: #4338CA; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.28); }
  .ob-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
  .ob-btn-primary:active { transform: scale(0.98); }
  .ob-btn-primary:focus-visible { outline: 2px solid #4F46E5; outline-offset: 3px; }

  /* ── Welcome screen ── */
  .ob-welcome-page {
    min-height: 100dvh; background: #fff; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 40px 24px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .ob-welcome-card {
    width: 100%; max-width: 420px; background: #fff; border: 1.5px solid #E5E7EB;
    border-radius: 20px; padding: 40px 36px; text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.07);
  }
  .ob-welcome-logo { margin-bottom: 24px; display: flex; justify-content: center; }
  .ob-welcome-title {
    font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.02em;
    line-height: 1.25; margin-bottom: 10px;
  }
  .ob-welcome-subtitle {
    font-size: 15px; color: #6B7280; line-height: 1.65; margin-bottom: 28px;
  }

  /* ── Reminder step ── */
  .ob-reminder-body { text-align: center; padding: 12px 0; }
  .ob-reminder-icon { font-size: 52px; display: block; margin-bottom: 16px; }
  .ob-reminder-select-wrap {
    display: inline-flex; align-items: center; gap: 8px; border: 1.5px solid #E5E7EB;
    border-radius: 12px; padding: 12px 20px; background: #fff; font-size: 15px;
    font-weight: 600; color: #111827; margin-bottom: 8px; cursor: pointer;
    transition: border-color 0.15s;
  }
  .ob-reminder-select-wrap:hover { border-color: #A5B4FC; }
  .ob-reminder-select {
    appearance: none; background: none; border: none; font-size: 15px; font-weight: 600;
    color: #111827; cursor: pointer; outline: none; font-family: inherit;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234F46E5' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 0 center; padding-right: 22px;
  }
  .ob-reminder-footer {
    display: flex; align-items: center; justify-content: space-between; margin-top: 40px;
    padding-top: 20px; border-top: 1px solid #F3F4F6; gap: 12px;
  }
  .ob-btn-later {
    background: #F3F4F6; border: none; border-radius: 10px; padding: 12px 20px;
    font-size: 14px; font-weight: 600; color: #4B5563; cursor: pointer; font-family: inherit;
    transition: background 0.15s;
  }
  .ob-btn-later:hover { background: #E5E7EB; }
  .ob-btn-save {
    background: #4F46E5; border: none; border-radius: 10px; padding: 12px 28px;
    font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; font-family: inherit;
    transition: background 0.15s;
  }
  .ob-btn-save:hover { background: #4338CA; }

  /* ── Loading screen ── */
  .ob-loading-page {
    min-height: 100dvh; background: #fff; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 40px 24px; text-align: center;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .ob-loading-logo-wrap { margin-bottom: 20px; }
  .ob-loading-text { font-size: 17px; font-weight: 600; color: #111827; letter-spacing: -0.01em; }
  .ob-loading-dots span {
    display: inline-block; animation: obDot 1.4s infinite;
    font-size: 17px; font-weight: 600; color: #111827;
  }
  .ob-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .ob-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes obDot { 0%,80%,100% { opacity:0.3; } 40% { opacity:1; } }

  /* ── Done / Recommendations screen ── */
  .ob-done-wrap {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding: 24px 0 8px;
  }
  .ob-done-icon { font-size: 56px; line-height: 1; margin-bottom: 20px; }
  .ob-done-title {
    font-size: 26px; font-weight: 700; color: #111827; letter-spacing: -0.02em;
    line-height: 1.2; margin-bottom: 12px;
  }
  .ob-done-sub {
    font-size: 15px; color: #6B7280; line-height: 1.7; margin: 0;
  }
  .ob-done-wrap .ob-btn-primary { width: 100%; }

  .ob-error { color: #DC2626; font-size: 13px; text-align: center; margin-bottom: 8px; margin-top: 4px; }

  /* ── Auth styles (unchanged, needed for sign-in/sign-up pages) ── */
  .auth-brand-name { font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.03em; font-family: 'Montserrat', sans-serif; }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .ob-topbar { padding: 16px 20px 0; gap: 12px; }
    .ob-content { padding: 36px 20px 48px; }
    .ob-step-title { font-size: 19px; }
    .ob-step-subtitle { font-size: 13px; }
    .ob-welcome-card { padding: 32px 24px; border-radius: 16px; }
    .ob-welcome-title { font-size: 20px; }
    .ob-welcome-subtitle { font-size: 14px; }
    .ob-rec-grid { grid-template-columns: 1fr; }
    .ob-option { padding: 13px 14px; }
    .ob-option-label { font-size: 14px; }
    .ob-option-sub { font-size: 12px; }
    .ob-btn-primary { height: 50px; font-size: 14px; }
    .ob-reminder-footer { margin-top: 28px; }
  }
  @media (max-width: 420px) {
    .ob-topbar { padding: 14px 16px 0; }
    .ob-content { padding: 28px 16px 40px; }
    .ob-step-title { font-size: 18px; }
    .ob-option-icon { width: 36px; height: 36px; min-width: 36px; font-size: 18px; }
  }
`;
