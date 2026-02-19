# E03: scaffold — CLI Project Scaffolder with Templates

**Catalog ID:** E03 | **Size:** S | **Language:** TypeScript / Node
**Repo name:** `scaffold`
**One-liner:** A CLI tool that scaffolds project templates from configurable blueprints — interactive prompts, Handlebars template variables, custom template directories, and post-scaffold hooks.

---

## Why This Stands Out

- **Template engine** — directories and files with Handlebars/mustache variables, conditional blocks, and partials
- **Interactive prompts** — project name, features, options — clean UX with validation and defaults
- **Multiple built-in templates** — API server, CLI tool, library — each production-ready
- **Custom templates** — load from local directory or git URL, making it extensible
- **Post-scaffold hooks** — npm install, git init, eslint --init — automate the boring setup
- **Dry-run mode** — preview every file and directory that would be created, without creating anything
- **TypeScript strict mode** — zero `any`, comprehensive types, clean architecture
- **Beautiful CLI** — colors, spinners, progress indicators, tree output for created files

---

## Architecture

```
scaffold/
├── src/
│   ├── index.ts                  # CLI entry point, arg parsing
│   ├── cli/
│   │   ├── commands.ts           # Command definitions: new, list, validate
│   │   ├── prompts.ts            # Interactive prompt flows
│   │   └── output.ts             # Colorized output, spinners, tree display
│   ├── template/
│   │   ├── engine.ts             # Handlebars template rendering
│   │   ├── engine.test.ts
│   │   ├── loader.ts             # Load templates from disk or git
│   │   ├── loader.test.ts
│   │   ├── variables.ts          # Variable extraction and validation
│   │   └── variables.test.ts
│   ├── scaffold/
│   │   ├── scaffolder.ts         # Core: walk template, render, write output
│   │   ├── scaffolder.test.ts
│   │   ├── hooks.ts              # Post-scaffold hook execution
│   │   └── hooks.test.ts
│   ├── config/
│   │   ├── schema.ts             # Template manifest schema (template.yaml)
│   │   └── schema.test.ts
│   └── utils/
│       ├── fs.ts                 # File system helpers (mkdir, write, copy)
│       ├── git.ts                # Git clone for remote templates
│       └── validate.ts           # Input validation helpers
├── templates/
│   ├── api/
│   │   ├── template.yaml         # Template manifest
│   │   └── files/
│   │       ├── package.json.hbs
│   │       ├── tsconfig.json.hbs
│   │       ├── src/
│   │       │   ├── index.ts.hbs
│   │       │   └── routes/
│   │       │       └── health.ts.hbs
│   │       ├── .gitignore
│   │       └── README.md.hbs
│   ├── cli/
│   │   ├── template.yaml
│   │   └── files/
│   │       ├── package.json.hbs
│   │       ├── src/
│   │       │   ├── index.ts.hbs
│   │       │   └── commands/
│   │       │       └── help.ts.hbs
│   │       └── README.md.hbs
│   └── library/
│       ├── template.yaml
│       └── files/
│           ├── package.json.hbs
│           ├── tsconfig.json.hbs
│           ├── src/
│           │   └── index.ts.hbs
│           ├── tests/
│           │   └── index.test.ts.hbs
│           └── README.md.hbs
├── tests/
│   ├── integration/
│   │   └── scaffold.test.ts      # End-to-end scaffold tests
│   └── fixtures/
│       ├── simple-template/
│       └── invalid-template/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── LICENSE
└── README.md
```

---

## Template Manifest Format

```yaml
# template.yaml
name: api
description: Express API server with TypeScript
version: "1.0.0"

variables:
  - name: projectName
    description: Project name (kebab-case)
    type: string
    required: true
    validate: "^[a-z][a-z0-9-]*$"

  - name: description
    description: Project description
    type: string
    default: "A new project"

  - name: author
    description: Author name
    type: string

  - name: useDocker
    description: Include Dockerfile?
    type: boolean
    default: false

  - name: features
    description: Features to include
    type: multiselect
    options: [auth, database, cors, rate-limit]
    default: [cors]

hooks:
  post:
    - command: npm install
      description: Installing dependencies
    - command: git init
      description: Initializing git repository
    - command: git add -A && git commit -m "feat: initial scaffold"
      description: Creating initial commit
```

---

## CLI Usage

```
scaffold new                          # Interactive: choose template, answer prompts
scaffold new api --name my-app        # Specify template and variables via flags
scaffold new --from ./my-template     # Use local custom template directory
scaffold new --from https://github.com/user/template.git
scaffold list                         # List available built-in templates
scaffold validate ./my-template       # Validate a template directory
scaffold new api --dry-run            # Preview without creating files
```

### CLI Output Example

```
$ scaffold new api --name my-api

  ✔ Template: api (Express API server with TypeScript)
  ✔ Project name: my-api
  ✔ Description: A new project
  ✔ Features: cors, auth

  Creating project...

  my-api/
  ├── package.json
  ├── tsconfig.json
  ├── src/
  │   ├── index.ts
  │   ├── middleware/
  │   │   ├── cors.ts
  │   │   └── auth.ts
  │   └── routes/
  │       └── health.ts
  ├── .gitignore
  └── README.md

  Running post-scaffold hooks...
  ✔ Installing dependencies (3.2s)
  ✔ Initializing git repository
  ✔ Creating initial commit

  Done! Created my-api in ./my-api
```

