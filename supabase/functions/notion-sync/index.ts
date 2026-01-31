import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Notion database ID for Saad's To-Do List
// NOTE: this must be the database's 32-char ID (not the ?v= view ID).
const NOTION_DATABASE_ID = "14b374dfd4ed80059129fba94668d6f5";

// Status mapping between app and Notion
const statusToNotion: Record<string, string> = {
  uncategorized: "Not Started",
  todo: "Not Started",
  in_progress: "In Progress",
  done: "Complete🙌",
};

const statusFromNotion: Record<string, string> = {
  "Not Started": "todo",
  "In Progress": "in_progress",
  "Complete🙌": "done",
  "IRIS Generated": "uncategorized",
};

interface NotionPage {
  id: string;
  properties: {
    Name: { title: Array<{ plain_text: string }> };
    Status: { select: { name: string } | null };
    "Date Created": { created_time: string };
  };
  created_time: string;
  last_edited_time: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  archived: boolean;
  notion_page_id: string | null;
  synced_at: string | null;
  user_id: string;
  context: string | null;
}

async function notionFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const NOTION_API_KEY = Deno.env.get("NOTION_API_KEY");
  if (!NOTION_API_KEY) {
    throw new Error("NOTION_API_KEY is not configured");
  }

  return fetch(`https://api.notion.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

async function fetchNotionTasks(): Promise<NotionPage[]> {
  const response = await notionFetch(`/databases/${NOTION_DATABASE_ID}/query`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.results as NotionPage[];
}

async function createNotionPage(task: Task): Promise<string> {
  const response = await notionFetch("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        Name: {
          title: [{ text: { content: task.title } }],
        },
        Status: {
          select: { name: statusToNotion[task.status] || "Uncategorized" },
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Notion page: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.id;
}

async function updateNotionPage(pageId: string, task: Task): Promise<void> {
  const response = await notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({
      properties: {
        Name: {
          title: [{ text: { content: task.title } }],
        },
        Status: {
          select: { name: statusToNotion[task.status] || "Uncategorized" },
        },
      },
      archived: task.archived || false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Notion page: ${response.status} - ${error}`);
  }
}

async function archiveNotionPage(pageId: string): Promise<void> {
  const response = await notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ archived: true }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to archive Notion page: ${response.status} - ${error}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for specific task sync
    let body: { action?: string; task_id?: string; task?: Partial<Task> } = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        // Empty body is fine for full sync
      }
    }

    const action = body.action || "full_sync";
    const results = {
      created_in_supabase: 0,
      updated_in_supabase: 0,
      created_in_notion: 0,
      updated_in_notion: 0,
      errors: [] as string[],
    };

    // Handle specific actions
    if (action === "create_in_notion" && body.task) {
      // Create a new task in Notion from local task
      const task = body.task as Task;
      try {
        const notionPageId = await createNotionPage(task);
        
        // Update the task with the Notion page ID
        await supabase
          .from("tasks")
          .update({ notion_page_id: notionPageId, synced_at: new Date().toISOString() })
          .eq("id", task.id);
        
        results.created_in_notion = 1;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        results.errors.push(`Failed to create in Notion: ${errorMessage}`);
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_in_notion" && body.task_id && body.task) {
      // Update an existing task in Notion
      const { data: existingTask } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", body.task_id)
        .single();

      if (existingTask?.notion_page_id) {
        try {
          await updateNotionPage(existingTask.notion_page_id, {
            ...existingTask,
            ...body.task,
          } as Task);
          
          await supabase
            .from("tasks")
            .update({ synced_at: new Date().toISOString() })
            .eq("id", body.task_id);
          
          results.updated_in_notion = 1;
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          results.errors.push(`Failed to update in Notion: ${errorMessage}`);
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "archive_in_notion" && body.task_id) {
      // Archive a task in Notion
      const { data: existingTask } = await supabase
        .from("tasks")
        .select("notion_page_id")
        .eq("id", body.task_id)
        .single();

      if (existingTask?.notion_page_id) {
        try {
          await archiveNotionPage(existingTask.notion_page_id);
          results.updated_in_notion = 1;
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          results.errors.push(`Failed to archive in Notion: ${errorMessage}`);
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Full bi-directional sync
    // 1. Fetch all tasks from Notion
    const notionPages = await fetchNotionTasks();

    // 2. Fetch all tasks from Supabase
    const { data: supabaseTasks, error: fetchError } = await supabase
      .from("tasks")
      .select("*");

    if (fetchError) {
      throw new Error(`Failed to fetch Supabase tasks: ${fetchError.message}`);
    }

    const tasks = (supabaseTasks || []) as Task[];

    // Create a map of Notion page IDs to tasks
    const tasksByNotionId = new Map<string, Task>();
    const tasksWithoutNotion: Task[] = [];

    for (const task of tasks) {
      if (task.notion_page_id) {
        tasksByNotionId.set(task.notion_page_id, task);
      } else if (!task.archived) {
        tasksWithoutNotion.push(task);
      }
    }

    // Create a set of processed Notion page IDs
    const processedNotionIds = new Set<string>();

    // 3. Sync from Notion to Supabase
    for (const page of notionPages) {
      processedNotionIds.add(page.id);

      const title =
        page.properties.Name?.title?.[0]?.plain_text || "Untitled";
      const notionStatus = page.properties.Status?.select?.name || "Uncategorized";
      const status = statusFromNotion[notionStatus] || "uncategorized";

      const existingTask = tasksByNotionId.get(page.id);

      if (existingTask) {
        // Check if Notion has newer changes (compare last_edited_time with synced_at)
        const notionEditTime = new Date(page.last_edited_time).getTime();
        const syncedAt = existingTask.synced_at
          ? new Date(existingTask.synced_at).getTime()
          : 0;

        if (notionEditTime > syncedAt) {
          // Notion is newer, update Supabase
          const { error: updateError } = await supabase
            .from("tasks")
            .update({
              title,
              status,
              synced_at: new Date().toISOString(),
            })
            .eq("id", existingTask.id);

          if (updateError) {
            results.errors.push(
              `Failed to update task ${existingTask.id}: ${updateError.message}`
            );
          } else {
            results.updated_in_supabase++;
          }
        }
      } else {
        // New task from Notion, create in Supabase
        const { error: insertError } = await supabase.from("tasks").insert({
          title,
          status,
          source: "notion",
          notion_page_id: page.id,
          synced_at: new Date().toISOString(),
          user_id: "saad",
        });

        if (insertError) {
          results.errors.push(
            `Failed to create task from Notion: ${insertError.message}`
          );
        } else {
          results.created_in_supabase++;
        }
      }
    }

    // 4. Push local tasks without Notion IDs to Notion
    for (const task of tasksWithoutNotion) {
      try {
        const notionPageId = await createNotionPage(task);

        await supabase
          .from("tasks")
          .update({ notion_page_id: notionPageId, synced_at: new Date().toISOString() })
          .eq("id", task.id);

        results.created_in_notion++;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        results.errors.push(
          `Failed to create Notion page for task ${task.id}: ${errorMessage}`
        );
      }
    }

    // 5. Check for tasks that exist in Supabase but were deleted in Notion
    for (const task of tasks) {
      if (task.notion_page_id && !processedNotionIds.has(task.notion_page_id) && !task.archived) {
        // Task was deleted in Notion, archive in Supabase
        const { error: archiveError } = await supabase
          .from("tasks")
          .update({ archived: true })
          .eq("id", task.id);

        if (archiveError) {
          results.errors.push(
            `Failed to archive task ${task.id}: ${archiveError.message}`
          );
        } else {
          results.updated_in_supabase++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    console.error("Sync error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
