# Goal Decomposition Engine

Breaks complex goals into dependency-ordered subtasks.

## Installation

```bash
cortex plugin install marketplace:cortex-plugin-goal-decomposer
cortex plugin install github:CortexPrism/cortex-plugin-goal-decomposer
cortex plugin install ./manifest.json
```

## Quick Start

```bash
cortex tools list
cortex chat --plugin cortex-plugin-goal-decomposer
```

## Tools

### decompose_goal

Break a complex goal into dependency-ordered subtasks.

**Parameters:**
- `goal` (string, required) — The complex goal to decompose
- `context` (string, optional) — Additional context
- `max_subtasks` (number, optional) — Maximum subtasks (default: 8)

### assign_subtasks

Assign subtasks to agents/roles.

**Parameters:**
- `subtasks` (string, required) — JSON array of subtask objects
- `agents` (string, optional) — JSON array of available agents

### track_progress

Track completion of subtasks.

**Parameters:**
- `goal_id` (string, required) — The goal identifier
- `subtask_id` (string, optional) — Specific subtask to update
- `status` (string, optional) — Status: pending, in_progress, completed, blocked

### goal_status

Get status of a decomposed goal.

**Parameters:**
- `goal_id` (string, required) — The goal identifier

### replan

Replan remaining subtasks if something changes.

**Parameters:**
- `goal_id` (string, required) — The goal identifier
- `change_description` (string, required) — Description of what changed

## Configuration

```json
{
  "plugins": {
    "cortex-plugin-goal-decomposer": {
      "enabled": true,
      "config": {
        "maxSubtasks": 8,
        "autoAssign": true
      }
    }
  }
}
```

## Development

```bash
deno task test
deno fmt
deno lint
deno task validate
```

## License

MIT — See [LICENSE](./LICENSE) file
