import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pheip/PageHeader";
import data from "@/data/lk_simpanglima_jan2026.json";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  PieChart, Pie, LineChart, Line, Legend,
} from "recharts";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, Sparkles, ShieldAlert, CheckCircle2, Info } from "lucide-react";

export const Route = createFileRoute("/property/lk-simpang-lima")({
  head: () => ({ meta: [{ title: "Louis Kienne Simpang Lima — PHEIP" }] }),
  component: PropertyView,
});

const fmtIDR = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `Rp ${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `Rp ${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `Rp ${(n / 1e3).toFixed(0)}K`;
  return `Rp ${n.toLocaleString()}`;
};
const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;

const TOOLTIP = { background: "oklch(0.16 0.008 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12, fontSize: 12 } as const;

function PropertyView() {
  const k = data.kpi_summary;
  const pl = data.profit_and_loss as any;
  const bs = data.balance_sheet.assets as any;
  const ar = data.accounts_receivable as any;
  const ap = data.accounts_payable as any;
  const insights = data.ai_insights as any[];

  const heroKpis = [
    { l: "Total Revenue", v: fmtIDR(k.total_revenue), sub: `vs Budget ${fmtPct(k.revenue_vs_budget_pct)}`, delta: k.revenue_vs_budget_pct - 100 },
    { l: "GOP", v: fmtIDR(k.gross_operating_profit), sub: `Margin ${fmtPct(k.gop_margin_pct)}`, delta: ((k.gross_operating_profit - k.gop_budget) / k.gop_budget) * 100 },
    { l: "Net Income", v: fmtIDR(k.net_income), sub: `Margin ${fmtPct(k.net_income_margin_pct)}`, delta: k.net_income_margin_pct },
    { l: "Occupancy", v: fmtPct(k.occupancy_pct), sub: `${k.rooms_occupied.toLocaleString()} / ${k.rooms_available.toLocaleString()} rooms`, delta: k.occupancy_pct - 50 },
    { l: "ADR", v: fmtIDR(k.adr), sub: "Average Daily Rate", delta: null },
    { l: "RevPAR", v: fmtIDR(k.revpar), sub: `GOPPAR ${fmtIDR(k.goppar)}`, delta: null },
  ];

  // Waterfall — cumulative for visual stacking
  let cum = 0;
  const waterfall = pl.waterfall_chart.map((w: any) => {
    if (w.type === "total" || w.type === "subtotal") {
      const r = { ...w, base: 0, bar: w.value };
      cum = w.value;
      return r;
    }
    const start = cum + w.value; // value is negative
    const r = { ...w, base: start, bar: -w.value };
    cum = start;
    return r;
  });

  const bva = pl.budget_vs_actual;
  const energy = pl.energy_cost.chart;
  const overheadDept = pl.overhead.dept_comparison_chart;
  const payrollByDept = data.payroll_detail.chart_by_dept;

  const arBuckets = ar.chart_data;
  const apBuckets = ap.chart_data;

  const insightTone = (t: string) => ({
    positive: { c: "emerald", Icon: CheckCircle2 },
    danger: { c: "oklch(0.65 0.2 25)", Icon: ShieldAlert },
    warning: { c: "var(--gold)", Icon: AlertTriangle },
    info: { c: "oklch(0.7 0.12 220)", Icon: Info },
  }[t] || { c: "var(--gold)", Icon: Sparkles });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PROPERTY COMMAND · LIVE DATA · JAN 2026"
        title="Louis Kienne Simpang Lima"
        subtitle={`${data.meta.hotel_address} — Real consolidated P&L, Balance Sheet, AR/AP Aging & Payroll for ${data.meta.period}.`}
      />

      {/* Identity strip */}
      <div className="glass rounded-2xl p-5 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[var(--gradient-gold)] grid place-items-center text-[var(--onyx)] font-display font-bold">LKS</div>
          <div>
            <div className="text-[10px] tracking-[0.25em] text-muted-foreground">PROPERTY</div>
            <div className="font-display text-xl">Louis Kienne Simpang Lima</div>
          </div>
        </div>
        <div className="h-10 w-px bg-border" />
        <Stat label="REPORTING PERIOD" value="January 2026" />
        <Stat label="GENERATED" value={data.meta.report_generated} />
        <Stat label="CURRENCY" value={data.meta.currency} />
        <Stat label="MODULES" value={`${data.meta.modules_included.length} active`} />
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full bg-emerald shadow-[0_0_10px_var(--emerald)] animate-pulse" />
          <span className="text-muted-foreground">Sync · PHEIP ETL v{data.meta.pheip_version}</span>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {heroKpis.map((h, i) => (
          <motion.div
            key={h.l}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5 relative overflow-hidden"
          >
            <div className="text-[10px] tracking-[0.25em] text-muted-foreground">{h.l}</div>
            <div className="font-display text-2xl mt-2 gold-gradient-text">{h.v}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{h.sub}</div>
            {h.delta !== null && (
              <div className={`text-xs mt-1 flex items-center gap-1 ${h.delta >= 0 ? "text-emerald" : "text-[oklch(0.7_0.18_25)]"}`}>
                {h.delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {h.delta >= 0 ? "+" : ""}{h.delta.toFixed(1)}%
              </div>
            )}
            <div className="absolute -bottom-6 -right-6 size-20 rounded-full bg-[var(--gold)]/5 blur-2xl" />
          </motion.div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-4 text-[var(--gold)]" />
          <div className="text-[10px] tracking-[0.25em] text-muted-foreground">PHEIP AI · EXECUTIVE INSIGHTS</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {insights.slice(0, 6).map((ins, i) => {
            const { c, Icon } = insightTone(ins.type);
            return (
              <div key={i} className="rounded-xl p-4 border border-border/60 bg-[oklch(1_0_0/2%)] flex gap-3">
                <div className="shrink-0 size-9 rounded-lg grid place-items-center" style={{ background: `color-mix(in oklab, ${c} 18%, transparent)` }}>
                  <Icon className="size-4" style={{ color: c }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] text-muted-foreground">
                    <span>{ins.module}</span><span>·</span><span style={{ color: c }}>{ins.type.toUpperCase()}</span>
                  </div>
                  <div className="font-display text-base mt-1">{ins.title} <span className="text-gold font-mono text-sm">· {ins.metric}</span></div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{ins.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waterfall */}
      <div className="glass rounded-2xl p-6">
        <div className="text-[10px] tracking-[0.25em] text-muted-foreground">P&L WATERFALL</div>
        <h2 className="font-display text-2xl mt-1 mb-4">Revenue to Net Income — January 2026</h2>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={waterfall}>
              <CartesianGrid stroke="oklch(1 0 0 / 5%)" vertical={false} />
              <XAxis dataKey="label" stroke="oklch(0.6 0.01 270)" fontSize={10} axisLine={false} tickLine={false} interval={0} angle={-15} dy={10} height={60} />
              <YAxis stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
              <Tooltip contentStyle={TOOLTIP} formatter={(v: any, _n: any, p: any) => [fmtIDR(p.payload.value), p.payload.label]} />
              <Bar dataKey="base" stackId="a" fill="transparent" />
              <Bar dataKey="bar" stackId="a" radius={[6, 6, 0, 0]}>
                {waterfall.map((d: any, i: number) => (
                  <Cell key={i} fill={d.type === "total" ? "var(--gold)" : d.type === "subtotal" ? "var(--emerald)" : "oklch(0.6 0.18 25)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <Legend2 color="var(--gold)" label="Total" />
          <Legend2 color="var(--emerald)" label="Subtotal" />
          <Legend2 color="oklch(0.6 0.18 25)" label="Deduction" />
        </div>
      </div>

      {/* Budget vs Actual + Revenue Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="font-display text-2xl mb-4">Budget vs Actual</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={bva}>
                <CartesianGrid stroke="oklch(1 0 0 / 5%)" vertical={false} />
                <XAxis dataKey="metric" stroke="oklch(0.6 0.01 270)" fontSize={10} axisLine={false} tickLine={false} angle={-15} dy={10} height={60} interval={0} />
                <YAxis stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v: any) => fmtIDR(v as number)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="budget" fill="oklch(0.45 0.06 270)" radius={[6, 6, 0, 0]} name="Budget" />
                <Bar dataKey="actual" fill="var(--gold)" radius={[6, 6, 0, 0]} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-2xl mb-4">Revenue Mix</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pl.revenue.mix_chart} dataKey="actual" nameKey="segment" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pl.revenue.mix_chart.map((_: any, i: number) => (
                    <Cell key={i} fill={["var(--gold)", "var(--emerald)", "oklch(0.68 0.14 220)"][i]} stroke="oklch(0.13 0.005 270)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} formatter={(v: any) => fmtIDR(v as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {pl.revenue.mix_chart.map((m: any, i: number) => (
              <div key={m.segment} className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full" style={{ background: ["var(--gold)", "var(--emerald)", "oklch(0.68 0.14 220)"][i] }} />
                <span>{m.segment}</span>
                <span className="ml-auto font-mono">{fmtIDR(m.actual)} · {m.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Energy + Overhead + Payroll */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl mb-1">Energy Cost</h2>
          <div className="text-xs text-muted-foreground mb-3">Per occupied room {fmtIDR(pl.energy_cost.per_occupied_room)} · Per available {fmtIDR(pl.energy_cost.per_available_room)}</div>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={energy}>
                <CartesianGrid stroke="oklch(1 0 0 / 5%)" vertical={false} />
                <XAxis dataKey="type" stroke="oklch(0.6 0.01 270)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.6 0.01 270)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v: any) => fmtIDR(v as number)} />
                <Bar dataKey="budget" fill="oklch(0.45 0.06 270)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="amount" fill="var(--gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl mb-3">Overhead by Dept</h2>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={overheadDept} layout="vertical">
                <CartesianGrid stroke="oklch(1 0 0 / 5%)" horizontal={false} />
                <XAxis type="number" stroke="oklch(0.6 0.01 270)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                <YAxis type="category" dataKey="dept" stroke="oklch(0.7 0.01 270)" fontSize={10} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v: any) => fmtIDR(v as number)} />
                <Bar dataKey="payroll" stackId="a" fill="var(--gold)" />
                <Bar dataKey="other" stackId="a" fill="var(--emerald)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl mb-3">Payroll by Dept</h2>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={payrollByDept}>
                <CartesianGrid stroke="oklch(1 0 0 / 5%)" vertical={false} />
                <XAxis dataKey="department" stroke="oklch(0.6 0.01 270)" fontSize={9} axisLine={false} tickLine={false} interval={0} angle={-20} dy={8} height={50} />
                <YAxis stroke="oklch(0.6 0.01 270)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v: any) => fmtIDR(v as number)} />
                <Bar dataKey="total" fill="var(--gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-muted-foreground mt-2">Total Payroll {fmtIDR(k.total_payroll)} · {fmtPct(k.payroll_pct_revenue)} of revenue</div>
        </div>
      </div>

      {/* AR + AP Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-[10px] tracking-[0.25em] text-muted-foreground">ACCOUNTS RECEIVABLE</div>
              <h2 className="font-display text-2xl mt-1">{fmtIDR(ar.total)} outstanding</h2>
            </div>
            <div className="text-right text-xs">
              <div className="text-emerald">Current {fmtPct(ar.pct_current)}</div>
              <div className="text-[oklch(0.7_0.18_25)]">Overdue {fmtPct(ar.pct_overdue)}</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {arBuckets.map((b: any) => (
              <div key={b.bucket} className="rounded-xl p-3 bg-[oklch(1_0_0/3%)] border border-border/60">
                <div className="text-[9px] tracking-[0.2em] text-muted-foreground">{b.bucket}</div>
                <div className="font-mono text-sm mt-1 text-gold">{fmtIDR(b.amount)}</div>
                <div className="text-[10px] text-muted-foreground">{b.pct}%</div>
              </div>
            ))}
          </div>
          <table className="w-full text-xs mt-4">
            <thead>
              <tr className="text-[9px] tracking-[0.25em] text-muted-foreground">
                <th className="text-left py-2">Category</th>
                <th className="text-right">Total</th>
                <th className="text-right">Overdue</th>
              </tr>
            </thead>
            <tbody>
              {ar.by_category.slice(0, 7).map((c: any) => (
                <tr key={c.category} className="border-t border-border/40">
                  <td className="py-2">{c.category}</td>
                  <td className="text-right font-mono">{fmtIDR(c.total)}</td>
                  <td className="text-right font-mono text-[oklch(0.7_0.18_25)]">{fmtIDR(c.days_61_90 + c.over_90)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-[10px] tracking-[0.25em] text-muted-foreground">ACCOUNTS PAYABLE</div>
              <h2 className="font-display text-2xl mt-1">{fmtIDR(ap.total_outstanding)} outstanding</h2>
              <div className="text-xs text-muted-foreground">{ap.total_vendors} vendors · {ap.critical_vendors_count} critical (&gt;90d)</div>
            </div>
            <div className="text-right text-xs">
              <div className="text-[oklch(0.7_0.18_25)]">Over 90d {fmtPct(ap.pct_over_90)}</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {apBuckets.map((b: any) => (
              <div key={b.bucket} className="rounded-xl p-3 bg-[oklch(1_0_0/3%)] border border-border/60">
                <div className="text-[9px] tracking-[0.2em] text-muted-foreground">{b.bucket}</div>
                <div className="font-mono text-sm mt-1 text-gold">{fmtIDR(b.amount)}</div>
                <div className="text-[10px] text-muted-foreground">{b.pct}%</div>
              </div>
            ))}
          </div>
          <table className="w-full text-xs mt-4">
            <thead>
              <tr className="text-[9px] tracking-[0.25em] text-muted-foreground">
                <th className="text-left py-2">Top Vendors</th>
                <th className="text-right">Outstanding</th>
                <th className="text-right">&gt;90d</th>
              </tr>
            </thead>
            <tbody>
              {ap.top10_by_outstanding.slice(0, 7).map((v: any) => (
                <tr key={v.no} className="border-t border-border/40">
                  <td className="py-2 truncate max-w-[200px]">{v.supplier}</td>
                  <td className="text-right font-mono">{fmtIDR(v.outstanding)}</td>
                  <td className="text-right font-mono text-[oklch(0.7_0.18_25)]">{fmtIDR(v.over_90)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Sheet snapshot */}
      <div className="glass rounded-2xl p-6">
        <div className="text-[10px] tracking-[0.25em] text-muted-foreground">BALANCE SHEET · 31 JAN 2026</div>
        <h2 className="font-display text-2xl mt-1 mb-4">Asset Position</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Cash", bs.cash],
            ["Bank", bs.bank],
            ["Account Receivable", bs.account_receivable],
            ["Other Receivable", bs.other_receivable],
            ["Inventory", bs.inventory],
            ["Prepaid Expenses", bs.prepaid_expenses],
            ["Other Current", bs.other_current],
            ["Fixed Assets", bs.fixed_assets],
          ].map(([label, v]: any) => (
            <div key={label} className="rounded-xl p-4 border border-border/60 bg-[oklch(1_0_0/2%)]">
              <div className="text-[10px] tracking-[0.2em] text-muted-foreground">{label}</div>
              <div className="font-mono text-base mt-1 text-gold">{fmtIDR(v.current_month)}</div>
              <div className={`text-[10px] mt-1 ${v.variance >= 0 ? "text-emerald" : "text-[oklch(0.7_0.18_25)]"}`}>
                {v.variance >= 0 ? "▲" : "▼"} {fmtIDR(Math.abs(v.variance))} MoM
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-6 pt-4 border-t border-border/60">
          <Stat label="TOTAL CURRENT ASSETS" value={fmtIDR(bs.total_current_assets.current_month)} />
          <Stat label="TOTAL ASSETS" value={fmtIDR(bs.total_assets.current_month)} />
          <Stat label="CASH + BANK" value={fmtIDR(k.cash_and_bank)} />
        </div>
      </div>

      {/* Daily trajectory simulated from monthly stats */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-2xl mb-4">Operating Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Stat label="ROOMS AVAILABLE" value={k.rooms_available.toLocaleString()} />
          <Stat label="ROOMS OCCUPIED" value={k.rooms_occupied.toLocaleString()} />
          <Stat label="OCCUPANCY" value={fmtPct(k.occupancy_pct)} />
          <Stat label="ADR" value={fmtIDR(k.adr)} />
          <Stat label="REVPAR" value={fmtIDR(k.revpar)} />
          <Stat label="GUESTS" value={k.total_guests.toLocaleString()} />
          <Stat label="F&B COVERS" value={k.total_covers.toLocaleString()} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className="font-display text-base mt-1">{value}</div>
    </div>
  );
}
function Legend2({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-2 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}