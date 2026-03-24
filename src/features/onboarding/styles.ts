export const onboardingStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .onboarding-page { padding: 0 20px env(safe-area-inset-bottom); }
  .auth-mode { justify-content: center; background: #f3f5f9 !important; }
  .onboarding-shell { width: 100%; max-width: 440px; }
  .welcome-screen { width: 100%; }
  .welcome-screen__content { flex: 1; width: 100%; display: flex; align-items: center; justify-content: center; }
  .welcome-screen__inner { width: 100%; max-width: 640px; margin: 0 auto; text-align: center; }
  .fade { animation: fadeUp 0.28s ease forwards; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .card { background: #fff; border-radius: 24px; box-shadow: 0 18px 48px rgba(109,40,217,0.08); padding: 40px 44px; width: 100%; max-width: 440px; }
  .auth-card { background: transparent; box-shadow: none; padding: 0; max-width: 480px; }
  .btn-primary { background: linear-gradient(135deg,#7C3AED,#6D28D9); color: #fff; border: none; border-radius: 14px; min-height: 52px; padding: 13px 16px; width: 100%; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; letter-spacing: 0.01em; }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(109,40,217,0.35); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-outline { background: #fff; color: #1a1a2e; border: 1.5px solid #e2e0f0; border-radius: 10px; padding: 12px 0; width: 100%; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; transition: all 0.18s; }
  .btn-outline:hover { border-color: #7C3AED; color: #6D28D9; background: #faf9ff; }
  .input-field { width: 100%; border: 1.5px solid #e2e0f0; border-radius: 10px; padding: 12px 14px; font-size: 14px; font-family: inherit; color: #1a1a2e; outline: none; transition: border 0.18s; background: #fff; }
  .input-field:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
  .option-row { border: 1.5px solid #e2e0f0; border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.18s; background: #fff; width: 100%; text-align: left; font-family: inherit; margin-bottom: 10px; }
  .option-row:hover { border-color: #7C3AED; background: #faf9ff; }
  .option-row.selected { border-color: #7C3AED; background: #f5f3ff; }
  .option-copy { min-width: 0; flex: 1; }
  .option-row .label { font-size: 14px; font-weight: 500; color: #1a1a2e; }
  .option-row .sub { font-size: 12px; color: #888; margin-top: 2px; line-height: 1.45; }
  .radio-dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #d0cce8; margin-left: auto; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.18s; }
  .selected .radio-dot { border-color: #7C3AED; background: #7C3AED; }
  .selected .radio-dot::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #fff; display: block; }
  .progress-bar { height: 4px; background: #e8e4f8; border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg,#7C3AED,#6D28D9); border-radius: 4px; transition: width 0.4s ease; }
  .welcome-step { text-align: center; padding: 10px 0; max-width: 560px; margin: 0 auto; }
  .welcome-title { font-weight: 700; font-size: 44px; color: #1a1a2e; margin-bottom: 16px; letter-spacing: -0.02em; line-height: 1.05; }
  .welcome-subtitle { font-size: 18px; color: #777; line-height: 1.6; margin-bottom: 36px; }
  .step-title { font-weight: 700; font-size: 20px; color: #1a1a2e; margin-bottom: 6px; letter-spacing: -0.01em; line-height: 1.2; }
  .step-title-lg { font-size: 22px; letter-spacing: -0.02em; margin-top: 12px; }
  .step-subtitle { font-size: 13px; color: #888; margin-bottom: 20px; line-height: 1.55; }
  .step-subtitle-tight { margin-bottom: 24px; margin-top: 5px; }
  .step-centered { text-align: center; }
  .loading-step { padding: 30px 0; }
  .recommendations-header { margin-bottom: 24px; }
  .divider { display: flex; align-items: center; gap: 12px; color: #bbb; font-size: 13px; margin: 6px 0; }
  .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e8e4f8; }
  .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.03em; }
  .time-select { border: 1.5px solid #e2e0f0; border-radius: 10px; padding: 10px 14px; font-size: 14px; font-family: inherit; color: #1a1a2e; background: #fff; cursor: pointer; outline: none; appearance: none; width: 140px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237C3AED' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px; }
  .rec-card { border: 1.5px solid #e8e4f8; border-radius: 14px; padding: 16px; flex: 1; min-width: 120px; cursor: pointer; transition: all 0.18s; }
  .rec-card:hover { border-color: #7C3AED; box-shadow: 0 4px 16px rgba(109,40,217,0.12); }
  .skip-link { background: none; border: none; color: #888; font-size: 13px; cursor: pointer; font-family: inherit; padding: 0; text-decoration: underline; }
  .skip-link:hover { color: #6D28D9; }
  .recommendations-grid { display: flex; gap: 10px; margin-bottom: 24px; }
  .reminder-box { background: #f5f3ff; border-radius: 12px; padding: 16px 20px; display: inline-flex; align-items: center; gap: 12px; margin-bottom: 28px; }
  .auth-step { text-align: center; }
  .auth-brand { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 28px; }
  .auth-brand-name { font-size: 18px; font-weight: 700; color: #24304a; letter-spacing: -0.03em; }
  .auth-title { font-size: 30px; font-weight: 700; line-height: 1.1; letter-spacing: -0.04em; color: #202b45; margin-bottom: 12px; }
  .auth-subtitle { font-size: 15px; line-height: 1.7; color: #62708b; margin-bottom: 34px; }
  .auth-form { text-align: left; }
  .auth-field { margin-bottom: 18px; }
  .auth-label { display: block; font-size: 13px; font-weight: 600; color: #28334e; margin-bottom: 8px; }
  .auth-input-wrap { position: relative; }
  .auth-pill-input { width: 100%; height: 54px; border: 1px solid #cdd6e4; border-radius: 999px; background: rgba(255,255,255,0.82); padding: 0 20px; font-size: 16px; color: #41506f; outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
  .auth-pill-input:focus { border-color: #5b4cf0; box-shadow: 0 0 0 3px rgba(91,76,240,0.12); }
  .auth-pill-input::placeholder { color: #7784a0; }
  .auth-secondary-action { width: 100%; height: 54px; border-radius: 999px; border: 1px solid #cdd6e4; background: rgba(255,255,255,0.82); color: #24304a; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.18s; }
  .auth-secondary-action:hover { border-color: #5b4cf0; color: #5b4cf0; background: #fff; }
  .auth-primary-action { height: 56px; border-radius: 999px; font-size: 16px; box-shadow: none; background: linear-gradient(90deg,#5b4cf0 0%, #5146df 100%); }
  .auth-primary-action:hover { box-shadow: 0 12px 24px rgba(91,76,240,0.18); }
  .auth-link-row { margin-top: 18px; font-size: 14px; color: #28334e; text-align: center; }
  .auth-link-button { background: none; border: none; color: #5b4cf0; font-size: 14px; font-weight: 600; cursor: pointer; padding: 0; }
  .auth-link-button:hover { text-decoration: underline; }
  .auth-inline-link { display: inline-flex; justify-content: center; width: 100%; margin-top: 18px; }
  .auth-divider { display: flex; align-items: center; gap: 14px; color: #8c98ae; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 22px 0; }
  .auth-divider::before, .auth-divider::after { content: ""; flex: 1; height: 1px; background: #d7deea; }
  .auth-footer { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 18px 44px 22px; margin-top: auto; border-top: 1px solid #d8dfeb; font-size: 13px; color: #62708b; }
  .auth-footer-links { display: flex; align-items: center; gap: 28px; }
  .auth-footer-links button { background: none; border: none; color: #5b4cf0; font-size: 13px; cursor: pointer; padding: 0; }
  .auth-password-toggle { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #99a4b9; font-size: 13px; font-weight: 600; cursor: pointer; }

  @media (max-width: 640px) {
    .onboarding-page { padding: 0 14px; }
    .onboarding-shell { max-width: 100%; }
    .welcome-screen { padding: 20px 0 28px !important; }
    .welcome-screen__content { align-items: flex-start; padding-top: 44px; }
    .welcome-screen__inner { max-width: 100%; }
    .onboarding-header { padding-top: 20px !important; gap: 12px; }
    .onboarding-progress { margin-top: 10px !important; }
    .onboarding-card-wrap { margin-top: 18px !important; padding-bottom: 32px !important; }
    .card { border-radius: 20px; padding: 24px 18px; box-shadow: 0 10px 32px rgba(109,40,217,0.08); }
    .btn-primary, .btn-outline { font-size: 14px; }
    .welcome-step { padding: 0; }
    .welcome-title { font-size: 34px; margin-bottom: 12px; }
    .welcome-subtitle { font-size: 16px; line-height: 1.55; margin-bottom: 28px; }
    .step-title { font-size: 18px; }
    .step-title-lg { font-size: 20px; }
    .step-subtitle { font-size: 12px; margin-bottom: 18px; }
    .option-row { padding: 13px 14px; gap: 10px; align-items: flex-start; }
    .option-row .label { font-size: 13px; }
    .option-row .sub { font-size: 11px; line-height: 1.45; }
    .reminder-box { width: 100%; display: flex; flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; }
    .time-select { width: 100%; }
    .recommendations-grid { flex-direction: column; }
    .rec-card { min-width: 0; width: 100%; }
    .auth-title { font-size: 24px; }
    .auth-subtitle { font-size: 14px; margin-bottom: 26px; }
    .auth-pill-input, .auth-secondary-action { height: 50px; }
    .auth-primary-action { height: 52px; }
    .auth-footer { flex-direction: column; align-items: flex-start; padding: 16px 0 18px; margin-top: 20px; }
    .auth-footer-links { gap: 18px; flex-wrap: wrap; }
  }

  @media (max-width: 420px) {
    .onboarding-header { align-items: flex-start !important; flex-direction: column; }
    .welcome-screen__content { padding-top: 32px; }
    .card { padding: 22px 16px; border-radius: 18px; }
    .welcome-title { font-size: 28px; }
    .welcome-subtitle { font-size: 15px; margin-bottom: 24px; }
    .step-title { font-size: 17px; }
    .step-subtitle { font-size: 12px; }
    .auth-brand { margin-bottom: 22px; }
    .auth-title { font-size: 21px; }
  }
`;
