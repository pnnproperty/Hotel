// Per-property data views consumed by dashboard layouts.
// Selector in <Shell /> determines which view is rendered.
import { HOTELS } from "./mock";
import lkSL from "./lk_simpanglima_jan2026.json";

export type Kpi = { key: string; label: string; value: string; delta: number; spark: number[]; unit: string };
export type OtaItem = { name: string; value: number };
export type SegItem = { name: string; value: number };
export type RadarItem = { metric: string; pollux: number; compset: number };
export type Insight = { tag: string; text: string; tone: "emerald" | "gold" };
export type Trend = { month: string; actual: number; budget: number; ly: number };
export type CompsetRow = {
  hotel: string; rooms: number; sold: number; occ: number; adr: number;
  revenue: number; revpar: number; rgi: number; mpi: number; ari: number; self?: boolean;
};
export type PropertyView = {
  property: string;
  subtitle: string;
  period: string;
  kpis: Kpi[];
  otaMix: OtaItem[];
  segments: SegItem[];
  compRadar: RadarItem[];
  insights: Insight[];
  revTrend: Trend[];
  compsetMtd: CompsetRow[];
};

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const trendFor = (annual: number): Trend[] =>
  months.map((m, i) => {
    const seasonal = 1 + Math.sin(i / 2) * 0.12 + (i / 11) * 0.18;
    const actual = (annual / 12) * seasonal / 1e9;
    return { month: m, actual: +actual.toFixed(2), budget: +(actual * 0.92).toFixed(2), ly: +(actual * 0.85).toFixed(2) };
  });

