import type {
  QuizLibraryItem,
  QuizLibraryStatus,
  QuizLibraryVisibility,
} from "./quizLibraryTypes";

export interface QuizLibraryFilters {
  topic: string;
  difficulty: string;
  language: string;
  creator: string;
  status?: string;
  visibility?: string;
  practiceState?: string;
}

const draftStatuses = new Set<QuizLibraryStatus>(["draft", "generated", "edited"]);
const publishedStatuses = new Set<QuizLibraryStatus>([
  "published-private",
  "published-public",
]);

export function isDraftQuiz(status: QuizLibraryStatus) {
  return draftStatuses.has(status);
}

export function isPublishedQuiz(status: QuizLibraryStatus) {
  return publishedStatuses.has(status);
}

export function isPublicDiscoveryQuiz(item: QuizLibraryItem) {
  return item.status === "published-public" && item.visibility === "public";
}

export function getStatusLabel(status: QuizLibraryStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "generated":
      return "Generated";
    case "edited":
      return "Edited";
    case "published-private":
    case "published-public":
      return "Published";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

export function getVisibilityLabel(visibility: QuizLibraryVisibility) {
  return visibility === "public" ? "Public" : "Private";
}

export function matchesQuizSearch(item: QuizLibraryItem, search: string) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  const haystack = [
    item.title,
    item.description,
    item.topic,
    item.creatorName,
    item.language,
    item.sourceLabel,
    item.note ?? "",
    item.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function matchesQuizFilters(
  item: QuizLibraryItem,
  filters: QuizLibraryFilters,
) {
  if (filters.topic !== "all" && item.topic !== filters.topic) {
    return false;
  }

  if (filters.difficulty !== "all" && item.difficulty !== filters.difficulty) {
    return false;
  }

  if (filters.language !== "all" && item.language !== filters.language) {
    return false;
  }

  if (filters.creator !== "all" && item.creatorName !== filters.creator) {
    return false;
  }

  if (filters.status && filters.status !== "all" && item.status !== filters.status) {
    return false;
  }

  if (
    filters.visibility &&
    filters.visibility !== "all" &&
    item.visibility !== filters.visibility
  ) {
    return false;
  }

  if (
    filters.practiceState &&
    filters.practiceState !== "all" &&
    item.practiceState !== filters.practiceState
  ) {
    return false;
  }

  return true;
}

export function getUniqueOptions(
  items: QuizLibraryItem[],
  getter: (item: QuizLibraryItem) => string,
) {
  return Array.from(new Set(items.map(getter))).sort((left, right) =>
    left.localeCompare(right),
  );
}
