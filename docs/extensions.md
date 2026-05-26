# AgentGrid Extension Development Guide

Build plugins that extend AgentGrid with custom commands, views, menus, and keybindings.

## Plugin Structure

```
my-plugin/
├── package.json      # name, version, description
├── index.ts          # entry point
└── views/            # optional React components
    └── MyView.tsx
```

## Plugin Manifest (package.json)

```json
{
  "name": "agentgrid-plugin-example",
  "version": "1.0.0",
  "description": "Example AgentGrid plugin",
  "main": "index.ts",
  "agentgrid": {
    "contributes": {
      "commands": [
        {
          "id": "example.hello",
          "title": "Say Hello",
          "handler": "sayHello"
        }
      ],
      "views": [
        {
          "id": "example.panel",
          "location": "sidebar",
          "component": "views/MyView.tsx"
        }
      ],
      "menus": [
        {
          "command": "example.hello",
          "group": "Grid"
        }
      ],
      "keybindings": [
        {
          "command": "example.hello",
          "key": "Cmd+Shift+H"
        }
      ]
    }
  }
}
```

## Plugin API

```typescript
// index.ts
export function activate(api: AgentGridPluginAPI) {
  // Register commands
  api.commands.register("example.hello", () => {
    api.notification.show("Hello from plugin!");
  });

  // Access grid state
  const grid = api.grid.getCurrent();
  console.log(`Grid has ${grid.panes.length} panes`);

  // Send to panes
  api.pane.send(grid.panes[0].id, "echo 'Hello from plugin'");

  // Listen for events
  api.events.on("pane:status-update", (event) => {
    console.log(`Pane ${event.paneId} is now ${event.status}`);
  });
}

export function deactivate() {
  // Cleanup
}
```

## Available API Methods

| Namespace      | Method                      | Description             |
| -------------- | --------------------------- | ----------------------- |
| `grid`         | `getCurrent()`              | Get current grid layout |
| `grid`         | `create(rows, cols, agent)` | Create a new grid       |
| `pane`         | `send(id, text)`            | Send text to a pane     |
| `pane`         | `broadcast(text)`           | Send to all panes       |
| `pane`         | `getStatus(id)`             | Get pane status         |
| `preset`       | `list()`                    | List saved presets      |
| `preset`       | `load(name)`                | Load a preset           |
| `notification` | `show(msg)`                 | Show notification       |
| `events`       | `on(event, cb)`             | Subscribe to events     |
| `ceoLog`       | `add(entry)`                | Add CEO log entry       |

## View Locations

- `sidebar` — Appears as a tab in the sidebar
- `panel` — Appears as a bottom panel
- `statusbar` — Appears in the status bar

## Installation

```bash
# From npm
agentgrid plugin install agentgrid-plugin-example

# From local path
agentgrid plugin install ./my-plugin

# From GitHub
agentgrid plugin install github:user/repo
```

Plugins are stored in `~/.agentgrid/plugins/`.

## Scoping

Plugins can be installed at three scopes:

- **Global** (`~/.agentgrid/plugins/`) — Available in all workspaces
- **Workspace** (`.agentgrid/plugins/`) — Only in this project
- **Pane** — Injected per-pane via pane config
