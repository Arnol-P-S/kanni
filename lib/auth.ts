import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { SchoolRole, type Locale } from "@prisma/client";
import { compare } from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";

import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/auth-constants";
import { db } from "@/lib/db";
import { LOCALE_COOKIE } from "@/lib/i18n";

export { SESSION_COOKIE, SESSION_TTL_SECONDS };
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_ATTEMPT_LIMIT = 5;
const IP_ATTEMPT_LIMIT = 30;
const DUMMY_PASSWORD_HASH =
  "$2b$12$H16d6pYv/Bk4GHJ.gWLmBe9g6GihuUoigkW0S7CrlBqApY9T1XqiO";

export const LoginInputSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(320)
      .pipe(z.email())
      .transform((value) => value.toLowerCase()),
    password: z.string().min(8).max(128),
  })
  .strict();

export type Actor = {
  userId: string;
  membershipId: string;
  schoolId: string;
  schoolName: string;
  role: SchoolRole;
  email: string;
  displayName: string;
  locale: Locale;
};

export class AuthenticationError extends Error {
  constructor(
    readonly code: "invalid_credentials" | "rate_limited" | "configuration",
  ) {
    super(code);
    this.name = "AuthenticationError";
  }
}

function authSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new AuthenticationError("configuration");
  }
  return secret;
}

function sessionHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function throttleHash(kind: "email" | "ip", value: string): string {
  return createHmac("sha256", authSecret())
    .update(`${kind}:${value}`)
    .digest("hex");
}

async function requestNetworkKey(): Promise<string | null> {
  if (process.env.AUTH_TRUST_PROXY !== "true") return null;
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown"
  ).slice(0, 80);
}

async function activeThrottleCount(keyHash: string): Promise<number> {
  const entry = await db.loginThrottle.findUnique({ where: { keyHash } });
  if (!entry) return 0;
  if (entry.resetAt <= new Date()) {
    await db.loginThrottle.deleteMany({ where: { keyHash } });
    return 0;
  }
  return entry.failureCount;
}

async function assertLoginAllowed(
  email: string,
  networkKey: string | null,
): Promise<string[]> {
  const keys = [
    throttleHash("email", email),
    ...(networkKey ? [throttleHash("ip", networkKey)] : []),
  ];
  const failures = await Promise.all(
    keys.map((key) => activeThrottleCount(key)),
  );
  if (
    failures[0] >= EMAIL_ATTEMPT_LIMIT ||
    (networkKey !== null && failures[1] >= IP_ATTEMPT_LIMIT)
  ) {
    throw new AuthenticationError("rate_limited");
  }
  return keys;
}

async function recordLoginFailure(keys: string[]): Promise<void> {
  const resetAt = new Date(Date.now() + LOGIN_WINDOW_MS);
  await db.$transaction(
    keys.map((keyHash) =>
      db.loginThrottle.upsert({
        where: { keyHash },
        update: { failureCount: { increment: 1 }, resetAt },
        create: { keyHash, failureCount: 1, resetAt },
      }),
    ),
  );
}

function roleHome(role: SchoolRole): string {
  return `/portal/${role === SchoolRole.school_admin ? "admin" : role}`;
}

export function homeForRole(role: SchoolRole): string {
  return roleHome(role);
}

export async function loginWithPassword(input: z.infer<typeof LoginInputSchema>): Promise<Actor> {
  const networkKey = await requestNetworkKey();
  const throttleKeys = await assertLoginAllowed(input.email, networkKey);
  const user = await db.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      displayName: true,
      passwordHash: true,
      locale: true,
      isActive: true,
      memberships: {
        where: { isActive: true },
        select: {
          id: true,
          role: true,
          schoolId: true,
          school: { select: { name: true } },
        },
        take: 2,
      },
    },
  });

  const passwordValid = await compare(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  if (
    !user ||
    !user.isActive ||
    !passwordValid ||
    user.memberships.length !== 1
  ) {
    await recordLoginFailure(throttleKeys);
    throw new AuthenticationError("invalid_credentials");
  }

  const membership = user.memberships[0];
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await db.$transaction([
    db.loginThrottle.deleteMany({ where: { keyHash: { in: throttleKeys } } }),
    db.session.deleteMany({
      where: { userId: user.id, expiresAt: { lte: new Date() } },
    }),
    db.session.create({
      data: {
        tokenHash: sessionHash(token),
        userId: user.id,
        membershipId: membership.id,
        expiresAt,
      },
    }),
    db.auditEvent.create({
      data: {
        schoolId: membership.schoolId,
        actorUserId: user.id,
        action: "auth.login",
        entityType: "session",
        entityId: user.id,
      },
    }),
  ]);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    priority: "high",
  });
  (await cookies()).set(LOCALE_COOKIE, user.locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });

  return {
    userId: user.id,
    membershipId: membership.id,
    schoolId: membership.schoolId,
    schoolName: membership.school.name,
    role: membership.role,
    email: user.email,
    displayName: user.displayName,
    locale: user.locale,
  };
}

export const getCurrentActor = cache(async (): Promise<Actor | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sessionHash(token) },
    select: {
      id: true,
      expiresAt: true,
      lastSeenAt: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          locale: true,
          isActive: true,
        },
      },
      membership: {
        select: {
          id: true,
          userId: true,
          schoolId: true,
          role: true,
          isActive: true,
          school: { select: { name: true } },
        },
      },
    },
  });
  if (
    !session ||
    session.expiresAt <= new Date() ||
    !session.user.isActive ||
    !session.membership.isActive ||
    session.membership.userId !== session.user.id
  ) {
    return null;
  }

  if (Date.now() - session.lastSeenAt.getTime() > 15 * 60 * 1000) {
    await db.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });
  }

  return {
    userId: session.user.id,
    membershipId: session.membership.id,
    schoolId: session.membership.schoolId,
    schoolName: session.membership.school.name,
    role: session.membership.role,
    email: session.user.email,
    displayName: session.user.displayName,
    locale: session.user.locale,
  };
});

export async function requireActor(expectedRole?: SchoolRole): Promise<Actor> {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login?notice=session-required");
  if (expectedRole && actor.role !== expectedRole) redirect(roleHome(actor.role));
  return actor;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const current = await db.session.findUnique({
      where: { tokenHash: sessionHash(token) },
      select: { id: true, userId: true, membership: { select: { schoolId: true } } },
    });
    if (current) {
      await db.$transaction([
        db.session.delete({ where: { id: current.id } }),
        db.auditEvent.create({
          data: {
            schoolId: current.membership.schoolId,
            actorUserId: current.userId,
            action: "auth.logout",
            entityType: "session",
            entityId: current.id,
          },
        }),
      ]);
    }
  }
  cookieStore.delete(SESSION_COOKIE);
}
