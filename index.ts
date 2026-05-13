import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pheip/PageHeader";
import { useSelectedProperty } from "@/store/property";
import { useDrrFiltered, fmtRpShort, fmtPct, NA, avgKpi } from "@/hooks/useDrrData";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Inbox } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/occupancy")({
  head: () => ({ meta: [{ title: "Occupancy — PHEIP" }] }),
  component: Occupancy,
});

function Occupancy() {
  const selected = useSelectedProperty();
  const { latestPerProperty, latest } = useDrrFiltered(selected);

  const occ = avgKpi(latestPerProperty, "occupancy", "mtd_actual");
  const adr = avgKpi(latestPerProperty, "adr", "mtd_actual");
  const revpar = avgKpi(latestPerProperty, "revpar", "mtd_actual");
  const occToday = avgKpi(latestPerProperty, "occupancy", "today_actual");

  const trend = useMemo(() => {
    if (!latest?.daily_breakdown?.length) return [];
    return latest.daily_breakdown
      .filter((d) => d.date)
      .map((d) => ({ day: (d.date || "").slice(5), occ: Number(d.occ_pct ?? (d as any).occupancy ?? 0), adr: Number(d.adr ?? 0) / 1000 }));
  }, [latest]);

  if (latestPerProperty.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="OCCUPANCY INTELLIGENCE" title={`${selected} — Occupancy`} subtitle="Awaiting DRR import." />
        <div className="glass rounded-2xl p-12 text-center">
          <Inbox className="size-10 text-gold mx-auto mb-4" />
          <div className="font-display text-2xl gold-gradient-text">N/A</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`OCCUPANCY INTELLIGENCE · ${selected.toUpperCase()}`} title="Room Demand & Pace" subtitle={`From ${latestPerProperty.length} imported DRR report${latestPerProperty.length === 1 ? "" : "s"}.`} />

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: "Occupancy MTD", v: fmtPct(occ) },
          { l: "Occupancy Today", v: fmtPct(occToday) },
          { l: "ADR MTD", v: fmtRpShort(adr) },
          { l: "RevPAR MTD", v: fmtRpShort(revpar) },
        ].map((k) => (
          <div key={k.l} className="glass rounded-2xl p-5">
            <div className="text-[10px] tracking-[0.25em] text-muted-foreground">{k.l}</div>
            <div className="font-display text-3xl mt-2 gold-gradient-text">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-2xl mb-4">Daily Occupancy & ADR (latest DRR)</h2>
        {trend.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="oc" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 5%)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ background: "oklch(0.16 0.008 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12 }} />
                <Area dataKey="occ" stroke="var(--gold)" strokeWidth={2.5} fill="url(#oc)" name="Occupancy %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">N/A — daily breakdown unavailable.</div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-2xl mb-4">By Property</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[0.25em] text-muted-foreground">
              <th className="text-left py-2">Property</th>
              <th className="text-right">Occ MTD</th>
              <th className="text-right">Occ Today</th>
              <th className="text-right">ADR</th>
              <th className="text-right">RevPAR</th>
            </tr>
          </thead>
          <tbody>
            {latestPerProperty.map((r) => (
              <tr key={r.id} className="border-t border-border/40 hover:bg-[oklch(1_0_0/3%)]">
                <td className="py-3">{r.property}</td>
                <td className="text-right font-mono">{fmtPct(r.occupancy?.mtd_actual)}</td>
                <td className="text-right font-mono">{fmtPct(r.occupancy?.today_actual)}</td>
                <td className="text-right font-mono">{fmtRpShort(r.adr?.mtd_actual)}</td>
                <td className="text-right font-mono text-gold">{fmtRpShort(r.revpar?.mtd_actual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
