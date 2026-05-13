import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pheip/PageHeader";
import { useSelectedProperty } from "@/store/property";
import { useDrrFiltered, fmtRpShort, NA, sumKpi, variancePct } from "@/hooks/useDrrData";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { useMemo } from "react";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/finance")({
  head: () => ({ meta: [{ title: "Finance — PHEIP" }] }),
  component: Finance,
});

function Finance() {
  const selected = useSelectedProperty();
  const { latestPerProperty, latest } = useDrrFiltered(selected);

  const room = sumKpi(latestPerProperty, "room_revenue", "mtd_actual");
  const roomB = sumKpi(latestPerProperty, "room_revenue", "mtd_budget");
  const fnb = sumKpi(latestPerProperty, "fnb_revenue", "mtd_actual");
  const fnbB = sumKpi(latestPerProperty, "fnb_revenue", "mtd_budget");
  const net = sumKpi(latestPerProperty, "net_revenue", "mtd_actual");
  const netB = sumKpi(latestPerProperty, "net_revenue", "mtd_budget");
  const ytdRev = sumKpi(latestPerProperty, "net_revenue", "ytd_actual");
  const ytdRevB = sumKpi(latestPerProperty, "net_revenue", "ytd_budget");

  const tiles = [
    { l: "Net Revenue MTD", v: fmtRpShort(net), d: variancePct(net ?? undefined, netB ?? undefined) },
    { l: "Room Revenue MTD", v: fmtRpShort(room), d: variancePct(room ?? undefined, roomB ?? undefined) },
    { l: "F&B Revenue MTD", v: fmtRpShort(fnb), d: variancePct(fnb ?? undefined, fnbB ?? undefined) },
    { l: "YTD Net Revenue", v: fmtRpShort(ytdRev), d: variancePct(ytdRev ?? undefined, ytdRevB ?? undefined) },
  ];

  const waterfall = useMemo(() => {
    if (net == null && room == null && fnb == null) return [];
    return [
      { name: "Room", v: (room ?? 0) / 1e9, type: "pos" },
      { name: "F&B", v: (fnb ?? 0) / 1e9, type: "pos" },
      { name: "Net Revenue", v: (net ?? 0) / 1e9, type: "total" },
    ];
  }, [room, fnb, net]);

  // Daily trend if single property has daily_breakdown
  const dailyTrend = useMemo(() => {
    if (!latest?.daily_breakdown?.length) return [];
    return latest.daily_breakdown
      .filter((d) => d.date)
      .map((d) => ({
        date: (d.date || "").slice(5),
        room: Number(d.room_revenue ?? 0) / 1e6,
        fnb: Number(d.fnb_revenue ?? 0) / 1e6,
        net: Number(d.net_revenue ?? 0) / 1e6,
      }));
  }, [latest]);

  if (latestPerProperty.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="FINANCIAL INTELLIGENCE" title={`${selected} — Finance`} subtitle="Awaiting DRR import." />
        <Empty />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`FINANCIAL INTELLIGENCE · ${selected.toUpperCase()}`} title="Group Financial Performance" subtitle={`From ${latestPerProperty.length} imported DRR report${latestPerProperty.length === 1 ? "" : "s"}.`} />

      <div className="grid grid-cols-4 gap-4">
        {tiles.map((k) => (
          <div key={k.l} className="glass rounded-2xl p-5">
            <div className="text-[10px] tracking-[0.25em] text-muted-foreground">{k.l}</div>
            <div className="font-display text-3xl mt-2 gold-gradient-text">{k.v}</div>
            <div className={`text-xs mt-1 ${k.d == null ? "text-muted-foreground" : k.d >= 0 ? "text-emerald" : "text-destructive"}`}>{k.d == null ? "vs Budget N/A" : `${k.d >= 0 ? "+" : ""}${k.d.toFixed(1)}% vs Budget`}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="text-[10px] tracking-[0.25em] text-muted-foreground">REVENUE COMPOSITION</div>
        <h2 className="font-display text-2xl mt-1 mb-4">Room → F&B → Net Revenue</h2>
        {waterfall.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={waterfall}>
                <CartesianGrid stroke="oklch(1 0 0 / 5%)" vertical={false} />
                <XAxis dataKey="name" stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(1)}B`} />
                <Tooltip contentStyle={{ background: "oklch(0.16 0.008 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => `Rp ${v.toFixed(2)}B`} />
                <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                  {waterfall.map((d, i) => (
                    <Cell key={i} fill={d.type === "total" ? "var(--gold)" : "var(--emerald)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyInline label="N/A" />
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-2xl mb-4">Daily Revenue (latest DRR)</h2>
        {dailyTrend.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={dailyTrend}>
                <CartesianGrid stroke="oklch(1 0 0 / 5%)" vertical={false} />
                <XAxis dataKey="date" stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}M`} />
                <Tooltip contentStyle={{ background: "oklch(0.16 0.008 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => `Rp ${v.toFixed(1)}M`} />
                <Line dataKey="room" stroke="var(--gold)" strokeWidth={2} dot={false} name="Room" />
                <Line dataKey="fnb" stroke="var(--emerald)" strokeWidth={2} dot={false} name="F&B" />
                <Line dataKey="net" stroke="oklch(0.68 0.14 220)" strokeWidth={2} dot={false} name="Net" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyInline label="N/A — daily breakdown unavailable for this selection." />
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-2xl mb-4">Revenue Contribution by Hotel</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[0.25em] text-muted-foreground">
              <th className="text-left py-2">Property</th>
              <th className="text-right">Net Rev MTD</th>
              <th className="text-right">Room Rev MTD</th>
              <th className="text-right">F&B Rev MTD</th>
              <th className="text-right">vs Budget</th>
              <th className="text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const total = latestPerProperty.reduce((s, r) => s + Number(r.net_revenue?.mtd_actual ?? 0), 0);
              return latestPerProperty.map((r) => {
                const rv = Number(r.net_revenue?.mtd_actual ?? 0);
                const rvB = Number(r.net_revenue?.mtd_budget ?? 0);
                const v = rvB > 0 ? ((rv - rvB) / rvB) * 100 : null;
                return (
                  <tr key={r.id} className="border-t border-border/40 hover:bg-[oklch(1_0_0/3%)]">
                    <td className="py-3">{r.property}</td>
                    <td className="text-right font-mono">{fmtRpShort(r.net_revenue?.mtd_actual)}</td>
                    <td className="text-right font-mono">{fmtRpShort(r.room_revenue?.mtd_actual)}</td>
                    <td className="text-right font-mono">{fmtRpShort(r.fnb_revenue?.mtd_actual)}</td>
                    <td className={`text-right ${v == null ? "text-muted-foreground" : v >= 0 ? "text-emerald" : "text-destructive"}`}>{v == null ? NA : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}</td>
                    <td className="text-right font-mono">{total > 0 ? `${(rv / total * 100).toFixed(1)}%` : NA}</td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <Inbox className="size-10 text-gold mx-auto mb-4" />
      <div className="font-display text-2xl gold-gradient-text">N/A</div>
      <p className="text-sm text-muted-foreground mt-2">No DRR data imported for this selection. Upload via Data Ingestion.</p>
    </div>
  );
}
function EmptyInline({ label }: { label: string }) {
  return <div className="h-48 flex items-center justify-center text-center text-sm text-muted-foreground">{label}</div>;
}
