import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/pheip/StubPage";
import { Leaf } from "lucide-react";
export const Route = createFileRoute("/esg")({ head: () => ({ meta: [{ title: "ESG — PHEIP" }] }), component: () => (
  <StubPage Icon={Leaf} eyebrow="SUSTAINABILITY" title="ESG Performance"
    subtitle="Energy intensity · Water · Carbon · Community impact."
    modules={[{label:"CO₂ / room/night",value:"12.4kg",note:"-8% YoY"},{label:"Water / guest",value:"218L"},{label:"Waste Diverted",value:"68%"},{label:"ESG Score",value:"A-"}]} />
)});
