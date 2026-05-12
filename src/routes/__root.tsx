import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Scripts, Link, useRouter } from "@tanstack/react-router";
import { Shell } from "@/components/pheip/Shell";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Pollux Hotels — Executive Intelligence Platform" },
      { name: "description", content: "Luxury hospitality executive intelligence and command center." },
      { property: "og:title", content: "Pollux Hotels — Executive Intelligence Platform" },
      { name: "twitter:title", content: "Pollux Hotels — Executive Intelligence Platform" },
      { property: "og:description", content: "Luxury hospitality executive intelligence and command center." },
      { name: "twitter:description", content: "Luxury hospitality executive intelligence and command center." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/022fe5ab-8370-4bc4-8838-6e2856cf8959/id-preview-461df008--26530f8a-8784-4ecf-9a0b-bc5e5c5c77ed.lovable.app-1778550436709.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/022fe5ab-8370-4bc4-8838-6e2856cf8959/id-preview-461df008--26530f8a-8784-4ecf-9a0b-bc5e5c5c77ed.lovable.app-1778550436709.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="text-center">
        <h1 className="font-display text-6xl gold-gradient-text">404</h1>
        <p className="text-muted-foreground mt-2">This wing of the hotel doesn't exist.</p>
        <Link to="/" className="inline-block mt-6 px-4 py-2 rounded-lg bg-[var(--gradient-gold)] text-[var(--onyx)] text-sm font-medium">Return to lobby</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="font-display text-2xl">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 px-4 py-2 rounded-lg bg-[var(--gradient-gold)] text-[var(--onyx)] text-sm">Retry</button>
        </div>
      </div>
    );
  },
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
    </QueryClientProvider>
  );
}
