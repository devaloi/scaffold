import { describe, it, expect } from "vitest";
import { parseManifest, ManifestError } from "./schema.js";

const VALID_MANIFEST = `
name: api
description: Express API server with TypeScript
version: "1.0.0"

variables:
  - name: projectName
    description: Project name (kebab-case)
    type: string
    required: true
    validate: "^[a-z][a-z0-9-]*$"

  - name: description
    description: Project description
    type: string
    default: "A new project"

  - name: useDocker
    description: Include Dockerfile?
    type: boolean
    default: false

  - name: features
    description: Features to include
    type: multiselect
    options: [auth, database, cors]
    default: [cors]

hooks:
  post:
    - command: npm install
      description: Installing dependencies
    - command: git init
      description: Initializing git repository
`;

describe("parseManifest", () => {
  it("parses a valid manifest", () => {
    const manifest = parseManifest(VALID_MANIFEST);
    expect(manifest.name).toBe("api");
    expect(manifest.description).toBe("Express API server with TypeScript");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.variables).toHaveLength(4);
    expect(manifest.hooks?.post).toHaveLength(2);
  });

  it("parses variable types correctly", () => {
    const manifest = parseManifest(VALID_MANIFEST);
    expect(manifest.variables[0]?.type).toBe("string");
    expect(manifest.variables[0]?.required).toBe(true);
    expect(manifest.variables[0]?.validate).toBe("^[a-z][a-z0-9-]*$");
    expect(manifest.variables[2]?.type).toBe("boolean");
    expect(manifest.variables[2]?.default).toBe(false);
    expect(manifest.variables[3]?.type).toBe("multiselect");
    expect(manifest.variables[3]?.options).toEqual(["auth", "database", "cors"]);
  });

  it("throws on missing name", () => {
    expect(() =>
      parseManifest(`description: test\nversion: "1.0"\nvariables: []`),
    ).toThrow(ManifestError);
  });

  it("throws on missing description", () => {
    expect(() =>
      parseManifest(`name: test\nversion: "1.0"\nvariables: []`),
    ).toThrow(ManifestError);
  });

  it("throws on missing version", () => {
    expect(() =>
      parseManifest(`name: test\ndescription: test\nvariables: []`),
    ).toThrow(ManifestError);
  });

  it("throws on missing variables", () => {
    expect(() =>
      parseManifest(`name: test\ndescription: test\nversion: "1.0"`),
    ).toThrow(ManifestError);
  });

  it("throws on invalid variable type", () => {
    expect(() =>
      parseManifest(`
name: test
description: test
version: "1.0"
variables:
  - name: foo
    description: bar
    type: number
`),
    ).toThrow(/invalid type/);
  });

  it("throws on multiselect without options", () => {
    expect(() =>
      parseManifest(`
name: test
description: test
version: "1.0"
variables:
  - name: foo
    description: bar
    type: multiselect
`),
    ).toThrow(/options/);
  });

  it("throws on invalid regex pattern", () => {
    expect(() =>
      parseManifest(`
name: test
description: test
version: "1.0"
variables:
  - name: foo
    description: bar
    type: string
    validate: "[invalid"
`),
    ).toThrow(/invalid regex/i);
  });

  it("parses manifest without hooks", () => {
    const manifest = parseManifest(`
name: test
description: test
version: "1.0"
variables:
  - name: projectName
    description: Name
    type: string
`);
    expect(manifest.hooks).toBeUndefined();
  });

  it("throws on non-object input", () => {
    expect(() => parseManifest("just a string")).toThrow(ManifestError);
  });
});
