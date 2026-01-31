import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import ViewToggle from "@/components/dashboard/ViewToggle";
import TaskCard from "@/components/dashboard/TaskCard";
import KanbanColumn from "@/components/dashboard/KanbanColumn";
import CreateTaskSheet from "@/components/dashboard/CreateTaskSheet";
import TaskFilters, { TaskFiltersState, defaultFilters } from "@/components/dashboard/TaskFilters";
import { Button } from "@/components/ui/button";
import { useTasks, TaskSource } from "@/hooks/useTasks";
import { useTaskFilters } from "@/hooks/useTaskFilters";
import { NOTION_STATUSES, STATUS_LABELS } from "@/lib/statusConfig";

const Dashboard = () => {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFiltersState>(defaultFilters);
  const { tasks, isLoading, isSyncing, addTask, moveTask, archiveTask, syncWithNotion } = useTasks();
  
  const filteredTasks = useTaskFilters(tasks, filters);

  const handleCreateTask = async (title: string, source: TaskSource, dueDate?: Date) => {
    await addTask(title, source, dueDate);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Fixed header section */}
      <div className="flex-shrink-0 p-4 pb-0 space-y-4">
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

        {/* Filters */}
        <TaskFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Scrollable content area */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : view === "list" ? (
        /* List view - whole container scrolls */
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {filteredTasks.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                {tasks.length === 0
                  ? "No tasks yet. Add one above or use voice commands!"
                  : "No tasks match your filters."}
              </p>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={
                    task.status !== NOTION_STATUSES.DONE
                      ? () => moveTask(
                          task.id,
                          task.status === NOTION_STATUSES.UNCATEGORIZED
                            ? NOTION_STATUSES.TODO
                            : task.status === NOTION_STATUSES.TODO
                            ? NOTION_STATUSES.IN_PROGRESS
                            : NOTION_STATUSES.DONE
                        )
                      : undefined
                  }
                  onArchive={() => archiveTask(task.id)}
                  onStatusChange={(newStatus) => moveTask(task.id, newStatus)}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        /* Kanban view - horizontal scroll for columns, vertical scroll within each column */
        <div className="flex-1 min-h-0 overflow-x-auto p-4">
          <div className="flex gap-3 h-full">
            <div className="shrink-0 h-full">
              <KanbanColumn
                title={STATUS_LABELS[NOTION_STATUSES.UNCATEGORIZED]}
                status={NOTION_STATUSES.UNCATEGORIZED}
                tasks={filteredTasks}
                onMoveTask={moveTask}
                onArchiveTask={archiveTask}
              />
            </div>
            <div className="shrink-0 h-full">
              <KanbanColumn
                title={STATUS_LABELS[NOTION_STATUSES.TODO]}
                status={NOTION_STATUSES.TODO}
                tasks={filteredTasks}
                onMoveTask={moveTask}
                onArchiveTask={archiveTask}
              />
            </div>
            <div className="shrink-0 h-full">
              <KanbanColumn
                title={STATUS_LABELS[NOTION_STATUSES.IN_PROGRESS]}
                status={NOTION_STATUSES.IN_PROGRESS}
                tasks={filteredTasks}
                onMoveTask={moveTask}
                onArchiveTask={archiveTask}
              />
            </div>
            <div className="shrink-0 h-full">
              <KanbanColumn
                title={STATUS_LABELS[NOTION_STATUSES.DONE]}
                status={NOTION_STATUSES.DONE}
                tasks={filteredTasks}
                onMoveTask={moveTask}
                onArchiveTask={archiveTask}
              />
            </div>
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
