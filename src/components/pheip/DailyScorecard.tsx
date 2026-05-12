import { motion } from "framer-motion";
import { CalendarDays, ArrowUpRight, ArrowDownRight, FileText } from "lucide-react";
import { useDrrFiltered, sumKpi, avgKpi, fmtRpShort, fmtPct } from "@/hooks/useDrrData";

const variance = (a?: number | null, b?: number | null) => {
  const av = Number(a) || 0, bv = Number(b) || 0;
  if (!bv) return 0;
  return ((av - bv) / bv) * 100;
};

export function DailyScorecard({ propertyFilter }: { propertyFilter?: string }) {
  const sel = propertyFilter || "All Hotels";
  const { latestPerProperty, latest, loading } = useDrrFiltered(sel);
  const isAll = !propertyFilter || propertyFilter === "All Hotels";

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-40 bg-[oklch(1_0_0/6%)] rounded mb-3" />
        <div className="h-8 w-72 bg-[oklch(1_0_0/6%)] rounded" />
      </div>
    );
  }

  if (latestPerProperty.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center gap-3">
        <FileText className="size-5 text-muted-foreground" />
        <div>
          <div className="font-display text-lg">Daily Scorecard</div>
          <div className="text-xs text-muted-foreground">No DRR uploaded yet. Upload a Daily Revenue Report in Data Ingestion to populate today's figures.</div>
        </div>
      </div>
    );
  }

  // Aggregate when "All Hotels": sum revenues, average rates/occ, latest report_date.
  const rows = latestPerProperty;
  const room_a = isAll ? sumKpi(rows, "room_revenue", "today_actual") : latest?.room_revenue?.today_actual ?? null;
  const room_b = isAll ? sumKpi(rows, "room_revenue", "today_budget") : latest?.room_revenue?.today_budget ?? null;
  const fnb_a  = isAll ? sumKpi(rows, "fnb_revenue", "today_actual")  : latest?.fnb_revenue?.today_actual ?? null;
  const fnb_b  = isAll ? sumKpi(rows, "fnb_revenue", "today_budget")  : latest?.fnb_revenue?.today_budget ?? null;
  const net_a  = isAll ? sumKpi(rows, "net_revenue", "today_actual")  : latest?.net_revenue?.today_actual ?? null;
  const net_b  = isAll ? sumKpi(rows, "net_revenue", "today_budget")  : latest?.net_revenue?.today_budget ?? null;
  const occ_a  = isAll ? avgKpi(rows, "occupancy", "today_actual")    : latest?.occupancy?.today_actual ?? null;
  const occ_b  = isAll ? avgKpi(rows, "occupancy", "today_budget")    : latest?.occupancy?.today_budget ?? null;
  const adr_a  = isAll ? avgKpi(rows, "adr", "today_actual")          : latest?.adr?.today_actual ?? null;
  const adr_b  = isAll ? avgKpi(rows, "adr", "today_budget")          : latest?.adr?.today_budget ?? null;
  const rev_a  = isAll ? avgKpi(rows, "revpar", "today_actual")       : latest?.revpar?.today_actual ?? null;
  const rev_b  = isAll ? avgKpi(rows, "revpar", "today_budget")       : latest?.revpar?.today_budget ?? null;

  const headerTitle = isAll ? "Portfolio Consolidated" : (latest?.property ?? "");
  const headerSub = isAll ? `${rows.length} hotels · latest DRR per hotel` : "Daily scorecard · latest DRR";
  const reportDate = isAll
    ? rows.map(r => r.report_date).sort().slice(-1)[0]
    : latest?.report_date;

  const tiles = [
    { label: "Room Revenue", actual: fmtRpShort(room_a), budget: `Budget ${fmtRpShort(room_b)}`, varPct: variance(room_a, room_b) },
    { label: "F&B Revenue",  actual: fmtRpShort(fnb_a),  budget: `Budget ${fmtRpShort(fnb_b)}`,  varPct: variance(fnb_a, fnb_b) },
    { label: "Net Revenue",  actual: fmtRpShort(net_a),  budget: `Budget ${fmtRpShort(net_b)}`,  varPct: variance(net_a, net_b) },
    { label: "Occupancy",    actual: fmtPct(occ_a, 2),   budget: `Budget ${fmtPct(occ_b, 2)}`,   varPct: (Number(occ_a) || 0) - (Number(occ_b) || 0), tone: "pct" as const },
    { label: "ADR",          actual: fmtRpShort(adr_a),  budget: `Budget ${fmtRpShort(adr_b)}`,  varPct: variance(adr_a, adr_b) },
    { label: "RevPAR",       actual: fmtRpShort(rev_a),  budget: `Budget ${fmtRpShort(rev_b)}`,  varPct: variance(rev_a, rev_b) },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-[var(--gradient-gold)] grid place-items-center">
            <CalendarDays className="size-4 text-[var(--onyx)]" />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground">{isAll ? "DAILY SCORECARD · CONSOLIDATED" : "DAILY SCORECARD · LATEST DRR"}</div>
            <div className="font-display text-xl mt-0.5 gold-gradient-text">{headerTitle}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{headerSub}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-[0.25em] text-muted-foreground">{isAll ? "LATEST REPORT" : "REPORT DATE"}</div>
          <div className="font-mono text-sm text-gold">{reportDate}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map((t) => {
          const pos = t.varPct >= 0;
          return (
            <div key={t.label} className="p-4 rounded-xl bg-[oklch(1_0_0/3%)] border border-border/60 hover:border-[var(--gold)]/30 transition">
              <div className="text-[10px] tracking-[0.25em] text-muted-foreground">{t.label}</div>
              <div className="font-display text-lg mt-1.5">{t.actual}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{t.budget}</div>
              <div className={`mt-2 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${pos ? "text-emerald bg-[oklch(0.72_0.17_162/12%)]" : "text-destructive bg-[oklch(0.65_0.22_25/12%)]"}`}>
                {pos ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {t.tone === "pct" ? `${Math.abs(t.varPct).toFixed(1)}pp` : `${Math.abs(t.varPct).toFixed(1)}%`}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
