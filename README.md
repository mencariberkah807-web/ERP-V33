# ARTKRILIK ERP V3

React-based UI/UX migration architecture.

## Locked principles

- Index UI starts from zero.
- Old Index visual design is not a design reference.
- Existing working business behavior is preserved.
- `src/legacy/` is a reference/archive area for verified working source.
- Do not refactor legacy code while copying it.
- Change control: SCAN → IDENTIFY → PROPOSE → APPROVE → APPLY → VALIDATE.

## Initial target

React App Shell → shared UI system → full ERP vertical slice:
Customer → Product → Sales Order → Payment → Work Order → Production → RTS → Admin → COMPLETED.

## Execution / Anti-Loop Lock

The canonical workflow rules are defined in `docs/WORKFLOW-LOCK-ANTI-LOOP.md`. This document is mandatory for all implementation sessions.

### Mandatory working pattern

**ONE OBJECTIVE → ONE COMMAND → USER OUTPUT → ANALYSIS → ONE NEXT COMMAND**

Rules:

1. Work on one concrete objective at a time.
2. Every terminal command must have a specific diagnostic or execution purpose.
3. Do not repeat an unchanged diagnostic command.
4. Do not run exploratory commands without a hypothesis.
5. For the same diagnosis, use at most two retries before changing strategy.
6. Never make code changes while a Git conflict/rebase/merge state blocks safe repository work.
7. Preserve repository/data state before changing Git state: **STATUS → IDENTIFY → DECIDE → RESOLVE → VALIDATE → PUSH**.
8. Destructive or history-rewriting Git operations require an explicit, justified decision. Force-push requires explicit Product Owner approval.
9. Every task must have a clear exit condition: resolved repository state, intentional sync, approved implementation, or passing relevant validation.
10. Do not transfer unnecessary diagnosis work to the user. If a diagnosis is blocked, change strategy.
11. Do not restart completed phases because of a new session, targeted inspection, or routine validation issue.
12. Optimize user and tool resource usage: minimum commands, minimum repeated scans, maximum decision value.

### Required response structure for execution tasks

Use:

**STATE → GOAL → DECISION → COMMAND → EXIT CONDITION**

The full canonical policy remains in `docs/WORKFLOW-LOCK-ANTI-LOOP.md`.