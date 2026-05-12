import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/pheip/StubPage";
import { CalendarHeart } from "lucide-react";
export const Route = createFileRoute("/events")({ head: () => ({ meta: [{ title: "Events — PHEIP" }] }), component: () => (
  <StubPage Icon={CalendarHeart} eyebrow="EVENTS INTELLIGENCE" title="Events & Banquet Pipeline"
    subtitle="Weddings · MICE · Ballroom utilization · Lead funnel."
    modules={[{label:"Event Revenue",value:"Rp 3.2B",note:"+18%"},{label:"Wedding Bookings",value:"42"},{label:"Ballroom Util.",value:"74%"},{label:"Conversion",value:"36.8%"}]} />
)});
