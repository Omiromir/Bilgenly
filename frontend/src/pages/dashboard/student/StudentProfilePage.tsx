import { useMemo } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { DashboardProfilePage } from "../../../features/dashboard/components/DashboardProfilePage";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import { studentProfileSummary } from "../../../features/dashboard/mock/sharedUi";

export function StudentProfilePage() {
  const meta = useDashboardPageMeta();
  const { currentStudent } = useAuth();
  const profile = useMemo(() => {
    if (!currentStudent) {
      return studentProfileSummary;
    }

    return {
      ...studentProfileSummary,
      name: currentStudent.fullName,
      email: currentStudent.email,
      joinedLabel: currentStudent.joinedLabel,
      location: currentStudent.location,
      bio: currentStudent.bio,
      initials: currentStudent.initials,
      personalInfo: studentProfileSummary.personalInfo.map((field) => {
        if (field.label === "Full Name") {
          return {
            ...field,
            value: currentStudent.fullName,
          };
        }

        if (field.label === "Email") {
          return {
            ...field,
            value: currentStudent.email,
          };
        }

        if (field.label === "Location") {
          return {
            ...field,
            value: currentStudent.location,
          };
        }

        return field;
      }),
    };
  }, [currentStudent]);

  return (
    <DashboardProfilePage
      title={meta?.title ?? "My Profile"}
      subtitle={meta?.subtitle ?? ""}
      profile={profile}
    />
  );
}
