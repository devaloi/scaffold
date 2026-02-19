import { execSync } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

export async function cloneRepo(url: string): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "scaffold-git-"));
  execSync(`git clone --depth 1 ${url} ${tmpDir}`, { stdio: "ignore" });
  return tmpDir;
}

export function isGitUrl(input: string): boolean {
  return (
    input.startsWith("https://") ||
    input.startsWith("git@") ||
    input.endsWith(".git")
  );
}
