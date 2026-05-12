import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/pheip/StubPage";
import { Star } from "lucide-react";
export const Route = createFileRoute("/reviews")({ head: () => ({ meta: [{ title: "Reviews — PHEIP" }] }), component: () => (
  <StubPage Icon={Star} eyebrow="REPUTATION INTELLIGENCE" title="Guest Sentiment & Reviews"
    subtitle="Google · Booking · Agoda · TripAdvisor · Traveloka aggregated reputation."
    modules={[{label:"Avg Score",value:"9.16",note:"+0.8% MoM"},{label:"Reviews MTD",value:"1,284"},{label:"Sentiment",value:"94%",note:"Positive"},{label:"Response Rate",value:"98.4%"}]} />
)});
