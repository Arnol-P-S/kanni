import { describe, expect, it } from "vitest";

import {
  actorHasCapability,
  canAccessGrowthCycle,
  type ActorContext,
} from "@/lib/demo-authorization";
import {
  createDemoSessionToken,
  createDemoWorkspaceToken,
  verifyDemoSessionToken,
  verifyDemoWorkspaceToken,
} from "@/lib/demo-session";
import { createGrowthCycle, mapSupportCircle } from "@/lib/growth-cycle";

const secret = "demo-test-secret-with-at-least-32-characters";
const start = new Date("2026-07-17T10:00:00.000Z");

function actor(role: ActorContext["role"]): ActorContext {
  return {
    personaId: `demo-${role}`,
    userId: `user-${role}`,
    organizationId: "kanni-demo-community",
    membershipId: `membership-${role}`,
    role,
    assurance: "synthetic_demo",
    adultConfirmed: true,
  };
}

describe("signed synthetic demo session", () => {
  it("accepts a valid token and rejects tampering and expiry", () => {
    const token = createDemoSessionToken("demo-admin-asha", secret, start);
    expect(verifyDemoSessionToken(token, secret, start)?.personaId).toBe(
      "demo-admin-asha",
    );
    expect(verifyDemoSessionToken(`${token}x`, secret, start)).toBeNull();
    expect(
      verifyDemoSessionToken(
        token,
        secret,
        new Date(start.getTime() + 2 * 60 * 60 * 1000),
      ),
    ).toBeNull();
  });

  it("signs and validates the compact workspace state", () => {
    const cycle = mapSupportCircle(createGrowthCycle(), "ml");
    const token = createDemoWorkspaceToken(cycle, secret);
    expect(verifyDemoWorkspaceToken(token, secret)?.mapping.guardianLinked).toBe(
      true,
    );
    expect(verifyDemoWorkspaceToken(`${token}x`, secret)).toBeNull();
  });
});

describe("role and relationship authorization", () => {
  const mapped = mapSupportCircle(createGrowthCycle(), "en");

  it("grants only the broad capability owned by the role", () => {
    expect(actorHasCapability(actor("student"), "submit_evidence")).toBe(true);
    expect(actorHasCapability(actor("student"), "review_evidence")).toBe(false);
    expect(actorHasCapability(actor("guardian"), "manage_mapping")).toBe(false);
  });

  it("requires the matching relationship for teacher, student, and guardian", () => {
    const unmapped = createGrowthCycle();
    expect(
      canAccessGrowthCycle(actor("teacher"), unmapped, "plan_instruction"),
    ).toBe(false);
    expect(
      canAccessGrowthCycle(actor("teacher"), mapped, "plan_instruction"),
    ).toBe(true);
    expect(
      canAccessGrowthCycle(actor("guardian"), mapped, "read_family_brief"),
    ).toBe(true);
  });
});
