import { useMemo, useState, useEffect } from "react";
import { useDrrAll, canonicalProperty, displayProperty, fmtPct, fmtRpShort, type DRR } from "@/hooks/useDrrData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Period = "today" | "mtd";

type Tick = {
  property: string;
  occ: number | null;
  occBudget: number | null;
  adr: number | null;
  adrBudget: number | null;
  reportDate: string;
  staleDays: number;
};

/** Build ticks for the chosen period, picking the latest DRR per property. */
function buildTicks(rows: DRR[], period: Period): Tick[] {
  const seen = new Map<string, DRR>();
  for (const r of rows) {
    const k = canonicalProperty(r.property);
    if (!seen.has(k)) seen.set(k, r);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from(seen.values()).map((r) => {
    const reportDate = r.report_date;
    let staleDays = 0;
    if (reportDate) {
      const reportDt = new Date(reportDate);
      reportDt.setHours(0, 0, 0, 0);
      staleDays = Math.floor((today.getTime() - reportDt.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (period === "mtd") {
      return {
        property: displayProperty(r.property),
        // For MTD, fall back to today_actual when MTD isn't populated yet
        // (e.g. very early in the month).
        occ: r.occupancy?.mtd_actual ?? r.occupancy?.today_actual ?? null,
        occBudget: r.occupancy?.mtd_budget ?? r.occupancy?.today_budget ?? null,
        adr: r.adr?.mtd_actual ?? r.adr?.today_actual ?? null,
        adrBudget: r.adr?.mtd_budget ?? r.adr?.today_budget ?? null,
        reportDate,
        staleDays,
      };
    }
    return {
      property: displayProperty(r.property),
      occ: r.occupancy?.today_actual ?? r.occupancy?.mtd_actual ?? null,
      occBudget: r.occupancy?.today_budget ?? r.occupancy?.mtd_budget ?? null,
      adr: r.adr?.today_actual ?? r.adr?.mtd_actual ?? null,
      adrBudget: r.adr?.today_budget ?? r.adr?.mtd_budget ?? null,
      reportDate,
      staleDays,
    };
  });
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
  const isStale = t.staleDays > 1;
  return (
    <span className="inline-flex items-center gap-3 px-5 border-r border-border/40 whitespace-nowrap">
      <span
        className={`text-[10px] tracking-[0.25em] uppercase ${
          isStale ? "text-amber-300/70" : "text-orange-100"
        }`}
        title={isStale ? `Data is ${t.staleDays} days old (${t.reportDate})` : t.reportDate}
      >
        {t.property}
        {isStale && <span className="ml-1.5 text-[9px] opacity-70">(D-{t.staleDays})</span>}
      </span>
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

const STORAGE_KEY = "pheip.tickerPeriod";

export function TickerBar() {
  const { rows } = useDrrAll();
  // Default to MTD — better for executive view since it represents the
  // cumulative month performance, not a single (possibly slow) day.
  const [period, setPeriod] = useState<Period>("mtd");

  // Persist user preference across page reloads.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "today" || saved === "mtd") setPeriod(saved);
  }, []);

  const togglePeriod = () => {
    const next: Period = period === "mtd" ? "today" : "mtd";
    setPeriod(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
  };

  const ticks = useMemo(() => buildTicks(rows, period), [rows, period]);
  if (ticks.length === 0) return null;
  // Duplicate for seamless marquee loop
  const loop = [...ticks, ...ticks];

  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-[oklch(0.07_0.005_270/90%)] backdrop-blur-xl">
      {/* Period toggle — top-left corner of ticker */}
      <button
        type="button"
        onClick={togglePeriod}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] uppercase tracking-[0.18em] font-mono bg-background/80 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
        title="Click to switch ticker between today and month-to-date"
      >
        <span className={period === "mtd" ? "text-amber-300" : "text-muted-foreground"}>MTD</span>
        <span className="opacity-30">/</span>
        <span className={period === "today" ? "text-amber-300" : "text-muted-foreground"}>Today</span>
      </button>

      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-[oklch(0.07_0.005_270)] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-[oklch(0.07_0.005_270)] to-transparent pointer-events-none" />
      <div className="flex animate-ticker py-2 pl-28" style={{ width: "max-content" }}>
        {loop.map((t, i) => (
          <TickItem key={`${t.property}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}
