import { spawn } from "node:child_process";

const requiredEnvironment = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);

if (missingEnvironment.length > 0) {
  console.error(
    `Integration tests require an isolated Supabase test project. Missing: ${missingEnvironment.join(", ")}.`,
  );
  process.exit(1);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const appUrl = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const startApp = process.env.E2E_START_APP !== "0";
let appProcess;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${signal ?? code}`));
    });
  });
}

async function waitForApp() {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (appProcess?.exitCode !== null && appProcess?.exitCode !== undefined) {
      throw new Error(
        `Local test server exited before becoming ready (code ${appProcess.exitCode}).`,
      );
    }

    try {
      const response = await fetch(`${appUrl}/checkin`);
      if (response.status < 500) return;
    } catch {
      // The application may still be compiling; retry until the deadline.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for the test server at ${appUrl}.`);
}

async function stopApp() {
  if (!appProcess || appProcess.exitCode !== null) return;

  appProcess.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => appProcess.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);

  if (appProcess.exitCode === null) appProcess.kill("SIGKILL");
}

try {
  if (startApp) {
    appProcess = spawn(
      npmCommand,
      ["run", "dev", "--", "--host", "127.0.0.1", "--port", "8080", "--strictPort"],
      {
        env: { ...process.env, E2E_BASE_URL: appUrl },
        stdio: "inherit",
      },
    );
    appProcess.once("error", (error) => {
      console.error("Unable to start the local integration-test server:", error.message);
    });
    await waitForApp();
  }

  await run(npmCommand, [
    "test",
    "--",
    "src/lib/request-db-constraint.test.ts",
    "src/lib/guest-qr-flow.e2e.test.ts",
  ]);
} catch (error) {
  console.error("Integration test run failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await stopApp();
}
