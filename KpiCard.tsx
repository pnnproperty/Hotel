import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Mail, Globe, ExternalLink, Search, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

// ===================================================================
//  External Content Panel
//  ----------------------------------------------------------------
//  Renders agent-driven content overlays: videos, emails, search
//  results, files, and external website previews. Mounted globally
//  and controlled via state in the VoiceOrb component.
//
//  Closing the modal: there are FIVE ways the user can close it,
//  because iframes (esp. YouTube fullscreen) can otherwise trap the user:
//    1. Click the X button in the header
//    2. Click the BIG floating close button at top-right (always on top)
//    3. Click the backdrop (dark area around modal)
//    4. Press the Escape key
//    5. Voice command — agent calls closeAll
// ===================================================================

export type FileKind = "pdf" | "image" | "office" | "text" | "other";

export type ExternalContent =
  | { kind: "video"; provider: "youtube" | "vimeo" | "direct"; videoId: string; title?: string }
  | { kind: "email"; to: string; subject: string; body: string; from?: string }
  | { kind: "search"; query: string; results: SearchResult[]; answerBox?: string }
  | { kind: "iframe"; url: string; title?: string }
  | { kind: "file"; url: string; fileKind: FileKind; title?: string; mimeType?: string };

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source?: string;
}

interface Props {
  content: ExternalContent | null;
  onClose: () => void;
}

