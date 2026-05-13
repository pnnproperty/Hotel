// Aggregates hotel dashboard data into compact context for the ElevenLabs agent.
import { HOTELS, KPIS, INSIGHTS } from "@/data/mock";

export const moduleLabels: Record<string, string> = {
  executive: "Executive Overview",
  finance: "Finance",
  occupancy: "Occupancy",
  ota: "OTA Production",
  compset: "Comp Set",
  segment: "Segment Analysis",
  reviews: "Guest Reviews",
  social: "Social Media",
  events: "Events & Banquet",
  forecast: "Forecast & Budget",
  engineering: "Engineering",
  hr: "Human Capital",
  esg: "ESG",
  ai: "AI Assistant",
  ingestion: "Data Ingestion",
  settings: "Settings",
};

export interface DashboardSnapshot {
  user: string;
  brand: string;
  activeModule: string;
  hotels: { name: string; city: string; occ: number; adr: number; revpar: number; rgi: number }[];
  kpis: { label: string; value: string; delta: number; unit: string }[];
  insights: typeof INSIGHTS;
}

export function buildSnapshot(activeModule: string): DashboardSnapshot {
  return {
    user: "Nico Po",
    brand: "Pollux Hotels",
    activeModule: moduleLabels[activeModule] ?? activeModule,
    hotels: HOTELS.map((h) => ({ name: h.name, city: h.city, occ: h.occ, adr: h.adr, revpar: h.revpar, rgi: h.rgi })),
    kpis: KPIS.map((k) => ({ label: k.label, value: k.value, delta: k.delta, unit: k.unit })),
    insights: INSIGHTS,
  };
}

export function snapshotToPrompt(s: DashboardSnapshot): string {
  const kpis = s.kpis.map((k) => `${k.label}: ${k.value} (${k.delta > 0 ? "+" : ""}${k.delta}%, ${k.unit})`).join(" | ");
  const hotels = s.hotels.map((h, i) => `${i + 1}. ${h.name} (${h.city}) — Occ ${h.occ}%, ADR Rp${h.adr.toLocaleString()}, RevPAR Rp${h.revpar.toLocaleString()}, RGI ${h.rgi}`).join("; ");
  const insights = s.insights.map((i) => `• [${i.tag}] ${i.text}`).join("\n");

  return `You are JARVIS, the AI operations co-pilot for ${s.brand} — a luxury hotel portfolio intelligence platform (PHEIP).
You are speaking live with ${s.user} (Group CEO).

Speak concisely, confidently, and warmly. Use natural spoken language (no markdown, no lists when speaking). Default language: Bahasa Indonesia, switch to English if the user does. Address the user as "${s.user}".

Currently active dashboard module: ${s.activeModule}.

Portfolio (${s.hotels.length} hotels): ${hotels}.

Live KPIs: ${kpis}.

Active insights:
${insights}

When the user asks about a metric, answer with the specific number and a one-sentence interpretation. If asked about something not in your context, call the getDashboardMetric tool.`;
}

export function lookupMetric(query: string): string {
  const q = query.toLowerCase();
  const k = KPIS.find((x) => x.label.toLowerCase().includes(q) || x.key.toLowerCase().includes(q));
  if (k) return `${k.label} is ${k.value}, change ${k.delta > 0 ? "+" : ""}${k.delta}% (${k.unit}).`;
  const h = HOTELS.find((x) => x.name.toLowerCase().includes(q) || x.city.toLowerCase().includes(q));
  if (h) return `${h.name} in ${h.city}: Occupancy ${h.occ}%, ADR Rp${h.adr.toLocaleString()}, RevPAR Rp${h.revpar.toLocaleString()}, RGI ${h.rgi}, Review ${h.score}.`;
  const ins = INSIGHTS.find((x) => x.text.toLowerCase().includes(q));
  if (ins) return `[${ins.tag}] ${ins.text}`;
  return `No exact match for "${query}". Available KPIs: ${KPIS.map((t) => t.label).join(", ")}.`;
}
