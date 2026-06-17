# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
