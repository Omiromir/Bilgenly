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

export function getAchievements() {
  return apiRequest<AchievementsDto>("/api/achievements", {
    fallbackErrorMessage: "Unable to load achievements.",
  });
}

// React Query hook — result is shared across StudentBadgesPage and useProfile.
// Navigating between either page within the stale window hits the in-memory
// cache instantly instead of issuing a second network request.
export function useAchievementsQuery() {
  const { currentUser, token, role } = useAuth();
  const userId = currentUser?.id ?? null;

  const query = useQuery({
    queryKey: ["achievements", userId],
    queryFn: getAchievements,
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
