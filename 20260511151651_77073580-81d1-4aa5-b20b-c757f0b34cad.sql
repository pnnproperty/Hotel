import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pheip/PageHeader";
import { useSelectedProperty } from "@/store/property";
import { useDrrFiltered, fmtRpShort, fmtPct, NA } from "@/hooks/useDrrData";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/segment")({ head: () => ({ meta: [{ title: "Segments — PHEIP" }] }), component: Segment });
const C = ["var(--gold)","var(--emerald)","oklch(0.68 0.14 220)","oklch(0.7 0.18 25)","oklch(0.62 0.18 305)","oklch(0.7 0.08 50)","oklch(0.75 0.13 130)","oklch(0.6 0.1 200)","oklch(0.6 0.15 30)"];

function Segment() {
  const selected = useSelectedProperty();
  const { latest } = useDrrFiltered(selected);
  const segments = latest?.segments ?? [];

  if (!latest) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="SEGMENT INTELLIGENCE" title={`${selected} — Segments`} subtitle="Awaiting DRR import." />
        <Empty />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`SEGMENT INTELLIGENCE · ${latest.property.toUpperCase()}`} title="Guest Segment Mix" subtitle={`From DRR ${latest.report_date} — Revenue contribution across business segments.`} />
      {segments.length === 0 ? (
        <Empty label="N/A — segment data unavailable in latest DRR." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-2xl mb-4">Revenue Share (MTD)</h2>
            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={segments} dataKey="mtd_revenue" nameKey="segment" innerRadius={70} outerRadius={120} paddingAngle={2}>
                    {segments.map((_, i) => <Cell key={i} fill={C[i % C.length]} stroke="oklch(0.13 0.005 270)" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.16 0.008 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12 }} formatter={(v: number) => fmtRpShort(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-2xl mb-4">Segment Breakdown</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[0.25em] text-muted-foreground">
                  <th className="text-left py-2">Segment</th>
                  <th className="text-right">Rooms</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">ARR</th>
                  <th className="text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s, i) => (
                  <tr key={s.segment + i} className="border-t border-border/40">
                    <td className="py-3 flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: C[i % C.length] }} />{s.segment || NA}</td>
                    <td className="text-right font-mono">{s.mtd_rooms?.toLocaleString() ?? NA}</td>
                    <td className="text-right font-mono">{fmtRpShort(s.mtd_revenue)}</td>
                    <td className="text-right font-mono">{fmtRpShort(s.mtd_arr)}</td>
                    <td className="text-right font-mono text-gold">{fmtPct(s.mtd_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ label = "N/A" }: { label?: string }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <Inbox className="size-10 text-gold mx-auto mb-4" />
      <div className="font-display text-2xl gold-gradient-text">{label}</div>
    </div>
  );
}
