/**
 * Notion status configuration - single source of truth
 * These MUST match exactly the status options in your Notion database
 */

// The exact status names from Notion (displayed in UI + stored in DB)
export const NOTION_STATUSES = {
  UNCATEGORIZED: "IRIS Generated",
  TODO: "Not Started",
  IN_PROGRESS: "In Progress",
  DONE: "Complete🙌",
} as const;

// Type for status values
export type NotionStatus = (typeof NOTION_STATUSES)[keyof typeof NOTION_STATUSES];

// All valid statuses as an array (useful for validation)
export const ALL_STATUSES: NotionStatus[] = [
  NOTION_STATUSES.UNCATEGORIZED,
  NOTION_STATUSES.TODO,
  NOTION_STATUSES.IN_PROGRESS,
  NOTION_STATUSES.DONE,
];

// Display labels for UI (can be customized separately from Notion names)
export const STATUS_LABELS: Record<NotionStatus, string> = {
  [NOTION_STATUSES.UNCATEGORIZED]: "Uncategorized",
  [NOTION_STATUSES.TODO]: "To Do",
  [NOTION_STATUSES.IN_PROGRESS]: "In Progress",
  [NOTION_STATUSES.DONE]: "Done",
};

// Column border colors for Kanban view
export const STATUS_COLORS: Record<NotionStatus, string> = {
  [NOTION_STATUSES.UNCATEGORIZED]: "border-orange-500/50",
  [NOTION_STATUSES.TODO]: "border-muted-foreground/30",
  [NOTION_STATUSES.IN_PROGRESS]: "border-primary/50",
  [NOTION_STATUSES.DONE]: "border-green-500/50",
};

// Status progression for "next status" logic
export const getNextStatus = (current: NotionStatus): NotionStatus | null => {
  switch (current) {
    case NOTION_STATUSES.UNCATEGORIZED:
      return NOTION_STATUSES.TODO;
    case NOTION_STATUSES.TODO:
      return NOTION_STATUSES.IN_PROGRESS;
    case NOTION_STATUSES.IN_PROGRESS:
      return NOTION_STATUSES.DONE;
    case NOTION_STATUSES.DONE:
      return null;
    default:
      return null;
  }
};

// Helper to check if a string is a valid NotionStatus
export const isValidStatus = (status: string): status is NotionStatus => {
  return ALL_STATUSES.includes(status as NotionStatus);
};

// Default status for new tasks
export const getDefaultStatus = (source: string): NotionStatus => {
  return source === "manual" ? NOTION_STATUSES.TODO : NOTION_STATUSES.UNCATEGORIZED;
};
