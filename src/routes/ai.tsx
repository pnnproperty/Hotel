import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/pheip/StubPage";
import { Sparkles } from "lucide-react";
export const Route = createFileRoute("/ai")({ head: () => ({ meta: [{ title: "AI Assistant — PHEIP" }] }), component: () => (
  <StubPage Icon={Sparkles} eyebrow="ARTIFICIAL INTELLIGENCE" title="PHEIP · Executive AI"
    subtitle="Voice-activated luxury intelligence agent. Ask about any property, KPI, or strategy."
    modules={[{label:"Queries Today",value:"148"},{label:"Insights",value:"36"},{label:"Predictions",value:"12"},{label:"Latency",value:"0.4s"}]} />
)});
