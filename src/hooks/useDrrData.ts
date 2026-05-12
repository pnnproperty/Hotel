import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type KpiBlock = {
  today_actual?: number;
  today_budget?: number;
  mtd_actual?: number;
  mtd_budget?: number;
  ytd_actual?: number;
  ytd_budget?: number;
};

export type CompsetRow = {
  hotel: string;
  rooms_available?: number;
  rooms_sold?: number;
  occ_pct?: number;
  adr?: number;
  room_revenue?: number;
  revpar?: number;
  rgi?: number;
  mpi?: number;
  ari?: number;
};

export type SegmentRow = {
  segment: string;
  mtd_rooms?: number;
  mtd_revenue?: number;
  mtd_arr?: number;
  mtd_pct?: number;
};

export type OtaRow = {
  agent: string;
  mtd_rooms?: number;
  mtd_lodging?: number;
  mtd_arr?: number;
  mtd_pct?: number;
  mtd_pax?: number;
};

export type DailyRow = {
  date?: string;
  room_revenue?: number;
  fnb_revenue?: number;
  net_revenue?: number;
  occupancy?: number;
  occ_pct?: number;
  rooms_sold?: number;
  adr?: number;
  revpar?: number;
};

export type DRR = {
  id: string;
  property: string;
  report_date: string;
  source_file?: string;
  created_at?: string;
  room_revenue: KpiBlock;
  fnb_revenue: KpiBlock;
  net_revenue: KpiBlock;
  occupancy: KpiBlock;
  adr: KpiBlock;
  revpar: KpiBlock;
  compset_mtd: CompsetRow[];
  compset_today: CompsetRow[];
  segments: SegmentRow[];
  ota_production: OtaRow[];
  daily_breakdown: DailyRow[];
};

const SELECT =
  "id, property, report_date, source_file, created_at, room_revenue, fnb_revenue, net_revenue, occupancy, adr, revpar, compset_mtd, compset_today, segments, ota_production, daily_breakdown";

/** All DRR rows, newest first. Cached at module level for cheap re-use across pages. */
let cache: DRR[] | null = null;
let inflight: Promise<DRR[]> | null = null;
const subs = new Set<() => void>();

async function fetchAll(): Promise<DRR[]> {
  const { data, error } = await supabase
    .from("drr_reports")
    .select(SELECT)
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  cache = (data ?? []) as unknown as DRR[];
  subs.forEach((s) => s());
  return cache;
}

export function refreshDrr() {
  inflight = fetchAll();
  return inflight;
}

export function useDrrAll() {
  const [, force] = useState(0);
  const [loading, setLoading] = useState(cache === null);
  useEffect(() => {
    const sub = () => force((x) => x + 1);
    subs.add(sub);
    if (cache === null && !inflight) {
      inflight = fetchAll();
    }
    if (inflight) {
      inflight.finally(() => setLoading(false));
    }
    return () => {
      subs.delete(sub);
    };
  }, []);
  return { rows: cache ?? [], loading };
}

/** Match a DB property name against the user-selected property (case-insensitive contains either way). */
export function matchesProperty(dbName: string, selected: string): boolean {
  if (!selected || selected === "All Hotels") return true;
  const a = canonicalProperty(dbName);
  const b = canonicalProperty(selected);
  return a.includes(b) || b.includes(a);
}

/** Canonicalize property name: lowercase, collapse whitespace, drop known sub-brand tokens
 *  (e.g. "Chadstone") so variants like "Louis Kienne Chadstone Cikarang" map to
 *  "Louis Kienne Cikarang". */
export function canonicalProperty(name: string): string {
  const ALIAS_DROP = ["chadstone"];
  let s = (name || "").toLowerCase().replace(/\s+/g, " ").trim();
  // Strip any parenthetical suffix, e.g. "Po Hotel Semarang (Semarang)" -> "po hotel semarang"
  s = s.replace(/\s*\([^)]*\)\s*/g, " ");
  for (const token of ALIAS_DROP) {
    s = s.replace(new RegExp(`\\b${token}\\b`, "g"), " ");
  }
  return s.replace(/\s+/g, " ").trim();
}

