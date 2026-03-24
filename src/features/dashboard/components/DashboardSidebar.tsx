import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { NavLink } from "react-router";
import { useAuth } from "../../../app/providers/AuthProvider";
import { cn } from "../../../components/ui/utils";
import { getDashboardNavigation } from "../config/navigation";
import { BilgenlyLogo } from "../../../components/shared/BilgenlyLogo";
import {
  DashboardButton,
  DashboardSearchField,
} from "./DashboardPrimitives";

interface DashboardSidebarProps {
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  showMobileClose?: boolean;
  collapsed?: boolean;
}

export function DashboardSidebar({
  className,
  onNavigate,
  onClose,
  onToggleCollapse,
  showMobileClose = false,
  collapsed = false,
}: DashboardSidebarProps) {
  const { role } = useAuth();
  const navigation = getDashboardNavigation(role);
  const primaryNavigation = navigation.filter(
    (item) => !item.path.endsWith("/settings"),
  );
  const settingsItem = navigation.find((item) =>
    item.path.endsWith("/settings"),
  );
  const navItemClassName =
    "flex items-center gap-3 rounded-[18px] px-4 py-3 text-base font-medium text-[var(--dashboard-text-soft)] transition hover:bg-[var(--dashboard-surface-muted)] hover:text-[var(--dashboard-text)]";
  const collapsedNavItemClassName =
    "h-14 w-14 justify-center rounded-[18px] px-0 py-0";

  return (
    <aside
      className={cn(
        "dashboard-sidebar relative flex h-full w-full flex-col border-r",
        collapsed && "items-center",
        className,
      )}
    >
      {!showMobileClose ? (
        <DashboardButton
          type="button"
          onClick={onToggleCollapse}
          variant="secondary"
          size="iconSm"
          className="absolute -right-4 top-20 z-10 hidden border border-[var(--dashboard-border)] text-[var(--dashboard-text-faint)] lg:inline-flex"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </DashboardButton>
      ) : null}

      <div
        className={cn(
          "flex items-center justify-between border-b border-[var(--dashboard-border-soft)] px-5 py-5",
          collapsed && "w-full justify-center px-4 py-7"
        )}
      >
        <div className="flex items-center gap-3">
          <BilgenlyLogo size={collapsed ? 48 : 40} showText={!collapsed} />
        </div>

        {showMobileClose ? (
          <DashboardButton
            type="button"
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="px-0 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </DashboardButton>
        ) : null}
      </div>

      <div className="border-b border-[var(--dashboard-border-soft)] px-4 py-4 lg:hidden">
        <DashboardSearchField placeholder="Search..." />
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4",
          collapsed && "w-full items-center gap-4 px-0 py-5"
        )}
      >
        {primaryNavigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path.endsWith("/overview") || path === "/dashboard/moderator"}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                navItemClassName,
                collapsed && collapsedNavItemClassName,
                isActive &&
                  "dashboard-nav-active text-white hover:bg-[var(--dashboard-brand)] hover:text-white",
              )
            }
          >
            <Icon className="h-5 w-5" />
            {!collapsed ? <span>{label}</span> : null}
          </NavLink>
        ))}
      </nav>

      {settingsItem ? (
        <div
          className={cn(
            "mt-auto border-t border-[var(--dashboard-border-soft)] px-4 py-4",
            collapsed && "w-full px-0 py-5"
          )}
        >
          {(() => {
            const SettingsIcon = settingsItem.icon;

            return (
              <NavLink
                to={settingsItem.path}
                end
                onClick={onNavigate}
                title={collapsed ? settingsItem.label : undefined}
                className={({ isActive }) =>
                  cn(
                    navItemClassName,
                    collapsed &&
                      cn("mx-auto", collapsedNavItemClassName),
                    isActive &&
                      "dashboard-nav-active text-white hover:bg-[var(--dashboard-brand)] hover:text-white",
                  )
                }
              >
                <SettingsIcon className="h-5 w-5" />
                {!collapsed ? <span>{settingsItem.label}</span> : null}
              </NavLink>
            );
          })()}
        </div>
      ) : null}
    </aside>
  );
}
