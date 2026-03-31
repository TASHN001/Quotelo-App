import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get("OPEN_API_KEY");
    if (!openaiApiKey) {
      console.error("[Transcribe] OPEN_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error: true,
          message: "Transcription service not configured. Please contact support."
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Invalid content type. Expected multipart/form-data."
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "No audio file provided."
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[Transcribe] Received audio file:", audioFile.name, audioFile.type, audioFile.size, "bytes");

    const whisperFormData = new FormData();
    whisperFormData.append("file", audioFile);
    whisperFormData.append("model", "whisper-1");
    whisperFormData.append("language", "en");

    console.log("[Transcribe] Calling OpenAI Whisper API...");
    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: whisperFormData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error("[Transcribe] Whisper API error - Status:", whisperResponse.status);
      console.error("[Transcribe] Whisper API error - Response:", errorText);
      return new Response(
        JSON.stringify({
          error: true,
          message: "Transcription service is temporarily unavailable. Please try again."
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text;

    if (!transcript) {
      console.error("[Transcribe] No transcript in Whisper response");
      return new Response(
        JSON.stringify({
          error: true,
          message: "No speech detected in audio. Please try again."
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[Transcribe] Successfully transcribed:", transcript);

    return new Response(
      JSON.stringify({
        transcript: transcript.trim(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Transcribe] Unexpected error:", error);
    console.error("[Transcribe] Error stack:", error.stack);
    return new Response(
      JSON.stringify({
        error: true,
        message: "An unexpected error occurred during transcription. Please try again."
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
