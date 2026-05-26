---
name: skill-creator
description: Auto-generate new skills from learnings, approved patterns, and repeated user preferences. The meta-skill that makes the harness self-improving. Core to AutoLab.
---

## When to Use

- After discovering a repeatable pattern across 2+ sessions
- When the user explicitly approves a workflow ("always do X")
- When LEARNINGS.md has 3+ entries about the same topic
- When a sub-agent finds a new capability worth capturing
- During AutoLab nightly improvement cycles

## Process

### 1. Source Mining

Scan these sources for skill candidates:

- `memory/LEARNINGS.md` — repeated corrections = skill gaps
- `memory/MEMORY.md` — confirmed patterns = skill candidates
- `memory/daily/*.md` — workflows that worked = codify them
- `resources/read/*.md` — external techniques worth internalizing
- Session transcript — what did the user approve? correct? praise?
- `packages/web/features.json` — feature patterns that recur

### 2. Skill Candidate Evaluation

For each candidate, score on 4 axes:

| Axis            | Question                                       | Threshold             |
| --------------- | ---------------------------------------------- | --------------------- |
| **Frequency**   | How often would this skill be triggered?       | 2+ times/week         |
| **Complexity**  | Does it need multi-step instructions?          | 3+ steps              |
| **Error-prone** | Do we keep getting it wrong without the skill? | 2+ mistakes           |
| **Reusable**    | Does it apply across agents, not just one?     | Cross-agent preferred |

Score >= 3/4 axes → create the skill.

### 3. Skill Template

```markdown
---
name: { skill-name }
description: { one-line description, under 100 chars }
---

## When to Use

- {trigger condition 1}
- {trigger condition 2}

## Process

### Step 1: {Action}

{What to do, what to check}

### Step 2: {Action}

{What to do, what to check}

## Output

- {What the skill produces}
- {How to verify it worked}

## Model Tier

- {Haiku | Sonnet | Opus} for each step
```

### 4. Skill Creation Checklist

1. Write `SKILL.md` to `.claude/skills/{skill-name}/SKILL.md`
2. Description must be under 100 chars (for ~70 token routing)
3. Add trigger patterns that the skill-routing system can match
4. If the skill involves code patterns, include inline examples
5. If the skill involves external tools, document the setup
6. Update CLAUDE.md skills count
7. Test: verify the skill is discoverable via `/skill-routing`

### 5. Skill Categories

| Category    | Purpose                    | Examples                                  |
| ----------- | -------------------------- | ----------------------------------------- |
| **Build**   | Code generation patterns   | app-factory, agent-runtime                |
| **Meta**    | Self-improvement, research | self-improve, deep-think                  |
| **Ops**     | Setup, deployment, infra   | mcp-setup, secrets-setup                  |
| **Agent**   | Agent-specific skills      | Per-agent skills in agents/{name}/skills/ |
| **Capture** | Knowledge capture          | transcript-to-insight, resource-digest    |

### 6. For Agent-Level Skills

Skills can also be created for individual agents (not just the harness):

```
agents/{agent-name}/skills/{skill-name}.md
```

These are loaded into the agent's system prompt via the memory-loader.
They follow the same template but are scoped to that agent's domain.

## Integration with AutoLab

The Skill Creator is a key component of the AutoLab nightly cycle:

1. AutoLab analyzes traces from the day's agent runs
2. Identifies patterns where agents struggled or succeeded
3. Calls Skill Creator to codify successful patterns
4. New skills are available to all agents via Group Evolution

## YouTube/Article Transcript Pipeline

When a YouTube video or article needs to be processed:

1. Get the URL from user or resource queue
2. For YouTube: Use computer use to visit a transcript service (e.g., tavio.io, kome.ai, or youtubetranscript.com)
3. Enter the URL, download the transcript text
4. Clean and structure the transcript
5. Extract insights relevant to Energy platform
6. Save to `resources/read/{topic}.md`
7. If insights warrant a new skill, create it

## X/Twitter Content Pipeline

1. Use computer use to browse the tweet/thread
2. Extract the full text content
3. If it's a thread, compile all tweets
4. Extract actionable insights
5. Save to resources and update relevant docs

## Skill Testing & Evals (from Anthropic's skill-creator enhancements, March 2026)

### Two Kinds of Skills

1. **Capability uplift** — helps Claude do something the base model can't do consistently (e.g., document creation, complex workflows). May become unnecessary as models improve.
2. **Encoded preference** — sequences steps according to your team's process (e.g., NDA review, weekly updates). Durable, value depends on fidelity to actual workflow.

### Writing Evals

For each skill, define test cases:

```markdown
## Evals

### Test 1: {scenario}

- **Prompt:** "{test input that should trigger the skill}"
- **Expected:** {description of correct output}
- **Files:** {any test files needed}

### Test 2: {scenario}

...
```

Evals check that:

- The skill triggers when it should (no false negatives)
- The skill doesn't trigger when it shouldn't (no false positives)
- Output quality meets the bar defined in "Expected"

### Benchmark Mode

Run standardized assessment across all evals:

- Track eval pass rate, elapsed time, token usage
- Run after model updates or skill edits
- Store results locally or integrate with CI

### Multi-Agent Eval Execution

Spin up independent agents to run evals in parallel:

- Each eval in a clean context (no cross-contamination)
- Own token and timing metrics per eval
- Use `isolation: "worktree"` for code-modifying skills

### A/B Comparisons

Use comparator agents to judge:

- Skill v1 vs v2 (after edits)
- Skill vs no skill (is it still needed?)
- Judges don't know which output is which → unbiased

### Description Tuning

As skill count grows, description precision is critical:

- Too broad → false triggers on unrelated prompts
- Too narrow → never fires when needed
- Analyze description against sample prompts
- Suggest edits that cut both false positives and false negatives

### The Future: Skills → Specifications

As models improve, skills evolve from "how to do X" (implementation) to "what X should produce" (specification). Evals already describe the "what" — eventually the eval IS the skill.

## Verification

After creating a skill:

- Confirm it appears in skill count
- Confirm skill-routing can find it with relevant keywords
- Confirm the description fits in ~70 tokens
- Test with a simulated trigger to verify steps are clear
- Write at least 2 evals per skill
- Run benchmark to establish baseline metrics
