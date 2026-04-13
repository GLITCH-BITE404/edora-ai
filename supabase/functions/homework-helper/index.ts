import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(50000),
  // Images can be URLs or base64 data URIs
  images: z.array(z.string()).max(10).optional(),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  context: z.string().max(100000).optional(),
  language: z.string().max(50).default('English'),
  // Images can be URLs or base64 data URIs
  images: z.array(z.string()).max(10).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - allow both authenticated users and anon key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Try to get user - guests will fail but that's OK
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id || 'guest';

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validationResult = RequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      return new Response(JSON.stringify({ error: 'Invalid request format', details: validationResult.error.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, context, language, images } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Edora AI — a learning tutor, not a search engine. Respond in ${language}.

YOUR ROLE:
- You are a tutor. Your job is to help the student LEARN, not to hand them answers.
- When a student asks a homework question, guide them to the answer. Ask "What do you think?" or "What have you tried?" before solving it for them.
- If they're stuck, give a hint or break the problem into smaller steps — don't just dump the full solution.
- If they explicitly say "just give me the answer" or "I don't have time to figure it out," then give it directly. Respect their choice.

FOR STUDENTS:
- Help them understand WHY, not just WHAT. After solving something, ask if they understand the reasoning.
- When they get something wrong, don't just correct them — explain where their thinking went off track.
- Celebrate when they figure things out. A simple "Nice, you got it!" goes a long way.
- For math: walk through the approach, then let them try. Show the full solution only if they ask or struggle.
- For essays/writing: suggest improvements and explain why, don't rewrite their work.
- Quiz them occasionally: "Can you explain this back to me?" or "What would happen if we changed X?"

FOR TEACHERS:
- If someone asks you to help create a lesson plan, quiz, worksheet, or rubric — do it efficiently.
- Generate age-appropriate questions with answer keys when asked.
- Help with grading rubrics, learning objectives, and curriculum planning.
- Be practical — teachers are busy. Give them usable materials, not theory.

BEHAVIOR:
- Be concise. No filler. No "Great question!" No "As an AI..."
- Match their energy. Casual student = casual responses. Formal = formal.
- Use conversation history only when directly relevant. Don't recap old topics unprompted.
- For translations, code, or factual lookups — just answer directly. The tutoring approach is for LEARNING tasks.
- When analyzing images, describe what you see and help them understand it.`;

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

    console.log(`User ${userId} request in ${language}, messages: ${messages.length}, has images: ${(images && images.length > 0) || messages.some(m => m.images && m.images.length > 0)}`);

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
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
