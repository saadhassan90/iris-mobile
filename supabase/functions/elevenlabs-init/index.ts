import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, xi-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const torontoTime = now.toLocaleString("en-US", { 
      timeZone: "America/Toronto",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

    const hour = parseInt(now.toLocaleString("en-US", { timeZone: "America/Toronto", hour: "numeric", hour12: false }));
    const greeting = hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 17 ? "afternoon" : hour >= 17 && hour < 21 ? "evening" : "night";

    let taskSummary = "No pending tasks.";
    try {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("title, status")
        .eq("archived", false)
        .neq("status", "done")
        .order("created_at", { ascending: false })
        .limit(10);

      if (tasks && tasks.length > 0) {
        const taskList = tasks.map(t => `• ${t.title}`).join("\n");
        taskSummary = `Saad has ${tasks.length} pending tasks:\n${taskList}`;
      }
    } catch (e) {
      console.error("Tasks fetch error:", e);
    }

    let recentContext = "";
    try {
      const { data: convos } = await supabase
        .from("conversations")
        .select("title, summary")
        .order("created_at", { ascending: false })
        .limit(3);

      if (convos && convos.length > 0) {
        const convoList = convos.filter(c => c.summary || c.title).map(c => c.summary || c.title).slice(0, 2);
        if (convoList.length > 0) {
          recentContext = `Recent conversations: ${convoList.join("; ")}`;
        }
      }
    } catch (e) {
      console.error("Conversations fetch error:", e);
    }

    const dynamicData = {
      current_time: torontoTime,
      timezone: "Eastern Time",
      greeting_time: greeting,
      user_name: "Saad",
      tasks: taskSummary,
      recent_context: recentContext || "No recent conversation history.",
      briefing: `Good ${greeting}, it's ${torontoTime}. ${taskSummary}`
    };

    console.log("Init data:", JSON.stringify(dynamicData).substring(0, 300));

    return new Response(JSON.stringify(dynamicData), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("elevenlabs-init error:", error);
    return new Response(
      JSON.stringify({ user_name: "Saad", greeting_time: "there", briefing: "Having trouble loading data." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
