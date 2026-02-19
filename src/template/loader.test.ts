import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { loadTemplate, TemplateLoadError } from "./loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(__dirname, "../../tests/fixtures");

describe("loadTemplate", () => {
  it("loads a valid template directory", async () => {
    const template = await loadTemplate(path.join(FIXTURES, "simple-template"));
    expect(template.manifest.name).toBe("simple");
    expect(template.manifest.variables).toHaveLength(2);
    expect(template.files.length).toBeGreaterThanOrEqual(3);
  });

  it("finds .hbs files", async () => {
    const template = await loadTemplate(path.join(FIXTURES, "simple-template"));
    const hbsFiles = template.files.filter((f) => f.isHbs);
    expect(hbsFiles.length).toBeGreaterThanOrEqual(2);
  });

  it("finds non-hbs files", async () => {
    const template = await loadTemplate(path.join(FIXTURES, "simple-template"));
    const staticFiles = template.files.filter((f) => !f.isHbs);
    expect(staticFiles.length).toBeGreaterThanOrEqual(1);
  });

  it("resolves nested directory structure", async () => {
    const template = await loadTemplate(path.join(FIXTURES, "simple-template"));
    const srcFiles = template.files.filter((f) => f.relativePath.startsWith("src"));
    expect(srcFiles.length).toBeGreaterThanOrEqual(1);
  });

  it("throws on non-existent directory", async () => {
    await expect(loadTemplate(path.join(FIXTURES, "nonexistent"))).rejects.toThrow(
      TemplateLoadError,
    );
  });

  it("throws on missing template.yaml", async () => {
    await expect(loadTemplate(path.join(FIXTURES))).rejects.toThrow(TemplateLoadError);
  });
});
