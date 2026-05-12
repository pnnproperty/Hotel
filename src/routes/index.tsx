import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { KpiCard } from "@/components/pheip/KpiCard";
import { useSelectedProperty } from "@/store/property";
import { useDrrFiltered, sumKpi, avgKpi, variancePct, fmtRpShort, fmtPct, NA, displayProperty, canonicalProperty } from "@/hooks/useDrrData";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { Trophy, Sparkles, TrendingUp, ChevronRight, Inbox, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Executive Overview — Pollux Hotels PHEIP" }] }),
  component: ExecutiveOverview,
});

const periods = ["Day", "Week", "MTD", "YTD"] as const;
type Period = (typeof periods)[number];

function ExecutiveOverview() {
  const selected = useSelectedProperty();
  const { rows, latest, latestPerProperty, loading } = useDrrFiltered(selected);
  const [period, setPeriod] = useState<Period>("MTD");
  type SortKey = "name" | "revMtd" | "revDaily" | "occ" | "revpar" | "adr" | "adrDaily" | "mpi" | "rgi" | "ari" | "trend";
  const [sortKey, setSortKey] = useState<SortKey>("revMtd");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  };

  const propertyLabel = selected === "All Hotels" ? "All Hotels" : (latest ? displayProperty(latest.property) : selected);
  const isAggregate = selected === "All Hotels" || latestPerProperty.length > 1;

  // KPI period mapping
  const periodKey = period === "Day" || period === "Week" ? "today" : period === "YTD" ? "ytd" : "mtd";
  const aKey = `${periodKey}_actual` as const;
  const bKey = `${periodKey}_budget` as const;

  // Aggregate KPIs across selected property set
  const kpis = useMemo(() => {
    const room = sumKpi(latestPerProperty, "room_revenue", aKey as never);
    const roomB = sumKpi(latestPerProperty, "room_revenue", bKey as never);
    const fnb = sumKpi(latestPerProperty, "fnb_revenue", aKey as never);
    const fnbB = sumKpi(latestPerProperty, "fnb_revenue", bKey as never);
    const net = sumKpi(latestPerProperty, "net_revenue", aKey as never);
    const netB = sumKpi(latestPerProperty, "net_revenue", bKey as never);
    const occ = avgKpi(latestPerProperty, "occupancy", aKey === "ytd_actual" ? "mtd_actual" : (aKey as never));
    const occB = avgKpi(latestPerProperty, "occupancy", bKey === "ytd_budget" ? "mtd_budget" : (bKey as never));
    const adr = avgKpi(latestPerProperty, "adr", aKey === "ytd_actual" ? "mtd_actual" : (aKey as never));
    const adrB = avgKpi(latestPerProperty, "adr", bKey === "ytd_budget" ? "mtd_budget" : (bKey as never));
    const revpar = avgKpi(latestPerProperty, "revpar", aKey === "ytd_actual" ? "mtd_actual" : (aKey as never));
    const revparB = avgKpi(latestPerProperty, "revpar", bKey === "ytd_budget" ? "mtd_budget" : (bKey as never));
    return [
      { key: "room", label: "Room Revenue", value: fmtRpShort(room), delta: variancePct(room ?? undefined, roomB ?? undefined) ?? 0, hasDelta: variancePct(room ?? undefined, roomB ?? undefined) != null, unit: roomB != null ? `Budget ${fmtRpShort(roomB)}` : "Budget N/A", spark: [1,2,3,4,5,6,7,8] },
      { key: "fnb", label: "F&B Revenue", value: fmtRpShort(fnb), delta: variancePct(fnb ?? undefined, fnbB ?? undefined) ?? 0, hasDelta: variancePct(fnb ?? undefined, fnbB ?? undefined) != null, unit: fnbB != null ? `Budget ${fmtRpShort(fnbB)}` : "Budget N/A", spark: [1,2,3,4,5,6,7,8] },
      { key: "net", label: "Net Revenue", value: fmtRpShort(net), delta: variancePct(net ?? undefined, netB ?? undefined) ?? 0, hasDelta: variancePct(net ?? undefined, netB ?? undefined) != null, unit: netB != null ? `Budget ${fmtRpShort(netB)}` : "Budget N/A", spark: [1,2,3,4,5,6,7,8] },
      { key: "occ", label: "Occupancy", value: fmtPct(occ), delta: occ != null && occB != null ? occ - occB : 0, hasDelta: occ != null && occB != null, unit: occB != null ? `Budget ${fmtPct(occB)}` : "Budget N/A", spark: [1,2,3,4,5,6,7,8] },
      { key: "adr", label: "ADR", value: fmtRpShort(adr), delta: variancePct(adr ?? undefined, adrB ?? undefined) ?? 0, hasDelta: variancePct(adr ?? undefined, adrB ?? undefined) != null, unit: adrB != null ? `Budget ${fmtRpShort(adrB)}` : "Budget N/A", spark: [1,2,3,4,5,6,7,8] },
      { key: "revpar", label: "RevPAR", value: fmtRpShort(revpar), delta: variancePct(revpar ?? undefined, revparB ?? undefined) ?? 0, hasDelta: variancePct(revpar ?? undefined, revparB ?? undefined) != null, unit: revparB != null ? `Budget ${fmtRpShort(revparB)}` : "Budget N/A", spark: [1,2,3,4,5,6,7,8] },
    ];
  }, [latestPerProperty, aKey, bKey]);

  // Daily revenue trajectory: build a per-date series from all DRR reports
  // in scope. Each report's `today_actual` represents that report_date's
  // daily revenue; we sum across properties when aggregating. Falls back to
  // the latest report's daily_breakdown when only one report exists.
  const trend = useMemo(() => {
    if (!rows || rows.length === 0) return [] as { date: string; actual: number; budget: number }[];
    const byDate = new Map<string, { actual: number; budget: number }>();
    // Dedup: one row per (property, report_date) — take the newest per pair
    const seen = new Set<string>();
    for (const r of rows) {
      const k = `${canonicalProperty(r.property)}::${r.report_date}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const a = Number(r.net_revenue?.today_actual ?? r.room_revenue?.today_actual ?? 0);
      const b = Number(r.net_revenue?.today_budget ?? r.room_revenue?.today_budget ?? 0);
      const cur = byDate.get(r.report_date) ?? { actual: 0, budget: 0 };
      cur.actual += a;
      cur.budget += b;
      byDate.set(r.report_date, cur);
    }
    const series = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: date.slice(5), actual: v.actual / 1e6, budget: v.budget / 1e6 }));
    if (series.length >= 2) return series;
    // Single date in scope — fall back to daily_breakdown if available
    if (latest?.daily_breakdown && latest.daily_breakdown.length > 0) {
      return latest.daily_breakdown
        .filter((d) => d.date)
        .map((d) => ({
          date: (d.date || "").slice(5),
          actual: Number(d.net_revenue ?? d.room_revenue ?? 0) / 1e6,
          budget: 0,
        }));
    }
    return series;
  }, [rows, latest]);

  // Leaderboard ranked by MTD net revenue (with daily + comp set indices)
  const ranked = useMemo(() => {
    const rows = latestPerProperty.map((r) => {
      const revMtd = Number(r.net_revenue?.mtd_actual ?? r.room_revenue?.mtd_actual ?? 0);
      const revB = Number(r.net_revenue?.mtd_budget ?? r.room_revenue?.mtd_budget ?? 0);
      const revDaily = Number(r.net_revenue?.today_actual ?? r.room_revenue?.today_actual ?? 0);
      const occ = Number(r.occupancy?.mtd_actual ?? 0);
      const adr = Number(r.adr?.mtd_actual ?? 0);
      const adrDaily = Number(r.adr?.today_actual ?? 0);
      const revpar = Number(r.revpar?.mtd_actual ?? 0);
      const trendPct = revB > 0 ? ((revMtd - revB) / revB) * 100 : 0;
      // Match this property in its own compset (prefer today's snapshot, then MTD)
      // using strict per-property aliases to avoid false matches on generic tokens.
      const SELF_ALIASES: Record<string, string[]> = {
        "louis kienne cikarang": ["lk cikarang", "louis kienne cikarang", "louis kienne hotel chadstone", "louis kienne chadstone", "louis kienne hotel"],
        "louis kienne pandanaran": ["lk pandanaran", "louis kienne pandanaran"],
        "louis kienne pemuda": ["lk pemuda", "louis kienne pemuda"],
        "louis kienne resort senggigi": ["lk resort senggigi", "louis kienne resort senggigi", "lk senggigi"],
        "louis kienne simpang lima": ["lk simpang lima", "louis kienne simpang lima"],
        "po hotel semarang": ["po hotel", "po semarang"],
      };
      const propKey = canonicalProperty(r.property || "");
      const aliases = SELF_ALIASES[propKey] ?? [propKey];
      const matchSelf = (rows?: { hotel?: string; mpi?: number; rgi?: number; ari?: number }[]) =>
        rows?.find((c) => {
          const h = (c.hotel || "").toLowerCase();
          return aliases.some((a) => h.includes(a));
        });
      const self = matchSelf(r.compset_today) ?? matchSelf(r.compset_mtd);
      const mpi = self?.mpi != null ? Number(self.mpi) : null;
      const rgi = self?.rgi != null ? Number(self.rgi) : null;
      const ari = self?.ari != null ? Number(self.ari) : null;
      return { id: r.id, name: displayProperty(r.property), revMtd, revDaily, occ, adr, adrDaily, revpar, trend: trendPct, mpi, rgi, ari };
    });
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      const an = av == null ? -Infinity : Number(av);
      const bn = bv == null ? -Infinity : Number(bv);
      return (an - bn) * dir;
    });
    return rows;
  }, [latestPerProperty, sortKey, sortDir]);

  // Comp radar (only when single property selected and compset present)
  const compRadar = useMemo(() => {
    if (!latest || !latest.compset_mtd?.length) return [] as { metric: string; pollux: number; compset: number }[];
    const self = latest.compset_mtd.find((c) => (c.hotel || "").toLowerCase().includes(latest.property.toLowerCase().split(/\s+/)[0]?.toLowerCase() ?? "")) ?? latest.compset_mtd[0];
    return [
      { metric: "RevPAR", pollux: Math.round((self.rgi ?? 1) * 100), compset: 100 },
      { metric: "ADR", pollux: Math.round((self.ari ?? 1) * 100), compset: 100 },
      { metric: "Occupancy", pollux: Math.round((self.mpi ?? 1) * 100), compset: 100 },
      { metric: "RGI", pollux: Math.round((self.rgi ?? 1) * 100), compset: 100 },
      { metric: "MPI", pollux: Math.round((self.mpi ?? 1) * 100), compset: 100 },
      { metric: "ARI", pollux: Math.round((self.ari ?? 1) * 100), compset: 100 },
    ];
  }, [latest]);

  // Insights derived from DRR
  const insights = useMemo(() => {
    const out: { tag: string; tone: "emerald" | "gold"; text: string }[] = [];
    if (latestPerProperty.length === 0) return out;

    const scopeLabel = isAggregate ? `Portfolio (${latestPerProperty.length} hotels)` : (latest ? displayProperty(latest.property) : "");

    // Revenue insight — aggregate when All Hotels, otherwise single hotel
    const room = isAggregate
      ? (sumKpi(latestPerProperty, "room_revenue", "mtd_actual") ?? 0)
      : Number(latest?.room_revenue?.mtd_actual ?? 0);
    const roomB = isAggregate
      ? (sumKpi(latestPerProperty, "room_revenue", "mtd_budget") ?? 0)
      : Number(latest?.room_revenue?.mtd_budget ?? 0);
    if (roomB > 0) {
      const v = ((room - roomB) / roomB) * 100;
      out.push({ tag: v >= 0 ? "OUTPERFORM" : "BELOW BUDGET", tone: v >= 0 ? "emerald" : "gold", text: `${scopeLabel}: Room revenue MTD ${fmtRpShort(room)} vs budget ${fmtRpShort(roomB)} (${v >= 0 ? "+" : ""}${v.toFixed(1)}%).` });
    }

    const fnb = isAggregate
      ? (sumKpi(latestPerProperty, "fnb_revenue", "mtd_actual") ?? 0)
      : Number(latest?.fnb_revenue?.mtd_actual ?? 0);
    const fnbB = isAggregate
      ? (sumKpi(latestPerProperty, "fnb_revenue", "mtd_budget") ?? 0)
      : Number(latest?.fnb_revenue?.mtd_budget ?? 0);
    if (fnbB > 0) {
      const v = ((fnb - fnbB) / fnbB) * 100;
      out.push({ tag: "F&B", tone: v >= 0 ? "emerald" : "gold", text: `F&B revenue MTD ${fmtRpShort(fnb)} vs budget ${fmtRpShort(fnbB)} (${v >= 0 ? "+" : ""}${v.toFixed(1)}%).` });
    }

    const occ = isAggregate
      ? (avgKpi(latestPerProperty, "occupancy", "mtd_actual") ?? 0)
      : Number(latest?.occupancy?.mtd_actual ?? 0);
    const adrV = isAggregate
      ? avgKpi(latestPerProperty, "adr", "mtd_actual")
      : latest?.adr?.mtd_actual;
    const revparV = isAggregate
      ? avgKpi(latestPerProperty, "revpar", "mtd_actual")
      : latest?.revpar?.mtd_actual;
    if (occ > 0) {
      out.push({ tag: "OCCUPANCY", tone: occ >= 70 ? "emerald" : "gold", text: `MTD occupancy ${occ.toFixed(1)}% — ADR ${fmtRpShort(adrV)}, RevPAR ${fmtRpShort(revparV)}.` });
    }

    // Portfolio leader insight when aggregating
    if (isAggregate && latestPerProperty.length > 1) {
      const ranked = [...latestPerProperty]
        .map((r) => ({ name: displayProperty(r.property), rev: Number(r.net_revenue?.mtd_actual ?? r.room_revenue?.mtd_actual ?? 0) }))
        .filter((x) => x.rev > 0)
        .sort((a, b) => b.rev - a.rev);
      if (ranked.length) {
        out.push({ tag: "TOP PERFORMER", tone: "emerald", text: `${ranked[0].name} leads MTD net revenue at ${fmtRpShort(ranked[0].rev)}.` });
      }
    }

    if (!isAggregate && latest?.compset_mtd?.length) {
      const sorted = [...latest.compset_mtd].sort((a, b) => Number(b.revpar ?? 0) - Number(a.revpar ?? 0));
      const idx = sorted.findIndex((c) => (c.hotel || "").toLowerCase().includes(latest.property.toLowerCase().split(/\s+/)[0]?.toLowerCase() ?? ""));
      if (idx >= 0) {
        out.push({ tag: "COMPSET", tone: idx < 3 ? "emerald" : "gold", text: `Ranked #${idx + 1} of ${sorted.length} in comp set by RevPAR.` });
      }
    }
    return out;
  }, [latest, latestPerProperty, isAggregate]);

  if (loading) {
    return <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">Loading dashboard…</div>;
  }

  if (!latest && rows.length === 0) {
    return (
      <div className="space-y-6">
        <Hero property={propertyLabel} subtitle="Awaiting data import" period={period} setPeriod={setPeriod} />
        <div className="glass rounded-2xl p-12 text-center">
          <Inbox className="size-10 text-gold mx-auto mb-4" />
          <h2 className="font-display text-2xl gold-gradient-text">No DRR data imported yet</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Upload a Daily Revenue Report from <strong>Data Ingestion</strong> to populate the executive dashboard. Until then, all metrics will display N/A.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Hero property={propertyLabel} subtitle={isAggregate ? `${latestPerProperty.length} hotel${latestPerProperty.length === 1 ? "" : "s"} with imported DRR data` : "Highlight"} period={period} setPeriod={setPeriod} />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            delta={k.hasDelta ? k.delta : 0}
            spark={k.spark}
            unit={k.unit}
            accent={i % 2 === 0 ? "gold" : "emerald"}
          />
        ))}
      </div>

      {/* Trend + Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] tracking-[0.25em] text-muted-foreground">REVENUE INTELLIGENCE</div>
              <h2 className="font-display text-2xl mt-1">Daily Revenue Trajectory</h2>
            </div>
            <div className="text-xs text-muted-foreground">From imported DRR daily breakdown</div>
          </div>
          {trend.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 5%)" vertical={false} />
                  <XAxis dataKey="date" stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `Rp ${v.toFixed(0)}M`} />
                  <Tooltip contentStyle={{ background: "oklch(0.16 0.008 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => `Rp ${v.toFixed(1)}M`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="actual" name="Net Revenue (Daily)" stroke="var(--gold)" strokeWidth={2.5} fill="url(#ga)" />
                  <Area type="monotone" dataKey="budget" name="Budget (Daily)" stroke="oklch(0.65 0.05 270)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock label="No daily breakdown available in the latest DRR for this selection." />
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="size-4 text-gold" />
            <div className="text-[10px] tracking-[0.25em] text-muted-foreground">PHEIP · AI INTELLIGENCE</div>
          </div>
          <h2 className="font-display text-2xl mb-4">Executive Insights</h2>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((ins, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="group p-4 rounded-xl border border-border/60 hover:border-[var(--gold)]/30 bg-[oklch(1_0_0/2%)] transition">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] tracking-[0.2em] ${ins.tone === "emerald" ? "text-emerald" : "text-gold"}`}>{ins.tag}</span>
                    <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-gold transition" />
                  </div>
                  <p className="text-sm mt-2 text-foreground/90 leading-relaxed">{ins.text}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyBlock label="N/A — insights will appear after DRR data is available." />
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] tracking-[0.25em] text-muted-foreground">PORTFOLIO LEADERBOARD</div>
            <h2 className="font-display text-2xl mt-1">Hotel Performance Ranking</h2>
          </div>
          <div className="text-xs text-muted-foreground">Sort by any column · {ranked.length} propert{ranked.length === 1 ? "y" : "ies"}</div>
        </div>
        {ranked.length > 0 ? (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm border-separate border-spacing-y-2 px-2">
              <thead>
                <tr className="text-[10px] tracking-[0.2em] text-muted-foreground">
                  {([
                    { k: "name" as const, l: "HOTEL", align: "text-left" },
                    { k: "revMtd" as const, l: "REV MTD", align: "text-right" },
                    { k: "revDaily" as const, l: "REV DAILY", align: "text-right" },
                    { k: "occ" as const, l: "OCC", align: "text-right" },
                    { k: "revpar" as const, l: "REVPAR", align: "text-right" },
                    { k: "adr" as const, l: "ADR", align: "text-right" },
                    { k: "adrDaily" as const, l: "ADR DAILY", align: "text-right" },
                    { k: "mpi" as const, l: "MPI", align: "text-right" },
                    { k: "rgi" as const, l: "RGI", align: "text-right" },
                    { k: "ari" as const, l: "ARI", align: "text-right" },
                    { k: "trend" as const, l: "VS BUDGET", align: "text-right" },
                  ]).map((c) => {
                    const active = sortKey === c.k;
                    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
                    return (
                      <th key={c.k} className={`px-3 py-2 ${c.align} font-normal`}>
                        <button onClick={() => toggleSort(c.k)} className={`inline-flex items-center gap-1 hover:text-gold transition ${active ? "text-gold" : ""}`}>
                          {c.l}
                          <Icon className="size-3" />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {ranked.map((h, i) => {
                  const medal = i === 0 ? "from-[oklch(0.85_0.13_88)] to-[oklch(0.65_0.12_70)]" : i === 1 ? "from-[oklch(0.85_0.005_270)] to-[oklch(0.65_0.005_270)]" : i === 2 ? "from-[oklch(0.65_0.12_50)] to-[oklch(0.45_0.1_40)]" : "from-[oklch(0.3_0.01_270)] to-[oklch(0.2_0.01_270)]";
                  const idxFmt = (n: number | null) => (n == null || !Number.isFinite(n) ? NA : n.toFixed(2));
                  return (
                    <motion.tr key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="bg-[oklch(1_0_0/1.5%)] hover:bg-[oklch(1_0_0/3%)] transition [&>td]:border-y [&>td]:border-border/50 [&>td:first-child]:border-l [&>td:first-child]:rounded-l-xl [&>td:last-child]:border-r [&>td:last-child]:rounded-r-xl">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`size-9 rounded-lg bg-gradient-to-br ${medal} grid place-items-center font-display font-bold text-[var(--onyx)] ${i < 3 ? "shadow-[var(--glow-gold)]" : ""}`}>
                            {i < 3 ? <Trophy className="size-4" /> : i + 1}
                          </div>
                          <div>
                            <div className="font-medium">{h.name}</div>
                            <div className="text-[11px] text-muted-foreground">From imported DRR</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono">{fmtRpShort(h.revMtd)}</td>
                      <td className="px-3 py-3 text-right font-mono">{fmtRpShort(h.revDaily)}</td>
                      <td className="px-3 py-3 text-right font-mono">{h.occ > 0 ? `${h.occ.toFixed(1)}%` : NA}</td>
                      <td className="px-3 py-3 text-right font-mono">{fmtRpShort(h.revpar)}</td>
                      <td className="px-3 py-3 text-right font-mono text-gold">{fmtRpShort(h.adr)}</td>
                      <td className="px-3 py-3 text-right font-mono text-gold">{fmtRpShort(h.adrDaily)}</td>
                      <td className="px-3 py-3 text-right font-mono">{idxFmt(h.mpi)}</td>
                      <td className="px-3 py-3 text-right font-mono">{idxFmt(h.rgi)}</td>
                      <td className="px-3 py-3 text-right font-mono">{idxFmt(h.ari)}</td>
                      <td className={`px-3 py-3 text-right ${h.trend >= 0 ? "text-emerald" : "text-destructive"}`}>
                        <span className="inline-flex items-center gap-1 text-xs">
                          <TrendingUp className={`size-3 ${h.trend < 0 ? "rotate-180" : ""}`} />
                          {Math.abs(h.trend).toFixed(1)}%
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBlock label="N/A — no DRR data for this selection." />
        )}
      </div>

      {/* Comp set radar + RevPAR cohort */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="text-[10px] tracking-[0.25em] text-muted-foreground">COMPETITIVE INDEX</div>
          <h2 className="font-display text-2xl mt-1 mb-4">Market Position vs Comp Set</h2>
          {compRadar.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer>
                <RadarChart data={compRadar}>
                  <PolarGrid stroke="oklch(1 0 0 / 8%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "oklch(0.7 0.01 270)", fontSize: 11 }} />
                  <PolarRadiusAxis stroke="oklch(1 0 0 / 5%)" tick={{ fill: "oklch(0.5 0.01 270)", fontSize: 10 }} />
                  <Radar dataKey="compset" stroke="oklch(0.55 0.02 270)" fill="oklch(0.55 0.02 270)" fillOpacity={0.15} />
                  <Radar dataKey="pollux" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: "oklch(0.16 0.008 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock label={isAggregate ? "Select a single property to see comp set indices." : "N/A — no comp set data in latest DRR."} />
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="text-[10px] tracking-[0.25em] text-muted-foreground">REVPAR COHORT</div>
          <h2 className="font-display text-2xl mt-1 mb-4">Property RevPAR Distribution</h2>
          {ranked.filter((r) => r.revpar > 0).length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const max = Math.max(...ranked.map((r) => r.revpar), 1);
                return ranked.map((h) => {
                  const pct = (h.revpar / max) * 100;
                  return (
                    <div key={h.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground/80">{h.name}</span>
                        <span className="font-mono text-gold">{fmtRpShort(h.revpar)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[oklch(1_0_0/4%)] overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.1 }} className="h-full rounded-full bg-[var(--gradient-gold)] shadow-[var(--glow-gold)]" />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <EmptyBlock label="N/A" />
          )}
        </div>
      </div>
    </div>
  );
}

function Hero({ property, subtitle, period, setPeriod }: { property: string; subtitle: string; period: Period; setPeriod: (p: Period) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
      <div>
        <div className="text-[11px] tracking-[0.3em] text-gold">EXECUTIVE COMMAND CENTER · {property.toUpperCase()}</div>
        <h1 className="font-display text-5xl mt-2 gold-gradient-text">{property}</h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-2xl">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {periods.map((t) => {
          const active = period === t;
          return (
            <button key={t} onClick={() => setPeriod(t)} className={`px-3 py-1.5 text-xs rounded-lg border transition ${active ? "bg-[var(--gradient-gold)] text-[var(--onyx)] border-transparent shadow-[var(--glow-gold)]" : "border-border glass text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="h-48 flex items-center justify-center text-center">
      <div>
        <div className="font-display text-xl text-muted-foreground">{NA}</div>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{label}</p>
      </div>
    </div>
  );
}
