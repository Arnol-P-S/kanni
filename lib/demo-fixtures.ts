import { z } from "zod";

export const DemoRoleSchema = z.enum([
  "tenant_admin",
  "teacher",
  "student",
  "guardian",
]);
export type DemoRole = z.infer<typeof DemoRoleSchema>;

export const DemoPersonaIdSchema = z.enum([
  "demo-admin-asha",
  "demo-teacher-meera",
  "demo-student-diya",
  "demo-guardian-arun",
]);
export type DemoPersonaId = z.infer<typeof DemoPersonaIdSchema>;

export type DemoPersona = {
  id: DemoPersonaId;
  displayName: string;
  role: DemoRole;
  roleLabel: string;
  description: string;
  homePath: string;
};

export const DEMO_ORGANIZATION_ID = "kanni-demo-community";
export const DEMO_GROUP_ID = "learning-circle-a";
export const DEMO_LEARNER_ID = "learner-diya";

export const demoPersonas: Record<DemoPersonaId, DemoPersona> = {
  "demo-admin-asha": {
    id: "demo-admin-asha",
    displayName: "Asha",
    role: "tenant_admin",
    roleLabel: "Community administrator",
    description: "Maps the synthetic support circle and reviews operations.",
    homePath: "/portal/admin",
  },
  "demo-teacher-meera": {
    id: "demo-teacher-meera",
    displayName: "Meera",
    role: "teacher",
    roleLabel: "Teacher",
    description: "Plans, publishes, reviews evidence, and approves family support.",
    homePath: "/portal/teacher",
  },
  "demo-student-diya": {
    id: "demo-student-diya",
    displayName: "Diya",
    role: "student",
    roleLabel: "Student",
    description: "Attempts the goal, chooses support, retries, and explains thinking.",
    homePath: "/portal/student",
  },
  "demo-guardian-arun": {
    id: "demo-guardian-arun",
    displayName: "Arun",
    role: "guardian",
    roleLabel: "Parent or guardian",
    description: "Receives one reviewed update and returns a small home signal.",
    homePath: "/portal/parent",
  },
};

export const demoPersonaList = DemoPersonaIdSchema.options.map(
  (personaId) => demoPersonas[personaId],
);

export function getDemoPersona(
  personaId: DemoPersonaId,
): DemoPersona {
  return demoPersonas[personaId];
}
