import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { chromium } from "@playwright/test";

const runFile = promisify(execFile);
const diagramDirectory = resolve(process.cwd(), "docs/diagrams");
const renderDirectory = resolve(diagramDirectory, "render");
const specifications = [
  { name: "system-architecture", width: 1500, height: 1200 },
  { name: "agency-loop", width: 1540, height: 900 },
] as const;

async function main() {
  await mkdir(renderDirectory, { recursive: true });
  const browser = await chromium.launch();
  const outputs: string[] = [];

  try {
    for (const specification of specifications) {
      const page = await browser.newPage({
        viewport: {
          width: specification.width,
          height: specification.height,
        },
        deviceScaleFactor: 2,
        colorScheme: "light",
        reducedMotion: "reduce",
      });
      const source = resolve(
        diagramDirectory,
        `${specification.name}.html`,
      );
      const output = resolve(
        renderDirectory,
        `${specification.name}.png`,
      );
      await page.goto(pathToFileURL(source).href, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: output,
        fullPage: true,
        animations: "disabled",
      });
      await page.close();
      outputs.push(output);
      process.stdout.write(`Rendered ${specification.name}.png\n`);
    }
  } finally {
    await browser.close();
  }

  const cropScript = resolve(
    process.cwd(),
    "scripts/crop-rich-diagrams.py",
  );
  const { stdout } = await runFile("python3", [
    cropScript,
    "--pad",
    "10",
    ...outputs,
  ]);
  process.stdout.write(stdout);
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown diagram render failure.";
  process.stderr.write(`Rich diagram render stopped: ${message}\n`);
  process.exitCode = 1;
});
