@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-gold: var(--gold);
  --color-gold-soft: var(--gold-soft);
  --color-emerald: var(--emerald);
  --color-emerald-soft: var(--emerald-soft);
  --color-platinum: var(--platinum);
  --color-onyx: var(--onyx);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --font-display: "Cormorant Garamond", "Playfair Display", serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

:root {
  --radius: 1rem;
  --background: oklch(0.13 0.005 270);
  --foreground: oklch(0.95 0.01 90);
  --card: oklch(0.16 0.008 270);
  --card-foreground: oklch(0.95 0.01 90);
  --popover: oklch(0.16 0.008 270);
  --popover-foreground: oklch(0.95 0.01 90);
  --primary: oklch(0.78 0.13 85);
  --primary-foreground: oklch(0.13 0.005 270);
  --secondary: oklch(0.22 0.01 270);
  --secondary-foreground: oklch(0.95 0.01 90);
  --muted: oklch(0.2 0.008 270);
  --muted-foreground: oklch(0.65 0.015 260);
  --accent: oklch(0.78 0.13 85);
  --accent-foreground: oklch(0.13 0.005 270);
  --destructive: oklch(0.65 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.25 0.01 270 / 60%);
  --input: oklch(0.22 0.01 270);
  --ring: oklch(0.78 0.13 85);

  --gold: oklch(0.78 0.13 85);
  --gold-soft: oklch(0.85 0.09 88);
  --emerald: oklch(0.72 0.17 162);
  --emerald-soft: oklch(0.82 0.12 162);
  --platinum: oklch(0.93 0.005 270);
  --onyx: oklch(0.09 0.005 270);

  --chart-1: oklch(0.78 0.13 85);
  --chart-2: oklch(0.72 0.17 162);
  --chart-3: oklch(0.68 0.14 220);
  --chart-4: oklch(0.7 0.18 25);
  --chart-5: oklch(0.62 0.18 305);

  --sidebar: oklch(0.1 0.005 270);
  --sidebar-foreground: oklch(0.85 0.01 90);
  --sidebar-primary: oklch(0.78 0.13 85);
  --sidebar-primary-foreground: oklch(0.13 0.005 270);
  --sidebar-accent: oklch(0.2 0.01 270);
  --sidebar-accent-foreground: oklch(0.95 0.01 90);
  --sidebar-border: oklch(0.25 0.01 270 / 50%);
  --sidebar-ring: oklch(0.78 0.13 85);

  --gradient-gold: linear-gradient(135deg, oklch(0.85 0.13 88), oklch(0.65 0.12 70));
  --gradient-emerald: linear-gradient(135deg, oklch(0.78 0.17 162), oklch(0.55 0.15 165));
  --gradient-onyx: linear-gradient(180deg, oklch(0.16 0.008 270), oklch(0.1 0.005 270));
  --glow-gold: 0 0 40px -8px oklch(0.78 0.13 85 / 60%);
  --glow-emerald: 0 0 40px -8px oklch(0.72 0.17 162 / 50%);
}

@layer base {
  * { border-color: var(--color-border); }
  html, body { background: var(--background); color: var(--foreground); }
  body {
    font-family: var(--font-sans);
    background-image:
      radial-gradient(ellipse 80% 50% at 20% 0%, oklch(0.78 0.13 85 / 6%), transparent 60%),
      radial-gradient(ellipse 60% 40% at 90% 100%, oklch(0.72 0.17 162 / 5%), transparent 60%),
      linear-gradient(180deg, oklch(0.09 0.005 270), oklch(0.13 0.005 270));
    background-attachment: fixed;
    min-height: 100vh;
  }
  h1, h2, h3 { font-family: var(--font-display); letter-spacing: -0.01em; }
}

@layer components {
  .glass {
    background: linear-gradient(180deg, oklch(1 0 0 / 4%), oklch(1 0 0 / 1.5%));
    backdrop-filter: blur(20px);
    border: 1px solid oklch(1 0 0 / 8%);
    box-shadow: 0 1px 0 0 oklch(1 0 0 / 6%) inset, 0 30px 60px -30px oklch(0 0 0 / 50%);
  }
  .glass-strong {
    background: linear-gradient(180deg, oklch(1 0 0 / 6%), oklch(1 0 0 / 2%));
    backdrop-filter: blur(28px);
    border: 1px solid oklch(1 0 0 / 10%);
  }
  .text-gold { color: var(--gold); }
  .text-emerald { color: var(--emerald); }
  .gold-gradient-text {
    background: var(--gradient-gold);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .hairline { border-top: 1px solid oklch(1 0 0 / 8%); }
  .kpi-glow:hover { box-shadow: var(--glow-gold); }
}

@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-ticker {
  animation: ticker-scroll 60s linear infinite;
}
.animate-ticker:hover { animation-play-state: paused; }

@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");
