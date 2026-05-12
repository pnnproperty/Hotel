import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/pheip/StubPage";
import { Users } from "lucide-react";
export const Route = createFileRoute("/hr")({ head: () => ({ meta: [{ title: "Human Capital — PHEIP" }] }), component: () => (
  <StubPage Icon={Users} eyebrow="PEOPLE INTELLIGENCE" title="Human Capital"
    subtitle="Headcount · Productivity · Engagement · Retention."
    modules={[{label:"Headcount",value:"1,284"},{label:"Engagement",value:"86%"},{label:"Retention",value:"94.2%"},{label:"Cost / Room",value:"Rp 184K"}]} />
)});
