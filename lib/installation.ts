import "server-only";

import { db } from "@/lib/db";

export async function isInstallationConfigured(): Promise<boolean> {
  return (await db.school.findFirst({ select: { id: true } })) !== null;
}
