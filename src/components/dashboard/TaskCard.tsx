import { useState } from "react";
import { format } from "date-fns";
import { Check, Archive, Mic, Keyboard, Mail, Headphones, HelpCircle, StickyNote } from "lucide-react";
import { Task, TaskStatus, TaskSource } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NOTION_STATUSES, STATUS_LABELS, STATUS_COLORS } from "@/lib/statusConfig";
import TaskDetailModal from "./TaskDetailModal";

interface TaskCardProps {
  task: Task;
  onComplete?: () => void;
  onArchive?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  compact?: boolean;
  draggable?: boolean;
}

// Badge styling for status
const statusBadgeColors: Record<TaskStatus, string> = {
  [NOTION_STATUSES.UNCATEGORIZED]: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  [NOTION_STATUSES.TODO]: "bg-muted text-muted-foreground",
  [NOTION_STATUSES.IN_PROGRESS]: "bg-primary/20 text-primary",
  [NOTION_STATUSES.DONE]: "bg-green-500/20 text-green-700 dark:text-green-400",
};

const sourceIcons: Record<TaskSource, React.ReactNode> = {
  voice: <Mic className="h-3 w-3" />,
  manual: <Keyboard className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  fireflies: <Headphones className="h-3 w-3" />,
  notion: <StickyNote className="h-3 w-3" />,
  other: <HelpCircle className="h-3 w-3" />,
};

const sourceLabels: Record<TaskSource, string> = {
  voice: "Voice",
  manual: "Manual",
  email: "Email",
  fireflies: "Fireflies",
  notion: "Notion",
  other: "Other",
};

const TaskCard = ({ 
  task, 
  onComplete, 
  onArchive, 
  onStatusChange,
  compact = false, 
  draggable = false 
}: TaskCardProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on action buttons
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    setModalOpen(true);
  };

  const handleComplete = () => {
    onComplete?.();
    setModalOpen(false);
  };

  const handleArchive = () => {
    onArchive?.();
    setModalOpen(false);
  };

  const statusColor = statusBadgeColors[task.status] ?? "bg-muted text-muted-foreground";
  const statusLabel = STATUS_LABELS[task.status] ?? task.status;

  return (
    <>
      <Card 
        draggable={draggable}
        onDragStart={handleDragStart}
        onClick={handleCardClick}
        className={cn(
          "transition-shadow hover:shadow-md cursor-pointer", 
          compact && "shadow-sm",
          draggable && "cursor-grab active:cursor-grabbing"
        )}
      >
        <CardContent className={cn("p-4", compact && "p-3")}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className={cn("rounded-full text-xs", statusColor)}
                >
                  {statusLabel}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs gap-1 text-muted-foreground"
                >
                  {sourceIcons[task.source]}
                  {sourceLabels[task.source]}
                </Badge>
              </div>
              <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>
                {task.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(task.createdAt, "MMM d, h:mm a")}
              </p>
            </div>
            
            <div className="flex gap-1">
              {task.status !== NOTION_STATUSES.DONE && onComplete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-green-600 hover:bg-green-100 hover:text-green-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {onArchive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskDetailModal
        task={task}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStatusChange={onStatusChange}
        onComplete={handleComplete}
        onArchive={handleArchive}
      />
    </>
  );
};

export default TaskCard;
