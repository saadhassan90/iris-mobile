import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactInfo {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  address: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, fileName } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Upload image to storage
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    const uniqueFileName = `${Date.now()}-${fileName || 'business-card.jpg'}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('business-cards')
      .upload(uniqueFileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('business-cards')
      .getPublicUrl(uniqueFileName);

    console.log("Image uploaded to:", publicUrl);

    // Call Lovable AI with vision to extract contact info
    const extractionPrompt = `You are analyzing a business card image. Extract all contact information you can find and return it as a JSON object.

Look for and extract:
- First name and last name (split the full name)
- Email address
- Phone number(s)
- Company/organization name
- Job title/position
- Website URL
- Physical address

Return ONLY a valid JSON object with these exact keys (use null for any field you cannot find):
{
  "first_name": "string or null",
  "last_name": "string or null", 
  "email": "string or null",
  "phone": "string or null",
  "company": "string or null",
  "job_title": "string or null",
  "website": "string or null",
  "address": "string or null",
  "raw_text": "all text you can read from the card"
}

Be thorough - examine the entire image carefully. Do not include any explanation, just the JSON.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: extractionPrompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: `data:image/jpeg;base64,${imageBase64}` 
                } 
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
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
      
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", responseText);

    // Parse the JSON from the response
    let contactInfo: ContactInfo & { raw_text?: string };
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        contactInfo = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Could not extract contact information from this image. Please try a clearer photo.",
          rawResponse: responseText
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save contact to database
    const { data: contact, error: dbError } = await supabase
      .from('contacts')
      .insert({
        first_name: contactInfo.first_name,
        last_name: contactInfo.last_name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        company: contactInfo.company,
        job_title: contactInfo.job_title,
        website: contactInfo.website,
        address: contactInfo.address,
        source_image_url: publicUrl,
        raw_extracted_text: contactInfo.raw_text || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Still return the extracted data even if save fails
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Contact extracted but failed to save to database",
          contact: contactInfo,
          imageUrl: publicUrl
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        contact,
        imageUrl: publicUrl
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Scan business card error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
