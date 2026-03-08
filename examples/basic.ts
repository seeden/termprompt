import { parseArgs } from "node:util";
import {
  setTheme,
  intro,
  outro,
  note,
  log,
  group,
  select,
  confirm,
  input,
  password,
  number,
  search,
  multiselect,
  spinner,
  progress,
  tasks,
  isCancel,
} from "../packages/termprompt/dist/index.js";

// Parse theme flags (hex, rgb, or named colors)
// Usage: npx tsx examples/basic.ts --color "#ff6600" --success "#22c55e"
const { values } = parseArgs({
  options: {
    color: { type: "string", short: "c", default: "#7c3aed" },
    success: { type: "string" },
    error: { type: "string" },
    warning: { type: "string" },
    info: { type: "string" },
  },
  strict: false,
});

setTheme({
  accent: values.color!,
  ...(values.success && { success: values.success }),
  ...(values.error && { error: values.error }),
  ...(values.warning && { warning: values.warning }),
  ...(values.info && { info: values.info }),
});

intro("termprompt example");

// ── Group: collect project config in one shot ───────────────

const config = await group({
  name: () =>
    input({
      message: "What is your project name?",
      placeholder: "my-app",
    }),

  framework: () =>
    select({
      message: "Pick a framework",
      options: [
        { value: "next", label: "Next.js", hint: "React SSR" },
        { value: "remix", label: "Remix", hint: "Full stack" },
        { value: "astro", label: "Astro", hint: "Content sites" },
        { value: "hono", label: "Hono", hint: "Edge-first" },
      ],
    }),

  timezone: () =>
    search({
      message: "Select your timezone",
      options: [
        { value: "utc", label: "UTC", hint: "GMT+0" },
        { value: "est", label: "Eastern", hint: "UTC-5" },
        { value: "cst", label: "Central", hint: "UTC-6" },
        { value: "mst", label: "Mountain", hint: "UTC-7" },
        { value: "pst", label: "Pacific", hint: "UTC-8" },
        { value: "cet", label: "Central European", hint: "UTC+1" },
        { value: "jst", label: "Japan", hint: "UTC+9" },
      ],
      placeholder: "Type to search...",
    }),

  port: () =>
    number({
      message: "Dev server port?",
      min: 1024,
      max: 65535,
      initialValue: 3000,
    }),

  extras: () =>
    multiselect({
      message: "Add extras?",
      options: [
        { value: "ts", label: "TypeScript" },
        { value: "lint", label: "ESLint" },
        { value: "test", label: "Vitest" },
        { value: "ci", label: "GitHub Actions" },
      ],
      required: false,
    }),

  dbPassword: () =>
    password({
      message: "Database password",
      validate(value) {
        if (value.length < 4) return "Must be at least 4 characters";
        return true;
      },
    }),

  proceed: ({ results }) =>
    confirm({
      message: `Create "${results.name}" with ${results.framework} on port ${results.port}?`,
    }),
});

if (isCancel(config.proceed) || !config.proceed) {
  log.warn("Cancelled.");
  process.exit(0);
}

// ── Note: show a summary ────────────────────────────────────

note(
  [
    `Project:   ${config.name}`,
    `Framework: ${config.framework}`,
    `Timezone:  ${config.timezone}`,
    `Port:      ${config.port}`,
    `Extras:    ${(config.extras as string[]).length > 0 ? (config.extras as string[]).join(", ") : "none"}`,
  ].join("\n"),
  "Configuration",
);

// ── Spinner: single async operation ─────────────────────────

const s = spinner();
s.start("Scaffolding project...");
await sleep(1500);
s.message("Installing dependencies...");
await sleep(1500);
s.stop("Project scaffolded.");

// ── Progress: determinate operation ─────────────────────────

const p = progress();
p.start("Downloading templates...");
for (let i = 0; i <= 100; i += 10) {
  p.update(i, i < 100 ? "Downloading templates..." : "Download complete");
  await sleep(150);
}
p.stop("Templates downloaded.");

// ── Tasks: multi-step operations ────────────────────────────

const result = await tasks([
  {
    title: "Generate config files",
    task: async () => {
      await sleep(800);
    },
  },
  {
    title: "Set up TypeScript",
    task: async () => {
      await sleep(1000);
    },
    enabled: (config.extras as string[]).includes("ts"),
  },
  {
    title: "Configure ESLint",
    task: async () => {
      await sleep(600);
    },
    enabled: (config.extras as string[]).includes("lint"),
  },
  {
    title: "Set up Vitest",
    task: async () => {
      await sleep(700);
    },
    enabled: (config.extras as string[]).includes("test"),
  },
  {
    title: "Configure GitHub Actions",
    task: async () => {
      await sleep(500);
    },
    enabled: (config.extras as string[]).includes("ci"),
  },
]);

if (result.errors.length > 0) {
  log.error("Some tasks failed.");
} else {
  log.success("All tasks completed.");
}

// ── Final output ────────────────────────────────────────────

note(
  `cd ${config.name}\nnpm run dev`,
  "Next steps",
);

outro("Done!");

process.exit(0);

// ── Helpers ─────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
