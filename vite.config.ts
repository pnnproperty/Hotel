// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

// Deployment target: Vercel.
// We disable Lovable's bundled Cloudflare plugin and replace it with Nitro's
// Vercel preset, which generates the .vercel/output/ directory Vercel expects.
//
// We do NOT redirect tanstackStart.server.entry to ./src/server.ts here,
// because that file uses a Cloudflare Workers fetch handler signature
// `{ fetch(request, env, ctx) }` which Nitro's Vercel preset cannot use.
// Nitro generates its own Vercel-compatible server entry from the
// TanStack Start handler.
export default defineConfig({
  cloudflare: false,
  vite: {
    plugins: [nitro({ preset: "vercel" })],
  },
});
