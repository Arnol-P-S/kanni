import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  actorHasCapability,
  canAccessGrowthCycle,
  type ActorContext,
  type GrowthCapability,
} from "@/lib/demo-authorization";
import {
  demoPersonas,
  getDemoPersona,
  type DemoPersonaId,
  type DemoRole,
} from "@/lib/demo-fixtures";
import {
  createDemoSessionToken,
  createDemoWorkspaceToken,
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_TTL_SECONDS,
  DEMO_WORKSPACE_COOKIE,
  getDemoSessionSecret,
  verifyDemoSessionToken,
  verifyDemoWorkspaceToken,
} from "@/lib/demo-session";
import { createGrowthCycle, type GrowthCycle } from "@/lib/growth-cycle";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure:
    process.env.NODE_ENV === "production" &&
    process.env.DEMO_SECURE_COOKIES !== "false",
  path: "/",
  maxAge: DEMO_SESSION_TTL_SECONDS,
  priority: "high" as const,
};

export async function getDemoActor(): Promise<ActorContext | null> {
  const secret = getDemoSessionSecret();
  if (!secret) return null;
  const token = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
  const session = verifyDemoSessionToken(token, secret);
  if (!session) return null;
  const persona = getDemoPersona(session.personaId);
  return {
    personaId: persona.id,
    userId: `user:${persona.id}`,
    organizationId: "kanni-demo-community",
    membershipId: `membership:${persona.id}`,
    role: persona.role,
    assurance: "synthetic_demo",
    adultConfirmed: true,
  };
}

export async function requireDemoActor(
  expectedRole?: DemoRole,
): Promise<ActorContext> {
  const actor = await getDemoActor();
  if (!actor) redirect("/login?notice=session-required");
  if (expectedRole && actor.role !== expectedRole) {
    const persona = demoPersonas[actor.personaId as DemoPersonaId];
    redirect(`${persona.homePath}?notice=role-denied`);
  }
  return actor;
}

export async function readDemoCycle(): Promise<GrowthCycle> {
  const secret = getDemoSessionSecret();
  if (!secret) return createGrowthCycle();
  const token = (await cookies()).get(DEMO_WORKSPACE_COOKIE)?.value;
  return verifyDemoWorkspaceToken(token, secret) ?? createGrowthCycle();
}

export async function writeDemoCycle(cycle: GrowthCycle): Promise<void> {
  const secret = getDemoSessionSecret();
  if (!secret) throw new Error("Demo session configuration is unavailable.");
  const token = createDemoWorkspaceToken(cycle, secret);
  if (token.length > 3_800) {
    throw new Error("The synthetic demo workspace exceeded its safe cookie size.");
  }
  (await cookies()).set(DEMO_WORKSPACE_COOKIE, token, cookieOptions);
}

export async function startDemoSession(
  personaId: DemoPersonaId,
): Promise<void> {
  const secret = getDemoSessionSecret();
  if (!secret) throw new Error("Demo session configuration is unavailable.");
  const store = await cookies();
  store.set(
    DEMO_SESSION_COOKIE,
    createDemoSessionToken(personaId, secret),
    cookieOptions,
  );
  const current = verifyDemoWorkspaceToken(
    store.get(DEMO_WORKSPACE_COOKIE)?.value,
    secret,
  );
  if (!current) {
    store.set(
      DEMO_WORKSPACE_COOKIE,
      createDemoWorkspaceToken(createGrowthCycle(), secret),
      cookieOptions,
    );
  }
}

export async function endDemoSession(): Promise<void> {
  (await cookies()).delete(DEMO_SESSION_COOKIE);
}

export async function requireGrowthCapability(
  capability: GrowthCapability,
): Promise<{ actor: ActorContext; cycle: GrowthCycle }> {
  const actor = await requireDemoActor();
  const cycle = await readDemoCycle();
  if (
    !actorHasCapability(actor, capability) ||
    !canAccessGrowthCycle(actor, cycle, capability)
  ) {
    const persona = demoPersonas[actor.personaId as DemoPersonaId];
    redirect(`${persona.homePath}?notice=relationship-required`);
  }
  return { actor, cycle };
}
