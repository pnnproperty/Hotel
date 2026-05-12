# Pollux Hotels — Vercel Deploy + ElevenLabs Client Tools

Project ini sudah dikonfigurasi untuk:
- ✅ Deploy ke **Vercel** via Nitro Vercel preset
- ✅ **12 ElevenLabs client tools** untuk agent voice (JARVIS)
- ✅ Integrasi **Supabase** untuk data backend
- ✅ File viewer dengan support PDF, image, Office docs, text
- ✅ Tab management — agent bisa close modal & tab yang dia buka

## Perubahan dari ZIP asli Lovable

| File | Perubahan |
|---|---|
| `vite.config.ts` | Switch dari Cloudflare ke Nitro Vercel preset |
| `wrangler.jsonc` | Dihapus (Cloudflare-only) |
| `package.json` | Tambah dependency `nitro` |
| `.gitignore` | Tambah `.vercel/` dan `.env` (keamanan) |
| `.env.example` | File baru — template env tanpa secret keys |
| `src/components/pheip/PolluxMallAgent.tsx` | Tambah 7 client tools baru |
| `src/components/pheip/external-content-panel.tsx` | File baru — modal overlay |

## 12 Client Tools yang Tersedia

| Tool | Function |
|---|---|
| `navigateToModule` | Pindah ke route modul (`/finance`, `/occupancy`, dst) |
| `showAlert` | Banner notification pojok kanan atas |
| `openExternalLink` | Buka URL di tab baru (track-able untuk close nanti) |
| `showVideo` | Embed YouTube/Vimeo/MP4 dalam modal |
| `showWebSearch` | Tampilkan hasil web search di overlay |
| `showEmail` | Email viewer/composer modal |
| `showIframe` | Embed website dalam modal |
| `showFile` | **NEW** — Preview file dari URL (PDF/image/Office/text) |
| `pickFile` | **NEW** — Dialog pilih file lokal user, preview hasilnya |
| `closeAll` | **NEW** — Tutup semua modal & tab yang agent buka |
| `getDashboardMetric` | Query data spesifik (existing) |
| `getActiveModule` | Cek modul aktif (existing) |

Mapping `navigateToModule` ke routes:
- `executive` → `/`
- `finance` → `/finance`
- `occupancy` → `/occupancy`
- `ota` → `/ota`
- `compset` → `/compset`
- `segment` → `/segment`
- `reviews` → `/reviews`
- `social` → `/social`
- `events` → `/events`
- `forecast` → `/forecast`
- `engineering` → `/engineering`
- `hr` → `/hr`
- `esg` → `/esg`
- `ai` → `/ai`
- `ingestion` → `/ingestion`
- `settings` → `/settings`

---

## Step 1: Upload ke GitHub

Karena upload web kemarin sempat trouble, saya rekomendasi pakai **GitHub Desktop**:

1. Download <https://desktop.github.com>
2. Extract ZIP project ke folder lokal
3. GitHub Desktop → **File → Add local repository** → pilih folder
4. Akan muncul prompt "create a repository" → klik
5. Form: name `pollux-hotels`, **JANGAN** centang README/gitignore/license
6. Klik **Create repository**
7. Di kiri: **Commit summary** → ketik "Initial commit" → **Commit to main**
8. Atas: **Publish repository** → pilih **Private** → **Publish**

Sekarang repo Anda ada di GitHub. **Tapi `.env` dengan Supabase keys TIDAK ikut commit** (sudah di-gitignore).

## Step 2: Setup Vercel + Environment Variables

1. Buka <https://vercel.com/new> → login pakai akun GitHub
2. Cari repo `pollux-hotels` → klik **Import**
3. Sebelum klik **Deploy**, scroll ke section **Environment Variables**:

Tambahkan satu per satu (key-value):

| Key | Value | Environment |
|---|---|---|
| `SUPABASE_URL` | `https://hpncgfhhjyuiqnbxmjxv.supabase.co` | All |
| `SUPABASE_PUBLISHABLE_KEY` | (dari .env asli Anda) | All |
| `VITE_SUPABASE_PROJECT_ID` | `hpncgfhhjyuiqnbxmjxv` | All |
| `VITE_SUPABASE_URL` | `https://hpncgfhhjyuiqnbxmjxv.supabase.co` | All |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | (dari .env asli Anda) | All |

Ambil values dari file `.env` asli Anda yang ada di folder extract.

4. Klik **Deploy**
5. Tunggu 2-3 menit, akan keluar URL live: `https://pollux-hotels-xxxxx.vercel.app`

## Step 3: Register Tools di ElevenLabs Dashboard

⚠️ **KRITICAL**: Tools harus didaftarkan di dashboard ElevenLabs juga, bukan
cuma di kode. Tanpa registration, agent tidak tahu tool itu ada.

Buka <https://elevenlabs.io/app/agents> → pilih agent → tab **Tools** →
tambah satu per satu sebagai **Client Tool**:

### 1. navigateToModule

