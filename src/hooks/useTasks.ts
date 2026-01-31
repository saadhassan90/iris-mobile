import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  NotionStatus,
  NOTION_STATUSES,
  getDefaultStatus,
  isValidStatus,
} from "@/lib/statusConfig";

export type TaskStatus = NotionStatus;

export type TaskSource = "voice" | "manual" | "email" | "fireflies" | "notion" | "other";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  source: TaskSource;
  createdAt: Date;
  dueDate?: Date;
  archived?: boolean;
  notionPageId?: string | null;
  syncedAt?: Date | null;
  context?: string | null;
}

interface DbTask {
  id: string;
  title: string;
  status: string;
  source: string;
  created_at: string | null;
  due_date: string | null;
  archived: boolean | null;
  notion_page_id: string | null;
  synced_at: string | null;
  context: string | null;
  user_id: string | null;
  updated_at: string | null;
}

const mapDbTaskToTask = (dbTask: DbTask): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  status: isValidStatus(dbTask.status) ? dbTask.status : NOTION_STATUSES.UNCATEGORIZED,
  source: dbTask.source as TaskSource,
  createdAt: dbTask.created_at ? new Date(dbTask.created_at) : new Date(),
  dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
  archived: dbTask.archived ?? false,
  notionPageId: dbTask.notion_page_id,
  syncedAt: dbTask.synced_at ? new Date(dbTask.synced_at) : null,
  context: dbTask.context,
});

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedTasks = (data || []).map(mapDbTaskToTask);
      setTasks(mappedTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Sync with Notion
  const syncWithNotion = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("notion-sync", {
        body: { action: "full_sync" },
      });

      if (error) throw error;

      console.log("Notion sync results:", data);

      // Refresh tasks after sync
      await fetchTasks();

      const results = data?.results;
      if (results) {
        const changes = 
          results.created_in_supabase + 
          results.updated_in_supabase + 
          results.created_in_notion + 
          results.updated_in_notion;
        
        if (changes > 0) {
          toast({
            title: "Synced with Notion",
            description: `${changes} task(s) synced`,
          });
        }
      }
    } catch (error) {
      console.error("Notion sync failed:", error);
      toast({
        title: "Sync failed",
        description: "Could not sync with Notion",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [fetchTasks, toast]);

  // Initial fetch and setup realtime subscription
  useEffect(() => {
    fetchTasks();

    // Set up realtime subscription
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        (payload) => {
          console.log("Realtime task change:", payload);
          
          if (payload.eventType === "INSERT") {
            const newTask = mapDbTaskToTask(payload.new as DbTask);
            setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
          } else if (payload.eventType === "UPDATE") {
            const updatedTask = mapDbTaskToTask(payload.new as DbTask);
            setTasks((prev) =>
              prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as DbTask).id;
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  // Sync with Notion on mount and periodically
  useEffect(() => {
    // Initial sync
    syncWithNotion();

    // Set up periodic sync every 30 seconds
    const syncInterval = setInterval(() => {
      syncWithNotion();
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [syncWithNotion]);

  const addTask = async (title: string, source: TaskSource = "manual", dueDate?: Date) => {
    try {
      const newTaskData = {
        title,
        status: getDefaultStatus(source),
        source,
        due_date: dueDate?.toISOString() || null,
        user_id: "saad",
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(newTaskData)
        .select()
        .single();

      if (error) throw error;

      const newTask = mapDbTaskToTask(data);

      // Sync to Notion
      await supabase.functions.invoke("notion-sync", {
        body: { action: "create_in_notion", task: data },
      });

      return newTask;
    } catch (error) {
      console.error("Failed to add task:", error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<Omit<Task, "id">>) => {
    try {
      const dbUpdates: Partial<DbTask> = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.source !== undefined) dbUpdates.source = updates.source;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate?.toISOString() || null;
      if (updates.archived !== undefined) dbUpdates.archived = updates.archived;
      if (updates.context !== undefined) dbUpdates.context = updates.context;

      const { error } = await supabase
        .from("tasks")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;

      // Sync to Notion
      await supabase.functions.invoke("notion-sync", {
        body: { action: "update_in_notion", task_id: id, task: dbUpdates },
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const moveTask = async (id: string, status: TaskStatus) => {
    await updateTask(id, { status });
  };

  const archiveTask = async (id: string) => {
    try {
      await updateTask(id, { archived: true });

      // Archive in Notion
      await supabase.functions.invoke("notion-sync", {
        body: { action: "archive_in_notion", task_id: id },
      });
    } catch (error) {
      console.error("Failed to archive task:", error);
    }
  };

  // Filter out archived tasks for the UI
  const activeTasks = tasks.filter((task) => !task.archived);

  return {
    tasks: activeTasks,
    isLoading,
    isSyncing,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    archiveTask,
    syncWithNotion,
  };
};
