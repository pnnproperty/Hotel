import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/pheip/StubPage";
import { Hash } from "lucide-react";
export const Route = createFileRoute("/social")({ head: () => ({ meta: [{ title: "Social — PHEIP" }] }), component: () => (
  <StubPage Icon={Hash} eyebrow="BRAND INTELLIGENCE" title="Social Media Performance"
    subtitle="Instagram · TikTok · Facebook · LinkedIn unified analytics."
    modules={[{label:"Followers",value:"248K",note:"+8.4%"},{label:"Engagement",value:"6.2%",note:"vs 4.1 industry"},{label:"Reach",value:"1.42M"},{label:"Top Content",value:"Reels"}]} />
)});