---

## Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Node.js 24 LTS |
| Language | TypeScript 5.7 (strict mode) |
| Template engine | Handlebars |
| CLI prompts | `@inquirer/prompts` |
| CLI colors | `chalk` |
| CLI spinners | `ora` |
| Argument parsing | `commander` |
| Testing | Vitest |
| Linting | ESLint + Prettier |
| Build | `tsc` |

---

## Phased Build Plan

### Phase 1: Template Engine

**1.1 — Project setup**
- `npm init`, install dependencies, configure TypeScript strict mode
- ESLint + Prettier config
- Vitest config
- Directory structure, scripts: dev, build, test, lint

**1.2 — Template manifest parser**
- Parse `template.yaml`: name, description, variables, hooks
- Variable types: string, boolean, multiselect
- Validation: required fields, valid types, regex patterns
- Tests: parse valid manifest, invalid manifest, missing fields

**1.3 — Handlebars rendering**
- Render `.hbs` files with variable context
- Conditional blocks: `{{#if useDocker}}...{{/if}}`
- Iteration: `{{#each features}}...{{/each}}`
- Custom helpers: `kebabCase`, `camelCase`, `pascalCase`, `upperCase`
- Tests: variable substitution, conditionals, loops, helpers, edge cases

**1.4 — Variable extraction**
- Extract variable names from template files (find all `{{varName}}`)
- Cross-reference with manifest variables
- Detect undefined variables, unused variables
- Tests: extraction from various template patterns

### Phase 2: Scaffolder Core

**2.1 — Template loader**
- Load from local directory: read `template.yaml` + `files/` directory
- Walk template directory tree recursively
- Support file name templates: `{{projectName}}.ts.hbs` → `my-app.ts`
- Conditional files: `{{#if useDocker}}Dockerfile.hbs{{/if}}`
- Tests: load valid template, missing manifest, nested directories

**2.2 — Scaffolder**
- Walk template tree, render each file, write to output directory
- Create directory structure matching template
- Handle binary files (copy without rendering)
- Dry-run mode: collect what would be created, don't write
- Tests: scaffold simple template, nested dirs, dry-run output

**2.3 — Post-scaffold hooks**
- Execute commands sequentially in output directory
- Show spinner with description during execution
- Capture output, show on error
- Skip hooks in dry-run mode
- Configurable: allow user to skip hooks with `--no-hooks`
- Tests: hook executes, hook fails gracefully, skip in dry-run

### Phase 3: CLI

**3.1 — Interactive prompts**
- `scaffold new` — prompt for template selection (list built-in templates)
- Prompt for each variable defined in manifest
- Input validation (regex, required)
- Defaults pre-filled
- Boolean → confirm prompt, multiselect → checkbox prompt
- Tests: prompt flow produces correct variable context

**3.2 — CLI commands**
- `new` — scaffold a new project (interactive or with flags)
- `list` — show available templates with descriptions
- `validate` — validate a template directory structure and manifest
- Flag parsing: `--name`, `--from`, `--dry-run`, `--no-hooks`, `--verbose`

**3.3 — Output formatting**
- Colorized file tree of created files
- Spinner for long operations (npm install, git init)
- Success/error messages with color
- Dry-run output clearly marked as preview

### Phase 4: Templates & Polish

**4.1 — Built-in templates**
- **api/** — Express + TypeScript API with health route, error handling, env config
- **cli/** — Node CLI with commander, TypeScript, help command
- **library/** — TypeScript library with build, test setup, exports config

**4.2 — Custom template loading**
- Local directory: `--from ./path/to/template`
- Git URL: `--from https://github.com/user/template.git` (shallow clone to temp dir)
- Validate custom template on load
- Tests: load from local path, validate structure

**4.3 — README**
- Badges, install (`npm install -g @devaloi/scaffold`)
- Quick start: `scaffold new api --name my-app`
- Template manifest format reference
- Variable types and validation
- Hook configuration
- Creating custom templates guide
- CLI reference with all commands and flags

**4.4 — Final checks**
- `npm run build` clean (tsc, no errors)
- `npm test` all pass
- `npm run lint` clean
- `scaffold new api --name test-app --dry-run` works
- Fresh clone → npm install → build → run works

---

## Commit Plan

1. `chore: scaffold project with TypeScript, ESLint, Vitest`
2. `feat: add template manifest parser and validation`
3. `feat: add Handlebars rendering engine with custom helpers`
4. `feat: add variable extraction and cross-reference`
5. `feat: add template loader from local directory`
6. `feat: add scaffolder with directory walking and file rendering`
7. `feat: add dry-run mode`
8. `feat: add post-scaffold hook execution`
9. `feat: add interactive CLI prompts`
10. `feat: add CLI commands (new, list, validate)`
11. `feat: add built-in templates (api, cli, library)`
12. `feat: add custom template loading from path and git URL`
13. `docs: add README with template guide and CLI reference`
14. `chore: final lint pass and cleanup`
