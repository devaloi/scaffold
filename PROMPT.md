# Build scaffold — CLI Project Scaffolder with Templates

You are building a **portfolio project** for a Senior AI Engineer's public GitHub. It must be impressive, clean, and production-grade. Read these docs before writing any code:

1. **`E03-node-cli-scaffolder.md`** — Complete project spec: architecture, phases, template engine, scaffolder, CLI, built-in templates, commit plan. This is your primary blueprint. Follow it phase by phase.
2. **`github-portfolio.md`** — Portfolio goals and Definition of Done (Level 1 + Level 2). Understand the quality bar.
3. **`github-portfolio-checklist.md`** — Pre-publish checklist. Every item must pass before you're done.

---

## Instructions

### Read first, build second
Read all three docs completely before writing a single line of code. Understand the template manifest format, the Handlebars rendering engine with custom helpers, the scaffolder that walks template trees, the interactive CLI prompts, and the post-scaffold hook system.

### Follow the phases in order
The project spec has 4 phases. Do them in order:
1. **Template Engine** — project setup, template manifest parser, Handlebars rendering with conditionals and custom helpers, variable extraction
2. **Scaffolder Core** — template loader from local directories, core scaffolder with directory walking and file rendering, dry-run mode, post-scaffold hooks
3. **CLI** — interactive prompts with validation, CLI commands (new, list, validate), colorized output with spinners and file tree display
4. **Templates & Polish** — built-in templates (api, cli, library), custom template loading from path and git URL, comprehensive README

### Commit frequently
Follow the commit plan in the spec. Use **conventional commits**. Each commit should be a logical unit.

### Quality non-negotiables
- **TypeScript strict mode.** Zero `any` types. `strict: true` in tsconfig. Full type safety from CLI input to file output.
- **Handlebars template engine.** Real Handlebars rendering with conditionals (`{{#if}}`), iteration (`{{#each}}`), and custom helpers (`kebabCase`, `camelCase`, `pascalCase`).
- **Template manifest is the contract.** `template.yaml` defines variables, types, defaults, and validation. The scaffolder enforces the manifest — no rendering without valid variable values.
- **Dry-run mode.** `--dry-run` must show exactly what would be created (file tree with sizes) without writing anything to disk. This is critical for trust.
- **Post-scaffold hooks.** Hooks execute sequentially in the output directory. Show progress with spinners. Fail gracefully with clear error messages.
- **Built-in templates must be useful.** The API, CLI, and library templates should produce real, buildable starter projects — not toy examples.
- **Beautiful CLI output.** Colors (chalk), spinners (ora), file tree display. The UX matters for a scaffolder.
- **Lint clean.** `eslint` and `prettier` must pass. `tsc --noEmit` must pass.

### What NOT to do
- Don't use `any` anywhere. TypeScript strict mode means strict.
- Don't skip template validation. Invalid templates must be caught on load, not during rendering.
- Don't execute hooks in dry-run mode. Dry-run is read-only.
- Don't render binary files (images, fonts) through Handlebars. Detect and copy them directly.
- Don't leave `// TODO` or `// FIXME` comments anywhere.
- Don't commit `node_modules` or scaffolded output directories.

---

## GitHub Username

The GitHub username is **devaloi**. For npm scripts and package.json, use package name `scaffold`. For any GitHub URLs, use `github.com/devaloi/scaffold`.

## Start

Read the three docs. Then begin Phase 1 from `E03-node-cli-scaffolder.md`.
