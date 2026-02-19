import { input, confirm, checkbox, select } from "@inquirer/prompts";
import type { TemplateVariable, TemplateManifest } from "../config/schema.js";
import type { TemplateContext } from "../template/engine.js";

export async function promptForVariables(
  variables: TemplateVariable[],
): Promise<TemplateContext> {
  const context: TemplateContext = {};

  for (const variable of variables) {
    const value = await promptForVariable(variable);
    context[variable.name] = value;
  }

  return context;
}

async function promptForVariable(
  variable: TemplateVariable,
): Promise<string | boolean | string[]> {
  switch (variable.type) {
    case "boolean":
      return confirm({
        message: variable.description,
        default: typeof variable.default === "boolean" ? variable.default : false,
      });

    case "multiselect": {
      const options = variable.options ?? [];
      const defaults = Array.isArray(variable.default) ? variable.default : [];
      return checkbox({
        message: variable.description,
        choices: options.map((opt) => ({
          name: opt,
          value: opt,
          checked: defaults.includes(opt),
        })),
      });
    }

    case "string":
    default:
      return input({
        message: variable.description,
        default: typeof variable.default === "string" ? variable.default : undefined,
        validate: (val: string) => {
          if (variable.required && val.trim().length === 0) {
            return `${variable.name} is required`;
          }
          if (variable.validate) {
            const regex = new RegExp(variable.validate);
            if (!regex.test(val)) {
              return `Must match pattern: ${variable.validate}`;
            }
          }
          return true;
        },
      });
  }
}

export async function promptForTemplate(manifests: TemplateManifest[]): Promise<string> {
  return select({
    message: "Select a template",
    choices: manifests.map((m) => ({
      name: `${m.name} — ${m.description}`,
      value: m.name,
    })),
  });
}

export function buildContextFromFlags(
  flags: Record<string, string | boolean | undefined>,
  variables: TemplateVariable[],
): TemplateContext {
  const context: TemplateContext = {};

  for (const variable of variables) {
    const flagValue = flags[variable.name];

    if (flagValue !== undefined) {
      if (variable.type === "boolean") {
        context[variable.name] = flagValue === "true" || flagValue === true;
      } else if (variable.type === "multiselect" && typeof flagValue === "string") {
        context[variable.name] = flagValue.split(",").map((s) => s.trim());
      } else {
        context[variable.name] = flagValue;
      }
    } else if (variable.default !== undefined) {
      context[variable.name] = variable.default;
    }
  }

  return context;
}
