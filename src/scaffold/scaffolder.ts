import * as path from "node:path";
import type { LoadedTemplate } from "../template/loader.js";
import type { TemplateContext } from "../template/engine.js";
import { renderTemplate, renderFilename } from "../template/engine.js";
import { readFile, writeFile, copyFile, ensureDir, isBinaryFile } from "../utils/fs.js";

export interface ScaffoldResult {
  outputDir: string;
  filesCreated: string[];
  directoriesCreated: string[];
}

export interface ScaffoldOptions {
  template: LoadedTemplate;
  context: TemplateContext;
  outputDir: string;
  dryRun?: boolean;
}

export async function scaffold(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const { template, context, outputDir, dryRun = false } = options;

  const filesCreated: string[] = [];
  const directoriesCreated = new Set<string>();

  if (!dryRun) {
    await ensureDir(outputDir);
  }
  directoriesCreated.add(outputDir);

  for (const file of template.files) {
    const renderedRelPath = renderFilePath(file.relativePath, context);
    const destPath = path.join(outputDir, renderedRelPath);
    const destDir = path.dirname(destPath);

    if (!directoriesCreated.has(destDir)) {
      directoriesCreated.add(destDir);
      if (!dryRun) {
        await ensureDir(destDir);
      }
    }

    if (isBinaryFile(file.absolutePath)) {
      if (!dryRun) {
        await copyFile(file.absolutePath, destPath);
      }
      filesCreated.push(renderedRelPath);
      continue;
    }

    if (file.isHbs) {
      const content = await readFile(file.absolutePath);
      const rendered = renderTemplate(content, context);
      if (!dryRun) {
        await writeFile(destPath, rendered);
      }
      filesCreated.push(renderedRelPath);
    } else {
      if (!dryRun) {
        await copyFile(file.absolutePath, destPath);
      }
      filesCreated.push(renderedRelPath);
    }
  }

  return {
    outputDir,
    filesCreated,
    directoriesCreated: [...directoriesCreated],
  };
}

function renderFilePath(relativePath: string, context: TemplateContext): string {
  const parts = relativePath.split(path.sep);
  const rendered = parts.map((part) => renderFilename(part, context));
  return rendered.join(path.sep);
}
