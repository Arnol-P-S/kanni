import { redirect } from "next/navigation";

import { homeForRole, requireActor } from "@/lib/auth";

export default async function PortalPage() {
  const actor = await requireActor();
  redirect(homeForRole(actor.role));
}
