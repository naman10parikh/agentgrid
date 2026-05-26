# UX Principles

Design heuristics, cognitive science, and interaction patterns specifically applied to agent interfaces.

## Nielsen's 10 Heuristics for Agent UIs

### 1. Visibility of System Status

The agent must always communicate what it is doing, has done, and will do next.

- **Tool Timeline** is the primary mechanism. Every tool call appears as a step with live status.
- Show duration after 3 seconds ("Thinking for 5s..."). Users tolerate waits when informed.
- Five states: idle, thinking, active, generating, completed. Each has distinct visual treatment.
- Never show a blank screen during agent activity. Skeleton loaders fill dead space.

### 2. Match Between System and Real World

Translate tool names into human language. `search_places` becomes "Searching restaurants near Capitol Hill."

- Use contextual labels that include the user's own words back to them.
- Show results as rich cards (weather, venues, events), not raw JSON.
- Time references use relative language ("in 2 hours" not "at 15:00:00Z").

### 3. User Control and Freedom

Users must be able to interrupt, redirect, or undo agent actions.

- **Take-Control Handoff**: user clicks into VNC viewer, agent pauses. "Resume Agent" to continue.
- **Autonomy Dial**: 4 levels from "Suggest Only" to "Full Auto." Default is "Act with Confirmation."
- **Undo**: reversible actions have a 15-minute undo window. Irreversible actions require confirmation gate.
- **Stop button**: always visible during agent activity. Stops mid-tool execution gracefully.

### 4. Consistency and Standards

Follow platform conventions. Users transfer mental models from other apps.

- Chat panel on left, workspace on right (matches Cursor, Codex, Manus).
- Message input at bottom with send button on right.
- Tool steps use familiar icons: checkmark (done), spinner (running), circle (pending).
- Keyboard shortcuts follow OS conventions (Cmd+K for search, Esc to close).

### 5. Error Prevention

Design interfaces that prevent errors before they happen.

- **Confirmation gates** for high-stakes actions (booking, payment, sending messages).
- **Intent preview** shows the plan before execution: "Spark wants to: 1. Book table, 2. Add to calendar."
- **Disambiguation**: if the agent is uncertain, ask before acting. "Did you mean downtown Seattle or Capitol Hill?"
- **Rate limiting UI**: if the agent would make too many API calls, batch and confirm.

### 6. Recognition Over Recall

Show available actions rather than requiring users to remember commands.

- **Quick Actions** grid on idle state: "Plan a date", "Search events", "Check weather."
- **Slash commands** in input field with autocomplete dropdown.
- **Suggested follow-ups** after each agent response: 2-3 contextual next steps.
- **Recent actions** accessible via "View Activity" button.

### 7. Flexibility and Efficiency

Serve both novice and expert users.

- Novices: quick action buttons, guided flows, progressive disclosure.
- Experts: slash commands, keyboard shortcuts, autonomy dial set to "Full Auto."
- **Collapsible detail**: tool timeline collapses to "Used 4 tools" for experienced users.
- **Batch actions**: power users can approve multiple pending actions at once.

### 8. Aesthetic and Minimalist Design

Every element must earn its place. Remove anything that doesn't inform or enable action.

- No decorative borders. Borders are structural (surface elevation, not decoration).
- No badge overload. One status indicator per element, not three.
- Cards show key info first, expand for details. Never show everything at once.
- White space is a feature, not waste. It reduces cognitive load and signals hierarchy.

### 9. Help Users Recognize and Recover from Errors

Errors should be clear, specific, and suggest a fix.

- **ErrorCard** component: friendly language, specific issue, retry button.
- "I couldn't find restaurants matching your criteria. Try a different neighborhood?" not "Error: 404."
- Tool errors show in timeline with red X icon and human-readable explanation.
- Network errors offer: retry, switch to offline mode, or try alternative approach.

### 10. Help and Documentation

Contextual help, never a separate manual.

- Tooltips on hover for every icon and non-obvious control (200ms delay).
- First-run onboarding: 3-step tutorial overlay, dismissible, never repeated.
- "What can I do?" prompt in idle state shows capability overview.
- Agent explains its own actions via "Explainable Rationale" pattern.

## Cognitive Load Management

### Progressive Disclosure

Show minimum information first. Reveal detail on demand.

