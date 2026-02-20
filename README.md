# scaffold

[![CI](https://github.com/devaloi/scaffold/actions/workflows/ci.yml/badge.svg)](https://github.com/devaloi/scaffold/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)

A CLI tool that scaffolds project templates from configurable blueprints — interactive prompts, Handlebars template variables, custom template directories, and post-scaffold hooks.

## Features

- **Template engine** — Handlebars with conditionals, iteration, and custom helpers (`kebabCase`, `camelCase`, `pascalCase`, `upperCase`)
- **Interactive prompts** — project name, features, options with validation and defaults
- **Built-in templates** — API server, CLI tool, library — each production-ready
- **Custom templates** — load from local directory or git URL
- **Post-scaffold hooks** — npm install, git init, and more — automated setup
- **Dry-run mode** — preview every file that would be created without writing anything
- **Beautiful CLI** — colors, spinners, file tree output

## Installation

```bash
npm install -g @devaloi/scaffold
```

Or run directly:

```bash
npx @devaloi/scaffold new api --name my-app
```

## Quick Start

```bash
# Interactive mode — choose template, answer prompts
scaffold new

# Specify template and project name
scaffold new api --name my-app

# Preview without creating files
scaffold new api --name my-app --dry-run

# List available templates
scaffold list

# Validate a template directory
scaffold validate ./my-template
```

## CLI Reference

### `scaffold new [template]`

Scaffold a new project from a template.

| Flag | Description |
|------|-------------|
| `--name <name>` | Project name |
| `--from <source>` | Custom template path or git URL |
| `--dry-run` | Preview files without creating them |
| `--no-hooks` | Skip post-scaffold hooks |
| `--output <dir>` | Output directory (defaults to `./<name>`) |
| `--verbose` | Show detailed output |

```bash
# Interactive
scaffold new

# With template and name
scaffold new api --name my-api

# From local custom template
scaffold new --from ./my-template --name my-project

# From git repository
scaffold new --from https://github.com/user/template.git --name my-project

# Dry run
scaffold new api --name test --dry-run
```

### `scaffold list`

List available built-in templates with descriptions and variables.

### `scaffold validate <path>`

Validate a template directory structure and manifest.

## Built-in Templates

### `api` — Express API Server

Express + TypeScript API with health route, error handling, and environment config.

**Variables:**
| Name | Type | Required | Default |
|------|------|----------|---------|
| `projectName` | string | ✔ | — |
| `description` | string | | "A new API server" |
| `author` | string | | "" |
| `useDocker` | boolean | | false |
| `features` | multiselect | | [cors] |

### `cli` — CLI Tool

Node CLI with Commander, TypeScript, and help command.

**Variables:**
| Name | Type | Required | Default |
|------|------|----------|---------|
| `projectName` | string | ✔ | — |
| `description` | string | | "A new CLI tool" |
| `author` | string | | "" |

### `library` — TypeScript Library

TypeScript library with build, test setup, and proper exports config.

**Variables:**
| Name | Type | Required | Default |
|------|------|----------|---------|
| `projectName` | string | ✔ | — |
| `description` | string | | "A new TypeScript library" |
| `author` | string | | "" |

## Template Manifest Format

Every template directory must contain a `template.yaml` and a `files/` directory:

```
my-template/
├── template.yaml
└── files/
    ├── package.json.hbs
    ├── src/
    │   └── index.ts.hbs
    └── README.md.hbs
```

### `template.yaml`

```yaml
name: my-template
description: A description of the template
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

  - name: useFeature
    description: Enable feature?
    type: boolean
    default: false

  - name: features
    description: Features to include
    type: multiselect
    options: [auth, database, cors]
    default: [cors]

hooks:
  post:
    - command: npm install
      description: Installing dependencies
    - command: git init
      description: Initializing git repository
```

### Variable Types

| Type | Prompt | Description |
|------|--------|-------------|
| `string` | Text input | Free-form text with optional regex validation |
| `boolean` | Yes/No confirm | Boolean toggle |
| `multiselect` | Checkbox list | Select multiple from `options` array |

### Template Files

Files ending in `.hbs` are rendered through Handlebars. All other files are copied as-is.

**Variable substitution:**
```handlebars
{
  "name": "{{projectName}}",
  "description": "{{description}}"
}
```

**Conditionals:**
```handlebars
{{#if useDocker}}
FROM node:22-alpine
WORKDIR /app
{{/if}}
```

**Iteration:**
```handlebars
{{#each features}}
- {{this}}
{{/each}}
```

**Custom helpers:**
```handlebars
{{kebabCase projectName}}   → my-project
{{camelCase projectName}}   → myProject
{{pascalCase projectName}}  → MyProject
{{upperCase projectName}}   → MY-PROJECT
```

### Filename Templates

Filenames can also use Handlebars variables:

```
{{projectName}}.ts.hbs  →  my-app.ts
```

## Creating Custom Templates

1. Create a directory with `template.yaml` and `files/`:

```bash
mkdir -p my-template/files
```

2. Write the manifest:

```yaml
name: my-template
description: My custom template
version: "1.0.0"
variables:
  - name: projectName
    description: Project name
    type: string
    required: true
```

3. Add template files in `files/`:

```bash
echo '# {{projectName}}' > my-template/files/README.md.hbs
```

4. Validate:

```bash
scaffold validate ./my-template
```

5. Use it:

```bash
scaffold new --from ./my-template --name my-project
```

## Development

```bash
git clone https://github.com/devaloi/scaffold.git
cd scaffold
npm install
npm run build
npm test
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build TypeScript to `dist/` |
| `npm run dev` | Watch mode build |
| `npm test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint + Prettier check |
| `npm run typecheck` | Type check with `tsc --noEmit` |

### Prerequisites

- Node.js 22+
- npm 10+

## Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Node.js 22 |
| Language | TypeScript 5.9 (strict mode) |
| Template engine | Handlebars |
| CLI prompts | `@inquirer/prompts` |
| CLI colors | `chalk` |
| CLI spinners | `ora` |
| Argument parsing | `commander` |
| Testing | Vitest |
| Linting | ESLint + Prettier |

## License

MIT — see [LICENSE](LICENSE)
