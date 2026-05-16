export interface ProfileField {
  label: string;
  value: string;
}

export interface ProfileActivityItem {
  title: string;
  description: string;
  time: string;
}

export type ProfileStatIconKey = "book" | "badge" | "trend" | "clock";

export interface ProfileStat {
  label: string;
  value: string;
  icon: ProfileStatIconKey;
}

export interface ProfileSummary {
  name: string;
  roleLabel: string;
  email: string;
  joinedLabel: string;
  location: string;
  bio: string;
  initials: string;
  avatarUrl: string | null;
  stats: ProfileStat[];
  activity: ProfileActivityItem[];
  personalInfo: ProfileField[];
}

export interface ProfileFormValues {
  fullName: string;
  email: string;
  bio: string;
  location: string;
  avatarUrl: string | null;
}

export interface ProfileFormErrors {
  fullName?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
}
