---
name: oss-project-scaffold
description: Scaffold a new OSS CLI project with package.json, tsconfig, README template, Vitest, CI, and LICENSE. The standardized starting point for all Energy OSS tools.
---

## When to Use

- When creating a new CLI tool in `tools/` or `oss-projects/`
- When META-FORGE or any company spawns a builder for a new OSS project
- When starting any TypeScript CLI that will be published to npm

## Process

### Step 1: Create Directory Structure

```
{project-name}/
├── src/
│   ├── index.ts          # CLI entry point (commander.js)
│   ├── types.ts           # Type definitions
│   └── utils.ts           # Shared utilities
├── tests/
│   └── index.test.ts      # Vitest tests
├── bin/
│   └── {project-name}.js  # Compiled CLI entry (shimmed by build)
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── LICENSE
├── .npmignore
└── .gitignore
```

### Step 2: Package.json Template

```json
{
  "name": "{project-name}",
  "version": "1.0.0",
  "description": "{one-liner}",
  "bin": {
    "{project-name}": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist/", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "pnpm build && pnpm test"
  },
  "license": "MIT",
  "engines": { "node": ">=18" },
  "keywords": ["ai", "claude", "agent", "{category}"],
  "author": "Energy Platform <naman@energy.dev>",
  "repository": {
    "type": "git",
    "url": "https://github.com/naman10parikh/{project-name}"
  }
}
```

### Step 3: Dependencies (Common Stack)

```bash
pnpm add commander chalk       # CLI essentials
pnpm add -D typescript vitest @types/node  # Dev tools
```

Optional (add only if needed):

- `ora` — spinners
- `cli-table3` — table output
- `boxen` — boxed output
- `inquirer` — interactive prompts
- `blessed` or `ink` — full TUI dashboard

### Step 4: TSConfig Template

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Step 5: CLI Entry Point Pattern

```typescript
#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";

const program = new Command();

program.name("{project-name}").description("{description}").version("1.0.0");

program
  .command("run")
  .description("Primary command")
  .action(async () => {
    // Implementation
  });

program.parse();
```

### Step 6: README Template

Follow the shared conventions in `.claude/contracts/shared.md`:

1. Title + one-liner
2. Badges (MIT, npm, TypeScript, CI)
3. Demo output / GIF placeholder
4. Install (`npx {name}` or `npm install -g {name}`)
5. Usage (all commands with examples)
6. How it works
7. Configuration
8. Contributing
9. License
10. "See Also" — link to 2-3 related Energy tools

### Step 7: Verification

```bash
pnpm install && pnpm build && pnpm test
node dist/index.js --help
npm pack --dry-run
```

## Output

- Complete project scaffold ready for implementation
- All boilerplate handled — builder can focus on core logic
- Passes npm-publish-checklist from day one

## Model Tier

- Haiku for file generation (steps 1-5)
- Sonnet for README writing (step 6)
