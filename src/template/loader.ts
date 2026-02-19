import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseManifest, type TemplateManifest } from "../config/schema.js";
import { readFile, pathExists, isDirectory } from "../utils/fs.js";

export interface TemplateFile {
  relativePath: string;
  absolutePath: string;
  isHbs: boolean;
}

export interface LoadedTemplate {
  manifest: TemplateManifest;
  files: TemplateFile[];
  basePath: string;
}

export class TemplateLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateLoadError";
  }
}

async function walkDir(dir: string, base: string): Promise<TemplateFile[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: TemplateFile[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(base, fullPath);

    if (entry.isDirectory()) {
      const nested = await walkDir(fullPath, base);
      files.push(...nested);
    } else {
      files.push({
        relativePath,
        absolutePath: fullPath,
        isHbs: entry.name.endsWith(".hbs"),
      });
    }
  }

  return files;
}

export async function loadTemplate(templateDir: string): Promise<LoadedTemplate> {
  if (!(await isDirectory(templateDir))) {
    throw new TemplateLoadError(`Template directory does not exist: ${templateDir}`);
  }

  const manifestPath = path.join(templateDir, "template.yaml");
  if (!(await pathExists(manifestPath))) {
    throw new TemplateLoadError(`Missing template.yaml in ${templateDir}`);
  }

  const manifestContent = await readFile(manifestPath);
  const manifest = parseManifest(manifestContent);

  const filesDir = path.join(templateDir, "files");
  if (!(await isDirectory(filesDir))) {
    throw new TemplateLoadError(`Missing files/ directory in ${templateDir}`);
  }

  const files = await walkDir(filesDir, filesDir);

  return {
    manifest,
    files,
    basePath: filesDir,
  };
}

export async function listBuiltinTemplates(
  templatesDir: string,
): Promise<TemplateManifest[]> {
  const entries = await fs.readdir(templatesDir, { withFileTypes: true });
  const manifests: TemplateManifest[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(templatesDir, entry.name, "template.yaml");
    if (await pathExists(manifestPath)) {
      const content = await readFile(manifestPath);
      try {
        manifests.push(parseManifest(content));
      } catch {
        // skip invalid templates
      }
    }
  }

  return manifests;
}
