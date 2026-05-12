export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <div className="text-[11px] tracking-[0.3em] text-gold">{eyebrow}</div>
      <h1 className="font-display text-4xl mt-2 gold-gradient-text">{title}</h1>
      {subtitle && <p className="text-muted-foreground text-sm mt-1 max-w-2xl">{subtitle}</p>}
    </div>
  );
}
