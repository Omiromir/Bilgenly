import { useMemo } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { DashboardProfilePage } from "../../../features/dashboard/components/DashboardProfilePage";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import { useProfile } from "../../../features/dashboard/hooks/useProfile";
import { studentProfileSummary } from "../../../features/dashboard/mock/sharedUi";

export function StudentProfilePage() {
    const meta = useDashboardPageMeta();
    const profile = useProfile(studentProfileSummary); // ← реальные данные

    return (
        <DashboardProfilePage
            title={meta?.title ?? "My Profile"}
            subtitle={meta?.subtitle ?? ""}
            profile={profile}
        />
    );
}