// ---------- LK PEMUDA (DRR · 10 May 2026 · MTD) ----------
const LK_PEMUDA: PropertyView = {
  property: "Louis Kienne Pemuda",
  subtitle: "Jl. Pemuda No. 45-51 Pandansari, Semarang Tengah · Daily Revenue Report 10 May 2026",
  period: "MTD May 2026",
  kpis: [
    { key: "rev", label: "Net Revenue MTD", value: "Rp 622.6M", delta: 6.0, spark: [62,124,188,251,315,378,442,505,568,605,622,622], unit: "vs Budget +6.0%" },
    { key: "room", label: "Room Revenue MTD", value: "Rp 565.5M", delta: 23.1, spark: [56,113,170,226,283,339,396,452,509,545,565,565], unit: "vs Budget +23.1%" },
    { key: "occ", label: "Occupancy MTD", value: "77.6%", delta: 17.6, spark: [55,62,68,72,74,75,76,76.5,77,77.3,77.5,77.6], unit: "1,275 / 1,644 rooms" },
    { key: "adr", label: "ADR", value: "Rp 443.5K", delta: 0.4, spark: [395,400,410,420,425,430,435,438,440,442,443,443], unit: "Today Rp 395.7K" },
    { key: "revpar", label: "RevPAR", value: "Rp 344K", delta: 14.0, spark: [216,240,260,280,295,310,320,330,335,340,343,344], unit: "Today Rp 216.9K" },
    { key: "rgi", label: "RGI", value: "1.14", delta: 14.0, spark: [1.05,1.07,1.09,1.10,1.11,1.12,1.13,1.13,1.14,1.14,1.14,1.14], unit: "MPI 1.18 · ARI 0.96" },
    { key: "ytd", label: "YTD Revenue", value: "Rp 7.20B", delta: 10.7, spark: [1.2,2.1,3.0,3.9,4.7,5.4,6.0,6.5,6.8,7.0,7.15,7.20], unit: "vs Budget +10.7%" },
    { key: "ytd_room", label: "YTD Room Rev", value: "Rp 6.02B", delta: 19.3, spark: [1.0,1.8,2.5,3.2,3.9,4.5,5.0,5.4,5.7,5.9,6.0,6.02], unit: "vs Budget +19.3%" },
    { key: "fnb", label: "F&B Revenue MTD", value: "Rp 53.1M", delta: -55.4, spark: [60,55,52,50,48,50,51,52,52,52.5,53,53.1], unit: "vs Budget -55.4%" },
    { key: "comp_rank", label: "Compset Rank", value: "#4 / 10", delta: 0, spark: [4,4,4,4,4,4,4,4,4,4,4,4], unit: "Above LK group avg" },
  ],
  otaMix: [
    { name: "Agoda", value: 35 },
    { name: "Traveloka", value: 34 },
    { name: "Other OTA", value: 12 },
    { name: "Booking.com", value: 10 },
    { name: "Tiket.com", value: 9 },
    { name: "Expedia", value: 0 },
  ],
  segments: [
    { name: "OTA", value: 67 },
    { name: "Travel Agent", value: 16 },
    { name: "Corporate", value: 6 },
    { name: "FIT", value: 5 },
    { name: "Walk-In", value: 5 },
    { name: "Government", value: 1 },
    { name: "Direct Web", value: 0 },
  ],
  compRadar: [
    { metric: "RevPAR", pollux: 114, compset: 100 },
    { metric: "ADR", pollux: 96, compset: 100 },
    { metric: "Occupancy", pollux: 118, compset: 100 },
    { metric: "RGI", pollux: 114, compset: 100 },
    { metric: "MPI", pollux: 118, compset: 100 },
    { metric: "ARI", pollux: 96, compset: 100 },
  ],
  insights: [
    { tag: "OUTPERFORM", text: "Room revenue Rp 565.5M MTD vs budget Rp 459.5M — beat budget by +23.1% driven by OTA pickup at 77.6% occupancy.", tone: "emerald" },
    { tag: "MARKET LEAD", text: "RGI 1.14 ranks #1 within Louis Kienne portfolio (Pandanaran 0.89, Simpang Lima 0.91) and #4 RevPAR in Semarang Central compset.", tone: "gold" },
    { tag: "CHANNEL", text: "OTA 67% of room revenue MTD — Agoda + Traveloka combined 69% of OTA mix. Diversification into direct/corporate recommended.", tone: "gold" },
    { tag: "ALERT", text: "F&B revenue MTD Rp 53.1M vs budget Rp 119.4M (-55%) — review restaurant programming, breakfast capture and banquet pipeline.", tone: "gold" },
  ],
  revTrend: trendFor(7204625086 * 12 / 5),
  compsetMtd: [
    { hotel: "LK Pemuda", rooms: 1644, sold: 1275, occ: 77.55, adr: 443510, revenue: 565475680, revpar: 343963, rgi: 1.14, mpi: 1.18, ari: 0.96, self: true },
    { hotel: "LK Pandanaran", rooms: 1960, sold: 1190, occ: 60.71, adr: 441919, revenue: 525883134, revpar: 268308, rgi: 0.89, mpi: 0.92, ari: 0.96 },
    { hotel: "LK Simpang Lima", rooms: 1510, sold: 926, occ: 61.32, adr: 450447, revenue: 417113621, revpar: 276234, rgi: 0.91, mpi: 0.93, ari: 0.98 },
    { hotel: "Grandhika", rooms: 1340, sold: 1100, occ: 82.09, adr: 451261, revenue: 496386862, revpar: 370438, rgi: 1.23, mpi: 1.25, ari: 0.98 },
    { hotel: "Horison Ultima Sentraland", rooms: 1670, sold: 727, occ: 43.53, adr: 553346, revenue: 402282353, revpar: 240888, rgi: 0.80, mpi: 0.66, ari: 1.20 },
    { hotel: "Grand Arkenso", rooms: 1650, sold: 812, occ: 49.21, adr: 344362, revenue: 279621904, revpar: 169468, rgi: 0.56, mpi: 0.75, ari: 0.75 },
    { hotel: "Santika Premiere", rooms: 1250, sold: 897, occ: 71.76, adr: 578392, revenue: 518817429, revpar: 415054, rgi: 1.37, mpi: 1.09, ari: 1.26 },
    { hotel: "Metro Park View", rooms: 890, sold: 858, occ: 96.40, adr: 485732, revenue: 416757686, revpar: 468267, rgi: 1.55, mpi: 1.47, ari: 1.06 },
    { hotel: "Quest Hotel", rooms: 1395, sold: 809, occ: 57.99, adr: 425249, revenue: 344026485, revpar: 246614, rgi: 0.82, mpi: 0.88, ari: 0.92 },
    { hotel: "Chanti Hotel", rooms: 954, sold: 772, occ: 80.92, adr: 442205, revenue: 341382419, revpar: 357843, rgi: 1.18, mpi: 1.23, ari: 0.96 },
  ],
};