/** Canonical display names — single source of truth for the 6 hotels.
 *  Maps the canonical (lowercased, alias-stripped) key to its preferred display label. */
const DISPLAY_NAMES: Record<string, string> = {
  "louis kienne cikarang": "Louis Kienne Cikarang",
  "louis kienne pandanaran": "Louis Kienne Pandanaran",
  "louis kienne pemuda": "Louis Kienne Pemuda",
  "louis kienne resort senggigi": "Louis Kienne Resort Senggigi",
  "louis kienne simpang lima": "Louis Kienne Simpang Lima",
  "po hotel semarang": "Po Hotel Semarang",
};

/** Map any DB property variant to its canonical display name. */
export function displayProperty(name: string): string {
  const k = canonicalProperty(name);
  return DISPLAY_NAMES[k] ?? prettifyName(name);
}

/** Distinct property labels from DB, prettified. Returns canonical display per normalized key. */
export function distinctProperties(rows: DRR[]): string[] {
  const map = new Map<string, string>();
  for (const r of rows) {
    const key = canonicalProperty(r.property);
    if (!map.has(key)) map.set(key, DISPLAY_NAMES[key] ?? prettifyName(r.property));
  }
  return Array.from(map.values()).sort();
}

function prettifyName(name: string): string {
  // Convert ALL CAPS to Title Case while preserving mixed-case input
  if (name === name.toUpperCase()) {
    return name
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return name;
}

export function useDrrFiltered(selected: string) {
  const { rows, loading } = useDrrAll();
  const filtered = useMemo(
    () => rows.filter((r) => matchesProperty(r.property, selected)),
    [rows, selected],
  );
  // Latest DRR per normalized property (one row each).
  const latestPerProperty = useMemo(() => {
    const seen = new Map<string, DRR>();
    for (const r of filtered) {
      const k = canonicalProperty(r.property);
      if (!seen.has(k)) seen.set(k, r);
    }
    return Array.from(seen.values());
  }, [filtered]);
  const latest = latestPerProperty[0] ?? null;
  return { rows: filtered, latest, latestPerProperty, loading, allRows: rows };
}

// ---------- Formatters ----------
export const NA = "N/A";
export function fmtRpShort(n?: number | null): string {
  if (n == null || !Number.isFinite(Number(n)) || Number(n) === 0) return NA;
  const v = Number(n);
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `Rp ${(v / 1e3).toFixed(0)}K`;
  return `Rp ${v.toFixed(0)}`;
}
export function fmtPct(n?: number | null, digits = 1): string {
  if (n == null || !Number.isFinite(Number(n))) return NA;
  return `${Number(n).toFixed(digits)}%`;
}
export function fmtNum(n?: number | null, digits = 2): string {
  if (n == null || !Number.isFinite(Number(n))) return NA;
  return Number(n).toFixed(digits);
}
export function variancePct(actual?: number, budget?: number): number | null {
  const a = Number(actual);
  const b = Number(budget);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return ((a - b) / b) * 100;
}

// ---------- Aggregations ----------
export function sumKpi(rows: DRR[], key: keyof Pick<DRR, "room_revenue" | "fnb_revenue" | "net_revenue">, period: "today_actual" | "mtd_actual" | "ytd_actual" | "today_budget" | "mtd_budget" | "ytd_budget"): number | null {
  let any = false;
  let sum = 0;
  for (const r of rows) {
    const v = (r[key] as KpiBlock)?.[period];
    if (v != null && Number.isFinite(Number(v))) {
      any = true;
      sum += Number(v);
    }
  }
  return any ? sum : null;
}

export function avgKpi(rows: DRR[], key: keyof Pick<DRR, "occupancy" | "adr" | "revpar">, period: "today_actual" | "mtd_actual" | "today_budget" | "mtd_budget"): number | null {
  let any = false;
  let sum = 0;
  let count = 0;
  for (const r of rows) {
    const v = (r[key] as KpiBlock)?.[period];
    if (v != null && Number.isFinite(Number(v))) {
      any = true;
      sum += Number(v);
      count++;
    }
  }
  return any && count > 0 ? sum / count : null;
}