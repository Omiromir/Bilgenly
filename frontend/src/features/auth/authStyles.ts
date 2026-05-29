export const authStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
  * { box-sizing: border-box; }
  .auth-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 32px 24px 0;
    background: #f3f5f9;
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    color: #202b45;
  }
  .auth-main {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }
  .auth-brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 26px;
  }
  .auth-brand-name {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #24304a;
  }
  .auth-title {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.05em;
    color: #202b45;
    text-align: center;
    margin: 0 0 14px;
  }
  .auth-subtitle {
    font-size: 15px;
    line-height: 1.7;
    color: #62708b;
    text-align: center;
    margin: 0 0 34px;
  }
  .auth-form {
    width: 100%;
  }
  .auth-field {
    margin-bottom: 18px;
  }
  .auth-label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 700;
    color: #28334e;
  }
  .auth-input-wrap {
    position: relative;
  }
  .auth-input {
    width: 100%;
    height: 50px;
    border: 1px solid #cfd7e4;
    border-radius: 999px;
    background: rgba(255,255,255,0.9);
    padding: 0 18px;
    font-size: 15px;
    color: #44516d;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .auth-input::placeholder {
    color: #7986a1;
  }
  .auth-input:focus {
    border-color: #5b4cf0;
    box-shadow: 0 0 0 3px rgba(91, 76, 240, 0.12);
  }
  .auth-input.has-trailing {
    padding-right: 74px;
  }
  .auth-trailing-btn {
    position: absolute;
    top: 50%;
    right: 18px;
    transform: translateY(-50%);
    border: none;
    background: none;
    color: #9aa5b8;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }
  .auth-primary {
    width: 100%;
    height: 48px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(90deg, #5b4cf0 0%, #5146df 100%);
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
  }
  .auth-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgba(91, 76, 240, 0.18);
  }
  .auth-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .auth-secondary {
    width: 100%;
    height: 48px;
    border: 1px solid #cfd7e4;
    border-radius: 999px;
    background: rgba(255,255,255,0.9);
    margin-bottom: 18px;
    color: #24304a;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
  }
  .auth-secondary:hover {
    border-color: #5b4cf0;
    color: #5b4cf0;
    background: #fff;
  }
  .auth-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin: 4px 0 22px;
    font-size: 14px;
    color: #28334e;
  }
  .auth-checkbox {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    cursor: pointer;
  }
  .auth-checkbox input {
    width: 16px;
    height: 16px;
    accent-color: #5b4cf0;
  }
  .auth-link {
    border: none;
    background: none;
    color: #5b4cf0;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    text-decoration: none;
  }
  .auth-link:hover {
    text-decoration: underline;
  }
  .auth-center-row {
    margin-top: 22px;
    text-align: center;
    font-size: 14px;
    color: #28334e;
  }
  .auth-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 26px 0 18px;
    color: #8e99ae;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .auth-divider::before,
  .auth-divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #d7deea;
  }
  .auth-stack {
    display: grid;
    gap: 12px;
  }
  .auth-strength {
    margin: -6px 0 22px;
  }
  .auth-strength-bars {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }
  .auth-strength-bars span {
    height: 4px;
    border-radius: 999px;
    background: #d6ddea;
  }
  .auth-strength-bars span.active {
    background: #39c270;
  }
  .auth-strength-label {
    font-size: 14px;
    color: #55627d;
  }
  .auth-back-link {
    display: inline-flex;
    justify-content: center;
    width: 100%;
    margin-top: 22px;
  }
  .auth-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    margin-top: auto;
    padding: 18px 44px 22px;
    border-top: 1px solid #d8dfeb;
    font-size: 13px;
    color: #62708b;
  }
  .auth-footer-links {
    display: flex;
    align-items: center;
    gap: 28px;
    flex-wrap: wrap;
  }
  .auth-error {
  margin-top: 6px;
  font-size: 14px;
  color: #dc2626;
}

