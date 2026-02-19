import Handlebars from "handlebars";

export type TemplateContext = Record<string, string | boolean | string[]>;

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ""))
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toUpperCase(str: string): string {
  return str.toUpperCase();
}

function registerHelpers(instance: typeof Handlebars): void {
  instance.registerHelper(
    "kebabCase",
    (value: string) => new Handlebars.SafeString(toKebabCase(value)),
  );
  instance.registerHelper(
    "camelCase",
    (value: string) => new Handlebars.SafeString(toCamelCase(value)),
  );
  instance.registerHelper(
    "pascalCase",
    (value: string) => new Handlebars.SafeString(toPascalCase(value)),
  );
  instance.registerHelper(
    "upperCase",
    (value: string) => new Handlebars.SafeString(toUpperCase(value)),
  );
}

let helpersRegistered = false;

function ensureHelpers(): void {
  if (!helpersRegistered) {
    registerHelpers(Handlebars);
    helpersRegistered = true;
  }
}

export function renderTemplate(template: string, context: TemplateContext): string {
  ensureHelpers();
  const compiled = Handlebars.compile(template, { noEscape: true });
  return compiled(context);
}

export function renderFilename(filename: string, context: TemplateContext): string {
  if (!filename.includes("{{")) {
    return filename.replace(/\.hbs$/, "");
  }
  ensureHelpers();
  const compiled = Handlebars.compile(filename, { noEscape: true });
  return compiled(context).replace(/\.hbs$/, "");
}
