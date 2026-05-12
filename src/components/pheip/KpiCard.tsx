import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

type Props = {
  label: string;
  value: string;
  delta: number;
  spark: number[];
  unit?: string;
  accent?: "gold" | "emerald";
};

export function KpiCard({ label, value, delta, spark, unit, accent = "gold" }: Props) {
  const data = spark.map((v, i) => ({ i, v }));
  const positive = delta >= 0;
  const color = accent === "gold" ? "var(--gold)" : "var(--emerald)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
      className="relative glass rounded-2xl p-5 overflow-hidden kpi-glow transition-shadow"
    >
      <div className="absolute -top-12 -right-12 size-32 rounded-full opacity-30 blur-3xl" style={{ background: color }} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase text-orange-100">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold gold-gradient-text">{value}</div>
        </div>
        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${positive ? "text-emerald bg-[oklch(0.72_0.17_162/12%)]" : "text-destructive bg-[oklch(0.65_0.22_25/12%)]"}`}>
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(delta).toFixed(1)}%
        </div>
      </div>
      <div className="h-12 mt-3 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`g-${label}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#g-${label})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {unit && <div className="text-[11px] text-muted-foreground mt-1">{unit}</div>}
    </motion.div>
  );
}
