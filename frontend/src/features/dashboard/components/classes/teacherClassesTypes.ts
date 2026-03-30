export type TeacherClassStatus = "active" | "archived";
export type TeacherClassStudentStatus = "active" | "invited" | "declined";
export type TeacherClassAssignmentVisibility = "class-members";
export type TeacherClassAssignedQuizStatus = "assigned";

export interface TeacherClassStudent {
  id: string;
  fullName: string;
  email: string;
  status: TeacherClassStudentStatus;
  joinedAt: string;
  linkedUserId?: string;
  avatar?: string;
  role?: string;
}

export interface TeacherClassAssignedQuiz {
  id: string;
  classId: string;
  quizId: string;
  title: string;
  topic: string;
  questionCount: number;
  assignedAt: string;
  assignedBy: string;
  assignedByName: string;
  visibility: TeacherClassAssignmentVisibility;
  status: TeacherClassAssignedQuizStatus;
}

export interface TeacherClassRecord {
  id: string;
  name: string;
  description: string;
  subject: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  studentCount: number;
  quizCount: number;
  status: TeacherClassStatus;
  students: TeacherClassStudent[];
  assignedQuizzes: TeacherClassAssignedQuiz[];
}

export interface TeacherClassFormValues {
  name: string;
  description: string;
  subject: string;
}

export interface AddStudentsFormValues {
  emails: string;
}
