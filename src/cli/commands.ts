import * as path from "node:path";
import * as url from "node:url";
import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { loadTemplate, listBuiltinTemplates } from "../template/loader.js";
import { scaffold } from "../scaffold/scaffolder.js";
import { runHooks } from "../scaffold/hooks.js";
import {
  promptForVariables,
  promptForTemplate,
  buildContextFromFlags,
} from "./prompts.js";
import {
  formatFileTree,
  successMessage,
  dryRunBanner,
  doneMessage,
  errorMessage,
} from "./output.js";
import { parseManifest } from "../config/schema.js";
import { readFile, pathExists } from "../utils/fs.js";
import { isGitUrl, cloneRepo } from "../utils/git.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getTemplatesDir(): string {
  return path.resolve(__dirname, "..", "..", "templates");
}

export function registerCommands(program: Command): void {
  program
    .command("new [template]")
    .description("Scaffold a new project from a template")
    .option("--name <name>", "Project name")
    .option("--from <source>", "Custom template path or git URL")
    .option("--dry-run", "Preview files without creating them")
    .option("--no-hooks", "Skip post-scaffold hooks")
    .option("--verbose", "Show detailed output")
    .option("--output <dir>", "Output directory (defaults to ./<name>)")
    .action(async (templateName: string | undefined, options: NewCommandOptions) => {
      await runNewCommand(templateName, options);
    });

  program
    .command("list")
    .description("List available built-in templates")
    .action(async () => {
      await runListCommand();
    });

  program
    .command("validate <path>")
    .description("Validate a template directory")
    .action(async (templatePath: string) => {
      await runValidateCommand(templatePath);
    });
}

interface NewCommandOptions {
  name?: string;
  from?: string;
  dryRun?: boolean;
  hooks?: boolean;
  verbose?: boolean;
  output?: string;
}

async function runNewCommand(
  templateName: string | undefined,
  options: NewCommandOptions,
): Promise<void> {
  try {
    let templateDir: string;
    let cleanupDir: string | undefined;

    if (options.from) {
      if (isGitUrl(options.from)) {
        const spinner = ora("Cloning template repository...").start();
        try {
          cleanupDir = await cloneRepo(options.from);
          templateDir = cleanupDir;
          spinner.succeed("Template repository cloned");
        } catch (err) {
          spinner.fail("Failed to clone template repository");
          console.error(errorMessage(err instanceof Error ? err.message : String(err)));
          process.exitCode = 1;
          return;
        }
      } else {
        templateDir = path.resolve(options.from);
      }
    } else {
      const templatesDir = getTemplatesDir();

      if (!templateName) {
        const manifests = await listBuiltinTemplates(templatesDir);
        if (manifests.length === 0) {
          console.error(errorMessage("No built-in templates found"));
          process.exitCode = 1;
          return;
        }
        templateName = await promptForTemplate(manifests);
      }

      templateDir = path.join(templatesDir, templateName);
    }

    const template = await loadTemplate(templateDir);

    console.log(
      "\n" +
        successMessage(
          `Template: ${chalk.bold(template.manifest.name)} (${template.manifest.description})`,
        ),
    );

    const flagContext: Record<string, string | boolean | undefined> = {};
    if (options.name) {
      flagContext["projectName"] = options.name;
      flagContext["name"] = options.name;
    }

    const hasAllRequired = template.manifest.variables
      .filter((v) => v.required)
      .every((v) => flagContext[v.name] !== undefined || v.default !== undefined);

    let context;
    if (hasAllRequired && options.name) {
      context = buildContextFromFlags(flagContext, template.manifest.variables);
    } else {
      context = await promptForVariables(template.manifest.variables);
    }

    const projectName =
      typeof context["projectName"] === "string"
        ? context["projectName"]
        : typeof context["name"] === "string"
          ? context["name"]
          : (options.name ?? "project");
    const outputDir = options.output ?? path.resolve(process.cwd(), projectName);

    if (options.dryRun) {
      console.log(dryRunBanner());
    }

    const spinner = ora("Creating project...").start();
    const result = await scaffold({
      template,
      context,
      outputDir,
      dryRun: options.dryRun,
    });
    spinner.succeed("Project structure created");

    console.log("\n" + formatFileTree(result.filesCreated, projectName));

    if (options.dryRun) {
      console.log(chalk.yellow("\n  No files were created (dry-run mode)\n"));
      return;
    }

    if (options.hooks !== false && template.manifest.hooks?.post) {
      console.log(chalk.dim("\n  Running post-scaffold hooks...\n"));
      await runHooks(template.manifest.hooks.post, outputDir, {
        onStart: (hook) => {
          process.stdout.write(chalk.dim(`  ⏳ ${hook.description}...`));
        },
        onComplete: (hookResult) => {
          const duration = (hookResult.duration / 1000).toFixed(1);
          if (hookResult.success) {
            process.stdout.write(
              `\r${successMessage(`${hookResult.description} (${duration}s)`)}\n`,
            );
          } else {
            process.stdout.write(
              `\r${errorMessage(`${hookResult.description} — ${hookResult.error ?? "unknown error"}`)}\n`,
            );
          }
        },
      });
    }

    console.log(doneMessage(projectName, outputDir));

    if (cleanupDir) {
      const { rm } = await import("node:fs/promises");
      await rm(cleanupDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(errorMessage(err instanceof Error ? err.message : String(err)));
    process.exitCode = 1;
  }
}

async function runListCommand(): Promise<void> {
  const templatesDir = getTemplatesDir();
  const manifests = await listBuiltinTemplates(templatesDir);

  if (manifests.length === 0) {
    console.log(chalk.yellow("  No built-in templates found"));
    return;
  }

  console.log(chalk.bold("\n  Available templates:\n"));
  for (const manifest of manifests) {
    console.log(`  ${chalk.cyan.bold(manifest.name.padEnd(12))} ${manifest.description}`);
    if (manifest.variables.length > 0) {
      const varNames = manifest.variables.map((v) => v.name).join(", ");
      console.log(chalk.dim(`${"".padEnd(14)}Variables: ${varNames}`));
    }
    console.log();
  }
}

async function runValidateCommand(templatePath: string): Promise<void> {
  const resolved = path.resolve(templatePath);

  try {
    const manifestPath = path.join(resolved, "template.yaml");
    if (!(await pathExists(manifestPath))) {
      console.error(errorMessage("Missing template.yaml"));
      process.exitCode = 1;
      return;
    }

    const content = await readFile(manifestPath);
    const manifest = parseManifest(content);

    const filesDir = path.join(resolved, "files");
    if (!(await pathExists(filesDir))) {
      console.error(errorMessage('Missing "files/" directory'));
      process.exitCode = 1;
      return;
    }

    console.log(successMessage(`Template "${manifest.name}" is valid`));
    console.log(
      chalk.dim(
        `  ${manifest.variables.length} variables, ${manifest.hooks?.post?.length ?? 0} hooks`,
      ),
    );
  } catch (err) {
    console.error(
      errorMessage(
        `Invalid template: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );
    process.exitCode = 1;
  }
}