// ---------- LK SIMPANG LIMA (Jan 2026 Consolidated) ----------
const sl = (lkSL as any).kpi_summary;
const slPL = (lkSL as any).profit_and_loss;
const LK_SL: PropertyView = {
  property: "Louis Kienne Simpang Lima",
  subtitle: `${(lkSL as any).meta.hotel_address} · ${(lkSL as any).meta.period}`,
  period: "January 2026",
  kpis: [
    { key: "rev", label: "Total Revenue", value: `Rp ${(sl.total_revenue / 1e9).toFixed(2)}B`, delta: sl.revenue_vs_budget_pct - 100, spark: [80,160,260,360,470,580,700,830,960,1100,1230,1321], unit: `vs Budget ${(sl.revenue_vs_budget_pct).toFixed(1)}%` },
    { key: "gop", label: "GOP", value: `Rp ${(sl.gross_operating_profit / 1e6).toFixed(0)}M`, delta: sl.gop_margin_pct, spark: [20,50,90,130,180,230,290,350,410,470,520,560], unit: `Margin ${sl.gop_margin_pct.toFixed(1)}%` },
    { key: "ni", label: "Net Income", value: `Rp ${(sl.net_income / 1e6).toFixed(0)}M`, delta: sl.net_income_margin_pct, spark: [10,30,60,90,130,170,210,260,310,360,400,440], unit: `Margin ${sl.net_income_margin_pct.toFixed(1)}%` },
    { key: "occ", label: "Occupancy", value: `${sl.occupancy_pct.toFixed(1)}%`, delta: 3.2, spark: [38,42,45,48,49,50,51,52,52.5,53,53.2,53.3], unit: `${sl.rooms_occupied.toLocaleString()} / ${sl.rooms_available.toLocaleString()} rooms` },
    { key: "adr", label: "ADR", value: `Rp ${(sl.adr / 1000).toFixed(0)}K`, delta: 1.4, spark: [460,470,480,485,490,492,494,495,495.5,496,496.5,497], unit: "Stable above budget" },
    { key: "revpar", label: "RevPAR", value: `Rp ${(sl.revpar / 1000).toFixed(0)}K`, delta: 4.6, spark: [200,220,235,245,250,255,258,260,262,263,264,265], unit: `GOPPAR Rp ${(sl.goppar / 1000).toFixed(0)}K` },
    { key: "payroll", label: "Payroll", value: `Rp ${(sl.total_payroll / 1e6).toFixed(0)}M`, delta: 0, spark: [50,100,150,200,240,260,270,275,278,280,281,282], unit: `${sl.payroll_pct_revenue.toFixed(1)}% of revenue` },
    { key: "cash", label: "Cash & Bank", value: `Rp ${(sl.cash_and_bank / 1e6).toFixed(0)}M`, delta: 2.1, spark: [400,420,440,460,480,490,495,500,505,510,512,515], unit: "Healthy liquidity" },
    { key: "ar", label: "AR Outstanding", value: `Rp ${(sl.total_ar_outstanding / 1e6).toFixed(0)}M`, delta: -sl.ar_overdue_pct, spark: [300,310,315,320,325,330,332,334,335,336,337,338], unit: `Overdue ${sl.ar_overdue_pct.toFixed(1)}%` },
    { key: "ap", label: "AP Outstanding", value: `Rp ${(sl.total_ap_outstanding / 1e6).toFixed(0)}M`, delta: -sl.ap_overdue_90_pct, spark: [350,360,370,380,390,395,398,400,402,403,404,405], unit: `>90d ${sl.ap_overdue_90_pct.toFixed(1)}%` },
  ],
  otaMix: [
    { name: "Agoda", value: 32 },
    { name: "Traveloka", value: 28 },
    { name: "Booking.com", value: 18 },
    { name: "Tiket.com", value: 12 },
    { name: "Other OTA", value: 7 },
    { name: "Expedia", value: 3 },
  ],
  segments: (slPL?.revenue?.mix_chart || []).map((m: any) => ({ name: m.segment, value: m.pct })),
  compRadar: [
    { metric: "RevPAR", pollux: 91, compset: 100 },
    { metric: "ADR", pollux: 98, compset: 100 },
    { metric: "Occupancy", pollux: 93, compset: 100 },
    { metric: "RGI", pollux: 91, compset: 100 },
    { metric: "MPI", pollux: 93, compset: 100 },
    { metric: "ARI", pollux: 98, compset: 100 },
  ],
  insights: [
    { tag: "FINANCIAL", text: `Revenue Rp ${(sl.total_revenue / 1e9).toFixed(2)}B at ${sl.revenue_vs_budget_pct.toFixed(1)}% of budget · GOP margin ${sl.gop_margin_pct.toFixed(1)}%.`, tone: "gold" },
    { tag: "OCCUPANCY", text: `Occupancy ${sl.occupancy_pct.toFixed(1)}% with ADR Rp ${(sl.adr / 1000).toFixed(0)}K — stable but trailing LK Pemuda's 77.55%.`, tone: "gold" },
    { tag: "AR", text: `AR outstanding Rp ${(sl.total_ar_outstanding / 1e6).toFixed(0)}M · overdue ${sl.ar_overdue_pct.toFixed(1)}% — collection focus required.`, tone: "gold" },
    { tag: "AP", text: `AP outstanding Rp ${(sl.total_ap_outstanding / 1e6).toFixed(0)}M with ${sl.ap_overdue_90_pct.toFixed(1)}% over 90 days — vendor relations risk.`, tone: "gold" },
  ],
  revTrend: trendFor(sl.total_revenue * 12),
  compsetMtd: [
    { hotel: "LK Simpang Lima", rooms: 4382, sold: 2334, occ: 53.26, adr: sl.adr, revenue: sl.total_revenue * 0.79, revpar: sl.revpar, rgi: 0.91, mpi: 0.93, ari: 0.98, self: true },
    { hotel: "LK Pemuda", rooms: 5146, sold: 3990, occ: 77.55, adr: 443510, revenue: 1769727000, revpar: 343963, rgi: 1.14, mpi: 1.18, ari: 0.96 },
    { hotel: "LK Pandanaran", rooms: 6076, sold: 3689, occ: 60.71, adr: 441919, revenue: 1630238000, revpar: 268308, rgi: 0.89, mpi: 0.92, ari: 0.96 },
    { hotel: "Grandhika", rooms: 4154, sold: 3410, occ: 82.09, adr: 451261, revenue: 1538799000, revpar: 370438, rgi: 1.23, mpi: 1.25, ari: 0.98 },
    { hotel: "Santika Premiere", rooms: 3875, sold: 2781, occ: 71.76, adr: 578392, revenue: 1608334000, revpar: 415054, rgi: 1.37, mpi: 1.09, ari: 1.26 },
    { hotel: "Metro Park View", rooms: 2759, sold: 2660, occ: 96.40, adr: 485732, revenue: 1291948000, revpar: 468267, rgi: 1.55, mpi: 1.47, ari: 1.06 },
  ],
};

