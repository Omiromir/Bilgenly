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
  stats: ProfileStat[];
  activity: ProfileActivityItem[];
  personalInfo: ProfileField[];
}

export interface SettingsToggleItem {
  label: string;
  description: string;
  enabled: boolean;
}

export interface SettingsField {
  label: string;
  value: string;
  kind?: "input" | "textarea";
}

export interface SettingsSelectField {
  label: string;
  value: string;
}

export interface SettingsThemeOption {
  label: string;
  selected?: boolean;
}

export interface ActiveSession {
  device: string;
  description: string;
  actionLabel?: string;
  destructive?: boolean;
}

export interface SettingsScreenData {
  account: {
    fields: SettingsField[];
    location: SettingsSelectField[];
  };
  security: {
    passwordFields: SettingsField[];
    twoFactor: {
      title: string;
      description: string;
      actionLabel: string;
    };
    sessions: ActiveSession[];
  };
  notifications: {
    email: SettingsToggleItem[];
    push: SettingsToggleItem[];
  };
  preferences: {
    themes: SettingsThemeOption[];
    region: SettingsSelectField[];
    privacy: SettingsToggleItem[];
  };
}

export const teacherProfileSummary: ProfileSummary = {
  name: "Professor Doe",
  roleLabel: "Teacher",
  email: "professor@bilgenly.com",
  joinedLabel: "Joined March 2024",
  location: "San Francisco, CA",
  bio: "Computer science instructor focused on practical programming, classroom analytics, and quiz-driven learning.",
  initials: "PD",
  stats: [
    { label: "Quizzes Created", value: "28", icon: "book" },
    { label: "Classes Active", value: "5", icon: "badge" },
    { label: "Average Score", value: "82%", icon: "trend" },
    { label: "Review Time", value: "16hrs", icon: "clock" },
  ],
  activity: [
    {
      title: "Published quiz",
      description: "JavaScript Fundamentals for CS101",
      time: "1 hour ago",
    },
    {
      title: "Reviewed submissions",
      description: "Python Data Structures mid-week quiz",
      time: "Yesterday",
    },
    {
      title: "Created class",
      description: "Advanced Web Interfaces",
      time: "3 days ago",
    },
  ],
  personalInfo: [
    { label: "Full Name", value: "Professor Doe" },
    { label: "Email", value: "professor@bilgenly.com" },
    { label: "Phone", value: "+1 (555) 123-4567" },
    { label: "Location", value: "San Francisco, CA" },
  ],
};

export const studentProfileSummary: ProfileSummary = {
  name: "John Doe",
  roleLabel: "Student",
  email: "john.doe@bilgenly.com",
  joinedLabel: "Joined March 2025",
  location: "San Francisco, CA",
  bio: "Computer Science student passionate about learning new technologies. Currently focusing on web development and data structures.",
  initials: "JD",
  stats: [
    { label: "Quizzes Completed", value: "24", icon: "book" },
    { label: "Badges Earned", value: "12", icon: "badge" },
    { label: "Average Score", value: "88%", icon: "trend" },
    { label: "Study Time", value: "48hrs", icon: "clock" },
  ],
  activity: [
    {
      title: "Completed quiz",
      description: "Python Data Structures - 88%",
      time: "2 hours ago",
    },
    {
      title: "Earned badge",
      description: "Quick Learner",
      time: "1 day ago",
    },
    {
      title: "Joined quiz",
      description: "SQL Queries Practice",
      time: "2 days ago",
    },
  ],
  personalInfo: [
    { label: "Full Name", value: "John Doe" },
    { label: "Email", value: "john.doe@bilgenly.com" },
    { label: "Phone", value: "+1 (555) 123-4567" },
    { label: "Location", value: "San Francisco, CA" },
  ],
};

