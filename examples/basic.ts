import {
  setTheme,
  intro,
  outro,
  select,
  confirm,
  input,
  multiselect,
  isCancel,
  log,
} from "../dist/index.js";

// Set your brand accent color
// Accepts: hex (#ff6600), rgb/rgba, named colors (magenta, cyan, ...), or a function
setTheme({ accent: "#7c3aed" });

intro("termprompt example");

const name = await input({
  message: "What is your project name?",
  placeholder: "my-app",
});

if (isCancel(name)) {
  log.warn("Cancelled.");
  process.exit(0);
}

const framework = await select({
  message: "Pick a framework",
  options: [
    { value: "next", label: "Next.js", hint: "React SSR" },
    { value: "remix", label: "Remix", hint: "Full stack" },
    { value: "astro", label: "Astro", hint: "Content sites" },
    { value: "hono", label: "Hono", hint: "Edge-first" },
  ],
});

if (isCancel(framework)) {
  log.warn("Cancelled.");
  process.exit(0);
}

const extras = await multiselect({
  message: "Add extras?",
  options: [
    { value: "ts", label: "TypeScript" },
    { value: "lint", label: "ESLint" },
    { value: "test", label: "Vitest" },
    { value: "ci", label: "GitHub Actions" },
  ],
  required: false,
});

if (isCancel(extras)) {
  log.warn("Cancelled.");
  process.exit(0);
}

const proceed = await confirm({
  message: `Create "${name}" with ${framework}?`,
});

if (isCancel(proceed) || !proceed) {
  log.warn("Cancelled.");
  process.exit(0);
}

log.success(`Project "${name}" created with ${framework}.`);
if (extras.length > 0) {
  log.info(`Extras: ${extras.join(", ")}`);
}

outro("Done!");
