import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { runHooks } from "./hooks.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hooks-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("runHooks", () => {
  it("executes a command in the given directory", async () => {
    const results = await runHooks(
      [{ command: "echo hello > output.txt", description: "Create file" }],
      tmpDir,
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.success).toBe(true);

    const content = await fs.readFile(path.join(tmpDir, "output.txt"), "utf-8");
    expect(content.trim()).toBe("hello");
  });

  it("runs hooks sequentially", async () => {
    const results = await runHooks(
      [
        { command: "echo first > order.txt", description: "First" },
        { command: "echo second >> order.txt", description: "Second" },
      ],
      tmpDir,
    );

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);

    const content = await fs.readFile(path.join(tmpDir, "order.txt"), "utf-8");
    expect(content.trim()).toBe("first\nsecond");
  });

  it("handles failed hooks gracefully", async () => {
    const results = await runHooks(
      [{ command: "exit 1", description: "Failing hook" }],
      tmpDir,
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.success).toBe(false);
    expect(results[0]?.error).toBeDefined();
  });

  it("records duration", async () => {
    const results = await runHooks(
      [{ command: "echo fast", description: "Fast hook" }],
      tmpDir,
    );

    expect(results[0]?.duration).toBeGreaterThanOrEqual(0);
  });

  it("calls onStart and onComplete callbacks", async () => {
    const started: string[] = [];
    const completed: string[] = [];

    await runHooks([{ command: "echo test", description: "Test hook" }], tmpDir, {
      onStart: (hook) => started.push(hook.description),
      onComplete: (result) => completed.push(result.description),
    });

    expect(started).toEqual(["Test hook"]);
    expect(completed).toEqual(["Test hook"]);
  });
});
