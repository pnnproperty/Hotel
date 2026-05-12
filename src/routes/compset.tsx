import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pheip/PageHeader";
import { useSelectedProperty } from "@/store/property";
import { useDrrFiltered, fmtRpShort, fmtPct, fmtNum, NA, canonicalProperty, displayProperty } from "@/hooks/useDrrData";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Crown, Inbox } from "lucide-react";

export const Route = createFileRoute("/compset")({
  head: () => ({ meta: [{ title: "Comp Set — PHEIP" }] }),
  component: Compset,
});

function Compset() {
  const selected = useSelectedProperty();
  const { latestPerProperty } = useDrrFiltered(selected);
  const isAll = !selected || selected === "All Hotels";
  // Properties that have any comp set data.
  const withCompset = latestPerProperty.filter(
    (r) => (r.compset_mtd?.length ?? 0) > 0 || (r.compset_today?.length ?? 0) > 0,
  );
  const latest = withCompset[0] ?? latestPerProperty[0] ?? null;

  if (!latest) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="COMPETITIVE INTELLIGENCE" title={`${selected} — Comp Set`} subtitle="Awaiting DRR import." />
        <Empty />
      </div>
    );
  }
  // Use today's daily snapshot per the report date (avoids MTD double-counting).
  // Fall back to MTD only if today is empty.
  const pickCompset = (r: typeof latest) => {
    const today = r.compset_today ?? [];
    const mtd = r.compset_mtd ?? [];
    return { rows: today.length > 0 ? today : mtd, usingToday: today.length > 0 };
  };
  // Normalize compset hotel names so variants like "LK Pemuda" / "Louis Kienne Pemuda"
  // and "Chanti" / "Chanti Hotel" collapse to one row.
  const canonHotel = (raw: string): string => {
    let s = canonicalProperty(raw);
    s = s.replace(/\blk\b/g, "louis kienne");
    // Drop generic suffix words that vary across DRRs.
    s = s.replace(/\b(hotel|resort|the)\b/g, " ");
    return s.replace(/\s+/g, " ").trim();
  };
  // Strict self-detection via per-property aliases. Generic location tokens
  // ("simpang", "senggigi", "semarang", "resort") match competitors; we only
  // accept matches that include a brand+location signal.
  const SELF_ALIASES: Record<string, string[]> = {
    "louis kienne cikarang": [
      "lk cikarang",
      "louis kienne cikarang",
      "louis kienne hotel chadstone",
      "louis kienne chadstone",
      "louis kienne hotel",
    ],
    "louis kienne pandanaran": ["lk pandanaran", "louis kienne pandanaran"],
    "louis kienne pemuda": ["lk pemuda", "louis kienne pemuda"],
    "louis kienne resort senggigi": [
      "lk resort senggigi",
      "louis kienne resort senggigi",
      "lk senggigi",
    ],
    "louis kienne simpang lima": ["lk simpang lima", "louis kienne simpang lima"],
    "po hotel semarang": ["po hotel", "po semarang"],
  };
  const aliasesFor = (propName: string): string[] => {
    const k = canonicalProperty(propName);
    return SELF_ALIASES[k] ?? [k];
  };
  const isSelfHotel = (hotel: string, propName: string): boolean => {
    const h = (hotel || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!h) return false;
    return aliasesFor(propName).some((a) => h.includes(a));
  };
  const findSelfRow = (compsetRows: any[], propName: string) =>
    compsetRows.find((c) => isSelfHotel(c.hotel || "", propName));

  const usingToday = withCompset.some((r) => pickCompset(r).usingToday);

  // Synthesize a self compset row from the property's own KPIs when the DRR's
  // compset table omits the property itself (happens on some DRRs).
  const synthSelfRow = (p: typeof latest, useToday: boolean) => {
    const period = useToday ? "today_actual" : "mtd_actual";
    const fb = useToday ? "mtd_actual" : "today_actual";
    const pick = (b: any): number | undefined => {
      const v = b?.[period] ?? b?.[fb];
      return v != null && Number.isFinite(Number(v)) ? Number(v) : undefined;
    };
    return {
      hotel: displayProperty(p.property),
      occ_pct: pick(p.occupancy),
      adr: pick(p.adr),
      revpar: pick(p.revpar),
      room_revenue: pick(p.room_revenue),
    } as any;
  };

  // Aggregate competitor rows: when All Hotels, average numeric fields across all properties' compsets keyed by canonical hotel name.
  type Row = { hotel: string; rooms_available?: number; rooms_sold?: number; occ_pct?: number; adr?: number; room_revenue?: number; revpar?: number; rgi?: number; mpi?: number; ari?: number };
  const sourceProps = isAll ? withCompset : [latest];
  const agg = new Map<string, { hotel: string; sums: Record<string, number>; counts: Record<string, number> }>();
  for (const p of sourceProps) {
    const picked = pickCompset(p);
    const rows = [...picked.rows];
    // Inject synthesized self row if property's own hotel is absent.
    if (!findSelfRow(rows, p.property)) {
      const synth = synthSelfRow(p, picked.usingToday);
      if (synth.revpar != null || synth.adr != null || synth.occ_pct != null) {
        rows.push(synth);
      }
    }
    for (const c of rows) {
      const key = canonHotel(c.hotel || "");
      if (!key) continue;
      let entry = agg.get(key);
      if (!entry) {
        entry = { hotel: c.hotel || "", sums: {}, counts: {} };
        agg.set(key, entry);
      }
      for (const f of ["rooms_available", "rooms_sold", "occ_pct", "adr", "room_revenue", "revpar", "rgi", "mpi", "ari"] as const) {
        const v = (c as any)[f];
        if (v != null && Number.isFinite(Number(v))) {
          entry.sums[f] = (entry.sums[f] ?? 0) + Number(v);
          entry.counts[f] = (entry.counts[f] ?? 0) + 1;
        }
      }
    }
  }
  const data: Row[] = Array.from(agg.values()).map((e) => {
    const out: Row = { hotel: e.hotel };
    for (const f of Object.keys(e.sums)) {
      const cnt = e.counts[f] || 1;
      // Sum room counts; average rates/indices.
      const isSum = f === "rooms_available" || f === "rooms_sold" || f === "room_revenue";
      (out as any)[f] = isSum ? e.sums[f] : e.sums[f] / cnt;
    }
    return out;
  }).sort((a, b) => Number(b.revpar ?? 0) - Number(a.revpar ?? 0));

  // Set of canonical hotel names that belong to "us" (any of the 6 properties).
  const ownProps = latestPerProperty.map((r) => r.property);
  const isOwn = (hotel: string) => ownProps.some((p) => isSelfHotel(hotel, p));

  // Index for highlight + scorecard self.
  const selfIdx = isAll ? -1 : data.findIndex((c) => isSelfHotel(c.hotel || "", latest.property));

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={`COMPETITIVE INTELLIGENCE · ${latest.property.toUpperCase()}`} title="Comp Set Positioning" subtitle="No comp set data in latest DRR." />
        <Empty label="N/A — comp set table empty in this DRR." />
      </div>
    );
  }

  // Scorecard values:
  // - Single hotel: take the self row.
  // - All Hotels: average self rows across the 6 properties (each property's own row in its own compset).
  let scoreRgi: number | null = null, scoreMpi: number | null = null, scoreAri: number | null = null, scoreRev: number | null = null, scoreOcc: number | null = null;
  let rankDisplay = "Reference";
  if (isAll) {
    const selfRows = withCompset
      .map((p) => {
        const picked = pickCompset(p);
        return findSelfRow(picked.rows, p.property) ?? synthSelfRow(p, picked.usingToday);
      })
      .filter(Boolean) as Row[];
    const avg = (k: keyof Row) => {
      const vs = selfRows.map((r) => Number((r as any)[k])).filter((v) => Number.isFinite(v));
      return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
    };
    scoreRgi = avg("rgi"); scoreMpi = avg("mpi"); scoreAri = avg("ari");
    scoreRev = avg("revpar"); scoreOcc = avg("occ_pct");
    rankDisplay = `Avg of ${selfRows.length} hotels`;
  } else {
    const self = selfIdx >= 0 ? data[selfIdx] : synthSelfRow(latest, pickCompset(latest).usingToday) as Row;
    scoreRgi = Number(self.rgi ?? null) || null;
    scoreMpi = Number(self.mpi ?? null) || null;
    scoreAri = Number(self.ari ?? null) || null;
    scoreRev = Number(self.revpar ?? null) || null;
    scoreOcc = Number(self.occ_pct ?? null) || null;
    rankDisplay = selfIdx >= 0 ? `#${selfIdx + 1} of ${data.length}` : "Reference";
  }

  const headerEyebrow = isAll
    ? `COMPETITIVE INTELLIGENCE · CONSOLIDATED · ${withCompset.length} HOTELS`
    : `COMPETITIVE INTELLIGENCE · ${latest.property.toUpperCase()} · ${latest.report_date}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={headerEyebrow}
        title="Comp Set Positioning"
        subtitle={`Hotel Competitor Statistic with RGI, MPI, ARI indices.${usingToday ? " (Today snapshot — MTD belum tersedia)" : ""}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "RGI", v: fmtNum(scoreRgi), note: rankDisplay },
          { l: "MPI", v: fmtNum(scoreMpi), note: "Demand capture" },
          { l: "ARI", v: fmtNum(scoreAri), note: "Rate efficiency" },
          { l: "RevPAR", v: fmtRpShort(scoreRev), note: `Occ ${fmtPct(scoreOcc)}` },
        ].map((k) => (
          <div key={k.l} className="glass rounded-2xl p-5 relative overflow-hidden">
            <div className="text-[10px] tracking-[0.25em] text-muted-foreground">{k.l}</div>
            <div className="font-display text-2xl mt-2 gold-gradient-text">{k.v}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{k.note}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-2xl mb-4">RevPAR Leaderboard</h2>
        <div className="h-96">
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical">
              <CartesianGrid stroke="oklch(1 0 0 / 5%)" horizontal={false} />
              <XAxis type="number" stroke="oklch(0.6 0.01 270)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e3).toFixed(0)}K`} />
              <YAxis type="category" dataKey="hotel" stroke="oklch(0.7 0.01 270)" fontSize={11} axisLine={false} tickLine={false} width={170} />
              <Tooltip contentStyle={{ background: "oklch(0.16 0.008 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmtRpShort(v)} />
              <Bar dataKey="revpar" radius={[0, 6, 6, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={(isAll ? isOwn(d.hotel) : i === selfIdx) ? "var(--gold)" : "oklch(0.5 0.08 240)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-2xl mb-4">Competitor Statistic with Indexes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[0.25em] text-muted-foreground">
              <th className="text-left py-2">#</th>
              <th className="text-left">Hotel</th>
              <th className="text-right">Rooms</th>
              <th className="text-right">Sold</th>
              <th className="text-right">Occ</th>
              <th className="text-right">ADR</th>
              <th className="text-right">RevPAR</th>
              <th className="text-right">RGI</th>
              <th className="text-right">MPI</th>
              <th className="text-right">ARI</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => {
              const own = isAll ? isOwn(c.hotel) : i === selfIdx;
              return (
              <tr key={c.hotel + i} className={`border-t border-border/40 ${own ? "bg-[var(--gold)]/10" : ""}`}>
                <td className="py-3">{i === 0 ? <Crown className="size-4 text-[var(--gold)]" /> : `#${i + 1}`}</td>
                <td className="font-medium flex items-center gap-2">
                  {c.hotel || NA}
                  {own && <span className="text-[9px] tracking-[0.2em] px-2 py-0.5 rounded-full bg-[var(--gold)] text-[var(--onyx)]">{isAll ? "OWN" : "YOU"}</span>}
                </td>
                <td className="text-right font-mono">{c.rooms_available?.toLocaleString() ?? NA}</td>
                <td className="text-right font-mono">{c.rooms_sold?.toLocaleString() ?? NA}</td>
                <td className="text-right font-mono">{fmtPct(c.occ_pct)}</td>
                <td className="text-right font-mono">{fmtRpShort(c.adr)}</td>
                <td className="text-right font-mono text-gold">{fmtRpShort(c.revpar)}</td>
                <td className={`text-right font-mono ${(c.rgi ?? 0) >= 1 ? "text-emerald" : "text-[oklch(0.7_0.18_25)]"}`}>{fmtNum(c.rgi)}</td>
                <td className={`text-right font-mono ${(c.mpi ?? 0) >= 1 ? "text-emerald" : "text-[oklch(0.7_0.18_25)]"}`}>{fmtNum(c.mpi)}</td>
                <td className={`text-right font-mono ${(c.ari ?? 0) >= 1 ? "text-emerald" : "text-[oklch(0.7_0.18_25)]"}`}>{fmtNum(c.ari)}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
