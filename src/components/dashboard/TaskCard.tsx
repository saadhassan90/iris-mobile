import { format } from "date-fns";
import { Check, Trash2, Mic, Keyboard } from "lucide-react";
import { Task, TaskStatus } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onComplete?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

const statusColors: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/20 text-primary",
  done: "bg-green-500/20 text-green-700 dark:text-green-400",
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const TaskCard = ({ task, onComplete, onDelete, compact = false }: TaskCardProps) => {
  return (
    <Card className={cn("transition-shadow hover:shadow-md", compact && "shadow-sm")}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("rounded-full text-xs", statusColors[task.status])}
              >
                {statusLabels[task.status]}
              </Badge>
              {task.source === "voice" ? (
                <Mic className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Keyboard className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>
              {task.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(task.createdAt, "MMM d, h:mm a")}
            </p>
          </div>
          
          {task.status !== "done" && (
            <div className="flex gap-1">
              {onComplete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-green-600 hover:bg-green-100 hover:text-green-700"
                  onClick={onComplete}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
