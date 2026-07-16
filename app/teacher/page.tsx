import type { Metadata } from "next";

import { TeacherDashboard } from "@/components/teacher-dashboard";

export const metadata: Metadata = {
  title: "Teacher review",
  description: "Review one activity and choose the learner's next strategy.",
};

export default function TeacherPage() {
  return <TeacherDashboard />;
}
