import { exec } from "node:child_process";
import type { TemplateHook } from "../config/schema.js";

export interface HookResult {
  command: string;
  description: string;
  success: boolean;
  duration: number;
  error?: string;
}

export interface HookCallbacks {
  onStart?: (hook: TemplateHook) => void;
  onComplete?: (result: HookResult) => void;
}

function execPromise(
  command: string,
  cwd: string,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

export async function runHooks(
  hooks: TemplateHook[],
  cwd: string,
  callbacks?: HookCallbacks,
): Promise<HookResult[]> {
  const results: HookResult[] = [];

  for (const hook of hooks) {
    callbacks?.onStart?.(hook);
    const start = Date.now();

    try {
      await execPromise(hook.command, cwd);
      const result: HookResult = {
        command: hook.command,
        description: hook.description,
        success: true,
        duration: Date.now() - start,
      };
      results.push(result);
      callbacks?.onComplete?.(result);
    } catch (err) {
      const result: HookResult = {
        command: hook.command,
        description: hook.description,
        success: false,
        duration: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
      results.push(result);
      callbacks?.onComplete?.(result);
    }
  }

  return results;
}
