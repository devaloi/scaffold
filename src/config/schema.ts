import * as yaml from "js-yaml";

export type VariableType = "string" | "boolean" | "multiselect";

export interface TemplateVariable {
  name: string;
  description: string;
  type: VariableType;
  required?: boolean;
  default?: string | boolean | string[];
  validate?: string;
  options?: string[];
}

export interface TemplateHook {
  command: string;
  description: string;
}

export interface TemplateManifest {
  name: string;
  description: string;
  version: string;
  variables: TemplateVariable[];
  hooks?: {
    post?: TemplateHook[];
  };
}

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

const VALID_TYPES: VariableType[] = ["string", "boolean", "multiselect"];

function validateVariable(variable: unknown, index: number): TemplateVariable {
  if (typeof variable !== "object" || variable === null) {
    throw new ManifestError(`Variable at index ${index} must be an object`);
  }

  const v = variable as Record<string, unknown>;

  if (typeof v["name"] !== "string" || v["name"].length === 0) {
    throw new ManifestError(
      `Variable at index ${index} must have a non-empty "name" string`,
    );
  }

  if (typeof v["description"] !== "string" || v["description"].length === 0) {
    throw new ManifestError(
      `Variable "${v["name"]}" must have a non-empty "description" string`,
    );
  }

  if (!VALID_TYPES.includes(v["type"] as VariableType)) {
    throw new ManifestError(
      `Variable "${v["name"]}" has invalid type "${String(v["type"])}". Must be one of: ${VALID_TYPES.join(", ")}`,
    );
  }

  const type = v["type"] as VariableType;

  if (type === "multiselect" && !Array.isArray(v["options"])) {
    throw new ManifestError(
      `Variable "${v["name"]}" of type "multiselect" must have an "options" array`,
    );
  }

  if (v["validate"] !== undefined && typeof v["validate"] !== "string") {
    throw new ManifestError(
      `Variable "${v["name"]}" validate must be a string regex pattern`,
    );
  }

  if (v["validate"] !== undefined) {
    try {
      new RegExp(v["validate"] as string);
    } catch {
      throw new ManifestError(
        `Variable "${v["name"]}" has invalid regex pattern: ${String(v["validate"])}`,
      );
    }
  }

  return {
    name: v["name"] as string,
    description: v["description"] as string,
    type,
    required: v["required"] === undefined ? undefined : Boolean(v["required"]),
    default: v["default"] as string | boolean | string[] | undefined,
    validate: v["validate"] as string | undefined,
    options: v["options"] as string[] | undefined,
  };
}

function validateHook(hook: unknown, index: number): TemplateHook {
  if (typeof hook !== "object" || hook === null) {
    throw new ManifestError(`Hook at index ${index} must be an object`);
  }
  const h = hook as Record<string, unknown>;

  if (typeof h["command"] !== "string" || h["command"].length === 0) {
    throw new ManifestError(
      `Hook at index ${index} must have a non-empty "command" string`,
    );
  }
  if (typeof h["description"] !== "string" || h["description"].length === 0) {
    throw new ManifestError(
      `Hook at index ${index} must have a non-empty "description" string`,
    );
  }

  return {
    command: h["command"],
    description: h["description"],
  };
}

export function parseManifest(content: string): TemplateManifest {
  const raw = yaml.load(content);

  if (typeof raw !== "object" || raw === null) {
    throw new ManifestError("Manifest must be a YAML object");
  }

  const doc = raw as Record<string, unknown>;

  if (typeof doc["name"] !== "string" || doc["name"].length === 0) {
    throw new ManifestError('Manifest must have a non-empty "name" string');
  }

  if (typeof doc["description"] !== "string" || doc["description"].length === 0) {
    throw new ManifestError('Manifest must have a non-empty "description" string');
  }

  if (typeof doc["version"] !== "string" || doc["version"].length === 0) {
    throw new ManifestError('Manifest must have a non-empty "version" string');
  }

  if (!Array.isArray(doc["variables"])) {
    throw new ManifestError('Manifest must have a "variables" array');
  }

  const variables = (doc["variables"] as unknown[]).map((v, i) =>
    validateVariable(v, i),
  );

  let hooks: TemplateManifest["hooks"] = undefined;

  if (doc["hooks"] !== undefined) {
    const hooksObj = doc["hooks"] as Record<string, unknown>;
    if (Array.isArray(hooksObj["post"])) {
      hooks = {
        post: (hooksObj["post"] as unknown[]).map((h, i) => validateHook(h, i)),
      };
    }
  }

  return {
    name: doc["name"],
    description: doc["description"],
    version: doc["version"],
    variables,
    hooks,
  };
}
