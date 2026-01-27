import { useState, useEffect } from "react";

export type TaskStatus = "uncategorized" | "todo" | "in_progress" | "done";

export type TaskSource = "voice" | "manual" | "email" | "fireflies" | "other";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  source: TaskSource;
  createdAt: Date;
  dueDate?: Date;
}

const STORAGE_KEY = "voice-agent-tasks";

const loadTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((task: Task) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }));
    }
  } catch (e) {
    console.error("Failed to load tasks:", e);
  }
  return [];
};

const saveTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed to save tasks:", e);
  }
};

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const addTask = (title: string, source: TaskSource = "voice") => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      status: source === "manual" ? "todo" : "uncategorized",
      source,
      createdAt: new Date(),
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Omit<Task, "id">>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const moveTask = (id: string, status: TaskStatus) => {
    updateTask(id, { status });
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
  };
};
