# Harness Authoring Guide

A **harness** is a reusable configuration that defines how a team of AI agents works together. It specifies roles, grid layout, skills, rules, and evaluation criteria.

## Harness File Format

Harnesses are YAML files stored in `~/.agentgrid/harnesses/` or `.agentgrid/harnesses/` in your project.

```yaml
name: engineering-sprint
description: "4-agent sprint: architect, frontend, backend, QA"
version: 1
category: engineering
score: 0.74

grid:
  rows: 2
  cols: 2

roles:
  - name: VP-ARCHITECT
    position: "0,0"
    cliTool: claude
    model: claude-opus-4-6
    effort: max
    systemPrompt: "You are the system architect. Design before building."
    skills:
      - architect
      - deep-think
    phase: 0

  - name: VP-FRONTEND
    position: "0,1"
    cliTool: claude
    model: claude-opus-4-6
    effort: max
    systemPrompt: "You are the frontend engineer. Build React components."
    skills:
      - frontend-design
      - design-systems
    phase: 1
    dependsOn:
      - VP-ARCHITECT

  - name: VP-BACKEND
    position: "1,0"
    cliTool: claude
    model: claude-opus-4-6
    effort: max
    systemPrompt: "You are the backend engineer. Build APIs and services."
    phase: 1
    dependsOn:
      - VP-ARCHITECT

  - name: ANVIL-QA
    position: "1,1"
    cliTool: claude
    model: claude-opus-4-6
    effort: max
    systemPrompt: "You are QA. Test everything. Zero tolerance for bugs."
    skills:
      - playwright-test
    phase: 2
    dependsOn:
      - VP-FRONTEND
      - VP-BACKEND

skills:
  - architect
  - deep-think
  - frontend-design
  - playwright-test

rules:
  - test-before-signal
  - qa-zero-tolerance

eval:
  - dimension: code_quality
    weight: 0.3
    rubric: "Clean TypeScript, no any, proper error handling"
  - dimension: test_coverage
    weight: 0.2
    rubric: "Unit tests for all new functions, E2E for user flows"
  - dimension: ux_polish
    weight: 0.2
    rubric: "Responsive, accessible, dark mode, animations"
  - dimension: architecture
    weight: 0.15
    rubric: "Clean separation, no circular deps, proper abstractions"
  - dimension: documentation
    weight: 0.15
    rubric: "README updated, API docs, inline comments for non-obvious code"
```

## Key Concepts

### Roles

Each role maps to one pane in the grid. Roles have:

- **name** — displayed as the pane label
- **position** — `"row,col"` in the grid
- **cliTool** — which AI CLI to use (claude, codex, gemini, etc.)
- **model** — specific model (claude-opus-4-6, gpt-4.1, etc.)
- **effort** — thinking effort level (low, medium, high, max)
- **systemPrompt** — injected as the initial prompt
- **skills** — additional capabilities to load
- **phase** — execution order (0 = first wave, 1 = second wave, etc.)
- **dependsOn** — roles that must complete before this one starts

### Phases

Phases control execution order:

- Phase 0 roles start immediately
- Phase 1 roles wait for all Phase 0 dependencies to signal `.done`
- Phase 2 roles (typically QA) wait for Phase 1

### Evaluation Criteria

Each harness defines how output quality is measured:

- **dimension** — what to evaluate (code_quality, test_coverage, etc.)
- **weight** — importance (0-1, must sum to 1)
- **rubric** — specific criteria for pass/fail

### Score

The `score` field (0-1) tracks the harness's historical success rate. AutoLab improves harnesses nightly by adjusting prompts, roles, and eval criteria.

## Built-in Harnesses

| Name               | Score | Roles | Use Case                   |
| ------------------ | ----- | ----- | -------------------------- |
| engineering-sprint | 0.74  | 4     | Feature development        |
| design             | 0.82  | 5     | UI/UX design pipeline      |
| content            | 0.75  | 3     | Article/content creation   |
| research           | 0.79  | 4     | Deep research + synthesis  |
| oss-launch         | 0.71  | 6     | Open source project launch |
| earning            | 0.45  | 7     | Revenue generation agents  |

## Creating a Harness

1. Start with a built-in harness as a template
2. Modify roles, prompts, and phases for your use case
3. Save to `~/.agentgrid/harnesses/my-harness.yaml`
4. Load via command palette or `agentgrid launch my-harness`
5. After each run, review results and adjust

## Tips

- Start with 2-3 roles and add complexity gradually
- Put QA in the LAST phase — it tests everyone else's output
- Use `dependsOn` to prevent race conditions
- Keep system prompts under 500 words — concise is better
- The signal protocol (`.done`, `.needs-qa`) is how agents coordinate
