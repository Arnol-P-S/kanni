import { readFile } from "node:fs/promises";

import { parse } from "dotenv";

import { ProductionEnvironmentSchema } from "../lib/production-environment";

async function main(): Promise<void> {
  const environmentPath =
    process.argv.slice(2).find((argument) => argument !== "--") ||
    ".env.production";
  const contents = await readFile(environmentPath, "utf8");
  const result = ProductionEnvironmentSchema.safeParse(parse(contents));
  if (!result.success) {
    const failures = result.error.issues.map((issue) => {
      const field = issue.path.join(".") || "environment";
      return `- ${field}: ${issue.message}`;
    });
    throw new Error(`Production environment validation failed:\n${failures.join("\n")}`);
  }
  process.stdout.write("Production environment validation passed.\n");
}

void main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Environment validation failed."}\n`,
  );
  process.exitCode = 1;
});
