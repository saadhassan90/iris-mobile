import { format } from "date-fns";
import {
  X,
  Calendar,
  Clock,
  Tag,
  FileText,
  ExternalLink,
  Check,
  Archive,
  Mic,
  Keyboard,
  Mail,
  Headphones,
  StickyNote,
  HelpCircle,
  MoreHorizontal,
} from "lucide-react";
import { Task, TaskStatus, TaskSource } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  NOTION_STATUSES,
  STATUS_LABELS,
  ALL_STATUSES,
  NotionStatus,
} from "@/lib/statusConfig";

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (status: TaskStatus) => void;
  onComplete?: () => void;
  onArchive?: () => void;
}

// Status colors for the select dropdown
const statusSelectColors: Record<TaskStatus, string> = {
  [NOTION_STATUSES.UNCATEGORIZED]: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  [NOTION_STATUSES.TODO]: "bg-muted text-muted-foreground",
  [NOTION_STATUSES.IN_PROGRESS]: "bg-primary/20 text-primary",
  [NOTION_STATUSES.DONE]: "bg-green-500/20 text-green-700 dark:text-green-400",
};

const sourceIcons: Record<TaskSource, React.ReactNode> = {
  voice: <Mic className="h-4 w-4" />,
  manual: <Keyboard className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  fireflies: <Headphones className="h-4 w-4" />,
  notion: <StickyNote className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
};

const sourceLabels: Record<TaskSource, string> = {
  voice: "Voice Command",
  manual: "Manually Created",
  email: "Email",
  fireflies: "Fireflies Meeting",
  notion: "Notion",
  other: "Other",
};

const TaskDetailModal = ({
  task,
  open,
  onOpenChange,
  onStatusChange,
  onComplete,
  onArchive,
}: TaskDetailModalProps) => {
  if (!task) return null;

  const statusLabel = STATUS_LABELS[task.status] ?? task.status;
  const statusColor = statusSelectColors[task.status] ?? "bg-muted text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header with close and actions */}
        <DialogHeader className="p-4 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.notionPageId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    window.open(
                      `https://notion.so/${task.notionPageId?.replace(/-/g, "")}`,
                      "_blank"
                    );
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="text-xs">Open in Notion</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {task.status !== NOTION_STATUSES.DONE && onComplete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-green-600 hover:bg-green-100 hover:text-green-700"
                  onClick={onComplete}
                  title="Mark complete"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {onArchive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
                  onClick={onArchive}
                  title="Archive"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Title section - Notion style */}
          <div className="px-6 py-4">
            <h1 className="text-xl font-semibold leading-tight">{task.title}</h1>
          </div>

          {/* Properties section - Notion style table */}
          <div className="px-6 pb-4 space-y-1">
            {/* Status property */}
            <div className="flex items-center py-2 group hover:bg-muted/50 -mx-2 px-2 rounded-md">
              <div className="w-28 flex-shrink-0 flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span className="text-sm">Status</span>
              </div>
              <div className="flex-1">
                {onStatusChange ? (
                  <Select
                    value={task.status}
                    onValueChange={(value) => onStatusChange(value as TaskStatus)}
                  >
                    <SelectTrigger className="w-auto h-7 border-0 bg-transparent hover:bg-muted/80 gap-1.5 px-2">
                      <Badge
                        variant="secondary"
                        className={cn("rounded-full text-xs", statusColor)}
                      >
                        {statusLabel}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "rounded-full text-xs",
                              statusSelectColors[status]
                            )}
                          >
                            {STATUS_LABELS[status]}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    variant="secondary"
                    className={cn("rounded-full text-xs", statusColor)}
                  >
                    {statusLabel}
                  </Badge>
                )}
              </div>
            </div>

            {/* Source property */}
            <div className="flex items-center py-2 group hover:bg-muted/50 -mx-2 px-2 rounded-md">
              <div className="w-28 flex-shrink-0 flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Source</span>
              </div>
              <div className="flex-1 flex items-center gap-2 text-sm">
                {sourceIcons[task.source]}
                <span>{sourceLabels[task.source]}</span>
              </div>
            </div>

            {/* Created date */}
            <div className="flex items-center py-2 group hover:bg-muted/50 -mx-2 px-2 rounded-md">
              <div className="w-28 flex-shrink-0 flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Created</span>
              </div>
              <div className="flex-1 text-sm">
                {format(task.createdAt, "MMMM d, yyyy 'at' h:mm a")}
              </div>
            </div>

            {/* Due date if exists */}
            {task.dueDate && (
              <div className="flex items-center py-2 group hover:bg-muted/50 -mx-2 px-2 rounded-md">
                <div className="w-28 flex-shrink-0 flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Due</span>
                </div>
                <div className="flex-1 text-sm">
                  {format(task.dueDate, "MMMM d, yyyy")}
                </div>
              </div>
            )}

            {/* Last synced */}
            {task.syncedAt && (
              <div className="flex items-center py-2 group hover:bg-muted/50 -mx-2 px-2 rounded-md">
                <div className="w-28 flex-shrink-0 flex items-center gap-2 text-muted-foreground">
                  <StickyNote className="h-4 w-4" />
                  <span className="text-sm">Synced</span>
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  {format(task.syncedAt, "MMM d, h:mm a")}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Content/Context section - Notion page body style */}
          <div className="px-6 py-6">
            {task.context ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {task.context}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No additional content
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add notes in Notion to see them here
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
