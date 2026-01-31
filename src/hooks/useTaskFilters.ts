import { useMemo } from "react";
import { Task } from "./useTasks";
import { TaskFiltersState } from "@/components/dashboard/TaskFilters";
import { ALL_STATUSES } from "@/lib/statusConfig";

// Simple fuzzy match function
const fuzzyMatch = (text: string, query: string): boolean => {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Direct substring match
  if (lowerText.includes(lowerQuery)) return true;
  
  // Fuzzy character sequence match
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === lowerQuery.length;
};

export const useTaskFilters = (tasks: Task[], filters: TaskFiltersState) => {
  return useMemo(() => {
    let filtered = [...tasks];

    // Search filter with fuzzy matching
    if (filters.search.trim()) {
      const query = filters.search.trim();
      filtered = filtered.filter((task) => 
        fuzzyMatch(task.title, query) ||
        (task.context && fuzzyMatch(task.context, query))
      );
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter((task) => filters.statuses.includes(task.status));
    }

    // Source filter
    if (filters.sources.length > 0) {
      filtered = filtered.filter((task) => filters.sources.includes(task.source));
    }

    // Notion link filter
    if (filters.hasNotionLink !== null) {
      filtered = filtered.filter((task) =>
        filters.hasNotionLink ? !!task.notionPageId : !task.notionPageId
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case "created":
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          comparison = ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status);
          break;
      }
      
      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, filters]);
};
