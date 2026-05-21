import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { cn } from "../../../components/ui/utils";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardShell() {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="dashboard-shell min-h-screen text-[var(--dashboard-text)]">
      <div className="lg:flex">
        <div
          className={cn(
            "hidden transition-[width] duration-200 lg:block lg:shrink-0",
            isDesktopSidebarCollapsed ? "lg:w-[92px]" : "lg:w-[288px]"
          )}
        >
          <DashboardSidebar
            className="sticky top-0 h-screen"
            collapsed={isDesktopSidebarCollapsed}
            onToggleCollapse={() =>
              setIsDesktopSidebarCollapsed((current) => !current)
            }
          />
        </div>

        <div
          className={cn(
            "fixed inset-0 z-40 bg-[var(--dashboard-overlay)] transition lg:hidden",
            isMobileSidebarOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          )}
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[290px] max-w-[85vw] transition-transform duration-200 ease-out lg:hidden",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          aria-hidden={!isMobileSidebarOpen}
        >
          <DashboardSidebar
            className="min-h-full shadow-[var(--dashboard-shadow-overlay)]"
            onNavigate={() => setIsMobileSidebarOpen(false)}
            onClose={() => setIsMobileSidebarOpen(false)}
            showMobileClose
          />
        </div>

        <div className="min-w-0 flex-1">
          <DashboardHeader onOpenSidebar={() => setIsMobileSidebarOpen(true)} />

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