export const teacherSettingsData: SettingsScreenData = {
  account: {
    fields: [
      { label: "Full Name", value: "Professor Doe" },
      { label: "Email", value: "professor@bilgenly.com" },
      { label: "Phone Number", value: "+1 (555) 123-4567" },
      {
        label: "Bio",
        value:
          "Passionate educator specializing in programming, analytics, and adaptive classroom experiences.",
        kind: "textarea",
      },
    ],
    location: [
      { label: "Country", value: "United States" },
      { label: "Time Zone", value: "Pacific Time (PT)" },
    ],
  },
  security: {
    passwordFields: [
      { label: "Current Password", value: "" },
      { label: "New Password", value: "" },
      { label: "Confirm New Password", value: "" },
    ],
    twoFactor: {
      title: "2FA Enabled",
      description: "Using authenticator app",
      actionLabel: "Manage",
    },
    sessions: [
      {
        device: "Chrome on MacBook Pro",
        description: "San Francisco, CA · Active now",
      },
      {
        device: "Safari on iPhone",
        description: "San Francisco, CA · 2 hours ago",
        actionLabel: "Revoke",
        destructive: true,
      },
    ],
  },
  notifications: {
    email: [
      {
        label: "Quiz assignments",
        description: "Get notified when new quizzes are assigned",
        enabled: true,
      },
      {
        label: "Grading updates",
        description: "Receive notifications when quizzes are graded",
        enabled: true,
      },
      {
        label: "Achievement alerts",
        description: "Get notified when you earn badges or achievements",
        enabled: false,
      },
      {
        label: "Deadline reminders",
        description: "Receive reminders about upcoming quiz deadlines",
        enabled: false,
      },
    ],
    push: [
      {
        label: "Real-time updates",
        description: "Instant notifications for important events",
        enabled: true,
      },
      {
        label: "Weekly summaries",
        description: "Receive weekly performance summaries",
        enabled: true,
      },
    ],
  },
  preferences: {
    themes: [
      { label: "Light", selected: true },
      { label: "Dark" },
      { label: "System" },
    ],
    region: [
      { label: "Language", value: "English" },
      { label: "Date Format", value: "MM/DD/YYYY" },
    ],
    privacy: [
      {
        label: "Show profile to other users",
        description: "Allow others to view your profile",
        enabled: false,
      },
      {
        label: "Show activity status",
        description: "Let others see when you're online",
        enabled: false,
      },
      {
        label: "Allow analytics",
        description: "Help us improve by sharing usage data",
        enabled: true,
      },
    ],
  },
};

export const studentSettingsData: SettingsScreenData = {
  account: {
    fields: [
      { label: "Full Name", value: "John Doe" },
      { label: "Email", value: "john.doe@bilgenly.com" },
      { label: "Phone Number", value: "+1 (555) 123-4567" },
      {
        label: "Bio",
        value:
          "Passionate educator specializing in programming and web development.",
        kind: "textarea",
      },
    ],
    location: [
      { label: "Country", value: "United States" },
      { label: "Time Zone", value: "Pacific Time (PT)" },
    ],
  },
  security: {
    passwordFields: [
      { label: "Current Password", value: "" },
      { label: "New Password", value: "" },
      { label: "Confirm New Password", value: "" },
    ],
    twoFactor: {
      title: "2FA Enabled",
      description: "Using authenticator app",
      actionLabel: "Manage",
    },
    sessions: [
      {
        device: "Chrome on MacBook Pro",
        description: "San Francisco, CA · Active now",
      },
      {
        device: "Safari on iPhone",
        description: "San Francisco, CA · 2 hours ago",
        actionLabel: "Revoke",
        destructive: true,
      },
    ],
  },
  notifications: {
    email: [
      {
        label: "Quiz assignments",
        description: "Get notified when new quizzes are assigned",
        enabled: true,
      },
      {
        label: "Grading updates",
        description: "Receive notifications when quizzes are graded",
        enabled: true,
      },
      {
        label: "Achievement alerts",
        description: "Get notified when you earn badges or achievements",
        enabled: false,
      },
      {
        label: "Deadline reminders",
        description: "Receive reminders about upcoming quiz deadlines",
        enabled: false,
      },
    ],
    push: [
      {
        label: "Real-time updates",
        description: "Instant notifications for important events",
        enabled: true,
      },
      {
        label: "Weekly summaries",
        description: "Receive weekly performance summaries",
        enabled: true,
      },
    ],
  },
  preferences: {
    themes: [
      { label: "Light", selected: true },
      { label: "Dark" },
      { label: "System" },
    ],
    region: [
      { label: "Language", value: "English" },
      { label: "Date Format", value: "MM/DD/YYYY" },
    ],
    privacy: [
      {
        label: "Show profile to other users",
        description: "Allow others to view your profile",
        enabled: false,
      },
      {
        label: "Show activity status",
        description: "Let others see when you're online",
        enabled: false,
      },
      {
        label: "Allow analytics",
        description: "Help us improve by sharing usage data",
        enabled: true,
      },
    ],
  },
};
