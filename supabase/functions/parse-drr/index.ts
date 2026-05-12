// Edge function: parse-drr
// Accepts a PDF file (multipart/form-data, field name "file"),
// extracts text, then uses Lovable AI Gateway (gemini-2.5-flash) to
// extract structured DRR data matching the dashboard schema.

import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.11.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an expert hotel data extractor. Given the raw text of a "Daily Revenue Report" (DRR) PDF from an Indonesian hotel, extract structured JSON matching the provided schema exactly.

Rules:
- All monetary values are Indonesian Rupiah (no decimals, parse as numbers).
- Percentages: return as numbers (e.g. 77.55, not "77.55%").
- "-" or empty cells → 0.
- Parentheses around numbers like (9,945,033) mean negative.
- property: extract hotel name from header (e.g. "Louis Kienne Pemuda").
- report_date: ISO format YYYY-MM-DD from "Report Date".
- room_revenue / fnb_revenue / net_revenue / occupancy / adr / revpar: each has {today_actual, today_budget, mtd_actual, mtd_budget, ytd_actual, ytd_budget}.
- compset_today and compset_mtd: array of {hotel, rooms_available, rooms_sold, occ_pct, adr, room_revenue, revpar, rgi, mpi, ari}. Skip TOTAL row and empty rows.
- segments: array of {segment, mtd_revenue, mtd_rooms, mtd_arr, mtd_pct} for non-zero MTD rows only.
- ota_production: array of {agent, mtd_rooms, mtd_pax, mtd_lodging, mtd_pct, mtd_arr} for unique OTA/travel agent names (aggregate duplicates by summing rooms/pax/lodging).
- daily_breakdown: array of {date, rooms_available, rooms_sold, occ_pct, adr, room_revenue, revpar, fnb_revenue, net_revenue} for EVERY day in the month found in the "Daily Statistic" / "Daily Performance" / per-date table. Date in ISO YYYY-MM-DD. Include every day printed in the PDF, even days with zero values. This is critical — the dashboard plots a daily timeline from this array.

Return ONLY the JSON object, no markdown, no commentary.`;

const KPI_SHAPE = {
  type: "object",
  properties: {
    today_actual: { type: "number" },
    today_budget: { type: "number" },
    mtd_actual: { type: "number" },
    mtd_budget: { type: "number" },
    ytd_actual: { type: "number" },
    ytd_budget: { type: "number" },
  },
  required: ["today_actual", "today_budget", "mtd_actual", "mtd_budget", "ytd_actual", "ytd_budget"],
};

const COMPSET_SHAPE = {
  type: "object",
  properties: {
    hotel: { type: "string" },
    rooms_available: { type: "number" },
    rooms_sold: { type: "number" },
    occ_pct: { type: "number" },
    adr: { type: "number" },
    room_revenue: { type: "number" },
    revpar: { type: "number" },
    rgi: { type: "number" },
    mpi: { type: "number" },
    ari: { type: "number" },
  },
  required: ["hotel", "rooms_sold", "occ_pct", "adr", "revpar", "rgi", "mpi", "ari"],
};

const SCHEMA = {
  type: "object",
  properties: {
    property: { type: "string" },
    report_date: { type: "string" },
    room_revenue: KPI_SHAPE,
    fnb_revenue: KPI_SHAPE,
    net_revenue: KPI_SHAPE,
    occupancy: KPI_SHAPE,
    adr: KPI_SHAPE,
    revpar: KPI_SHAPE,
    compset_today: { type: "array", items: COMPSET_SHAPE },
    compset_mtd: { type: "array", items: COMPSET_SHAPE },
    segments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          segment: { type: "string" },
          mtd_revenue: { type: "number" },
          mtd_rooms: { type: "number" },
          mtd_arr: { type: "number" },
          mtd_pct: { type: "number" },
        },
        required: ["segment", "mtd_revenue", "mtd_rooms", "mtd_arr", "mtd_pct"],
      },
    },
    ota_production: {
      type: "array",
      items: {
        type: "object",
        properties: {
          agent: { type: "string" },
          mtd_rooms: { type: "number" },
          mtd_pax: { type: "number" },
          mtd_lodging: { type: "number" },
          mtd_pct: { type: "number" },
          mtd_arr: { type: "number" },
        },
        required: ["agent", "mtd_rooms", "mtd_pax", "mtd_lodging", "mtd_pct", "mtd_arr"],
      },
    },
    daily_breakdown: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          rooms_available: { type: "number" },
          rooms_sold: { type: "number" },
          occ_pct: { type: "number" },
          adr: { type: "number" },
          room_revenue: { type: "number" },
          revpar: { type: "number" },
          fnb_revenue: { type: "number" },
          net_revenue: { type: "number" },
        },
        required: ["date", "rooms_sold", "occ_pct", "adr", "room_revenue", "revpar"],
      },
    },
  },
  required: [
    "property", "report_date",
    "room_revenue", "fnb_revenue", "net_revenue",
    "occupancy", "adr", "revpar",
    "compset_today", "compset_mtd", "segments", "ota_production", "daily_breakdown",
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "Missing 'file' field" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Extract text from PDF
    const buf = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });

    // Keep full text — daily statistic table often appears late in the PDF
    const trimmedText = text.length > 200000 ? text.slice(0, 200000) : text;
    console.log(`[parse-drr] extracted ${text.length} chars from PDF`);
    // Log a window likely to contain daily statistic table for debugging
    const dailyIdx = text.search(/daily\s*(statistic|performance|breakdown)/i);
    console.log(`[parse-drr] daily-table marker at index: ${dailyIdx}`);

    // 2. Send to Lovable AI for structured extraction
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Extract DRR data from this report. CRITICAL: the daily_breakdown array MUST contain one row PER DAY found in the Daily Statistic / Daily Performance table (typically 28-31 rows). Do not skip days. If you cannot find a daily table, return [] but DO try hard.\n\n${trimmedText}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_drr",
            description: "Emit extracted DRR data",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_drr" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Top up in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("AI did not return a tool call. Raw: " + JSON.stringify(aiJson).slice(0, 500));
    }
    const parsed = JSON.parse(toolCall.function.arguments);
    console.log(`[parse-drr] daily_breakdown rows: ${parsed?.daily_breakdown?.length ?? 0}`);

    return new Response(JSON.stringify({
      parsed,
      raw_text_preview: trimmedText.slice(0, 2000),
      file_name: file.name,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("parse-drr error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});