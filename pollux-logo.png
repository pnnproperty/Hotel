import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, BarChart3, BedDouble, Globe2, Trophy, PieChart, Star,
  Hash, CalendarHeart, LineChart, Wrench, Users, Leaf, Sparkles, Settings,
  Search, Bell, ChevronDown, FileUp
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useSelectedProperty, setSelectedProperty } from "@/store/property";
import { PolluxMallAgent } from "./PolluxMallAgent";
import polluxLogo from "@/assets/pollux-logo.png";
import { useDrrAll, distinctProperties } from "@/hooks/useDrrData";
import { TickerBar } from "./TickerBar";

const NAV = [
  { to: "/", label: "Executive Overview", icon: LayoutDashboard },
  { to: "/finance", label: "Finance", icon: BarChart3 },
  { to: "/occupancy", label: "Occupancy", icon: BedDouble },
  { to: "/ota", label: "OTA Production", icon: Globe2 },
  { to: "/compset", label: "Comp Set", icon: Trophy },
  { to: "/segment", label: "Segment Analysis", icon: PieChart },
  { to: "/reviews", label: "Guest Reviews", icon: Star },
  { to: "/social", label: "Social Media", icon: Hash },
  { to: "/events", label: "Events & Banquet", icon: CalendarHeart },
  { to: "/forecast", label: "Forecast & Budget", icon: LineChart },
  { to: "/engineering", label: "Engineering", icon: Wrench },
  { to: "/hr", label: "Human Capital", icon: Users },
  { to: "/esg", label: "ESG", icon: Leaf },
  { to: "/ai", label: "AI Assistant", icon: Sparkles },
  { to: "/ingestion", label: "Data Ingestion", icon: FileUp },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Shell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const hotel = useSelectedProperty();
  const [hotelOpen, setHotelOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const { rows } = useDrrAll();
  const properties = useMemo(() => distinctProperties(rows), [rows]);
  const filteredNav = useMemo(() => {
    const q = navQuery.trim().toLowerCase();
    if (!q) return NAV;
    return NAV.filter((n) => n.label.toLowerCase().includes(q));
  }, [navQuery]);
  const filteredHotels = useMemo<string[]>(() => {
    const q = navQuery.trim().toLowerCase();
    const list = ["All Hotels", ...properties];
    if (!q) return [];
    return list.filter((h) => h.toLowerCase().includes(q));
  }, [navQuery, properties]);

  return (
    <div className="min-h-screen flex text-foreground">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 border-r border-border/60 bg-sidebar/80 backdrop-blur-xl sticky top-0 h-screen flex flex-col">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="size-10 shrink-0"
              style={{
                background: "var(--gradient-gold)",
                WebkitMaskImage: `url(${polluxLogo})`,
                maskImage: `url(${polluxLogo})`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                filter: "drop-shadow(var(--glow-gold))",
              }}
              aria-label="Pollux"
            />
            <div>
              <div className="font-display text-lg leading-tight gold-gradient-text font-semibold">POLLUX</div>
              <div className="text-[10px] tracking-[0.3em] text-muted-foreground">HOTELS</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-0.5">
          {filteredNav.map((n) => {
            const active = path === n.to || (n.to !== "/" && path.startsWith(n.to));
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to as never}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-[oklch(1_0_0/4%)] text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/2%)]"
                }`}
              >
                <span className={`relative size-7 grid place-items-center rounded-md ${active ? "bg-[var(--gradient-gold)] text-[var(--onyx)]" : "bg-[oklch(1_0_0/3%)]"}`}>
                  <Icon className="size-3.5" />
                  {active && <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-[var(--gold)] shadow-[var(--glow-gold)]" />}
                </span>
                <span className="tracking-wide">{n.label}</span>
              </Link>
            );
          })}
          {filteredNav.length === 0 && (
            <div className="text-xs text-muted-foreground px-3 py-2">No menu matches "{navQuery}"</div>
          )}
        </nav>
        <div className="p-4 m-3 rounded-xl glass">
          <div className="text-[10px] tracking-[0.25em] text-muted-foreground">SYSTEM</div>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="size-2 rounded-full bg-emerald shadow-[0_0_10px_var(--emerald)] animate-pulse" />
            <span>Online</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Last sync · 2 min ago</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[oklch(0.09_0.005_270/70%)] border-b border-border/60">
          <div className="flex items-center gap-4 px-8 h-16">
            <div className="text-xs tracking-[0.3em] text-muted-foreground">EXECUTIVE INTELLIGENCE</div>
            <div className="h-4 w-px bg-border" />
            <div className="text-sm text-foreground/80">Monday · 11 May 2026</div>

            <div className="ml-6 flex-1 max-w-md relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={navQuery}
                onChange={(e) => setNavQuery(e.target.value)}
                placeholder="Search KPIs, hotels, segments…"
                className="w-full bg-[oklch(1_0_0/3%)] border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]/60 transition"
              />
              {navQuery && filteredHotels.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 glass-strong rounded-xl p-1.5 z-50 max-h-64 overflow-y-auto">
                  <div className="text-[9px] tracking-[0.3em] text-muted-foreground px-3 py-1.5">HOTEL MATCHES</div>
                  {filteredHotels.map((h) => (
                    <button
                      key={h}
                      onClick={() => { setSelectedProperty(h); setNavQuery(""); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[oklch(1_0_0/4%)] ${hotel === h ? "text-gold" : ""}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setHotelOpen(!hotelOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg glass text-sm hover:border-[var(--gold)]/40">
                <span className="size-2 rounded-full bg-[var(--gold)]" />
                {hotel}
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
              {hotelOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-2 w-72 glass-strong rounded-xl p-2 z-50 max-h-96 overflow-y-auto">
                  <div className="text-[9px] tracking-[0.3em] text-muted-foreground px-3 py-1.5">PROPERTIES WITH IMPORTED DATA</div>
                  {["All Hotels", ...properties].map((n) => (
                    <button key={n} onClick={() => { setSelectedProperty(n); setHotelOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[oklch(1_0_0/4%)] ${hotel === n ? "text-gold" : ""}`}>
                      {n}
                    </button>
                  ))}
                  {properties.length === 0 && (
                    <div className="text-xs text-muted-foreground px-3 py-3">No DRR uploads yet. Use Data Ingestion to import a Daily Revenue Report.</div>
                  )}
                </motion.div>
              )}
            </div>

            <button className="size-9 grid place-items-center rounded-lg glass hover:border-[var(--gold)]/40 relative">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[var(--gold)]" />
            </button>

            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-border">
              <div className="size-9 rounded-full bg-[var(--gradient-gold)] grid place-items-center text-[var(--onyx)] font-semibold text-sm">NP</div>
              <div className="text-xs leading-tight">
                <div>Nico Po</div>
                <div className="text-muted-foreground">Group CEO</div>
              </div>
            </div>
          </div>
        </header>

        <TickerBar />

        <main className="px-8 py-8">
          <Outlet />
        </main>
      </div>

      {/* AI Floating Button */}
      <PolluxMallAgent />
    </div>
  );
}
