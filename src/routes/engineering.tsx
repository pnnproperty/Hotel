import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/pheip/StubPage";
import { Wrench } from "lucide-react";
export const Route = createFileRoute("/engineering")({ head: () => ({ meta: [{ title: "Engineering — PHEIP" }] }), component: () => (
  <StubPage Icon={Wrench} eyebrow="OPERATIONS INTELLIGENCE" title="Engineering & Assets"
    subtitle="Work orders · Maintenance · Asset health · Energy · CAPEX."
    modules={[{label:"Open Tickets",value:"42"},{label:"Asset Health",value:"96.4%",note:"Optimal"},{label:"Energy (kWh)",value:"412K"},{label:"CAPEX YTD",value:"Rp 6.1B"}]} />
)});
