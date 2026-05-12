import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FileUp, Loader2, CheckCircle2, AlertCircle, Database, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/pheip/PageHeader";
import { displayProperty } from "@/hooks/useDrrData";

export const Route = createFileRoute("/ingestion")({ component: IngestionPage });

type ParsedDRR = {
  property: string;
  report_date: string;
  room_revenue: Record<string, number>;
  fnb_revenue: Record<string, number>;
  net_revenue: Record<string, number>;
  occupancy: Record<string, number>;
  adr: Record<string, number>;
  revpar: Record<string, number>;
  compset_today: any[];
  compset_mtd: any[];
  segments: any[];
  ota_production: any[];
  daily_breakdown: any[];
};

const fmtRp = (n: number) => "Rp " + (n || 0).toLocaleString("id-ID");
const fmtPct = (n: number) => (n || 0).toFixed(2) + "%";

function IngestionPage() {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedDRR | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [committed, setCommitted] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);

  const loadRecent = async () => {
    const { data } = await supabase
      .from("drr_reports")
      .select("id, property, report_date, source_file, created_at, room_revenue, fnb_revenue, net_revenue, occupancy, adr, revpar, daily_breakdown")
      .order("created_at", { ascending: false })
      .limit(20);
    setRecent(data || []);
  };

  useEffect(() => { loadRecent(); }, []);

  const handleParse = async () => {
    if (!file) return;
    setBusy(true); setError(""); setCommitted(false); setParsed(null);
    try {
      setStage("Uploading PDF to parser…");
      const form = new FormData();
      form.append("file", file);
      const { data, error: fnErr } = await supabase.functions.invoke("parse-drr", {
        body: form,
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);
      setStage("Parsing complete");
      setParsed(data.parsed);
      setFileName(data.file_name);
    } catch (e: any) {
      setError(e?.message || "Failed to parse PDF");
    } finally {
      setBusy(false); setStage("");
    }
  };

  const handleCommit = async () => {
    if (!parsed || !file) return;
    setBusy(true); setError("");
    try {
      setStage("Uploading file to storage…");
      const storagePath = `${parsed.property.replace(/\s+/g, "_")}/${parsed.report_date}_${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("drr-pdfs")
        .upload(storagePath, file, { contentType: "application/pdf", upsert: true });
      if (upErr) console.warn("Storage upload warning:", upErr.message);

      setStage("Writing to database…");
      const { error: dbErr } = await supabase
        .from("drr_reports")
        .upsert({
          property: parsed.property,
          report_date: parsed.report_date,
          room_revenue: parsed.room_revenue ?? {},
          fnb_revenue: parsed.fnb_revenue ?? {},
          net_revenue: parsed.net_revenue ?? {},
          occupancy: parsed.occupancy ?? {},
          adr: parsed.adr ?? {},
          revpar: parsed.revpar ?? {},
          compset_today: parsed.compset_today ?? [],
          compset_mtd: parsed.compset_mtd ?? [],
          segments: parsed.segments ?? [],
          ota_production: parsed.ota_production ?? [],
          daily_breakdown: parsed.daily_breakdown ?? [],
          source_file: storagePath,
        }, { onConflict: "property,report_date" });
      if (dbErr) throw new Error(dbErr.message);
      setCommitted(true);
      await loadRecent();
    } catch (e: any) {
      setError(e?.message || "Failed to commit");
    } finally {
      setBusy(false); setStage("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data Ingestion · DRR Pipeline"
        title="PDF → Dashboard"
        subtitle="Upload Daily Revenue Report, compset, segments and OTA production."
      />

      {/* Upload card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-9 rounded-lg bg-[var(--gradient-gold)] grid place-items-center">
            <FileUp className="size-4 text-[var(--onyx)]" />
          </div>
          <div>
            <div className="font-display text-lg">Upload PDF</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest">​</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              setParsed(null);
              setCommitted(false);
              setError("");
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-1 text-left border border-dashed border-border rounded-xl px-4 py-6 hover:border-[var(--gold)]/40 transition cursor-pointer"
          >
            {file ? (
              <div className="text-sm">
                <span className="text-gold font-medium">{file.name}</span>
                <span className="text-muted-foreground ml-2">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Click to select PDF file</div>
            )}
          </button>
          <button
            onClick={handleParse}
            disabled={!file || busy}
            className="px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-yellow-400/20"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
            Parse PDF
          </button>
        </div>

        {stage && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> {stage}
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-start gap-2 text-xs text-red-400 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Preview */}
      {parsed && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] tracking-[0.3em] text-muted-foreground">EXTRACTED · PREVIEW</div>
                <div className="font-display text-2xl mt-1 gold-gradient-text">{parsed.property}</div>
                <div className="text-xs text-muted-foreground mt-1">Report Date · {parsed.report_date} · Source: {fileName}</div>
              </div>
              <button
                onClick={handleCommit}
                disabled={busy || committed}
                className="px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-sm disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-yellow-400/20"
              >
                {committed ? <CheckCircle2 className="size-4" /> : <Database className="size-4" />}
                {committed ? "Committed" : "Commit to Dashboard"}
              </button>
            </div>

            {/* KPI tiles */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <KpiTile label="Room Revenue MTD" value={fmtRp(parsed.room_revenue?.mtd_actual)} sub={`Budget ${fmtRp(parsed.room_revenue?.mtd_budget)}`} />
              <KpiTile label="F&B Revenue MTD" value={fmtRp(parsed.fnb_revenue?.mtd_actual)} sub={`Budget ${fmtRp(parsed.fnb_revenue?.mtd_budget)}`} />
              <KpiTile label="Net Revenue MTD" value={fmtRp(parsed.net_revenue?.mtd_actual)} sub={`YTD ${fmtRp(parsed.net_revenue?.ytd_actual)}`} />
              <KpiTile label="Occupancy MTD" value={fmtPct(parsed.occupancy?.mtd_actual)} sub={`Today ${fmtPct(parsed.occupancy?.today_actual)}`} />
              <KpiTile label="ADR MTD" value={fmtRp(parsed.adr?.mtd_actual)} sub={`Today ${fmtRp(parsed.adr?.today_actual)}`} />
              <KpiTile label="RevPAR MTD" value={fmtRp(parsed.revpar?.mtd_actual)} sub={`Today ${fmtRp(parsed.revpar?.today_actual)}`} />
            </div>
          </div>

          {/* Compset MTD */}
          {parsed.compset_mtd?.length > 0 && (
            <Section title={`Compset · MTD (${parsed.compset_mtd.length} hotels)`}>
              <DataTable
                cols={["Hotel", "Rooms Sold", "Occ %", "ADR", "RevPAR", "RGI", "MPI", "ARI"]}
                rows={parsed.compset_mtd.map((r: any) => [
                  r.hotel,
                  String(r.rooms_sold ?? 0),
                  fmtPct(r.occ_pct),
                  fmtRp(r.adr),
                  fmtRp(r.revpar),
                  (r.rgi ?? 0).toFixed(2),
                  (r.mpi ?? 0).toFixed(2),
                  (r.ari ?? 0).toFixed(2),
                ])}
              />
            </Section>
          )}

          {/* Segments */}
          {parsed.segments?.length > 0 && (
            <Section title={`Segments · MTD (${parsed.segments.length} rows)`}>
              <DataTable
                cols={["Segment", "MTD Revenue", "Rooms", "ARR", "Mix %"]}
                rows={parsed.segments.map((s: any) => [
                  s.segment,
                  fmtRp(s.mtd_revenue),
                  String(s.mtd_rooms ?? 0),
                  fmtRp(s.mtd_arr),
                  fmtPct(s.mtd_pct),
                ])}
              />
            </Section>
          )}

          {/* OTA */}
          {parsed.ota_production?.length > 0 && (
            <Section title={`OTA / Travel Agent Production · MTD (${parsed.ota_production.length})`}>
              <DataTable
                cols={["Agent", "Rooms", "Pax", "Lodging", "ARR", "Mix %"]}
                rows={parsed.ota_production.map((o: any) => [
                  o.agent,
                  String(o.mtd_rooms ?? 0),
                  String(o.mtd_pax ?? 0),
                  fmtRp(o.mtd_lodging),
                  fmtRp(o.mtd_arr),
                  fmtPct(o.mtd_pct),
                ])}
              />
            </Section>
          )}

          {/* Daily breakdown */}
          {parsed.daily_breakdown?.length > 0 && (
            <Section title={`Daily Breakdown · ${parsed.daily_breakdown.length} days`}>
              <DataTable
                cols={["Date", "Rooms Sold", "Occ %", "ADR", "RevPAR", "Room Rev", "F&B Rev", "Net Rev"]}
                rows={parsed.daily_breakdown.map((d: any) => [
                  d.date,
                  String(d.rooms_sold ?? 0),
                  fmtPct(d.occ_pct),
                  fmtRp(d.adr),
                  fmtRp(d.revpar),
                  fmtRp(d.room_revenue),
                  fmtRp(d.fnb_revenue),
                  fmtRp(d.net_revenue),
                ])}
              />
            </Section>
          )}
        </motion.div>
      )}

      {/* Recent imports */}
      <div className="glass rounded-2xl p-6">
        <div className="font-display text-lg mb-4">Recent Imports</div>
        {recent.length === 0 ? (
          <div className="text-xs text-muted-foreground">No imports yet. Upload your first DRR PDF above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Property", "Report Date", "Room Rev (Today)", "F&B Rev (Today)", "Net Rev (Today)", "Occ", "ADR", "RevPAR", "Imported"].map((c) => (
                    <th key={c} className="text-left py-2 px-2 font-medium text-muted-foreground text-[10px] tracking-[0.15em] uppercase">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-[oklch(1_0_0/2%)]">
                    <td className="py-2 px-2 font-medium text-gold">{displayProperty(r.property)}</td>
                    <td className="py-2 px-2 text-muted-foreground tabular-nums">{r.report_date}</td>
                    <td className="py-2 px-2 text-muted-foreground tabular-nums">{fmtRp(r.room_revenue?.today_actual)}</td>
                    <td className="py-2 px-2 text-muted-foreground tabular-nums">{fmtRp(r.fnb_revenue?.today_actual)}</td>
                    <td className="py-2 px-2 text-muted-foreground tabular-nums">{fmtRp(r.net_revenue?.today_actual)}</td>
                    <td className="py-2 px-2 text-muted-foreground tabular-nums">{fmtPct(r.occupancy?.today_actual)}</td>
                    <td className="py-2 px-2 text-muted-foreground tabular-nums">{fmtRp(r.adr?.today_actual)}</td>
                    <td className="py-2 px-2 text-muted-foreground tabular-nums">{fmtRp(r.revpar?.today_actual)}</td>
                    <td className="py-2 px-2 text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 rounded-xl bg-[oklch(1_0_0/3%)] border border-border">
      <div className="text-[10px] tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className="font-display text-xl mt-1.5">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="font-display text-base mb-4">{title}</div>
      {children}
    </div>
  );
}

function DataTable({ cols, rows }: { cols: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {cols.map((c) => (
              <th key={c} className="text-left py-2 px-2 font-medium text-muted-foreground text-[10px] tracking-[0.15em] uppercase">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/30 hover:bg-[oklch(1_0_0/2%)]">
              {row.map((cell, j) => (
                <td key={j} className={`py-2 px-2 ${j === 0 ? "font-medium" : "text-muted-foreground tabular-nums"}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}