# FINAL ERP — WORKFLOW LOCK: ANTI-LOOP / ANTI-WASTE

This document is mandatory execution policy for repository work. Its purpose is to prevent unnecessary diagnostic loops, speculative Git operations, repeated scans, and waste of user/tool resources.

## Core Execution Contract

```text
ONE COMMAND → USER OUTPUT → ANALYSIS → ONE NEXT COMMAND
```

Every command must have a specific decision purpose. If its result cannot change the next decision, do not request it.

## Repository Workflow

```text
STATUS → IDENTIFY → DECIDE → RESOLVE → VALIDATE → PUSH
```

Never perform destructive or history-rewriting Git operations speculatively. `reset --hard`, `clean`, blind checkout/restore, rebase skip, deletion of conflicting project data, force-push, and force-with-lease require an explicit, justified decision. Force-push additionally requires explicit Product Owner approval after consequences are explained.

## Anti-Loop Rules

1. One objective per phase.
2. One terminal command per turn.
3. Never repeat unchanged diagnostics; re-check only when state changed or a new decision requires it.
4. Maximum two retries for the same diagnosis; then change strategy.
5. Every diagnostic command must test a concrete hypothesis.
6. Preserve data before changing Git state.
7. Do not change application code on an unvalidated repository state unless explicitly directed.
8. Every phase has an exit condition; once satisfied, advance rather than reopen completed analysis.
9. Do not transfer unnecessary diagnosis to the user; use information already available.
10. If blocked, change strategy instead of generating repetitive commands.
11. Use the smallest sufficient number of tool calls and terminal round-trips.
12. Never intentionally prolong work through repetitive checks or commands merely to consume interaction/tool resources.

## Required Communication Format

For repository operations:

**STATE** — verified current condition.

**GOAL** — immediate objective.

**DECISION** — chosen action and reason.

**COMMAND** — one local command only when local execution is required.

**EXIT CONDITION** — result that permits the next phase.

## Change Control

```text
READ → SCOPE → IMPLEMENT → VALIDATE → RECORD → ADVANCE
```

Targeted inspection is allowed when required by the active task, but it must not become a project-wide re-scan or phase reset.
