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
    const { message, studentId, studentClass, currentData, mode } = await req.json();
    
    console.log('Received request:', { message, mode, studentId, studentClass });

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    let systemPrompt = '';

    if (mode === 'learn') {
      // Learn mode - Educational assistant
      systemPrompt = `You are a friendly and knowledgeable educational assistant for students at PRESIDENCY PORTAL.

Your role:
- Help students understand concepts in Mathematics, Science, Social Studies, History, Geography, Coding, English, and any other subject
- Explain topics in a simple, student-friendly way
- Use examples and analogies to make learning easier
- Break down complex problems into simple steps
- Encourage curiosity and critical thinking
- Be patient and supportive

Guidelines:
- Keep explanations clear and age-appropriate
- Use emojis to make learning fun 😊
- Ask follow-up questions to ensure understanding
- Provide practice problems when relevant
- Celebrate student's learning progress
- If you don't know something, admit it and encourage the student to explore further

Remember: You're here to make learning enjoyable and accessible!`;
    } else {
      // Portal mode - Student portal assistant
      // Get IST time
      const tz = 'Asia/Kolkata';
      const now = new Date();
      const currentDateIST = now.toLocaleDateString('en-IN', { timeZone: tz });
      const currentDayIST = now.toLocaleDateString('en-IN', { timeZone: tz, weekday: 'long' });
      const currentTimeIST24 = now.toLocaleTimeString('en-IN', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
      const currentTimeIST12 = now.toLocaleTimeString('en-IN', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });
      const [hStr, mStr] = currentTimeIST24.split(':');
      const nowMinutesIST = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);

      // Compute schedule status
      const timetable = Array.isArray(currentData?.timetable) ? currentData.timetable : [];
      const todays = timetable.filter((e: any) => e.day === currentDayIST);

      function toMinutes(hhmm: string) {
        const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
        return h * 60 + m;
      }

      const schedule = todays.map((e: any) => {
        const [start, end] = e.timeSlot.split('-');
        const startMin = toMinutes(start);
        const endMin = toMinutes(end);
        let status: 'finished' | 'ongoing' | 'upcoming' = 'upcoming';
        if (nowMinutesIST >= endMin) status = 'finished';
        else if (nowMinutesIST >= startMin && nowMinutesIST < endMin) status = 'ongoing';
        return { ...e, startMin, endMin, status };
      }).sort((a: any, b: any) => a.startMin - b.startMin);

      const currentClass = schedule.find((s: any) => s.status === 'ongoing') || null;
      const nextClass = schedule.find((s: any) => s.status === 'upcoming') || null;

      systemPrompt = `You are a helpful AI assistant for PRESIDENCY PORTAL, a school management system.

Time Context (use ONLY these values - IST/Asia/Kolkata):
- Timezone: IST (Asia/Kolkata)
- Date: ${currentDateIST}
- Day: ${currentDayIST}
- Time (24h): ${currentTimeIST24}
- Time (12h): ${currentTimeIST12}

Computed Schedule for Today (do not guess):
${JSON.stringify({ nowMinutesIST, currentClass, nextClass, schedule }, null, 2)}

Student Context:
- Student ID: ${studentId}
- Student Class: ${studentClass}

Available Data:
${JSON.stringify(currentData, null, 2)}

Instructions:
- Use ONLY the provided IST time and computed schedule status
- Never infer or calculate the current time yourself
- When showing timetable, use the computed status (finished/ongoing/upcoming)
- When asked about assignments, show the most relevant ones based on deadlines
- When asked about attendance, calculate and show the percentage
- Be friendly, concise, and helpful
- Use emojis occasionally to make responses more friendly 😊`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log('AI Response:', aiResponse);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in chat-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