// ---------- ALL HOTELS (portfolio aggregate) ----------
const ALL_HOTELS: PropertyView = {
  property: "All Hotels",
  subtitle: "Portfolio Aggregate · 6 properties across Indonesia",
  period: "MTD May 2026",
  kpis: [
    { key: "rev", label: "Total Revenue", value: "Rp 29.6B", delta: 12.4, spark: [12,14,13,16,18,17,20,22,21,24,26,29], unit: "vs budget +8.2%" },
    { key: "gop", label: "GOP", value: "Rp 14.1B", delta: 9.8, spark: [6,7,7,8,9,9,10,11,11,12,13,14], unit: "Margin 47.6%" },
    { key: "occ", label: "Occupancy", value: "78.7%", delta: 3.1, spark: [70,72,71,74,75,76,77,78,78,79,79,78], unit: "vs LY +4.4pp" },
    { key: "adr", label: "ADR", value: "Rp 1.04M", delta: 6.7, spark: [820,860,880,910,940,960,980,990,1010,1020,1030,1040], unit: "Rate index 114" },
    { key: "revpar", label: "RevPAR", value: "Rp 824K", delta: 9.1, spark: [600,620,640,680,700,720,740,760,780,800,810,824], unit: "Best in comp set" },
    { key: "goppar", label: "GOPPAR", value: "Rp 394K", delta: 7.4, spark: [280,290,310,320,340,350,360,370,380,385,390,394], unit: "Target 380" },
    { key: "rgi", label: "RGI", value: "112.4", delta: 2.6, spark: [104,105,106,108,109,110,110,111,112,112,113,112], unit: "Market leader" },
    { key: "score", label: "Review Score", value: "9.16", delta: 0.8, spark: [8.7,8.8,8.8,8.9,9.0,9.0,9.05,9.1,9.1,9.12,9.14,9.16], unit: "Across 6 hotels" },
    { key: "social", label: "Social Engagement", value: "1.42M", delta: 18.3, spark: [800,860,900,950,1000,1080,1140,1200,1260,1320,1380,1420], unit: "IG + TikTok" },
    { key: "forecast", label: "Forecast Accuracy", value: "96.8%", delta: 1.2, spark: [92,93,94,94,95,95,96,96,96,96.5,96.7,96.8], unit: "Last 30 days" },
  ],
  otaMix: [
    { name: "Agoda", value: 28 },
    { name: "Traveloka", value: 24 },
    { name: "Booking.com", value: 19 },
    { name: "Tiket.com", value: 13 },
    { name: "Expedia", value: 9 },
    { name: "Ctrip", value: 7 },
  ],
  segments: [
    { name: "OTA", value: 31 },
    { name: "Corporate", value: 22 },
    { name: "Government", value: 14 },
    { name: "FIT", value: 12 },
    { name: "Group", value: 8 },
    { name: "MICE", value: 7 },
    { name: "Walk-In", value: 4 },
    { name: "Long Stay", value: 2 },
  ],
  compRadar: [
    { metric: "RevPAR", pollux: 118, compset: 100 },
    { metric: "ADR", pollux: 114, compset: 100 },
    { metric: "Occupancy", pollux: 109, compset: 100 },
    { metric: "RGI", pollux: 112, compset: 100 },
    { metric: "MPI", pollux: 108, compset: 100 },
    { metric: "ARI", pollux: 115, compset: 100 },
  ],
  insights: [
    { tag: "OUTPERFORM", text: "PO Hotel Semarang outperformed budget by 14.2% — driven by MICE pickup and weekend leisure mix.", tone: "emerald" },
    { tag: "MARKET LEAD", text: "LK Pemuda achieved the highest RGI (1.14) MTD May, ranking #1 within the Louis Kienne portfolio.", tone: "gold" },
    { tag: "CHANNEL", text: "Traveloka contribution increased 21% week-over-week — recommend reallocating 8% spend from metasearch.", tone: "emerald" },
    { tag: "ALERT", text: "LK Simpang Lima F&B and occupancy trailing portfolio — pricing & banquet review suggested.", tone: "gold" },
  ],
  revTrend: months.map((m, i) => ({
    month: m,
    actual: +(2.0 + i * 0.18 + Math.sin(i) * 0.2).toFixed(2),
    budget: +(1.9 + i * 0.16).toFixed(2),
    ly: +(1.7 + i * 0.14 + Math.cos(i) * 0.15).toFixed(2),
  })),
  compsetMtd: LK_PEMUDA.compsetMtd,
};

