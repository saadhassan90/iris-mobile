import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for clawdbot API configuration
    const CLAWDBOT_API_URL = Deno.env.get("CLAWDBOT_API_URL");
    const CLAWDBOT_API_KEY = Deno.env.get("CLAWDBOT_API_KEY");

    // If clawdbot is configured, use it
    if (CLAWDBOT_API_URL && CLAWDBOT_API_KEY) {
      console.log("Using clawdbot API");
      
      // Build messages array in OpenAI format
      const messages = [];
      
      // Add conversation history
      if (Array.isArray(conversationHistory)) {
        for (const msg of conversationHistory) {
          if (msg.role && msg.content) {
            messages.push({ role: msg.role, content: msg.content });
          }
        }
      }
      
      // Add current message
      messages.push({ role: "user", content: message });

      // Generate a session ID for context continuity
      const sessionId = `lovable-${Date.now()}`;
      
      const response = await fetch(CLAWDBOT_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLAWDBOT_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "clawdbot:main",
          messages,
          stream: false,
          user: sessionId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Clawdbot API error:", response.status, errorText);
        throw new Error("Clawdbot API request failed");
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || "I couldn't process that request.";
      
      return new Response(
        JSON.stringify({ response: responseText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback to Lovable AI as placeholder
    console.log("Using Lovable AI as placeholder (clawdbot not configured)");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI backend not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build conversation messages
    const messages = [
      {
        role: "system",
        content: `You are Iris, a helpful AI assistant powered by clawdbot. You help users with:
- Task management (creating, updating, querying tasks)
- Email and calendar management
- General questions and assistance

Keep responses concise and conversational since they will be spoken aloud.
When the user asks to create a task, confirm what you're creating.
When asked about tasks, emails, or calendar, acknowledge you're checking and provide helpful info.`,
      },
    ];

    // Add conversation history if provided
    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current message
    messages.push({ role: "user", content: message });

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI request failed");
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("clawdbot-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
