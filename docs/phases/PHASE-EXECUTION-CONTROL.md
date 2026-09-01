# ARTKRILIK ERP V3.3 — PHASE EXECUTION CONTROL

## PURPOSE

Authoritative execution control for V3.3. Completed phases are historical authority; they are never restarted merely because a new chat/session begins.

## CURRENT PROJECT STATE

- PHASE 00: COMPLETE
- PHASE 01: COMPLETE — historical source/legacy scan baseline only
- PHASE 02: COMPLETE — Business Requirement SSOT APPROVED
- PHASE 03: COMPLETE — Global System Architecture
- PHASE 04: COMPLETE — Database & Backend Architecture
- PHASE 05: COMPLETE — API Contract
- PHASE 06: COMPLETE — Frontend Architecture
- CURRENT EXECUTION PHASE: PHASE 07
- TARGET: complete ERP V3.3 through PHASE 20 and final release

## NON-LOOP RULE

A new session MUST read this control document, read AGENTS.md, determine CURRENT EXECUTION PHASE, and continue from that phase. It must reuse completed outputs and must not repeat PHASE 00/01 scans unless a concrete validation failure requires a targeted re-scan.

A repository scan is not a phase-reset mechanism.

## PHASE ADVANCEMENT RULE

`PHASE N → VALIDATE → MARK COMPLETE → PHASE N+1`

Never restart an earlier phase unless an explicit Product Owner decision changes an approved requirement.

## EXECUTION MODE

For each active phase:

`READ → SCOPE → IMPLEMENT / PRODUCE REQUIRED OUTPUT → VALIDATE → RECORD RESULT → ADVANCE`

Inspection necessary to execute the current phase is implementation work, not a restart of historical scanning.

## APPROVAL RULE

Approval is required only for a genuinely new business/product/design decision outside the approved V3 baseline. Do not ask for generic approval between phases. Do not stop merely because an old phase document contains `STOP FOR APPROVAL` or `Do not implement`; those historical prompt endings are superseded by this execution-control document.

If an unresolved PHASE 02 Open Decision is actually encountered, stop only at that narrow decision boundary and then resume the same phase. Never reset earlier phases.

## PHASE 02 AUTHORITY

The approved PHASE 02 business baseline remains authoritative. The 24 approved business rules remain in force. The 11 Open Decisions remain open and must not be silently invented.

## IMPLEMENTATION PHASES

### Architecture / Contract

03 Global System Architecture — COMPLETE
04 Database & Backend Architecture — COMPLETE
05 API Contract — COMPLETE
06 Frontend Architecture — COMPLETE
07 UI/UX Design System — CURRENT

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

A phase is complete when its required output/work is present, relevant validation has passed, no blocking issue remains, and the result is recorded. Then CURRENT EXECUTION PHASE advances immediately to the next phase.

## COMPLETION RECORD — PHASE 03

Produced and validated `docs/phases/PHASE-03-ARCHITECTURE-CONTRACT.md` covering the Presentation → Application → Domain → Repository → Infrastructure boundaries, repository ports, application use cases, state ownership, validation/error boundaries, integration boundary, and migration strategy.

## COMPLETION RECORD — PHASE 04

Produced and validated `docs/phases/PHASE-04-DATABASE-BACKEND-ARCHITECTURE-CONTRACT.md` covering relational model, PK/FK, indexes/constraints, status fields, audit strategy, transaction boundaries, backend/service structure, repository interfaces, validation/authorization/error handling, payment calculation authority, and migration strategy.

## COMPLETION RECORD — PHASE 05

Produced and validated `docs/phases/PHASE-05-API-CONTRACT-OUTPUT.md` against the approved V3.3 business baseline and prior architecture contracts. The contract defines `/api/v1`, resource groups, request/response conventions, validation/error model, authorization boundaries, idempotency, pagination/filtering/sorting, atomic commands, and explicit protection of the approved SO/WO, payment, production, packing, RTS, handover, completion, and cancellation invariants.

PHASE 05 is complete. The project advances immediately to PHASE 06.

## COMPLETION RECORD — PHASE 06

Produced and validated `docs/phases/PHASE-06-FRONTEND-ARCHITECTURE-CONTRACT.md` covering React presentation boundaries, routing, feature boundaries, component boundaries, hooks, application services, repository clients, state separation, form strategy, loading/error/empty states, optimistic-update policy, cache invalidation, role-aware presentation, performance boundaries, and legacy isolation. The contract is aligned with the approved V3.3 business baseline and Phase 03–05 contracts.

PHASE 06 is complete. The project advances immediately to PHASE 07.

## PHASE 07 START CONDITION

PHASE 07 is authorized to begin immediately because PHASE 06 is complete.

PHASE 07 must produce the UI/UX Design System required by its phase specification while preserving approved V3.3 architecture and business behavior. Validate the result and advance to PHASE 08 without generic approval.

## FINAL OBJECTIVE

This phase system exists to drive the repository to a working, validated ERP V3.3 release. It is an execution roadmap, not a perpetual analysis loop.