export function ExternalContentPanel({ content, onClose }: Props) {
  // Wrap onClose to also exit native fullscreen mode (YouTube/Vimeo fullscreen).
  // Without this, when video is fullscreen, the X button and backdrop are
  // hidden behind the fullscreen iframe — user can't reach them.
  const handleClose = () => {
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => { /* noop */ });
    }
    onClose();
  };

  // Close on Escape key. Even when an iframe has focus, the keydown
  // bubbles up to the parent document for ESC specifically (browser
  // exits fullscreen on ESC, but the second press fires on document).
  useEffect(() => {
    if (!content) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, onClose]);

  return (
    <AnimatePresence>
      {content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Big floating close button — ALWAYS visible, sits ABOVE the modal
              and even above YouTube fullscreen overlays. z-index higher than
              the modal itself ensures it never gets covered. */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="fixed top-5 right-5 z-[10000] flex items-center gap-2 px-4 py-2.5 rounded-full bg-foreground text-background shadow-2xl hover:scale-105 active:scale-95 transition-transform font-mono text-xs uppercase tracking-wider"
            aria-label="Close overlay (or press ESC)"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
            <kbd className="ml-1 px-1.5 py-0.5 text-[9px] rounded bg-background/20 border border-background/30">
              ESC
            </kbd>
          </button>

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-mono text-muted-foreground">
                {content.kind === "video" && <><Play className="w-3.5 h-3.5" /> Video</>}
                {content.kind === "email" && <><Mail className="w-3.5 h-3.5" /> Email</>}
                {content.kind === "search" && <><Search className="w-3.5 h-3.5" /> Web Search</>}
                {content.kind === "iframe" && <><Globe className="w-3.5 h-3.5" /> External</>}
                {content.kind === "file" && <><FileText className="w-3.5 h-3.5" /> File · {content.fileKind.toUpperCase()}</>}
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-md hover:bg-secondary transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body — switches based on content kind */}
            <div className="flex-1 overflow-auto">
              {content.kind === "video" && <VideoPanel content={content} />}
              {content.kind === "email" && <EmailPanel content={content} />}
              {content.kind === "search" && <SearchPanel content={content} />}
              {content.kind === "iframe" && <IframePanel content={content} />}
              {content.kind === "file" && <FilePanel content={content} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// -------------------------------------------------------------------
//  Video sub-panel — embeds YouTube/Vimeo/direct in an iframe
// -------------------------------------------------------------------
function VideoPanel({ content }: { content: Extract<ExternalContent, { kind: "video" }> }) {
  let embedUrl = "";
  if (content.provider === "youtube") {
    embedUrl = `https://www.youtube.com/embed/${content.videoId}?autoplay=1&rel=0`;
  } else if (content.provider === "vimeo") {
    embedUrl = `https://player.vimeo.com/video/${content.videoId}?autoplay=1`;
  } else {
    embedUrl = content.videoId; // direct URL passed in videoId field
  }

  return (
    <div>
      {content.title && (
        <h3 className="px-5 pt-4 pb-2 text-base font-medium">{content.title}</h3>
      )}
      <div className="aspect-video bg-black">
        <iframe
          src={embedUrl}
          title={content.title || "Video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
//  Email sub-panel — renders a clean email viewer mockup
// -------------------------------------------------------------------
function EmailPanel({ content }: { content: Extract<ExternalContent, { kind: "email" }> }) {
  return (
    <div className="p-6 space-y-4">
      <div className="space-y-1 pb-4 border-b border-border">
        <h3 className="text-xl font-semibold">{content.subject}</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground font-mono">
          {content.from && (
            <span><span className="opacity-60">FROM</span> &nbsp; {content.from}</span>
          )}
          <span><span className="opacity-60">TO</span> &nbsp;&nbsp;&nbsp; {content.to}</span>
        </div>
      </div>
      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {content.body}
      </div>
      <div className="flex gap-2 pt-4 border-t border-border">
        <button
          onClick={() => {
            // Open default mail client with pre-filled email
            const params = new URLSearchParams({
              subject: content.subject,
              body: content.body,
            });
            window.location.href = `mailto:${content.to}?${params.toString()}`;
          }}
          className="px-4 py-2 text-xs uppercase tracking-wider font-mono rounded-md bg-foreground text-background hover:opacity-90 transition"
        >
          Open in Mail Client
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(content.body)}
          className="px-4 py-2 text-xs uppercase tracking-wider font-mono rounded-md border border-border hover:bg-secondary transition"
        >
          Copy Text
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
//  Search results sub-panel — Google-like results display
// -------------------------------------------------------------------
function SearchPanel({ content }: { content: Extract<ExternalContent, { kind: "search" }> }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-mono">"{content.query}"</span>
        <span className="text-xs text-muted-foreground ml-auto">{content.results.length} results</span>
      </div>

      {content.answerBox && (
        <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-400/20">
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-emerald-400/70 mb-2">
            Direct Answer
          </div>
          <div className="text-sm leading-relaxed">{content.answerBox}</div>
        </div>
      )}

      <div className="space-y-4">
        {content.results.map((r, i) => (
          <a
            key={i}
            href={r.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 -mx-3 rounded-lg hover:bg-secondary/50 transition group"
          >
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mb-1">
              <Globe className="w-3 h-3" />
              <span className="truncate">{r.source || new URL(r.link).hostname}</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="text-sm font-medium text-foreground group-hover:underline">
              {r.title}
            </div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.snippet}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
//  Iframe sub-panel — embeds any URL (with safety constraints)
// -------------------------------------------------------------------
function IframePanel({ content }: { content: Extract<ExternalContent, { kind: "iframe" }> }) {
  return (
    <div className="h-[70vh] flex flex-col">
      {content.title && (
        <div className="px-5 py-2 text-xs font-mono text-muted-foreground border-b border-border flex items-center gap-2">
          <span className="truncate flex-1">{content.title}</span>
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition"
          >
            <span>Open in new tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
      <iframe
        src={content.url}
        title={content.title || "External content"}
        className={cn("flex-1 w-full border-0", !content.title && "h-full")}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}

// -------------------------------------------------------------------
//  File sub-panel — renders PDFs, images, Office docs in-place
// -------------------------------------------------------------------
function FilePanel({ content }: { content: Extract<ExternalContent, { kind: "file" }> }) {
  const { url, fileKind, title } = content;

  const filename = title || url.split("/").pop()?.split("?")[0] || "file";

  return (
    <div className="h-[75vh] flex flex-col">
      {/* Toolbar */}
      <div className="px-5 py-2 text-xs font-mono text-muted-foreground border-b border-border flex items-center gap-3">
        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate flex-1">{filename}</span>
        <a
          href={url}
          download={filename}
          className="flex items-center gap-1 hover:text-foreground transition"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-foreground transition"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Open</span>
        </a>
      </div>

      {/* Body — different rendering based on file kind */}
      <div className="flex-1 bg-secondary/20 flex items-center justify-center overflow-auto">
        {fileKind === "image" && (
          <img
            src={url}
            alt={filename}
            className="max-w-full max-h-full object-contain"
          />
        )}

        {fileKind === "pdf" && (
          // Native browser PDF viewer. Most browsers support this.
          <iframe
            src={url}
            title={filename}
            className="w-full h-full border-0 bg-white"
          />
        )}

        {fileKind === "office" && (
          // Office Online viewer can render .docx/.xlsx/.pptx publicly accessible URLs
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
            title={filename}
            className="w-full h-full border-0 bg-white"
          />
        )}

        {fileKind === "text" && (
          // Inline text/code preview
          <TextFilePreview url={url} filename={filename} />
        )}

        {fileKind === "other" && (
          <div className="text-center p-8 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
            <div className="text-sm">{filename}</div>
            <div className="text-xs text-muted-foreground">
              This file type cannot be previewed inline. Use Download or Open to view it.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fetches text content and shows it in a scrollable <pre>.
// Limited to ~500KB to avoid jamming the UI with massive files.
function TextFilePreview({ url, filename }: { url: string; filename: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((t) => {
        if (cancelled) return;
        setText(t.length > 500_000 ? t.slice(0, 500_000) + "\n\n... [truncated, file too large]" : t);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [url]);

  if (error) return <div className="p-6 text-sm text-muted-foreground">Failed to load: {error}</div>;
  if (text === null) return <div className="p-6 text-sm text-muted-foreground">Loading {filename}…</div>;

  return (
    <pre className="w-full h-full p-6 text-xs font-mono whitespace-pre-wrap text-foreground/90 overflow-auto bg-background">
      {text}
    </pre>
  );
}
