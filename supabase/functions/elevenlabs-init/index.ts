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
    console.log("ElevenLabs init webhook received:", JSON.stringify(payload, null, 2));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract conversation data from ElevenLabs payload
    const conversationId = payload.conversation_id;
    const agentId = payload.agent_id;
    const timestamp = payload.timestamp || new Date().toISOString();

    // Create a new conversation record for this voice session
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        id: conversationId,
        title: `Voice Chat - ${new Date(timestamp).toLocaleString()}`,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .select()
      .single();

    if (convError && !convError.message.includes("duplicate")) {
      console.error("Error creating conversation:", convError);
      // Don't fail - conversation might already exist
    }

    console.log("Voice session initialized:", conversationId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        conversation_id: conversationId,
        message: "Voice session initialized" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in elevenlabs-init:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
