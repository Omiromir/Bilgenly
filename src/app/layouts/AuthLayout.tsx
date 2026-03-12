import type { ReactNode } from "react";
import { Link } from "react-router";
import { BilgenlyLogo } from "../../features/onboarding/components/BilgenlyLogo";
import { authStyles } from "../../features/auth/authStyles";

interface AuthLayoutProps {
  children: ReactNode;
  subtitle: string;
  title: string;
}

export function AuthLayout({ children, subtitle, title }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <style>{authStyles}</style>

      <main className="auth-main">
        <div style={{ textAlign: "center" }}>
          <div className="auth-brand">
            <BilgenlyLogo size={30} />
          </div>
        </div>

        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        {children}
      </main>

      <footer className="auth-footer">
        <span>Copyright 2026 Bilgenly</span>
        <div className="auth-footer-links">
          <Link className="auth-link" to="/">
            Privacy Policy
          </Link>
          <Link className="auth-link" to="/">
            Terms & Conditions
          </Link>
        </div>
      </footer>
    </div>
  );
}
