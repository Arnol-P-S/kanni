import type { Metadata } from "next";

import { ParentDashboard } from "@/components/parent-dashboard";

export const metadata: Metadata = {
  title: "Parent handoff",
  description: "One plain-language activity summary and one home prompt.",
};

export default function ParentPage() {
  return <ParentDashboard />;
}
