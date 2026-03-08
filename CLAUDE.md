# termprompt

## Monorepo Structure

```
apps/
  docs/             # Next.js + Fumadocs, deployed to GitHub Pages
packages/
  protocol/         # @termprompt/protocol - OSC 7770 parser/encoder
  termprompt/       # termprompt - prompts, display, theming (bundles protocol)
```

## Commands

```bash
pnpm build              # build all packages
pnpm test               # test all packages
pnpm typecheck          # typecheck all packages
pnpm dev                # watch mode for all packages

pnpm version:bump patch # bump version across all packages (patch/minor/major/exact)
pnpm release            # test + typecheck + publish all packages to npm
```

## Package Relationships

- `termprompt` imports `@termprompt/protocol` as a **devDependency** and bundles it (zero runtime deps)
- `@termprompt/protocol` is published separately for terminal host authors who only need the parser
- Both packages always share the same version (bumped from root)

## Publishing

1. `pnpm version:bump <patch|minor|major>`
2. `pnpm release` (runs tests, typecheck, then publishes both packages)
3. Publish `@termprompt/protocol` first (it's independent), then `termprompt`

## Docs Deployment

- GitHub Actions: `.github/workflows/deploy-docs.yml`
- Triggers on push to `main` when `apps/docs/**` changes
- Deploys to GitHub Pages at seeden.github.io/termprompt
