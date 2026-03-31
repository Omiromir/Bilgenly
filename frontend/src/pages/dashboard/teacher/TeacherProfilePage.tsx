// pages/dashboard/teacher/TeacherProfilePage.tsx
import { DashboardProfilePage } from "../../../features/dashboard/components/DashboardProfilePage";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import { teacherProfileSummary } from "../../../features/dashboard/mock/sharedUi";
import { useProfile } from "../../../features/dashboard/hooks/useProfile"; 

export function TeacherProfilePage() {
    const meta = useDashboardPageMeta();
    const profile = useProfile(teacherProfileSummary);

    return (
        <DashboardProfilePage
            title={meta?.title ?? "My Profile"}
            subtitle={meta?.subtitle ?? ""}
            profile={profile}
        />
    );
}