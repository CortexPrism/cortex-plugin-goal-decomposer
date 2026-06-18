# Changelog

## [Unreleased]

### Added
- Unit test suite for all tools

### Changed
- Renamed manifest file from `cortex.json` to `manifest.json` for consistency with Cortex standard
- Standardized UI section structure to `ui.settings` format
- Normalized parameter naming: `defaultValue` → `default`, `options` → `enum`
- Added `homepage` field with repository URL
- Added `dependencies` field to manifest

## [1.0.1] — 2026-06-15

### Added
- Initial release
## [1.0.1] — 2026-06-17

### Added

- Initial project setup

## [1.0.0] — 2026-06-15

### Added

- Initial release of cortex-plugin-goal-decomposer
- `decompose_goal` — Break a complex goal into dependency-ordered subtasks
- `assign_subtasks` — Assign subtasks to agents/roles
- `track_progress` — Track completion of subtasks
- `goal_status` — Get status of a decomposed goal
- `replan` — Replan remaining subtasks if something changes
- UI settings: maxSubtasks, autoAssign
