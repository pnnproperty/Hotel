export const HOTELS = [
  { id: "po-smg", code: "PO", name: "PO Hotel Semarang", city: "Semarang", tier: "Flagship", revenue: 8420000000, occ: 82.4, adr: 1450000, revpar: 1194800, rgi: 118.2, score: 9.4, trend: 4.2 },
  { id: "lk-pdn", code: "LKP", name: "Louis Kienne Pandanaran", city: "Semarang", tier: "Premium", revenue: 4120000000, occ: 78.1, adr: 920000, revpar: 718520, rgi: 108.5, score: 9.1, trend: 2.8 },
  { id: "lk-pmd", code: "LKM", name: "Louis Kienne Pemuda", city: "Semarang", tier: "Premium", revenue: 565475679, occ: 77.55, adr: 443510, revpar: 343963, rgi: 114, score: 9.3, trend: 23.1 },
  { id: "lk-sml", code: "LKS", name: "Louis Kienne Simpang Lima", city: "Semarang", tier: "Premium", revenue: 3980000000, occ: 75.3, adr: 940000, revpar: 707820, rgi: 104.1, score: 8.9, trend: -1.2 },
  { id: "lk-ckr", code: "LKC", name: "Louis Kienne Cikarang", city: "Cikarang", tier: "Business", revenue: 3210000000, occ: 71.8, adr: 780000, revpar: 560040, rgi: 99.6, score: 8.7, trend: 1.4 },
  { id: "lk-sgg", code: "LKG", name: "Louis Kienne Senggigi", city: "Lombok", tier: "Resort", revenue: 5240000000, occ: 79.6, adr: 1280000, revpar: 1018880, rgi: 112.8, score: 9.2, trend: 3.9 },
];

export const KPIS = [
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
];

export const REV_TREND = Array.from({ length: 12 }, (_, i) => {
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i];
  return {
    month: m,
    actual: 2.0 + i * 0.18 + Math.sin(i) * 0.2,
    budget: 1.9 + i * 0.16,
    ly: 1.7 + i * 0.14 + Math.cos(i) * 0.15,
  };
});

export const OCC_HEATMAP = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => ({ d, h, v: Math.round(40 + Math.random() * 55) }))
).flat();

// LK Pemuda · MTD May 2026 · OTA Production share (% of OTA room revenue)
export const OTA_MIX = [
  { name: "Agoda", value: 35, color: "var(--chart-1)" },
  { name: "Traveloka", value: 34, color: "var(--chart-2)" },
  { name: "Other OTA", value: 12, color: "oklch(0.7 0.08 50)" },
  { name: "Booking.com", value: 10, color: "var(--chart-3)" },
  { name: "Tiket.com", value: 9, color: "var(--chart-4)" },
  { name: "Expedia", value: 0, color: "var(--chart-5)" },
];

// LK Pemuda · MTD May 2026 · Segment mix (% of room revenue)
export const SEGMENTS = [
  { name: "OTA", value: 67 },
  { name: "Travel Agent", value: 16 },
  { name: "Corporate", value: 6 },
  { name: "FIT", value: 5 },
  { name: "Walk-In", value: 5 },
  { name: "Government", value: 1 },
  { name: "Direct Web", value: 0 },
  { name: "MICE", value: 0 },
];

// LK Pemuda · MTD May 2026 · Compset indices (×100)
export const COMP_RADAR = [
  { metric: "RevPAR", pollux: 114, compset: 100 },
  { metric: "ADR", pollux: 96, compset: 100 },
  { metric: "Occupancy", pollux: 118, compset: 100 },
  { metric: "RGI", pollux: 114, compset: 100 },
  { metric: "MPI", pollux: 118, compset: 100 },
  { metric: "ARI", pollux: 96, compset: 100 },
];

export const INSIGHTS = [
  { tag: "OUTPERFORM", text: "LK Pemuda MTD room revenue Rp 565.5M vs budget Rp 459.5M — beat budget by +23.1% driven by OTA pickup.", tone: "emerald" },
  { tag: "MARKET LEAD", text: "LK Pemuda MTD RGI 1.14 ranks #1 within Louis Kienne portfolio (Pandanaran 0.89, Simpang Lima 0.91).", tone: "gold" },
  { tag: "CHANNEL", text: "OTA accounts for 67% of LK Pemuda room revenue MTD — Agoda + Traveloka combined 69% of OTA mix; diversify into direct.", tone: "gold" },
  { tag: "ALERT", text: "LK Pemuda F&B revenue MTD Rp 53.1M vs budget Rp 119.4M (-55%) — urgent review of restaurant programming and banquets.", tone: "gold" },
];

// LK Pemuda · Daily Revenue Report 10 May 2026 — Compset (Hotel Competitor Statistic, MTD)
export const LK_PEMUDA_COMPSET_MTD = [
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
];
