import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pheip/PageHeader";
import { useSelectedProperty } from "@/store/property";
import { useDrrFiltered, fmtRpShort, fmtPct, NA } from "@/hooks/useDrrData";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/ota")({
  head: () => ({ meta: [{ title: "OTA Production — PHEIP" }] }),
  component: OTA,
});

const COLORS = ["var(--gold)", "var(--emerald)", "oklch(0.68 0.14 220)", "oklch(0.7 0.18 25)", "oklch(0.62 0.18 305)", "oklch(0.7 0.08 50)", "oklch(0.75 0.13 130)", "oklch(0.6 0.1 200)", "oklch(0.6 0.15 30)"];

function OTA() {
  const selected = useSelectedProperty();
  const { latest } = useDrrFiltered(selected);
  const ota = latest?.ota_production ?? [];

  if (!latest) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="DISTRIBUTION INTELLIGENCE" title={`${selected} — OTA Production`} subtitle="Awaiting DRR import." />
        <Empty />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`DISTRIBUTION INTELLIGENCE · ${latest.property.toUpperCase()}`}
        title="OTA Production Command"
        subtitle={`From DRR ${latest.report_date} — Channel mix and revenue across active OTAs.`}
      />

      {ota.length === 0 ? (
        <Empty label="N/A — OTA production data unavailable in latest DRR." />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-2xl mb-2">Channel Mix (% of OTA revenue)</h2>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={ota} dataKey="mtd_lodging" nameKey="agent" innerRadius={60} outerRadius={100} paddingAngle={2}>
                      {ota.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="oklch(0.13 0.005 270)" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "oklch(0.16 0.008 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12 }} formatter={(v: number) => fmtRpShort(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {ota.map((o, i) => (
                  <div key={o.agent + i} className="flex items-center gap-2 text-xs">
                    <span className="size-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span>{o.agent || NA}</span>
                    <span className="ml-auto font-mono text-muted-foreground">{fmtPct(o.mtd_pct)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 glass rounded-2xl p-6">
              <h2 className="font-display text-2xl mb-4">Revenue by Channel (MTD)</h2>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={ota} layout="vertical">
                    <CartesianGrid stroke="oklch(1 0 0 / 5%)" horizontal={false} />
                    <XAxis type="number" stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                    <YAxis type="category" dataKey="agent" stroke="oklch(0.7 0.01 270)" fontSize={12} axisLine={false} tickLine={false} width={130} />
                    <Tooltip contentStyle={{ background: "oklch(0.16 0.008 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12 }} formatter={(v: number) => fmtRpShort(v)} />
                    <Bar dataKey="mtd_lodging" radius={[0, 8, 8, 0]}>
                      {ota.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-2xl mb-4">Channel Performance Matrix (MTD)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[0.25em] text-muted-foreground">
                  <th className="text-left py-2">Channel</th>
                  <th className="text-right">Mix Share</th>
                  <th className="text-right">Room Nights</th>
                  <th className="text-right">Pax</th>
                  <th className="text-right">ARR</th>
                  <th className="text-right">Lodging Revenue</th>
                </tr>
              </thead>
              <tbody>
                {ota.map((o, i) => (
                  <tr key={o.agent + i} className="border-t border-border/40 hover:bg-[oklch(1_0_0/3%)]">
                    <td className="py-3 font-medium">{o.agent || NA}</td>
                    <td className="text-right font-mono">{fmtPct(o.mtd_pct)}</td>
                    <td className="text-right font-mono">{o.mtd_rooms?.toLocaleString() ?? NA}</td>
                    <td className="text-right font-mono">{o.mtd_pax?.toLocaleString() ?? NA}</td>
                    <td className="text-right font-mono">{fmtRpShort(o.mtd_arr)}</td>
                    <td className="text-right font-mono text-gold">{fmtRpShort(o.mtd_lodging)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