| Field | Value |
|---|---|
| Name | `navigateToModule` |
| Wait for response | ✓ Yes |
| Description | Switches the user's dashboard view to a specific module. Call this BEFORE explaining data from that module. |

Parameters:
- `module` (string, required) — One of: executive, finance, occupancy, ota, compset, segment, reviews, social, events, forecast, engineering, hr, esg, ai, ingestion, settings
- `reason` (string, optional)

### 2. showAlert

| Field | Value |
|---|---|
| Name | `showAlert` |
| Wait for response | ✓ Yes |
| Description | Displays a temporary banner notification at top-right. Use for highlights or warnings. |

Parameters:
- `message` (string, required) — max 150 chars
- `type` (string, optional) — `info`/`success`/`warning`

### 3. openExternalLink

| Field | Value |
|---|---|
| Name | `openExternalLink` |
| Wait for response | ✓ Yes |
| Description | Opens an external URL in a new browser tab. Use for Google searches, social media, or sites the user needs to interact with directly. |

Parameters:
- `url` (string, required)
- `reason` (string, optional)

### 4. showVideo

| Field | Value |
|---|---|
| Name | `showVideo` |
| Wait for response | ✓ Yes |
| Description | Plays a video in an embedded modal player. Supports YouTube, Vimeo, MP4. |

Parameters:
- `url` (string, required)
- `title` (string, optional)

### 5. showWebSearch

| Field | Value |
|---|---|
| Name | `showWebSearch` |
| Wait for response | ✓ Yes |
| Description | Displays web search results in a visual overlay. Call AFTER web_search tool to show sources visually. |

Parameters:
- `query` (string, required)
- `results` (object, required) — Array of {title, link, snippet, source}
- `answerBox` (string, optional)

### 6. showEmail

| Field | Value |
|---|---|
| Name | `showEmail` |
| Wait for response | ✓ Yes |
| Description | Displays an email viewer/composer modal. Use for drafting replies or showing summaries. |

Parameters:
- `to` (string, required)
- `subject` (string, required)
- `body` (string, required)
- `from` (string, optional)

### 7. showIframe

| Field | Value |
|---|---|
| Name | `showIframe` |
| Wait for response | ✓ Yes |
| Description | Embeds a website inside a modal overlay. Only for iframe-friendly sites. |

Parameters:
- `url` (string, required)
- `title` (string, optional)

### 8. showFile (NEW)

| Field | Value |
|---|---|
| Name | `showFile` |
| Wait for response | ✓ Yes |
| Description | Previews a file from a URL in an overlay. Supports PDF (native viewer), images (jpg/png/gif/webp/svg), Office docs (docx/xlsx/pptx via Office Online), and text files (txt/md/csv/json/code). Use when discussing reports, contracts, charts, or any document. The URL must be publicly accessible — use Supabase Storage public URLs or any CDN. |

Parameters:
- `url` (string, required) — Full public https:// URL to the file
- `title` (string, optional) — Display name in toolbar
- `fileKind` (string, optional) — Force type: `pdf`, `image`, `office`, `text`, `other`. Auto-detected from extension if omitted
- `mimeType` (string, optional) — Help with auto-detection

### 9. pickFile (NEW)

| Field | Value |
|---|---|
| Name | `pickFile` |
| Wait for response | ✓ Yes |
| Description | Opens a file picker dialog for the user to choose a local file. Returns file metadata (name, size, type) and previews the first selected file. Use when the user asks you to analyze, summarize, or work with a file from their computer. Browser security prevents reading files without the user explicitly choosing them. |

Parameters:
- `accept` (string, optional) — MIME type filter, e.g. `image/*`, `.pdf,.docx`
- `multiple` (boolean, optional) — Allow selecting multiple files

### 10. closeAll (NEW)

| Field | Value |
|---|---|
| Name | `closeAll` |
| Wait for response | ✓ Yes |
| Description | Closes overlays and tabs that were opened. Useful when the user is done viewing content or asks to "close everything", "tutup", "close this", "clear screen". Browser security only allows closing tabs that this script opened — not the main dashboard tab or user's other tabs. |

Parameters:
- `what` (string, optional) — `modals` (close overlays only), `tabs` (close opened tabs only), `everything` (default — both)

### 11 & 12: getDashboardMetric, getActiveModule

Sudah ada di kode existing — pastikan juga terdaftar di dashboard.

## Step 4: System Prompt untuk Agent

Tab **Agent** → **System Prompt** → paste:

