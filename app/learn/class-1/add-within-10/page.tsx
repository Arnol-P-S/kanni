import type { Metadata } from "next";

import { ClassOneActivity } from "@/components/class-one-activity";

export const metadata: Metadata = {
  title: "Class 1 Addition within 10",
  description: "An adult-assisted, Malayalam-first addition activity.",
};

export default function ClassOnePage() {
  return <ClassOneActivity />;
}
