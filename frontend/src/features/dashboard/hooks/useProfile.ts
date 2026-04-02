import { useMemo } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import type { ProfileSummary } from "../mock/sharedUi";

export function useProfile(fallback: ProfileSummary) {
    const { currentUser, role } = useAuth();

    return useMemo(() => {
        if (!currentUser) {
            return fallback;
        }

        return {
            ...fallback,
            name: currentUser.fullName,
            email: currentUser.email,
            roleLabel: role ? role.charAt(0).toUpperCase() + role.slice(1) : fallback.roleLabel,
            initials: currentUser.initials,
            joinedLabel: currentUser.joinedLabel,
            location: currentUser.location,
            bio: currentUser.bio,
            personalInfo: [
                { label: "Full Name", value: currentUser.fullName },
                { label: "Email", value: currentUser.email },
                ...fallback.personalInfo.filter(
                    (field) => field.label !== "Full Name" && field.label !== "Email",
                ),
            ],
        };
    }, [currentUser, fallback, role]);
}
