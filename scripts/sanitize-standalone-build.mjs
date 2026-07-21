import { readdir, rm, unlink } from "node:fs/promises";
import { join } from "node:path";

const standaloneDirectory = join(process.cwd(), ".next", "standalone");
const developmentBuildDirectory = join(process.cwd(), ".next", "dev");

let entries = [];
try {
  entries = await readdir(standaloneDirectory);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const environmentFiles = entries.filter(
  (entry) => entry === ".env" || entry.startsWith(".env."),
);

await Promise.all(
  environmentFiles.map((entry) => unlink(join(standaloneDirectory, entry))),
);

if (environmentFiles.length > 0) {
  console.log(
    `Removed ${environmentFiles.length} environment file${environmentFiles.length === 1 ? "" : "s"} from the standalone build. Runtime configuration must be injected by the deployment environment.`,
  );
}

await rm(developmentBuildDirectory, { recursive: true, force: true });
