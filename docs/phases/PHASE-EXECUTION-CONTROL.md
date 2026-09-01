# ARTKRILIK ERP V3.3 — PHASE EXECUTION CONTROL

## PURPOSE

This document is the authoritative execution control for the V3.3 phase system.

Its purpose is to prevent the project from restarting completed analysis, repeating repository scans, or waiting indefinitely for manual approval between implementation phases.

## CURRENT PROJECT STATE

- PHASE 00: COMPLETE
- PHASE 01: COMPLETE — source/legacy scan is historical baseline only
- PHASE 02: COMPLETE — Business Requirement SSOT APPROVED
- CURRENT EXECUTION PHASE: PHASE 03
- TARGET: complete ERP V3.3 through PHASE 20 and final release

## NON-LOOP RULE

Completed phases are NEVER restarted merely because a new chat/session begins.

A new session MUST:

1. Read this control document.
2. Read AGENTS.md.
3. Determine CURRENT EXECUTION PHASE.
4. Continue from CURRENT EXECUTION PHASE.
5. Reuse completed phase outputs as authority.
6. Do NOT repeat PHASE 00 or PHASE 01 scans unless a concrete validation failure explicitly requires a targeted re-scan.

A repository scan is not a phase-reset mechanism.

## PHASE ADVANCEMENT RULE

The project advances monotonically:

PHASE N → VALIDATE → MARK COMPLETE → PHASE N+1

Never:

PHASE N → restart PHASE 01 → restart PHASE 02 → wait for approval

unless an explicit Product Owner decision changes an already-approved requirement.

## EXECUTION MODE

For each active phase:

READ → SCOPE → IMPLEMENT / PRODUCE REQUIRED OUTPUT → VALIDATE → RECORD RESULT → ADVANCE

The assistant may inspect the repository as much as technically necessary during the active phase. Such inspection is implementation work, not a request to restart the historical deep scan.

## APPROVAL RULE

Product Owner approval is required only when a genuinely NEW business/product/design decision is required that is not covered by the approved V3 baseline.

Do NOT ask for approval for:

- implementing an already-approved rule;
- choosing ordinary implementation details within an approved architecture;
- fixing bugs discovered while implementing the approved scope;
- progressing to the next phase after validation;
- repeating a completed scan;
- documenting implementation results.

If an unresolved Open Decision from PHASE 02 is encountered, use the narrowest necessary decision point. Do not restart PHASE 01.

## PHASE 02 AUTHORITY

The approved PHASE 02 business baseline is authoritative.

The 24 approved business rules remain in force.

The 11 listed Open Decisions remain open and must not be silently invented. They are decision points only when implementation actually depends on them.

## IMPLEMENTATION PHASES

### Architecture / Contract

03 Global System Architecture
04 Database & Backend Architecture
05 API Contract
06 Frontend Architecture
07 UI/UX Design System

### Core Implementation

08 Master Data
09 Sales Order
10 Payment
11 Work Order & Production
12 Packing / RTS / Handover
13 Dashboard / Reporting

### Integration / Hardening

14 Full Integration
15 Security
16 Performance
17 Testing / UAT
18 Data Migration
19 Deployment
20 Final Audit / Release

## PHASE COMPLETION RECORD

A phase is complete when:

- required output/work is present;
- relevant validation has passed;
- no blocking issue remains for that phase;
- the result is recorded in the repository or implementation report;
- CURRENT EXECUTION PHASE advances to the next phase.

A phase does NOT remain "current" simply because the original phase prompt says STOP FOR APPROVAL.

## LEGACY PROMPT OVERRIDE

Older phase documents may contain wording such as:

- "Jangan coding"
- "Do not implement"
- "STOP"
- "WAIT FOR APPROVAL"

Those statements are historical prompt wording and are superseded by this execution-control document once the relevant prerequisite phase has been approved and the project has entered implementation.

The phase document still defines WHAT must be achieved. This document defines HOW the project progresses.

## NO SILENT BUSINESS INVENTION

Execution autonomy does not authorize invention of business rules.

If implementation reaches a genuine business ambiguity:

1. identify the exact decision;
2. preserve existing approved behavior;
3. make the smallest safe technical boundary;
4. request only that specific Product Owner decision;
5. resume the same phase after the decision.

Do not reset the project.

## PHASE 03 START CONDITION

PHASE 03 is authorized to begin immediately because PHASE 02 is approved.

PHASE 03 must produce the architecture required by its phase document, validate it against the approved V3.3 business baseline and AGENTS.md, and then advance to PHASE 04 without requiring a new generic approval step.

## FINAL OBJECTIVE

The phase system exists to drive the repository to a working, validated ERP V3.3 release.

It is an execution roadmap, not a perpetual analysis loop.
