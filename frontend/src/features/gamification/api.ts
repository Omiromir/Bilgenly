import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../app/providers/AuthProvider";
import { apiRequest, getRequestErrorMessage } from "../../lib/apiClient";

export interface UserBadgeDto {
  badgeId: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  username: string;
  averageScore: number;
  isCurrentUser: boolean;
  avatarUrl?: string | null;
}

export interface AchievementsDto {
  rank: number;
  rankLabel: string;
  averageScore: number;
  quizzesDone: number;
  badgesEarned: number;
  totalBadges: number;
  badges: UserBadgeDto[];
  leaderboard: LeaderboardEntryDto[];
}

export function getAchievements(classId?: string) {
  const url = classId
    ? `/api/achievements?classId=${encodeURIComponent(classId)}`
    : "/api/achievements";
  return apiRequest<AchievementsDto>(url, {
    fallbackErrorMessage: "Unable to load achievements.",
  });
}

export function useAchievementsQuery(classId?: string) {
  const { currentUser, token, role } = useAuth();
  const userId = currentUser?.id ?? null;

  const query = useQuery({
    queryKey: ["achievements", userId, classId ?? "all"],
    queryFn: () => getAchievements(classId),
    enabled: role === "student" && Boolean(token && userId),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? getRequestErrorMessage(query.error, "Unable to load achievements.")
      : null,
  };
}
