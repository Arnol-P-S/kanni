import { redirect } from "next/navigation";

import { demoPersonas, type DemoPersonaId } from "@/lib/demo-fixtures";
import { requireDemoActor } from "@/lib/demo-server";

export default async function PortalPage() {
  const actor = await requireDemoActor();
  redirect(demoPersonas[actor.personaId as DemoPersonaId].homePath);
}
