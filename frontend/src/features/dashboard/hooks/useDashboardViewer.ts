import { useMemo } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useSettings } from "../../../app/providers/SettingsProvider";
import { getProfileInitials } from "../settings/userSettings";

export function useDashboardViewer() {
  const { currentUser, role } = useAuth();
  const { settings } = useSettings();

  return useMemo(() => {
    if (!currentUser) {
      return null;
    }

    // Prefer backend-synced fields over localStorage settings — settings is
    // only used as a fallback (e.g. during initial hydration before getMe
    // resolves) and for locally-managed values like phone/country that the
    // backend doesn't store yet.
    const fullName = currentUser.fullName || settings.profile.fullName;
    const email = currentUser.email || settings.profile.email;
    const bio = currentUser.bio ?? settings.profile.bio;
    const avatarUrl = currentUser.avatarUrl ?? settings.profile.avatarUrl;

    return {
      ...currentUser,
      fullName,
      email,
      initials: getProfileInitials(fullName),
      avatarUrl,
      location: settings.profile.country,
      bio,
      roleLabel: role ? role.charAt(0).toUpperCase() + role.slice(1) : "User",
      phoneNumber: settings.profile.phoneNumber,
    };
  }, [
    currentUser,
    role,
    settings.profile.bio,
    settings.profile.country,
    settings.profile.avatarUrl,
    settings.profile.email,
    settings.profile.fullName,
    settings.profile.phoneNumber,
  ]);
}
