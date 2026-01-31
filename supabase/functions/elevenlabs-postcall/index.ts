import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("ElevenLabs postcall webhook received:", JSON.stringify(payload, null, 2));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract data from ElevenLabs post-call payload
    const conversationId = payload.conversation_id;
    const transcript = payload.transcript || [];
    const summary = payload.summary;
    const duration = payload.duration;
    const timestamp = payload.timestamp || new Date().toISOString();

    // Ensure conversation exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .single();

    if (!existingConv) {
      // Create conversation if it doesn't exist
      await supabase.from("conversations").insert({
        id: conversationId,
        title: `Voice Chat - ${new Date(timestamp).toLocaleString()}`,
        created_at: timestamp,
        updated_at: timestamp,
      });
    }

    // Store transcript messages
    const messagesToInsert = [];
    
    for (const turn of transcript) {
      messagesToInsert.push({
        conversation_id: conversationId,
        role: turn.role === "agent" ? "assistant" : "user",
        content: turn.message || turn.text || "",
        status: "delivered",
        created_at: turn.timestamp || timestamp,
      });
    }

    if (messagesToInsert.length > 0) {
      const { error: msgError } = await supabase
        .from("messages")
        .insert(messagesToInsert);

      if (msgError) {
        console.error("Error inserting messages:", msgError);
      }
    }

    // Update conversation with last message and summary
    const lastMessage = transcript.length > 0 
      ? transcript[transcript.length - 1].message || transcript[transcript.length - 1].text
      : summary || "Voice conversation ended";

    await supabase
      .from("conversations")
      .update({
        last_message: lastMessage,
        updated_at: timestamp,
      })
      .eq("id", conversationId);

    console.log(`Postcall processed: ${messagesToInsert.length} messages saved for conversation ${conversationId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        conversation_id: conversationId,
        messages_saved: messagesToInsert.length,
        message: "Post-call transcript saved" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in elevenlabs-postcall:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
