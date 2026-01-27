import { useState } from "react";
import { Plus, Mail, ChevronDown, ChevronUp } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ViewToggle from "@/components/dashboard/ViewToggle";
import TaskCard from "@/components/dashboard/TaskCard";
import KanbanColumn from "@/components/dashboard/KanbanColumn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTasks, TaskStatus } from "@/hooks/useTasks";

const Dashboard = () => {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [emailsOpen, setEmailsOpen] = useState(true);
  const { tasks, addTask, moveTask, deleteTask } = useTasks();

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle, "manual");
    setNewTaskTitle("");
  };

  // Mock email data
  const emails = [
    { id: "1", subject: "Follow up with client", recipient: "john@example.com", status: "pending" },
    { id: "2", subject: "Weekly report", recipient: "team@company.com", status: "sent" },
    { id: "3", subject: "Meeting notes", recipient: "manager@company.com", status: "draft" },
  ];

  const emailStatusColors: Record<string, string> = {
    sent: "bg-green-500/20 text-green-700 dark:text-green-400",
    pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    draft: "bg-muted text-muted-foreground",
  };

  return (
    <AppLayout title="Dashboard">
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
        <div className="min-h-[200px]">
          {view === "list" ? (
            <div className="flex flex-col gap-3">
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
                        ? () => moveTask(task.id, task.status === "todo" ? "in_progress" : "done")
                        : undefined
                    }
                    onDelete={() => deleteTask(task.id)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
              <div className="snap-center shrink-0">
                <KanbanColumn
                  title="To Do"
                  status="todo"
                  tasks={tasks}
                  onMoveTask={moveTask}
                  onDeleteTask={deleteTask}
                />
              </div>
              <div className="snap-center shrink-0">
                <KanbanColumn
                  title="In Progress"
                  status="in_progress"
                  tasks={tasks}
                  onMoveTask={moveTask}
                  onDeleteTask={deleteTask}
                />
              </div>
              <div className="snap-center shrink-0">
                <KanbanColumn
                  title="Done"
                  status="done"
                  tasks={tasks}
                  onMoveTask={moveTask}
                  onDeleteTask={deleteTask}
                />
              </div>
            </div>
          )}
        </div>

        {/* Email section */}
        <Collapsible open={emailsOpen} onOpenChange={setEmailsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" />
                  Email Actions
                  <Badge variant="secondary" className="rounded-full">
                    {emails.length}
                  </Badge>
                </CardTitle>
                {emailsOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-2 pt-2">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{email.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        To: {email.recipient}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`rounded-full text-xs ${emailStatusColors[email.status]}`}
                    >
                      {email.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
