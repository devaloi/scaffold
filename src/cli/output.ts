import chalk from "chalk";

export function formatFileTree(files: string[], rootName: string): string {
  const sorted = [...files].sort();
  const lines: string[] = [];

  lines.push(chalk.bold.cyan(rootName + "/"));

  const tree = buildTree(sorted);
  renderTree(tree, "", lines, true);

  return lines.join("\n");
}

interface TreeNode {
  name: string;
  children: TreeNode[];
  isFile: boolean;
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const filePath of paths) {
    const parts = filePath.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const isFile = i === parts.length - 1;
      let node = current.find((n) => n.name === part);

      if (!node) {
        node = { name: part, children: [], isFile };
        current.push(node);
      }

      current = node.children;
    }
  }

  return root;
}

function renderTree(
  nodes: TreeNode[],
  prefix: string,
  lines: string[],
  isRoot: boolean,
): void {
  const sorted = [...nodes].sort((a, b) => {
    if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
    return a.isFile ? 1 : -1;
  });

  for (let i = 0; i < sorted.length; i++) {
    const node = sorted[i]!;
    const isLast = i === sorted.length - 1;
    const connector = isRoot ? "" : isLast ? "└── " : "├── ";
    const childPrefix = isRoot ? "  " : prefix + (isLast ? "    " : "│   ");

    const displayName = node.isFile
      ? chalk.white(node.name)
      : chalk.blue(node.name + "/");

    lines.push(prefix + connector + displayName);

    if (node.children.length > 0) {
      renderTree(node.children, childPrefix, lines, false);
    }
  }
}

export function successMessage(message: string): string {
  return chalk.green("  ✔ ") + message;
}

export function errorMessage(message: string): string {
  return chalk.red("  ✖ ") + message;
}

export function infoMessage(message: string): string {
  return chalk.cyan("  ℹ ") + message;
}

export function dryRunBanner(): string {
  return chalk.yellow.bold("\n  ⚠ DRY RUN — no files will be created\n");
}

export function doneMessage(projectName: string, outputDir: string): string {
  return (
    "\n" +
    chalk.green.bold("  Done! ") +
    `Created ${chalk.bold(projectName)} in ${chalk.dim(outputDir)}\n`
  );
}
