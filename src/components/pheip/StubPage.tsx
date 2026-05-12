import { PageHeader } from "./PageHeader";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useSelectedProperty } from "@/store/property";

export function StubPage({
  eyebrow, title, subtitle, modules, Icon,
}: {
  eyebrow: string; title: string; subtitle: string;
  modules: { label: string; value: string; note?: string }[];
  Icon?: LucideIcon;
}) {
  const selected = useSelectedProperty();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`${eyebrow} · ${selected.toUpperCase()}`} title={title} subtitle={subtitle} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modules.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5 kpi-glow"
          >
            <div className="text-[10px] tracking-[0.25em] text-muted-foreground">{m.label}</div>
            <div className="font-display text-3xl mt-2 gold-gradient-text">N/A</div>
            <div className="text-xs text-muted-foreground mt-1">No data source connected</div>
          </motion.div>
        ))}
      </div>
      <div className="glass rounded-2xl p-10 text-center">
        {Icon && <Icon className="size-10 text-gold mx-auto mb-4" />}
        <div className="text-[10px] tracking-[0.3em] text-muted-foreground">PHEIP MODULE</div>
        <h2 className="font-display text-3xl mt-2 gold-gradient-text">No data imported</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
          This module currently has no data source connected for <strong>{selected}</strong>. Metrics will populate once relevant reports are uploaded via Data Ingestion.
        </p>
      </div>
    </div>
  );
}
