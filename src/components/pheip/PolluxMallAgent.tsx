import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Settings, Volume2, Loader2, Diamond, Hand } from "lucide-react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { buildSnapshot, snapshotToPrompt, lookupMetric, moduleLabels } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";
import { ExternalContentPanel, type ExternalContent, type SearchResult, type FileKind } from "./external-content-panel";

const STORAGE_KEY = "pollux.elevenlabs.agentId";
const CLAP_KEY = "pollux.clapActivation";
const DEFAULT_AGENT_ID = "agent_7101kr9gz36hex3v7c4a8zfqmpeb";

function pathToModule(path: string): string {
  const seg = path.split("/").filter(Boolean)[0];
  if (!seg) return "executive";
  return seg;
}

/** Detect file type for preview rendering based on filename or MIME. */
function detectFileKind(pathOrName: string, mimeType?: string): FileKind {
  const lower = pathOrName.toLowerCase();
  const mime = mimeType?.toLowerCase() ?? "";

  if (mime.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/i.test(lower)) {
    return "image";
  }
  if (mime === "application/pdf" || /\.pdf$/i.test(lower)) {
    return "pdf";
  }
  if (
    mime.includes("officedocument") ||
    /\.(docx|xlsx|pptx|doc|xls|ppt)$/i.test(lower)
  ) {
    return "office";
  }
  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    /\.(txt|md|csv|json|xml|yaml|yml|log|html|css|js|ts|tsx|jsx|py|rb|go|rs|java|c|cpp|sh)$/i.test(lower)
  ) {
    return "text";
  }
  return "other";
}

export function PolluxMallAgent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const activeModule = pathToModule(path);
  if (!mounted) return null;
  return (
    <ConversationProvider>
      <VoiceOrbInner activeModule={activeModule} />
    </ConversationProvider>
  );
}