.auth-help {
  margin-top: 6px;
  font-size: 14px;
  color: #6b7280;
}

.auth-input[aria-invalid="true"] {
  border-color: #dc2626;
  outline: none;
}
  @media (max-width: 640px) {
    .auth-page {
      padding: 24px 16px 0;
    }
    .auth-title {
      font-size: 24px;
    }
    .auth-subtitle {
      font-size: 14px;
      margin-bottom: 28px;
    }
    .auth-input,
    .auth-primary,
    .auth-secondary {
      height: 46px;
      font-size: 14px;
    }
    .auth-footer {
      flex-direction: column;
      align-items: flex-start;
      padding: 16px 0 18px;
      margin-top: 28px;
    }
    .auth-footer-links {
      gap: 18px;
    }
    .auth-meta-row {
      flex-wrap: wrap;
      gap: 10px;
    }
  }
  @media (max-width: 420px) {
    .auth-page {
      padding: 20px 14px 0;
    }
    .auth-title {
      font-size: 21px;
    }
    .auth-subtitle {
      font-size: 13px;
      margin-bottom: 24px;
    }
    .auth-brand {
      margin-bottom: 20px;
    }
    .auth-input,
    .auth-primary,
    .auth-secondary {
      height: 44px;
      font-size: 14px;
    }
    .auth-label {
      font-size: 12px;
    }
    .auth-strength-label {
      font-size: 12px;
    }
  }

  /* ── Dark mode ── */
  .dark .auth-page {
    background: #0d1424;
    color: #dde6f7;
  }
  .dark .auth-brand-name {
    color: #f5f8ff;
  }
  .dark .auth-title {
    color: #f5f8ff;
  }
  .dark .auth-subtitle {
    color: #9aa8c6;
  }
  .dark .auth-label {
    color: #c8d4ee;
  }
  .dark .auth-input {
    background: #111b2f;
    border-color: #2a3858;
    color: #dde6f7;
  }
  .dark .auth-input::placeholder {
    color: #4e5e7a;
  }
  .dark .auth-input:focus {
    border-color: #7a72ff;
    box-shadow: 0 0 0 3px rgba(122, 114, 255, 0.18);
  }
  .dark .auth-input[aria-invalid="true"] {
    border-color: #f08aa1;
  }
  .dark .auth-trailing-btn {
    color: #72809f;
  }
  .dark .auth-trailing-btn:hover {
    color: #9aa8c6;
  }
  .dark .auth-primary {
    background: linear-gradient(90deg, #7a72ff 0%, #6b64f5 100%);
    box-shadow: none;
  }
  .dark .auth-primary:hover {
    box-shadow: 0 12px 24px rgba(122, 114, 255, 0.28);
  }
  .dark .auth-secondary {
    background: #111b2f;
    border-color: #2a3858;
    color: #dde6f7;
  }
  .dark .auth-secondary:hover {
    border-color: #7a72ff;
    color: #7a72ff;
    background: rgba(122, 114, 255, 0.08);
  }
  .dark .auth-meta-row {
    color: #c8d4ee;
  }
  .dark .auth-checkbox input {
    accent-color: #7a72ff;
  }
  .dark .auth-link {
    color: #7a72ff;
  }
  .dark .auth-center-row {
    color: #9aa8c6;
  }
  .dark .auth-divider {
    color: #3d4f6a;
  }
  .dark .auth-divider::before,
  .dark .auth-divider::after {
    background: #223150;
  }
  .dark .auth-strength-bars span {
    background: #223150;
  }
  .dark .auth-strength-bars span.active {
    background: #57c48e;
  }
  .dark .auth-strength-label {
    color: #9aa8c6;
  }
  .dark .auth-error {
    color: #f08aa1;
  }
  .dark .auth-help {
    color: #9aa8c6;
  }
  .dark .auth-footer {
    border-color: #223150;
    color: #72809f;
  }
`;
