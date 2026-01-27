import { useState } from "react";
import { Task, TaskStatus } from "@/hooks/useTasks";
import TaskCard from "./TaskCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onMoveTask: (id: string, status: TaskStatus) => void;
  onArchiveTask: (id: string) => void;
}

const columnColors: Record<TaskStatus, string> = {
  uncategorized: "border-orange-500/50",
  todo: "border-muted-foreground/30",
  in_progress: "border-primary/50",
  done: "border-green-500/50",
};

const KanbanColumn = ({
  title,
  status,
  tasks,
  onMoveTask,
  onArchiveTask,
}: KanbanColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const filteredTasks = tasks.filter((task) => task.status === status);
  
  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === "uncategorized") return "todo";
    if (current === "todo") return "in_progress";
    if (current === "in_progress") return "done";
    return null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onMoveTask(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex h-full min-w-[280px] flex-col rounded-xl border-2 bg-card p-3 transition-colors",
        columnColors[status],
        isDragOver && "bg-accent/50 border-primary"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {filteredTasks.length}
        </span>
      </div>
      
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {isDragOver ? "Drop here" : "No tasks"}
          </p>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              compact
              draggable
              onComplete={
                getNextStatus(status)
                  ? () => onMoveTask(task.id, getNextStatus(status)!)
                  : undefined
              }
              onArchive={() => onArchiveTask(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