function VoiceOrbInner({ activeModule }: { activeModule: string }) {
  const [open, setOpen] = useState(false);
  const [agentId, setAgentId] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clapEnabled, setClapEnabled] = useState(false);
  const [clapListening, setClapListening] = useState(false);
  const [lastClap, setLastClap] = useState<number>(0);

  const [connecting, setConnecting] = useState(false);
  const moduleRef = useRef(activeModule);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // Agent-driven notification banner
  const [agentNotification, setAgentNotification] = useState<{
    message: string;
    type: "info" | "success" | "warning";
  } | null>(null);

  // External content overlay (video / email / search / iframe / file)
  const [externalContent, setExternalContent] = useState<ExternalContent | null>(null);

  // Track tabs/windows that the agent opens via openExternalLink, so
  // closeAllTabs can shut them later. Browser only lets us close
  // windows that THIS script opened.
  const openedTabsRef = useRef<Window[]>([]);

  useEffect(() => { moduleRef.current = activeModule; }, [activeModule]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    setAgentId(saved && saved.trim() ? saved : DEFAULT_AGENT_ID);
    setClapEnabled(localStorage.getItem(CLAP_KEY) === "1");
  }, []);

  const toggleClap = (v: boolean) => {
    setClapEnabled(v);
    if (typeof window !== "undefined") localStorage.setItem(CLAP_KEY, v ? "1" : "0");
  };

  const conversation = useConversation({
    clientTools: {
      // === Query: get a specific metric ===
      getDashboardMetric: (params: { query: string }) => {
        return lookupMetric(params.query ?? "");
      },

      // === Query: current active module ===
      getActiveModule: () => {
        return `User is currently viewing the ${moduleLabels[moduleRef.current] ?? moduleRef.current} module.`;
      },

      // === Navigate to a module/route ===
      // For Pollux Hotels this uses TanStack Router file-based routes,
      // where each module corresponds to a top-level path /finance, /occupancy, etc.
      navigateToModule: (params: { module: string; reason?: string }) => {
        const moduleKey = params.module?.toLowerCase().trim();
        if (!moduleKey || !moduleLabels[moduleKey]) {
          return `Module "${params.module}" not found. Available modules: ${Object.keys(moduleLabels).join(", ")}`;
        }
        const path = moduleKey === "executive" ? "/" : `/${moduleKey}`;
        navigateRef.current?.({ to: path });
        return `Navigated to ${moduleLabels[moduleKey]} module.`;
      },

      // === Show temporary notification banner ===
      showAlert: (params: { message: string; type?: "info" | "success" | "warning" }) => {
        const type = params.type ?? "info";
        setAgentNotification({ message: params.message, type });
        setTimeout(() => setAgentNotification(null), 6000);
        return `Notification displayed.`;
      },

      // === Open external URL in new tab ===
      // Tracks the opened window so closeAllTabs can shut it later.
      // Note: passing "noopener" returns null and prevents close — we keep
      // noopener for security; closeAllTabs will only close trackable wins.
      openExternalLink: (params: { url: string; reason?: string; closable?: boolean }) => {
        try {
          const url = new URL(params.url);
          if (!["http:", "https:"].includes(url.protocol)) {
            return "Only http/https URLs are allowed.";
          }
          // If agent explicitly wants closable, drop noopener (less secure)
          const features = params.closable ? "" : "noopener,noreferrer";
          const win = window.open(url.toString(), "_blank", features);
          if (win) openedTabsRef.current.push(win);
          return `Opened ${url.hostname} in a new tab${params.closable ? " (closable)" : ""}.`;
        } catch {
          return `Invalid URL: ${params.url}`;
        }
      },

      // === Play video inline in modal ===
      showVideo: (params: { url: string; title?: string }) => {
        if (!params.url) return "Missing video URL";
        const url = params.url.trim();

        const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([^&?\s]+)/);
        if (ytMatch && ytMatch[1]) {
          setExternalContent({ kind: "video", provider: "youtube", videoId: ytMatch[1], title: params.title });
          return `Playing YouTube video${params.title ? `: ${params.title}` : ""}.`;
        }

        const vmMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (vmMatch && vmMatch[1]) {
          setExternalContent({ kind: "video", provider: "vimeo", videoId: vmMatch[1], title: params.title });
          return `Playing Vimeo video${params.title ? `: ${params.title}` : ""}.`;
        }

        if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
          setExternalContent({ kind: "video", provider: "direct", videoId: url, title: params.title });
          return `Playing video${params.title ? `: ${params.title}` : ""}.`;
        }

        return "Unsupported video URL. Use YouTube, Vimeo, or direct .mp4 link.";
      },

      // === Display web search results in modal ===
      showWebSearch: (params: {
        query: string;
        results: SearchResult[];
        answerBox?: string;
      }) => {
        if (!params.query || !Array.isArray(params.results)) {
          return "Missing query or results array";
        }
        setExternalContent({
          kind: "search",
          query: params.query,
          results: params.results.slice(0, 8),
          answerBox: params.answerBox,
        });
        return `Displayed ${params.results.length} search results for "${params.query}".`;
      },

      // === Compose / display an email ===
      showEmail: (params: {
        to: string;
        subject: string;
        body: string;
        from?: string;
      }) => {
        if (!params.to || !params.subject || !params.body) {
          return "Email requires at least: to, subject, body";
        }
        setExternalContent({
          kind: "email",
          to: params.to,
          subject: params.subject,
          body: params.body,
          from: params.from,
        });
        return `Email displayed. Subject: "${params.subject}".`;
      },

      // === Open any URL inside an embedded iframe overlay ===
      showIframe: (params: { url: string; title?: string }) => {
        try {
          const url = new URL(params.url);
          if (!["http:", "https:"].includes(url.protocol)) {
            return "Only http/https URLs allowed.";
          }
          setExternalContent({ kind: "iframe", url: url.toString(), title: params.title });
          return `Loaded ${url.hostname} in overlay.`;
        } catch {
          return `Invalid URL: ${params.url}`;
        }
      },

      // === Show a file (PDF, image, doc) from a URL in an overlay ===
      // Supports: PDFs (native browser viewer), images (jpg/png/gif/webp/svg),
      // Office docs (docx/xlsx/pptx via Office Online viewer — requires public URL),
      // text files (.txt/.json/.csv/.md inline), other types (download fallback).
      showFile: (params: { url: string; title?: string; fileKind?: FileKind; mimeType?: string }) => {
        if (!params.url) return "Missing file URL.";
        try {
          const url = new URL(params.url);
          if (!["http:", "https:"].includes(url.protocol)) {
            return "Only http/https URLs allowed.";
          }
          // Auto-detect kind from extension if not provided
          const kind: FileKind = params.fileKind ?? detectFileKind(url.pathname, params.mimeType);
          setExternalContent({
            kind: "file",
            url: url.toString(),
            fileKind: kind,
            title: params.title,
            mimeType: params.mimeType,
          });
          return `Showing file (${kind}): ${params.title || url.pathname.split("/").pop()}`;
        } catch {
          return `Invalid URL: ${params.url}`;
        }
      },

      // === Ask the user to pick a local file ===
      // Returns metadata about the picked file. We CAN'T silently read user's
      // disk — browser requires the user click to choose. So this opens a
      // file picker dialog and waits for selection.
      pickFile: async (params: { accept?: string; multiple?: boolean }) => {
        return new Promise<string>((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          if (params.accept) input.accept = params.accept;
          if (params.multiple) input.multiple = true;

          let resolved = false;
          input.onchange = () => {
            resolved = true;
            const files = Array.from(input.files ?? []);
            if (files.length === 0) {
              resolve("User cancelled file picker.");
              return;
            }
            const info = files.map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type || "unknown",
              lastModified: new Date(f.lastModified).toISOString(),
            }));

            // Show first file as preview if it's a known previewable type
            const first = files[0];
            if (!first) {
              resolve(`User selected ${files.length} file(s): ${JSON.stringify(info)}`);
              return;
            }
            const objUrl = URL.createObjectURL(first);
            const kind = detectFileKind(first.name, first.type);
            setExternalContent({
              kind: "file",
              url: objUrl,
              fileKind: kind,
              title: first.name,
              mimeType: first.type,
            });

            resolve(
              `User selected ${files.length} file(s). First: ${first.name} (${(first.size / 1024).toFixed(1)} KB). ` +
              `All files: ${JSON.stringify(info)}`,
            );
          };

          // If user closes the dialog without choosing (browser doesn't fire
          // a reliable "cancel" event everywhere), set a 60s timeout fallback.
          setTimeout(() => {
            if (!resolved) resolve("File picker timed out — user didn't choose a file.");
          }, 60_000);

          input.click();
        });
      },

      // === Close all overlays and any tabs the agent opened ===
      // Browser security: we can only close windows that THIS script opened,
      // and only those NOT opened with noopener. Tabs opened by the user
      // manually CANNOT be closed.
      closeAll: (params: { what?: "modals" | "tabs" | "everything" }) => {
        const what = params.what ?? "everything";
        let closedModal = false;
        let closedTabs = 0;
        let unclosable = 0;

        if (what === "modals" || what === "everything") {
          if (externalContent !== null) {
            setExternalContent(null);
            closedModal = true;
          }
          setAgentNotification(null);
        }

        if (what === "tabs" || what === "everything") {
          for (const win of openedTabsRef.current) {
            if (!win || win.closed) continue;
            try {
              win.close();
              if (win.closed) closedTabs++;
              else unclosable++;
            } catch {
              unclosable++;
            }
          }
          // Clear the list — closed wins are dead, unclosed we can't touch anyway
          openedTabsRef.current = [];
        }

        const parts: string[] = [];
        if (closedModal) parts.push("closed open modal");
        if (closedTabs > 0) parts.push(`closed ${closedTabs} tab(s)`);
        if (unclosable > 0) parts.push(`${unclosable} tab(s) couldn't be closed (browser security)`);
        if (parts.length === 0) parts.push("nothing to close");

        return parts.join(", ") + ".";
      },
    },
    onConnect: () => {
      setConnecting(false);
      setErrorMsg(null);
    },
    onDisconnect: (details?: { reason?: string; message?: string; closeCode?: number; closeReason?: string }) => {
      setConnecting(false);
      if (details?.reason === "error") {
        setErrorMsg(details.message || details.closeReason || `Connection closed${details.closeCode ? ` (${details.closeCode})` : ""}.`);
      }
    },
    onStatusChange: ({ status }: { status: string }) => {
      if (status === "connected" || status === "disconnected") setConnecting(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setConnecting(false);
    },
  });

  const status = conversation.status;
  const isSpeaking = conversation.isSpeaking;
  const isLive = status === "connected";

  const start = useCallback(async () => {
    if (!agentId) { setShowSettings(true); return; }
    setConnecting(true); setErrorMsg(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser ini belum mendukung akses mikrofon.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      const snapshot = buildSnapshot(moduleRef.current);
      conversation.startSession({
        agentId,
        connectionType: "websocket",
        onConnect: () => {
          window.setTimeout(() => {
            try {
              conversation.sendContextualUpdate(snapshotToPrompt(snapshot));
            } catch {
              // Session may have already ended; ignore.
            }
          }, 0);
        },
      });
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const msg = raw.includes("Requested device not found") || raw.includes("Found no audioinput")
        ? "Mikrofon tidak ditemukan. Hubungkan/aktifkan mikrofon lalu coba lagi."
        : raw.includes("Permission denied") || raw.includes("NotAllowedError")
          ? "Akses mikrofon ditolak. Izinkan akses mikrofon di browser lalu coba lagi."
          : raw;
      setErrorMsg(msg);
      setConnecting(false);
    }
  }, [agentId, conversation]);

  const stop = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const saveAgent = (id: string) => {
    const v = id.trim();
    setAgentId(v);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, v);
    setShowSettings(false);
  };

  // Clap detection
  const isLiveStatus = conversation.status === "connected";
  useEffect(() => {
    if (!clapEnabled) { setClapListening(false); return; }
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let raf = 0;
    let lastTrigger = 0;
    let prevEnergy = 0;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        setClapListening(true);

        const tick = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(data);
          const start = Math.floor(data.length * 0.15);
          const end = Math.floor(data.length * 0.55);
          let sum = 0;
          for (let i = start; i < end; i++) sum += data[i];
          const energy = sum / (end - start) / 255;

          const now = performance.now();
          const delta = energy - prevEnergy;
          if (delta > 0.32 && energy > 0.5 && now - lastTrigger > 1500) {
            lastTrigger = now;
            setLastClap(now);
          }
          prevEnergy = energy * 0.6 + prevEnergy * 0.4;
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setErrorMsg("Tidak bisa aktifkan clap-listener. Periksa izin mikrofon.");
        toggleClap(false);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (ctx && ctx.state !== "closed") ctx.close();
      setClapListening(false);
    };
  }, [clapEnabled]);

  const startRef = useRef<() => void>(() => {});
  useEffect(() => { startRef.current = () => { void start(); }; }, [start]);
  useEffect(() => {
    if (!lastClap) return;
    setOpen(true);
    if (isLiveStatus) {
      void conversation.endSession();
    } else if (!connecting) {
      startRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastClap]);

  return (
    <>
      {/* External content overlay (video / email / search / iframe) */}
      <ExternalContentPanel content={externalContent} onClose={() => setExternalContent(null)} />

      {/* Agent-driven notification banner (top-right) */}
      <AnimatePresence>
        {agentNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "fixed top-6 right-6 z-[9999] max-w-md rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl",
              agentNotification.type === "info" && "bg-blue-500/10 border-blue-400/30 text-blue-50",
              agentNotification.type === "success" && "bg-emerald-500/10 border-emerald-400/30 text-emerald-50",
              agentNotification.type === "warning" && "bg-amber-500/10 border-amber-400/30 text-amber-50",
            )}
          >
            <div className="flex items-start gap-3">
              <Diamond className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-1 font-mono">
                  Pollux Agent
                </div>
                <div className="text-sm leading-relaxed">{agentNotification.message}</div>
              </div>
              <button
                onClick={() => setAgentNotification(null)}
                className="text-current opacity-50 hover:opacity-100 transition"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="POLLUX Voice Assistant"
      >
        <div className="relative">
          {(isLive || isSpeaking) && (
            <>
              <span className="absolute inset-0 rounded-full bg-[oklch(0.82_0.13_85/0.4)] animate-ping" />
              <span className="absolute -inset-2 rounded-full bg-[oklch(0.82_0.13_85/0.15)] animate-pulse" />
            </>
          )}
          <div className={cn(
            "relative h-16 w-16 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all",
            "bg-gradient-to-br from-[oklch(0.88_0.11_88/0.95)] to-[oklch(0.55_0.15_70/0.95)]",
            "border-[oklch(0.85_0.13_85/0.5)] shadow-[0_0_40px_-8px_oklch(0.82_0.13_85/0.7)]",
            isSpeaking && "animate-pulse",
          )}>
            {connecting ? (
              <Loader2 className="h-6 w-6 text-background animate-spin" />
            ) : isSpeaking ? (
              <Volume2 className="h-6 w-6 text-background" />
            ) : isLive ? (
              <Mic className="h-6 w-6 text-background" />
            ) : (
              <Diamond className="h-6 w-6 text-background" strokeWidth={2.5} />
            )}
          </div>
          {isLive && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[oklch(0.78_0.17_155)] ring-2 ring-background" />
          )}
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-28 right-6 z-50 w-[380px] max-h-[600px] flex flex-col rounded-2xl border border-border/60 bg-background/95 backdrop-blur-2xl shadow-[0_30px_80px_-20px_oklch(0_0_0/0.6)] overflow-hidden"
          >
            <div className="relative flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-gradient-to-r from-[oklch(0.82_0.13_85/0.08)] to-transparent">
              <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-[oklch(0.88_0.11_88)] to-[oklch(0.6_0.15_70)] flex items-center justify-center">
                <Diamond className="h-4 w-4 text-background" strokeWidth={2.5} />
                {isLive && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.17_155)] ring-2 ring-background animate-pulse" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold tracking-tight">JARVIS</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  {connecting ? "Connecting…" : isSpeaking ? "Speaking" : isLive ? "Listening" : "Standby"}
                </div>
              </div>
              <button onClick={() => setShowSettings((s) => !s)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition" aria-label="Settings">
                <Settings className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {showSettings && (
              <SettingsPane
                initial={agentId}
                clapEnabled={clapEnabled}
                clapListening={clapListening}
                onToggleClap={toggleClap}
                onSave={saveAgent}
                onCancel={() => setShowSettings(false)}
              />
            )}

            {!showSettings && (
              <VoiceVisualizer
                conversation={conversation}
                isLive={isLive}
                isSpeaking={isSpeaking}
                connecting={connecting}
                activeModule={activeModule}
              />
            )}

            {errorMsg && (
              <div className="px-4 py-2 text-[11px] text-[oklch(0.7_0.2_25)] border-t border-border/60 bg-[oklch(0.7_0.2_25/0.08)]">
                {errorMsg}
              </div>
            )}

            {!showSettings && (
              <div className="p-3 border-t border-border/60 flex items-center gap-2">
                {!isLive ? (
                  <button
                    onClick={start}
                    disabled={connecting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[oklch(0.88_0.11_88)] to-[oklch(0.7_0.15_75)] text-background text-[11px] font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                    {connecting ? "Connecting" : "Start Conversation"}
                  </button>
                ) : (
                  <button
                    onClick={stop}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[oklch(0.7_0.2_25/0.15)] border border-[oklch(0.7_0.2_25/0.4)] text-[oklch(0.78_0.18_25)] text-[11px] font-mono uppercase tracking-wider font-semibold hover:bg-[oklch(0.7_0.2_25/0.25)] transition"
                  >
                    <MicOff className="h-4 w-4" />
                    End Session
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface VisualizerProps {
  conversation: ReturnType<typeof useConversation>;
  isLive: boolean;
  isSpeaking: boolean;
  connecting: boolean;
  activeModule: string;
}

function VoiceVisualizer({ conversation, isLive, isSpeaking, connecting, activeModule }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const sanitizeFinite = (value: number, fallback = 0) => (
    Number.isFinite(value) ? value : fallback
  );

  const sanitizeFrequencyData = (data?: Uint8Array | null) => {
    if (!data || data.length === 0) return null;
    return data;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let phase = 0;
    const bars = 64;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const baseR = Math.min(w, h) * 0.22;

      let freq: Uint8Array | null = null;
      try {
        if (isLive) {
          freq = sanitizeFrequencyData(
            isSpeaking
              ? conversation.getOutputByteFrequencyData?.()
              : conversation.getInputByteFrequencyData?.(),
          );
        }
      } catch {
        freq = null;
      }

      const energy = freq
        ? Array.from(freq.slice(0, 32)).reduce((a, b) => a + b, 0) / (32 * 255)
        : (isLive ? 0.08 : 0);

      phase += 0.012;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(phase);
      ctx.strokeStyle = `oklch(0.82 0.13 85 / ${0.25 + energy * 0.4})`;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      const ringR = baseR * 1.7;
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const len = i % 5 === 0 ? 12 : 5;
        ctx.moveTo(Math.cos(a) * ringR, Math.sin(a) * ringR);
        ctx.lineTo(Math.cos(a) * (ringR + len * dpr), Math.sin(a) * (ringR + len * dpr));
      }
      ctx.stroke();

      ctx.rotate(-phase * 2.5);
      ctx.strokeStyle = `oklch(0.88 0.11 88 / ${0.4 + energy * 0.5})`;
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.arc(0, 0, baseR * 1.35, 0, Math.PI * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, baseR * 1.35, Math.PI * 1.55, Math.PI * 1.95);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 0; i < bars; i++) {
        const a = (i / bars) * Math.PI * 2;
        const rawV = freq ? freq[i % freq.length] / 255 : Math.sin(phase * 3 + i * 0.4) * 0.15 + 0.15;
        const v = sanitizeFinite(rawV, 0.15);
        const len = sanitizeFinite(baseR * 0.35 + v * baseR * 0.9, baseR * 0.45);
        const r1 = sanitizeFinite(baseR * 0.95, 0);
        const r2 = sanitizeFinite(r1 + len, r1);
        const x1 = sanitizeFinite(Math.cos(a) * r1, 0);
        const y1 = sanitizeFinite(Math.sin(a) * r1, 0);
        const x2 = sanitizeFinite(Math.cos(a) * r2, 0);
        const y2 = sanitizeFinite(Math.sin(a) * r2, 0);
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `oklch(0.88 0.11 88 / ${0.9})`);
        grad.addColorStop(1, `oklch(0.6 0.15 70 / 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      const coreR = baseR * (0.7 + energy * 0.25);
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, `oklch(0.95 0.08 88 / ${0.9})`);
      coreGrad.addColorStop(0.5, `oklch(0.82 0.13 85 / 0.6)`);
      coreGrad.addColorStop(1, `oklch(0.6 0.15 70 / 0)`);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `oklch(0.88 0.11 88 / 0.5)`;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(cx - baseR * 0.15, cy);
      ctx.lineTo(cx + baseR * 0.15, cy);
      ctx.moveTo(cx, cy - baseR * 0.15);
      ctx.lineTo(cx, cy + baseR * 0.15);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [conversation, isLive, isSpeaking]);

  const statusLabel = connecting
    ? "Initializing neural link…"
    : isSpeaking
      ? "Jarvis is speaking"
      : isLive
        ? "Listening…"
        : "Standby";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 min-h-[320px] relative">
      <canvas ref={canvasRef} className="w-[280px] h-[280px]" />
      <div className="mt-4 flex flex-col items-center gap-1.5 relative z-10">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[oklch(0.85_0.13_85)]">
          {statusLabel}
        </div>
        {!isLive && !connecting && (
          <div className="text-[11px] text-muted-foreground mt-1 max-w-[260px] text-center">
            Aktifkan link untuk berbicara dengan Jarvis tentang modul {moduleLabels[activeModule] ?? activeModule}.
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPane({
  initial,
  clapEnabled,
  clapListening,
  onToggleClap,
  onSave,
  onCancel,
}: {
  initial: string;
  clapEnabled: boolean;
  clapListening: boolean;
  onToggleClap: (v: boolean) => void;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initial);
  return (
    <div className="p-4 space-y-4 border-b border-border/60">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">ElevenLabs Agent ID</div>
        <p className="text-[11px] text-muted-foreground mb-2">
          Tempel Agent ID dari ElevenLabs (Conversational AI → Agents). Agent harus diset sebagai <span className="font-mono">Public</span>.
        </p>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="agent_xxxxxxxxxxxx"
          className="w-full h-9 rounded-lg bg-[oklch(1_0_0/3%)] border border-border px-3 text-sm font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[oklch(0.82_0.13_85/0.4)]"
        />
      </div>

      <div className="rounded-lg border border-border/60 bg-[oklch(0.82_0.13_85/0.04)] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-foreground">
              <Hand className="h-3 w-3 text-[oklch(0.85_0.13_85)]" /> Clap to activate
              {clapListening && (
                <span className="ml-1 flex items-center gap-1 text-[9px] text-[oklch(0.78_0.17_155)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.78_0.17_155)] animate-pulse" /> LIVE
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
              Tepuk tangan keras untuk start/stop sesi Jarvis. Mic akan mendengarkan pasif di background.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleClap(!clapEnabled)}
            className={cn(
              "relative h-6 w-11 rounded-full transition shrink-0",
              clapEnabled ? "bg-[oklch(0.82_0.13_85)]" : "bg-secondary",
            )}
            aria-pressed={clapEnabled}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all",
                clapEnabled ? "left-[22px]" : "left-0.5",
              )}
            />
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(val)}
          disabled={!val.trim()}
          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[oklch(0.88_0.11_88)] to-[oklch(0.7_0.15_75)] text-background text-[11px] font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition disabled:opacity-40"
        >
          Save
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-[oklch(1_0_0/3%)] border border-border text-[11px] font-mono uppercase tracking-wider hover:bg-accent transition">
          Cancel
        </button>
      </div>
      <div className="text-[10px] font-mono text-muted-foreground/70 leading-relaxed pt-1 border-t border-border/40">
        Agent ID disimpan lokal di browser ini. Pastikan agent mengaktifkan <span className="text-foreground">Overrides → System Prompt + First Message</span> dan <span className="text-foreground">Client Tools</span>: <span className="font-mono">getDashboardMetric(query)</span>, <span className="font-mono">getActiveModule()</span>.
      </div>
    </div>
  );
}
