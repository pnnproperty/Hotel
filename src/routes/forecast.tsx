import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/pheip/StubPage";
import { LineChart } from "lucide-react";
export const Route = createFileRoute("/forecast")({ head: () => ({ meta: [{ title: "Forecast — PHEIP" }] }), component: () => (
  <StubPage Icon={LineChart} eyebrow="PREDICTIVE INTELLIGENCE" title="Forecast & Budget"
    subtitle="AI-driven 90-day forecast and budget reconciliation."
    modules={[{label:"Forecast Accuracy",value:"96.8%"},{label:"90-Day Revenue",value:"Rp 88B"},{label:"Pickup",value:"+4.2%"},{label:"Budget Achievement",value:"108%"}]} />
)});
