import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, language = 'English', images } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Edora AI, a smart, friendly, and unrestricted assistant. You MUST respond primarily in ${language}.

IMPORTANT RULES:
- You help with ANYTHING the user asks - homework, translations, general questions, coding, etc.
- NEVER refuse to help or say you can't do something
- If asked "how do I say X in [language]", provide the translation
- If asked about any topic, answer helpfully
- Remember the ENTIRE conversation - refer back to previous messages when relevant
- When analyzing images, describe what you see in detail and answer questions about them

Your behavior:
- Always respond in ${language} (include technical terms or foreign words as needed)
- Understand vague, short, or incomplete questions - figure out what the user needs
- Give direct, clear answers
- For math: show the answer and key steps
- For translations: provide the translation directly
- For general questions: answer naturally and helpfully
- For images: describe what you see and answer any questions about them
- Be smart about context from earlier in the conversation
- Format answers cleanly using line breaks when helpful
- Be friendly, helpful, and conversational

You are NOT restricted to homework only. Help with:
- Translations to any language
- General knowledge questions
- Coding and programming
- Writing and grammar
- Math and science
- History, geography, arts
- Image analysis and description
- Literally anything the user asks

Remember: You have memory of this conversation. Use it to give better, contextual answers.`;

    // Build messages array with conversation history
    const apiMessages: { role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }[] = [
      { role: "system", content: systemPrompt }
    ];

    // Add context as a system message if provided
    if (context) {
      apiMessages.push({ 
        role: "system", 
        content: `[Uploaded file content for reference]\n${context}` 
      });
    }

    // Add all conversation messages, handling images for vision
    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        // Check if this message has images attached
        if (msg.images && Array.isArray(msg.images) && msg.images.length > 0) {
          // Create multimodal content for messages with images
          const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
            { type: "text", text: msg.content }
          ];
          
          // Add each image as an image_url part
          for (const imageUrl of msg.images) {
            content.push({
              type: "image_url",
              image_url: { url: imageUrl }
            });
          }
          
          apiMessages.push({ role: msg.role, content });
        } else {
          // Regular text message
          apiMessages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    console.log(`Processing request in ${language}, messages: ${messages?.length || 0}, has images: ${(images && images.length > 0) || messages?.some((m: { images?: string[] }) => m.images && m.images.length > 0)}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Edora AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});