// ---------- Generic fallback for properties without rich data ----------
function genericFor(name: string): PropertyView {
  const h = HOTELS.find((x) => x.name === name);
  if (!h) return ALL_HOTELS;
  return {
    property: h.name,
    subtitle: `${h.city} · ${h.tier} · Operational dashboard`,
    period: "MTD May 2026",
    kpis: [
      { key: "rev", label: "Revenue MTD", value: `Rp ${(h.revenue / 1e9).toFixed(2)}B`, delta: h.trend, spark: [60,70,80,90,100,110,120,130,140,150,160,170], unit: `Tier ${h.tier}` },
      { key: "occ", label: "Occupancy", value: `${h.occ.toFixed(1)}%`, delta: 2.1, spark: [65,68,70,72,74,75,76,77,77.5,78,78.5,h.occ], unit: "vs LY +2.1pp" },
      { key: "adr", label: "ADR", value: `Rp ${(h.adr / 1000).toFixed(0)}K`, delta: 3.4, spark: [800,820,840,860,880,890,895,900,910,920,930,h.adr/1000], unit: "Rate stable" },
      { key: "revpar", label: "RevPAR", value: `Rp ${(h.revpar / 1000).toFixed(0)}K`, delta: 5.6, spark: [500,540,580,620,660,690,710,730,740,745,748,h.revpar/1000], unit: "Outperforming" },
      { key: "rgi", label: "RGI", value: (h.rgi / 100).toFixed(2), delta: 1.2, spark: [1.0,1.02,1.04,1.06,1.07,1.08,1.09,1.10,1.10,1.11,1.12,h.rgi/100], unit: "Market position" },
      { key: "score", label: "Review Score", value: h.score.toFixed(2), delta: 0.4, spark: [8.5,8.6,8.7,8.8,8.9,9.0,9.0,9.05,9.1,9.1,9.15,h.score], unit: "Guest sentiment" },
    ],
    otaMix: ALL_HOTELS.otaMix,
    segments: ALL_HOTELS.segments,
    compRadar: ALL_HOTELS.compRadar.map((r) => ({ ...r, pollux: Math.round(95 + (h.rgi - 100) + Math.random() * 8) })),
    insights: [
      { tag: "PROPERTY", text: `${h.name} MTD revenue Rp ${(h.revenue / 1e9).toFixed(2)}B with occupancy ${h.occ.toFixed(1)}% and RGI ${(h.rgi / 100).toFixed(2)}.`, tone: "gold" },
      { tag: "TREND", text: `Performance trend ${h.trend >= 0 ? "+" : ""}${h.trend.toFixed(1)}% — ${h.trend >= 0 ? "above" : "below"} pace.`, tone: h.trend >= 0 ? "emerald" : "gold" },
    ],
    revTrend: trendFor(h.revenue * 12),
    compsetMtd: ALL_HOTELS.compsetMtd,
  };
}

export function getPropertyView(name: string): PropertyView {
  if (name === "All Hotels") return ALL_HOTELS;
  if (name === "Louis Kienne Pemuda") return LK_PEMUDA;
  if (name === "Louis Kienne Simpang Lima") return LK_SL;
  return genericFor(name);
}
