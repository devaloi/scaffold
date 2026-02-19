import { describe, it, expect } from "vitest";
import { extractVariables, crossReference } from "./variables.js";
import type { TemplateVariable } from "../config/schema.js";

describe("extractVariables", () => {
  it("extracts simple variables", () => {
    const vars = extractVariables(["Hello {{name}}, welcome to {{project}}"]);
    expect(vars).toContain("name");
    expect(vars).toContain("project");
  });

  it("extracts variables from conditionals", () => {
    const vars = extractVariables(["{{#if useDocker}}Dockerfile{{/if}}"]);
    expect(vars).toContain("useDocker");
  });

  it("extracts variables from each blocks", () => {
    const vars = extractVariables(["{{#each features}}{{this}}{{/each}}"]);
    expect(vars).toContain("features");
  });

  it("extracts variables from helper calls", () => {
    const vars = extractVariables(["{{kebabCase projectName}}"]);
    expect(vars).toContain("projectName");
  });

  it("handles multiple templates", () => {
    const vars = extractVariables(["{{name}}", "{{version}}"]);
    expect(vars).toContain("name");
    expect(vars).toContain("version");
  });

  it("deduplicates variables", () => {
    const vars = extractVariables(["{{name}} {{name}}"]);
    expect(vars.size).toBe(1);
  });

  it("returns empty set for no variables", () => {
    const vars = extractVariables(["no variables here"]);
    expect(vars.size).toBe(0);
  });
});

describe("crossReference", () => {
  const makeVar = (name: string): TemplateVariable => ({
    name,
    description: "test",
    type: "string",
  });

  it("identifies matching variables", () => {
    const result = crossReference(
      [makeVar("name"), makeVar("version")],
      ["{{name}} {{version}}"],
    );
    expect(result.undefined).toHaveLength(0);
    expect(result.unused).toHaveLength(0);
  });

  it("identifies undefined variables", () => {
    const result = crossReference([makeVar("name")], ["{{name}} {{unknown}}"]);
    expect(result.undefined).toContain("unknown");
  });

  it("identifies unused variables", () => {
    const result = crossReference([makeVar("name"), makeVar("unused")], ["{{name}}"]);
    expect(result.unused).toContain("unused");
  });

  it("handles empty templates", () => {
    const result = crossReference([makeVar("name")], []);
    expect(result.unused).toContain("name");
    expect(result.undefined).toHaveLength(0);
  });
});