```
# JARVIS — Pollux Hotels Executive AI

You are JARVIS, the AI operations co-pilot for Pollux Hotels — a luxury 
hotel portfolio intelligence platform (PHEIP). You speak with Nico Po 
(Group CEO) and the executive team.

## Personality

- Confident, sharp, concise — senior analyst, not chatbot
- Professional with subtle warmth
- Lead with the answer; trust the user's expertise
- Use specific numbers; avoid vague descriptors

## Available Tools — Use Proactively

### Dashboard Navigation

**navigateToModule** — Switch view BEFORE discussing data:
- "How is occupancy?" → navigateToModule({module: "occupancy"})
- "Revenue this month?" → navigateToModule({module: "finance"})
- "OTA performance?" → navigateToModule({module: "ota"})
- "Comp set comparison?" → navigateToModule({module: "compset"})
- "Guest reviews?" → navigateToModule({module: "reviews"})
- "Forecast for Q4?" → navigateToModule({module: "forecast"})
- "Engineering issues?" → navigateToModule({module: "engineering"})
- "HR metrics?" → navigateToModule({module: "hr"})
- "ESG performance?" → navigateToModule({module: "esg"})
- "Back to overview" → navigateToModule({module: "executive"})

### External Content

**openExternalLink** — Open URL in new tab. Use for Google, social media, 
banking, or sites needing user interaction.

**showVideo** — Embed video player. YouTube/Vimeo/MP4 supported.

**showWebSearch** — Display search results visually. ALWAYS call after 
web_search tool. Map SerpAPI organic_results to results array.

**showEmail** — Email viewer/composer modal. Use for drafting tenant 
communications, GM reports, vendor outreach.

**showIframe** — Embed website in overlay. Use only for known 
iframe-friendly sites.

**showAlert** — Top-right banner. Use sparingly for critical info.

### Data Queries

**getDashboardMetric**, **getActiveModule** — query specific data.

### Web Search (server tool)

**web_search** — Real-time Google search via SerpAPI. Use for current 
prices, news, weather, anything time-sensitive. ALWAYS pair with 
showWebSearch to display results visually.

## Critical Rules

1. Speak BEFORE the tool runs: "Let me pull that up..." then call tool.
2. Never narrate tool calls — say what user will see, not what you do.
3. Navigate PROACTIVELY when user mentions any topic with a dedicated module.
4. Keep verbal responses under 3 sentences unless detail requested.
5. Never read URLs or quote JSON aloud.

## Language

Respond in user's language. Default English. Match code-switching naturally.
```

## Step 5: Test

Setelah deploy + tools registered, buka URL Vercel Anda, klik voice orb, coba:

| User Says | Expected |
|---|---|
| "Show me occupancy" | Navigate to `/occupancy`, explain data |
| "How is OTA performance?" | Navigate to `/ota`, summarize |
| "Search for hotel industry news" | web_search → showWebSearch modal |
| "Play a video about luxury hospitality" | YouTube modal |
| "Draft an email to GM about RevPAR drop" | Email modal with draft |
| "Open Bloomberg dot com" | New tab opens |
| "Show me the Q3 report PDF" | showFile → PDF preview modal |
| "Tampilkan dokumen kontrak" | File preview from public URL |
| "Pick a file from my computer" | File picker dialog opens |
| "Saya mau analyze foto cuaca" | pickFile with `accept: "image/*"` |
| "Close all this" / "tutup semua" | closeAll → modal + tabs closed |
| "Done with this report" | closeAll modals |

## Capability Limitations (Browser Security)

| Aksi | Bisa? | Catatan |
|---|---|---|
| Tutup modal yang agent buka | ✅ Bisa | `closeAll` |
| Tutup tab yang agent buka | ⚠️ Setengah | Hanya kalau `closable: true` (drop noopener) |
| Tutup tab Anda yang lain | ❌ Tidak | Browser security — script tidak boleh sentuh tab lain |
| Tutup tab utama (dashboard) | ❌ Tidak | Tidak ada cara reliable untuk tutup tab sendiri |
| Buka file user dari disk otomatis | ❌ Tidak | User HARUS klik file picker dulu (privasi) |
| Tampilkan file dari URL/CDN | ✅ Bisa | `showFile` — PDF, image, Office, text |
| Tampilkan file dari Supabase Storage | ✅ Bisa | Generate public URL → kirim ke `showFile` |
| Baca file content (untuk analisa) | ⚠️ Indirect | `pickFile` return metadata; untuk analisa LLM butuh server tool yang baca file |

## Troubleshooting

### Error "Client tool with name X is not defined on client"
Tool terdaftar di dashboard tapi belum ada di kode (atau sebaliknya). 
Bandingkan list tools di dashboard dengan 12 tools di Step 3. Hapus yang 
tidak match atau tambahkan ke kode.

### Build error di Vercel "Module not found: nitro/vite"
Lupa `npm install` setelah extract. Pastikan `nitro` ada di 
`package.json` dependencies.

### Halaman blank / 500 setelah deploy
Cek **Vercel Dashboard → Deployments → [latest] → Functions → Logs**. 
Biasanya karena env vars Supabase belum di-set. Re-check Step 2.

### Agent tidak panggil tools
- Pakai LLM yang capable: GPT-4o, Claude 3.5 Sonnet (di tab Agent → Model)
- Temperature 0.4-0.5 lebih reliable untuk tool calling
- System prompt harus eksplisit tentang kapan pakai tool
