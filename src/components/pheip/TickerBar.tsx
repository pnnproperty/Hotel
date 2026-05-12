import { useMemo } from "react";
import { useDrrAll, canonicalProperty, displayProperty, fmtPct, fmtRpShort, type DRR } from "@/hooks/useDrrData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Tick = {
  property: string;
  occ: number | null;
  occBudget: number | null;
  adr: number | null;
  adrBudget: number | null;
};

function buildTicks(rows: DRR[]): Tick[] {
  const seen = new Map<string, DRR>();
  for (const r of rows) {
    const k = canonicalProperty(r.property);
    if (!seen.has(k)) seen.set(k, r);
  }
  return Array.from(seen.values()).map((r) => ({
    property: displayProperty(r.property),
    occ: r.occupancy?.today_actual ?? r.occupancy?.mtd_actual ?? null,
    occBudget: r.occupancy?.today_budget ?? r.occupancy?.mtd_budget ?? null,
    adr: r.adr?.today_actual ?? r.adr?.mtd_actual ?? null,
    adrBudget: r.adr?.today_budget ?? r.adr?.mtd_budget ?? null,
  }));
}

function Delta({ actual, budget, kind }: { actual: number | null; budget: number | null; kind: "pct" | "abs" }) {
  if (actual == null || budget == null) return null;
  const diff = kind === "pct" ? actual - budget : ((actual - budget) / budget) * 100;
  if (!Number.isFinite(diff)) return null;
  const up = diff >= 0;
  const Icon = Math.abs(diff) < 0.05 ? Minus : up ? TrendingUp : TrendingDown;
  const cls = Math.abs(diff) < 0.05 ? "text-muted-foreground" : up ? "text-emerald" : "text-rose-400";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] ${cls}`}>
      <Icon className="size-3" />
      {up ? "+" : ""}{diff.toFixed(kind === "pct" ? 1 : 1)}{kind === "pct" ? "pp" : "%"}
    </span>
  );
}

function TickItem({ t }: { t: Tick }) {
  return (
    <span className="inline-flex items-center gap-3 px-5 border-r border-border/40 whitespace-nowrap">
      <span className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase text-orange-100">{t.property}</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">OCC</span>
        <span className="text-xs font-mono text-foreground">{fmtPct(t.occ)}</span>
        <Delta actual={t.occ} budget={t.occBudget} kind="pct" />
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">ADR</span>
        <span className="text-xs font-mono text-foreground">{fmtRpShort(t.adr)}</span>
        <Delta actual={t.adr} budget={t.adrBudget} kind="abs" />
      </span>
    </span>
  );
}

export function TickerBar() {
  const { rows } = useDrrAll();
  const ticks = useMemo(() => buildTicks(rows), [rows]);
  if (ticks.length === 0) return null;
  // Duplicate for seamless marquee loop
  const loop = [...ticks, ...ticks];
  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-[oklch(0.07_0.005_270/90%)] backdrop-blur-xl">
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-[oklch(0.07_0.005_270)] to-transparent pointer-events-none" />
      <div className="flex animate-ticker py-2" style={{ width: "max-content" }}>
        {loop.map((t, i) => (
          <TickItem key={`${t.property}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}
