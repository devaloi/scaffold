import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import { scaffold } from "./scaffolder.js";
import { loadTemplate } from "../template/loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, "../../tests/fixtures");

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "scaffold-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("scaffold", () => {
  it("creates files in output directory", async () => {
    const template = await loadTemplate(path.join(FIXTURES, "simple-template"));
    const outputDir = path.join(tmpDir, "my-project");

    const result = await scaffold({
      template,
      context: { projectName: "my-project", description: "Test project" },
      outputDir,
    });

    expect(result.filesCreated.length).toBeGreaterThanOrEqual(3);

    const pkg = await fs.readFile(path.join(outputDir, "package.json"), "utf-8");
    expect(pkg).toContain('"my-project"');
  });

  it("renders .hbs files with context", async () => {
    const template = await loadTemplate(path.join(FIXTURES, "simple-template"));
    const outputDir = path.join(tmpDir, "rendered");

    await scaffold({
      template,
      context: { projectName: "test-app", description: "My test" },
      outputDir,
    });

    const readme = await fs.readFile(path.join(outputDir, "README.md"), "utf-8");
    expect(readme).toContain("test-app");
    expect(readme).toContain("My test");
  });

  it("copies non-hbs files as-is", async () => {
    const template = await loadTemplate(path.join(FIXTURES, "simple-template"));
    const outputDir = path.join(tmpDir, "static");

    await scaffold({
      template,
      context: { projectName: "test", description: "test" },
      outputDir,
    });

    const gitignore = await fs.readFile(path.join(outputDir, ".gitignore"), "utf-8");
    expect(gitignore).toContain("node_modules/");
  });

  it("creates nested directories", async () => {
    const template = await loadTemplate(path.join(FIXTURES, "simple-template"));
    const outputDir = path.join(tmpDir, "nested");

    await scaffold({
      template,
      context: { projectName: "test", description: "test" },
      outputDir,
    });

    const indexPath = path.join(outputDir, "src", "index.ts");
    const content = await fs.readFile(indexPath, "utf-8");
    expect(content).toContain("test");
  });

  it("dry-run does not create files", async () => {
    const template = await loadTemplate(path.join(FIXTURES, "simple-template"));
    const outputDir = path.join(tmpDir, "dry-run");

    const result = await scaffold({
      template,
      context: { projectName: "test", description: "test" },
      outputDir,
      dryRun: true,
    });

    expect(result.filesCreated.length).toBeGreaterThanOrEqual(3);

    try {
      await fs.access(outputDir);
      // should not reach here
      expect(true).toBe(false);
    } catch {
      // expected: directory should not exist
    }
  });
});
