import type { Metadata } from "next";

import { ClassElevenActivity } from "@/components/class-eleven-activity";

export const metadata: Metadata = {
  title: "Class 11 Linear Search",
  description:
    "A bounded linear-search lesson with project-authored questions and a disabled supervised-AI integration path.",
};

export default function ClassElevenPage() {
  return <ClassElevenActivity />;
}
