import { useState } from "react";
import { Plus } from "lucide-react";
import ViewToggle from "@/components/dashboard/ViewToggle";
import TaskCard from "@/components/dashboard/TaskCard";
import KanbanColumn from "@/components/dashboard/KanbanColumn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/useTasks";

const Dashboard = () => {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { tasks, addTask, moveTask, archiveTask } = useTasks();

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle, "manual");
    setNewTaskTitle("");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Add task input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          className="rounded-full"
        />
        <Button
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
          onClick={handleAddTask}
          disabled={!newTaskTitle.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* View toggle */}
      <div className="flex justify-center">
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Task views */}
      {view === "list" ? (
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
    </div>
  );
};

export default Dashboard;
