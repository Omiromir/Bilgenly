import { useEffect, useState } from "react";
import { getMe } from "../../auth/api";
import type { ProfileSummary } from "../mock/sharedUi";

export function useProfile(fallback: ProfileSummary) {
    const [profile, setProfile] = useState<ProfileSummary>(fallback);

    useEffect(() => {
        getMe()
            .then((data) => {
                const initials = data.username
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                setProfile((current) => ({
                    ...current,
                    name: data.username,
                    email: data.email,
                    roleLabel: data.role,
                    initials,
                    personalInfo: [
                        { label: "Full Name", value: data.username },
                        { label: "Email", value: data.email },
                        ...current.personalInfo.filter(
                            (f) => f.label !== "Full Name" && f.label !== "Email"
                        ),
                    ],
                }));
            })
            .catch(() => {
            });
    }, []);

    return profile;
}