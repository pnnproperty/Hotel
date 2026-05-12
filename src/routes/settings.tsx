import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/pheip/StubPage";
import { Settings } from "lucide-react";
export const Route = createFileRoute("/settings")({ head: () => ({ meta: [{ title: "Settings — PHEIP" }] }), component: () => (
  <StubPage Icon={Settings} eyebrow="ADMINISTRATION" title="Platform Settings"
    subtitle="Users, roles, data sources and integrations."
    modules={[{label:"Users",value:"34"},{label:"Properties",value:"6"},{label:"Integrations",value:"12"},{label:"Uptime",value:"99.98%"}]} />
)});
