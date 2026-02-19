import { describe, it, expect } from "vitest";
import { renderTemplate, renderFilename } from "./engine.js";

describe("renderTemplate", () => {
  it("substitutes simple variables", () => {
    const result = renderTemplate("Hello {{name}}!", { name: "world" });
    expect(result).toBe("Hello world!");
  });

  it("handles multiple variables", () => {
    const result = renderTemplate("{{greeting}} {{name}}!", {
      greeting: "Hi",
      name: "Alice",
    });
    expect(result).toBe("Hi Alice!");
  });

  it("handles conditional blocks (true)", () => {
    const result = renderTemplate(
      "Start{{#if useDocker}}\nDockerfile{{/if}}\nEnd",
      { useDocker: true },
    );
    expect(result).toContain("Dockerfile");
  });

  it("handles conditional blocks (false)", () => {
    const result = renderTemplate(
      "Start{{#if useDocker}}\nDockerfile{{/if}}\nEnd",
      { useDocker: false },
    );
    expect(result).not.toContain("Dockerfile");
  });

  it("handles iteration with each", () => {
    const result = renderTemplate(
      "{{#each features}}Feature: {{this}}\n{{/each}}",
      { features: ["auth", "cors"] },
    );
    expect(result).toContain("Feature: auth");
    expect(result).toContain("Feature: cors");
  });

  it("applies kebabCase helper", () => {
    const result = renderTemplate("{{kebabCase projectName}}", {
      projectName: "MyProject",
    });
    expect(result).toBe("my-project");
  });

  it("applies camelCase helper", () => {
    const result = renderTemplate("{{camelCase projectName}}", {
      projectName: "my-project",
    });
    expect(result).toBe("myProject");
  });

  it("applies pascalCase helper", () => {
    const result = renderTemplate("{{pascalCase projectName}}", {
      projectName: "my-project",
    });
    expect(result).toBe("MyProject");
  });

  it("applies upperCase helper", () => {
    const result = renderTemplate("{{upperCase projectName}}", {
      projectName: "my-project",
    });
    expect(result).toBe("MY-PROJECT");
  });

  it("handles empty template", () => {
    const result = renderTemplate("", { name: "test" });
    expect(result).toBe("");
  });

  it("does not escape HTML characters", () => {
    const result = renderTemplate("{{value}}", { value: "<div>&amp;</div>" });
    expect(result).toBe("<div>&amp;</div>");
  });
});

describe("renderFilename", () => {
  it("strips .hbs extension", () => {
    expect(renderFilename("package.json.hbs", {})).toBe("package.json");
  });

  it("renders variables in filename", () => {
    expect(renderFilename("{{projectName}}.ts.hbs", { projectName: "app" })).toBe(
      "app.ts",
    );
  });

  it("returns non-hbs filename unchanged", () => {
    expect(renderFilename(".gitignore", {})).toBe(".gitignore");
  });

  it("applies helpers in filename", () => {
    expect(
      renderFilename("{{kebabCase projectName}}.ts.hbs", {
        projectName: "MyProject",
      }),
    ).toBe("my-project.ts");
  });
});
