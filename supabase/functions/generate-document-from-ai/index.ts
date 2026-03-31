import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  documentType: string;
  prompt: string;
  userProfile?: {
    businessName?: string;
    email?: string;
    currency?: string;
  };
}

function getTodayISO(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getCurrentDateContext(): { dateISO: string; dayOfWeek: string; fullDate: string } {
  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return {
    dateISO: today.toISOString().split('T')[0],
    dayOfWeek: days[today.getDay()],
    fullDate: `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`
  };
}

function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getNextDayOfWeek(dayName: string, fromDate?: string): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());
  
  if (targetDay === -1) {
    const startDate = fromDate || getTodayISO();
    return addDaysToDate(startDate, 7);
  }
  
  const today = fromDate ? new Date(fromDate) : new Date();
  const currentDay = today.getDay();
  let daysToAdd = targetDay - currentDay;
  
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysToAdd);
  return targetDate.toISOString().split('T')[0];
}

function parseDueDate(dueDateInfo: string | null, issueDate: string): string {
  if (!dueDateInfo) {
    return addDaysToDate(issueDate, 7);
  }

  const lowerInfo = dueDateInfo.toLowerCase();

  if (lowerInfo.includes('tomorrow')) {
    return addDaysToDate(issueDate, 1);
  }

  if (lowerInfo.includes('today')) {
    return issueDate;
  }

  const inDaysMatch = lowerInfo.match(/(\d+)\s*days?/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    return addDaysToDate(issueDate, days);
  }

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of dayNames) {
    if (lowerInfo.includes(day)) {
      return getNextDayOfWeek(day, issueDate);
    }
  }

  return addDaysToDate(issueDate, 7);
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { documentType, prompt, userProfile }: RequestBody = await req.json();

    if (!documentType || !prompt) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Missing required fields: documentType and prompt are required"
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

    const openaiApiKey = Deno.env.get("OPEN_API_KEY");
    if (!openaiApiKey) {
      console.error("[Edge Function] OPEN_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error: true,
          message: "AI service not configured. Please contact support."
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

    const dateContext = getCurrentDateContext();
    const requestId = generateRequestId();

    const systemPrompt = `You are an invoice data extraction assistant. Extract invoice information from natural language and return ONLY valid JSON.

You MUST respond with ONLY a JSON object matching this exact structure:

{
  "clientName": string or null,
  "clientEmail": string or null,
  "items": [
    {
      "description": string,
      "quantity": number,
      "amount": number
    }
  ],
  "dueDateInfo": string or null,
  "taxRate": number,
  "notes": string or null,
  "complete": boolean,
  "followUpQuestion": string or null
}

Extraction rules:
1. clientName: Extract the client/customer name from the prompt
2. clientEmail: Extract email if provided, otherwise null
3. items: Array of line items. Each item needs description, quantity, and amount
   - If user provides ONE item with ONE amount (e.g., "R5000 for consulting"), create ONE item with quantity=1 and amount=5000
   - If user provides MULTIPLE items but ONLY ONE total amount, set complete=false and ask for clarification
   - If user provides multiple items with individual amounts, create multiple items
   - Remove currency symbols (R, $, etc.) and return numeric values only
   - Never invent items not mentioned in the prompt
4. dueDateInfo: Extract due date information as natural language (e.g., "Friday", "tomorrow", "7 days", "next Monday")
5. taxRate: Extract tax rate as decimal (e.g., 15% becomes 0.15). Default to 0 if not mentioned
6. notes: Any additional notes or payment terms mentioned
7. complete: Set to true if you have enough information to generate the invoice. Set to false if critical information is missing or ambiguous
8. followUpQuestion: If complete=false, ask ONE specific question to clarify. Otherwise null

CURRENT DATE AND TIME CONTEXT:
- Today is ${dateContext.fullDate}
- Current day of week: ${dateContext.dayOfWeek}
- ISO date: ${dateContext.dateISO}

Use this context to accurately interpret relative date references like "next Monday", "tomorrow", "this Friday", etc.

Examples:
Prompt: "Invoice for Laaq, R5000, due Friday"
Response: {"clientName": "Laaq", "clientEmail": null, "items": [{"description": "Services", "quantity": 1, "amount": 5000}], "dueDateInfo": "Friday", "taxRate": 0, "notes": null, "complete": true, "followUpQuestion": null}

Prompt: "Invoice for ACME Corp, web development and design, R15000 total"
Response: {"clientName": "ACME Corp", "clientEmail": null, "items": [], "dueDateInfo": null, "taxRate": 0, "notes": null, "complete": false, "followUpQuestion": "You mentioned web development and design for R15000 total. Could you provide the breakdown for each service?"}

Prompt: "Invoice for John Doe, 10 hours consulting at R500/hour, 5 hours design at R600/hour, due in 14 days"
Response: {"clientName": "John Doe", "clientEmail": null, "items": [{"description": "Consulting", "quantity": 10, "amount": 500}, {"description": "Design", "quantity": 5, "amount": 600}], "dueDateInfo": "14 days", "taxRate": 0, "notes": null, "complete": true, "followUpQuestion": null}

Respond with ONLY the JSON object, no markdown formatting, no explanations.`;

    let openaiResponse;
    try {
      console.log("[Edge Function] Calling OpenAI API...");
      openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });
    } catch (fetchError) {
      console.error("[Edge Function] OpenAI API fetch error:", fetchError);
      return new Response(
        JSON.stringify({
          error: true,
          message: "Failed to connect to AI service. Please try again."
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

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[Edge Function] OpenAI API error - Status:", openaiResponse.status);
      console.error("[Edge Function] OpenAI API error - Response:", errorText);
      return new Response(
        JSON.stringify({
          error: true,
          message: "AI service is temporarily unavailable. Please try again."
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

    let openaiData;
    try {
      openaiData = await openaiResponse.json();
    } catch (jsonError) {
      console.error("[Edge Function] Failed to parse OpenAI response as JSON:", jsonError);
      return new Response(
        JSON.stringify({
          error: true,
          message: "Received invalid response from AI service. Please try again."
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

    const aiResponse = openaiData.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error("[Edge Function] No content in OpenAI response");
      return new Response(
        JSON.stringify({
          error: true,
          message: "AI service returned an empty response. Please try again."
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

    let extractedData;
    try {
      extractedData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("[Edge Function] Failed to parse AI response:", parseError);
      console.error("[Edge Function] AI response was:", aiResponse);
      return new Response(
        JSON.stringify({
          error: true,
          message: "AI returned an invalid format. Please rephrase your request."
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

    if (!extractedData.complete) {
      const incompleteDraft = {
        requestId: requestId,
        documentType: documentType,
        complete: false,
        followUpQuestion: extractedData.followUpQuestion || "Could you provide more details about the items and amounts?",
        client: {
          name: extractedData.clientName || null,
          email: extractedData.clientEmail || null,
        },
        items: [],
        issueDate: dateContext.dateISO,
        dueDate: addDaysToDate(dateContext.dateISO, 7),
        subtotal: 0,
        tax: 0,
        total: 0,
        notes: extractedData.notes || null,
      };

      console.log("[Edge Function] Incomplete data, returning follow-up question");
      return new Response(
        JSON.stringify(incompleteDraft),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const items = extractedData.items.map((item: any) => {
      const quantity = item.quantity || 1;
      const unitPrice = item.amount || 0;
      const lineTotal = quantity * unitPrice;
      return {
        description: item.description || "Services",
        quantity: quantity,
        unitPrice: unitPrice,
        total: lineTotal,
      };
    });

    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const taxRate = extractedData.taxRate || 0;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const issueDate = dateContext.dateISO;
    const dueDate = parseDueDate(extractedData.dueDateInfo, issueDate);

    const invoiceDraft = {
      requestId: requestId,
      documentType: documentType,
      complete: true,
      followUpQuestion: null,
      client: {
        name: extractedData.clientName || null,
        email: extractedData.clientEmail || null,
      },
      items: items,
      issueDate: issueDate,
      dueDate: dueDate,
      subtotal: subtotal,
      tax: taxAmount,
      total: total,
      notes: extractedData.notes || null,
    };

    console.log("[Edge Function] Successfully processed document data with requestId:", requestId);

    return new Response(
      JSON.stringify(invoiceDraft),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Edge Function] Unexpected error:", error);
    console.error("[Edge Function] Error stack:", error.stack);
    return new Response(
      JSON.stringify({
        error: true,
        message: "An unexpected error occurred. Please try again."
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
