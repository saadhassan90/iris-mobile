import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import ViewToggle from "@/components/dashboard/ViewToggle";
import TaskCard from "@/components/dashboard/TaskCard";
import KanbanColumn from "@/components/dashboard/KanbanColumn";
import CreateTaskSheet from "@/components/dashboard/CreateTaskSheet";
import { Button } from "@/components/ui/button";
import { useTasks, TaskSource } from "@/hooks/useTasks";

const Dashboard = () => {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { tasks, isLoading, isSyncing, addTask, moveTask, archiveTask, syncWithNotion } = useTasks();

  const handleCreateTask = async (title: string, source: TaskSource, dueDate?: Date) => {
    await addTask(title, source, dueDate);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header with add task and sync buttons */}
      <div className="flex gap-2">
        <Button
          className="flex-1 rounded-full gap-2"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add New Task
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={syncWithNotion}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* View toggle */}
      <div className="flex justify-center">
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Task views */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : view === "list" ? (
        <div className="flex flex-col gap-3 min-h-[200px]">
          {tasks.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No tasks yet. Add one above or use voice commands!
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={
                  task.status !== "done"
                    ? () => moveTask(task.id, task.status === "uncategorized" ? "todo" : task.status === "todo" ? "in_progress" : "done")
                    : undefined
                }
                onArchive={() => archiveTask(task.id)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-1 gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
          <div className="snap-center shrink-0">
            <KanbanColumn
              title="Uncategorized"
              status="uncategorized"
              tasks={tasks}
              onMoveTask={moveTask}
              onArchiveTask={archiveTask}
            />
          </div>
          <div className="snap-center shrink-0">
            <KanbanColumn
              title="To Do"
              status="todo"
              tasks={tasks}
              onMoveTask={moveTask}
              onArchiveTask={archiveTask}
            />
          </div>
          <div className="snap-center shrink-0">
            <KanbanColumn
              title="In Progress"
              status="in_progress"
              tasks={tasks}
              onMoveTask={moveTask}
              onArchiveTask={archiveTask}
            />
          </div>
          <div className="snap-center shrink-0">
            <KanbanColumn
              title="Done"
              status="done"
              tasks={tasks}
              onMoveTask={moveTask}
              onArchiveTask={archiveTask}
            />
          </div>
        </div>
      )}

      {/* Create Task Sheet */}
      <CreateTaskSheet
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
};

export default Dashboard;
