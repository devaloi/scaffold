import type { TemplateVariable } from "../config/schema.js";

const VARIABLE_PATTERN = /\{\{(?:#(?:if|each|unless)\s+)?([a-zA-Z_]\w*)\}\}/g;
const HELPER_CALL_PATTERN =
  /\{\{(?:kebabCase|camelCase|pascalCase|upperCase)\s+([a-zA-Z_]\w*)\}\}/g;

export function extractVariables(templates: string[]): Set<string> {
  const variables = new Set<string>();

  for (const template of templates) {
    for (const match of template.matchAll(VARIABLE_PATTERN)) {
      const name = match[1];
      if (name !== undefined) {
        variables.add(name);
      }
    }
    for (const match of template.matchAll(HELPER_CALL_PATTERN)) {
      const name = match[1];
      if (name !== undefined) {
        variables.add(name);
      }
    }
  }

  return variables;
}

export interface CrossReferenceResult {
  defined: string[];
  used: string[];
  undefined: string[];
  unused: string[];
}

export function crossReference(
  manifestVariables: TemplateVariable[],
  templateContent: string[],
): CrossReferenceResult {
  const defined = manifestVariables.map((v) => v.name);
  const used = [...extractVariables(templateContent)];

  const definedSet = new Set(defined);
  const usedSet = new Set(used);

  const undefinedVars = used.filter((v) => !definedSet.has(v));
  const unusedVars = defined.filter((v) => !usedSet.has(v));

  return {
    defined,
    used: [...usedSet],
    undefined: undefinedVars,
    unused: unusedVars,
  };
}
