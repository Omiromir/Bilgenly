import type { ReactNode } from "react";
import { Link } from "react-router";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Bilgenly Dashboard
            </p>
            <h1 className="text-2xl font-semibold">{title}</h1>
          </div>
          <nav className="flex gap-4 text-sm text-slate-600">
            <Link to="/dashboard/teacher">Teacher</Link>
            <Link to="/dashboard/student">Student</Link>
            <Link to="/dashboard/moderator">Moderator</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