| Level  | Content                              | Interaction        |
| ------ | ------------------------------------ | ------------------ |
| Glance | Status icon + one-line summary       | Visible by default |
| Scan   | Key details (2-3 data points)        | Visible by default |
| Read   | Full details, actions, metadata      | Click to expand    |
| Study  | Source data, reasoning, alternatives | Dedicated view     |

### Chunking

Group related items to reduce perceived complexity.

- **Tool timeline**: Group sequential same-type tools. "Searched 3 venues" not 3 separate search steps.
- **Results**: Show top 3-5, with "Show more" for the rest. Never dump 20 results at once.
- **Forms**: Max 5-7 fields per visible section. Use steps/tabs for longer forms.

### Smart Defaults

Reduce decisions. Pre-fill what you can predict.

- Location: use device geolocation or last-used city.
- Date/time: default to "tonight" or "this weekend" for social queries.
- Preferences: learn from history. If user always picks Italian, suggest Italian first.
- Autonomy: start at Level 3 ("Act with Confirmation"), let users adjust.

## Trust Patterns for Agent UIs

### Intent Preview

Show the plan before execution. Critical for irreversible actions.

```
"I'm going to: 1. Book at Marufuku (7pm), 2. Add to calendar, 3. Text your partner."
[Approve] [Edit Plan] [Cancel]
```

Use for: bookings, payments, messages, calendar events, file changes.
Never use for: searches, weather checks, browsing, memory saves.

### Explainable Rationale

After autonomous actions, explain why.

Structure: "Because you [user signal], I [action taken]."
Example: "Because you mentioned loving ramen last week, I chose Marufuku — it also has outdoor seating for tonight's 72F weather."

### Autonomy Dial

4 levels of agent autonomy. Users choose their comfort level.

1. **Suggest Only** — Agent recommends, user acts manually
2. **Plan & Propose** — Agent creates plan, user reviews before any action
3. **Act with Confirmation** — Agent prepares everything, user approves (DEFAULT)
4. **Full Auto** — Agent acts independently, notifies after completion

### Audit Trail

Everything the agent did is logged and reviewable.

- Chronological activity log with timestamps
- Each entry has: action, input, result, duration
- Undo capability for reversible actions (within 15 minutes)
- Exportable as CSV or JSON for transparency

## Key UX Laws

### Fitts's Law

Time to reach a target = f(distance / size). Make CTAs large and close to cursor origin.

- Primary CTA: minimum 44px height, positioned near chat input.
- Secondary actions: minimum 32px, grouped near the primary CTA.

### Hick's Law

Decision time increases logarithmically with number of choices. Limit options.

- Quick actions: 4-6 options maximum.
- Tool selection: never show all tools at once. Context-filter to relevant ones.
- Settings: group into categories, show 5-7 per category.

### Jakob's Law

Users spend most time on OTHER sites. Match their existing expectations.

- Chat interface: matches iMessage/WhatsApp (messages bottom-up, input at bottom).
- Workspace: matches VS Code / Cursor (panel-based, resizable, tabbed).
- Settings: matches System Preferences (sidebar categories, toggles, dropdowns).

### Doherty Threshold

Productivity increases when response time is < 400ms.

- UI response (click/hover): < 100ms.
- Agent acknowledgment ("Thinking..."): < 400ms after user sends message.
- First tool result: ideally < 2s. Show progress for anything longer.
- Streaming: start token output immediately, don't buffer.

## Gestalt Principles Applied

| Principle         | Application                            | Example                                            |
| ----------------- | -------------------------------------- | -------------------------------------------------- |
| **Proximity**     | Group related items with tight spacing | Tool steps in timeline, venue details in card      |
| **Similarity**    | Same visual style = same function      | All tool step icons same size, all CTAs same style |
| **Continuity**    | Align elements to guide the eye        | Left-aligned text, consistent grid columns         |
| **Closure**       | Incomplete shapes read as complete     | Card borders can be partial (top + left only)      |
| **Figure-Ground** | Clear foreground on background         | Cards (surface) on base background                 |
| **Common Region** | Items in a container are grouped       | Card boundary groups title + body + actions        |

## Microinteraction Design

Every user action should have feedback. The feedback hierarchy:

1. **Immediate** (0-100ms): Visual state change (hover, press, focus ring)
2. **Acknowledgment** (100-400ms): Animation confirming the action started
3. **Progress** (400ms+): Loading indicator showing work is happening
4. **Completion**: Final state with result

Never skip steps 1-2. Skipping them makes the interface feel broken even if the action succeeds.
