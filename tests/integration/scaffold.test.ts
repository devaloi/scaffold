import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import { loadTemplate } from "../../src/template/loader.js";
import { scaffold } from "../../src/scaffold/scaffolder.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, "..", "fixtures");
const TEMPLATES = path.resolve(__dirname, "..", "..", "templates");

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "scaffold-integ-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("integration: scaffold from fixture", () => {
  it("scaffolds simple template end-to-end", async () => {
    const template = await loadTemplate(path.join(FIXTURES, "simple-template"));
    const outputDir = path.join(tmpDir, "my-project");

    const result = await scaffold({
      template,
      context: { projectName: "my-project", description: "Integration test" },
      outputDir,
    });

    expect(result.filesCreated).toContain("package.json");
    expect(result.filesCreated).toContain(path.join("src", "index.ts"));

    const pkg = JSON.parse(
      await fs.readFile(path.join(outputDir, "package.json"), "utf-8"),
    ) as { name: string };
    expect(pkg.name).toBe("my-project");
  });

  it("dry-run produces file list without writing", async () => {
    const template = await loadTemplate(path.join(FIXTURES, "simple-template"));
    const outputDir = path.join(tmpDir, "dry-project");

    const result = await scaffold({
      template,
      context: { projectName: "dry-project", description: "Dry run test" },
      outputDir,
      dryRun: true,
    });

    expect(result.filesCreated.length).toBeGreaterThan(0);
    const exists = await fs
      .access(outputDir)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });
});

describe("integration: scaffold from built-in templates", () => {
  it("scaffolds the api template", async () => {
    const template = await loadTemplate(path.join(TEMPLATES, "api"));
    const outputDir = path.join(tmpDir, "my-api");

    const result = await scaffold({
      template,
      context: {
        projectName: "my-api",
        description: "Test API",
        author: "test",
        useDocker: false,
        features: ["cors"],
      },
      outputDir,
    });

    expect(result.filesCreated).toContain("package.json");
    expect(result.filesCreated).toContain(path.join("src", "index.ts"));
    expect(result.filesCreated).toContain(
      path.join("src", "routes", "health.ts"),
    );

    const pkg = await fs.readFile(
      path.join(outputDir, "package.json"),
      "utf-8",
    );
    expect(pkg).toContain('"my-api"');
    expect(pkg).toContain("express");
  });

  it("scaffolds the cli template", async () => {
    const template = await loadTemplate(path.join(TEMPLATES, "cli"));
    const outputDir = path.join(tmpDir, "my-cli");

    const result = await scaffold({
      template,
      context: {
        projectName: "my-cli",
        description: "Test CLI",
        author: "",
      },
      outputDir,
    });

    expect(result.filesCreated).toContain("package.json");
    expect(result.filesCreated).toContain(path.join("src", "index.ts"));
  });

  it("scaffolds the library template", async () => {
    const template = await loadTemplate(path.join(TEMPLATES, "library"));
    const outputDir = path.join(tmpDir, "my-lib");

    const result = await scaffold({
      template,
      context: {
        projectName: "my-lib",
        description: "Test Library",
        author: "",
      },
      outputDir,
    });

    expect(result.filesCreated).toContain("package.json");
    expect(result.filesCreated).toContain(path.join("src", "index.ts"));
    expect(result.filesCreated).toContain(
      path.join("tests", "index.test.ts"),
    );
  });
});

describe("integration: custom template from local path", () => {
  it("loads and scaffolds from a local custom path", async () => {
    const customDir = path.join(tmpDir, "custom-template");
    const filesDir = path.join(customDir, "files");
    await fs.mkdir(filesDir, { recursive: true });

    await fs.writeFile(
      path.join(customDir, "template.yaml"),
      `
name: custom
description: Custom test template
version: "1.0.0"
variables:
  - name: projectName
    description: Name
    type: string
    required: true
`,
    );

    await fs.writeFile(
      path.join(filesDir, "index.ts.hbs"),
      'console.log("{{projectName}}");',
    );

    const template = await loadTemplate(customDir);
    const outputDir = path.join(tmpDir, "custom-output");

    const result = await scaffold({
      template,
      context: { projectName: "custom-project" },
      outputDir,
    });

    expect(result.filesCreated).toContain("index.ts");
    const content = await fs.readFile(
      path.join(outputDir, "index.ts"),
      "utf-8",
    );
    expect(content).toContain("custom-project");
  });
});
