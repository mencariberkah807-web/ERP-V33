# ARTKRILIK ERP V3 --- AGENTS.md

## Project Identity

ARTKRILIK ERP V3.3 is a production ERP redesign and implementation project.

The project uses a controlled phase roadmap whose purpose is to reach a validated production release. Completed phases are historical authority and MUST NOT be restarted merely because a new chat/session begins.

**Primary principle:** Approved V3 design/business decisions are the source of truth. Existing code is a baseline/reference, not raw material to redesign freely.

------------------------------------------------------------------------

## PHASE EXECUTION CONTROL — CRITICAL

Read `docs/phases/PHASE-EXECUTION-CONTROL.md` at the start of every new implementation session.

Current baseline:

- PHASE 00 = COMPLETE
- PHASE 01 = COMPLETE
- PHASE 02 = COMPLETE / BUSINESS BASELINE APPROVED
- PHASE 03 = COMPLETE
- PHASE 04 = COMPLETE
- PHASE 05 = COMPLETE
- PHASE 06 = COMPLETE
- PHASE 07 = COMPLETE
- CURRENT PHASE = PHASE 08

### NON-LOOP RULE

Do NOT restart PHASE 00 or PHASE 01 on a new chat/session.

PHASE 01 is a completed historical deep-scan baseline. Repository inspection required by a later implementation task is a **targeted implementation inspection**, not a new PHASE 01 scan.

The project progresses monotonically:

`PHASE N → IMPLEMENT / PRODUCE → VALIDATE → COMPLETE → PHASE N+1`

Never reset to an earlier phase unless an explicit Product Owner decision changes the approved baseline or a concrete validation failure requires targeted re-investigation.

A repository scan is never a phase-reset mechanism.

### Approval rule

Do not ask for generic approval between phases.

Approval is required only for a genuinely NEW business/product/design decision that is not already covered by the approved V3.3 baseline.

Approved requirements may be implemented without waiting for another approval.

### Phase prompt wording

Some historical phase documents may contain `Jangan coding`, `Do not implement`, `STOP`, or `WAIT FOR APPROVAL`. Those are historical prompt instructions and are superseded for execution sequencing by `PHASE-EXECUTION-CONTROL.md` once the prerequisite phase is approved.

The phase document defines the required outcome. The execution-control document defines progression.

------------------------------------------------------------------------

## Global Change Control

For an active implementation task use:

**READ → SCOPE → IMPLEMENT → VALIDATE → RECORD → ADVANCE**

Targeted inspection is allowed and expected before implementation. It MUST NOT become a full project re-scan.

Rules:

1. No new business decision may be invented silently.
2. Do not silently alter locked business behavior.
3. Do not refactor unrelated code during a scoped task.
4. Do not redesign an existing locked UI/behavior without explicit approval.
5. Keep implementation changes scoped and independently testable.
6. After applying a change, run the relevant application/build/test validation.
7. If current code conflicts with the approved V3 baseline, correct the implementation toward V3 within the approved scope.
8. Stop only for a real blocker or a genuinely new decision, not for routine implementation details.
9. After validation, advance to the next phase/task instead of reopening completed analysis.

------------------------------------------------------------------------

## V3 Authority Hierarchy

Use this order of authority:

1. Latest explicitly approved V3 decision in the project conversation/checkpoint.
2. Current V3 architecture/baseline documentation.
3. Existing V3 code, only where it does not conflict with V3 decisions.
4. V2/source code as behavior reference only.
5. General assumptions are NOT authoritative.

Never use V2 behavior to override an approved V3 decision.

------------------------------------------------------------------------

# SALES ORDER → WORK ORDER → PACKING CORE ENGINE

## Core Lifecycle

```text
NEW ORDER
   ↓
READY PRODUCTION
   ↓ START
IN PRODUCTION
   ↓ DONE
COMPLETED PRODUCTION
   ↓
PACKING
   ↓ PACK
RTS
   ↓
HANDOVER
   ↓
COMPLETED ORDER
```

------------------------------------------------------------------------

# SALES ORDER

## Order Types

Only:

- Direct Order
- Marketplace

## Direct Order

```text
New Order
→ Direct Order
→ Create Order
→ SO Detail
→ Create WO
```

Create Order does NOT automatically create a WO.

## Marketplace

```text
New Order
→ Marketplace
→ Create WO
→ Automatic Payment Record
→ PAID
```

Marketplace payment is automatically recorded as PAID.

------------------------------------------------------------------------

## Sales Order Status

Business statuses:

- NEW ORDER
- READY PRODUCTION
- IN PRODUCTION
- PACKING
- RTS
- COMPLETED
- INACTIVE

### Table Badge Labels

Use these short UI labels:

| Business Status | Badge |
|---|---|
| NEW ORDER | New Order |
| READY PRODUCTION | Ready WO |
| IN PRODUCTION | In Progress |
| PACKING | Packing |
| RTS | RTS |
| COMPLETED | Completed |
| INACTIVE | Inactive |

Badge labels are presentation only. Do not create new business statuses from these labels.

------------------------------------------------------------------------

# SALES ORDER ITEMS

1 SO may contain multiple Order Items.

**Locked relationship:**

```text
1 Active SO Item
        ↓
1 WO
```

Quantity does NOT create additional WOs.

### SO Item Identity

Use `soItemId`.

WO relationship:

```text
SO Number + SO Item ID
```

Do NOT use SO Number + Product ID as the unique relationship.

Duplicate WO creation is prohibited.

------------------------------------------------------------------------

# SALES ORDER DETAIL

SO Detail uses a **Right Drawer**, not the old JOB Card Modal.

Primary actions:

- Edit
- Create WO
- Print

There is NO Save Draft.

------------------------------------------------------------------------

# EDIT / SYNC

Before Production starts:

```text
Admin edits SO
→ SO updates
→ Related WO data syncs
```

After Production starts:

```text
WO = Production execution authority
```

Production does NOT become customer/order data authority.

------------------------------------------------------------------------

# CUSTOMER COMMUNICATION

```text
CUSTOMER
    ↕
  ADMIN
    ↕
   ERP
    ↓
PRODUCTION
```

Production/operators may report issues to Admin, but must NOT directly change or negotiate customer-facing information.

------------------------------------------------------------------------

# PRODUCTION AUTHORITY

Production controls execution state only:

```text
READY PRODUCTION
    ↓ START
IN PRODUCTION
    ↓ DONE
COMPLETED PRODUCTION
```

Processes:

- Laser Cutting
- UV Printing
- Assembly
- Laser Marking
- Finishing

Processes are non-sequential and potentially parallel. Do NOT implement a mandatory sequential routing/stage engine.

Production cannot edit customer/order/instruction data, including Customer, SO, SO Item, Quantity, Price, Discount, Deadline, Artwork, Specification, Production Notes, and Customer requests, unless an explicitly approved exception exists.

------------------------------------------------------------------------

# WORK ORDER

```text
Sales Order
    ↓
SO Item
    ↓
Work Order
```

1 Active SO Item = 1 WO.

WO inherits transaction data from SO and SO Item. Do not force re-entry of existing order data.

WO must contain/reference:

- WO Number
- SO Number
- SO Item ID

------------------------------------------------------------------------

# PACKING

Packing is a fulfillment process, not a Production process.

**Packing lookup is based on Sales Order, NOT Work Order.**

All Active Order Items must have completed Production before packing is allowed.

```text
All Active Items
    ↓
Completed Production
    ↓
PACK
    ↓
RTS
```

------------------------------------------------------------------------

# RTS / HANDOVER / FINAL COMPLETION

RTS means Ready to Ship / Ready for Handover. RTS does NOT mean Completed Order.

Final Order Completion is Admin-controlled:

```text
RTS
+
HANDOVER
+
PAYMENT = PAID
+
ADMIN COMPLETE
        ↓
COMPLETED ORDER
```

Therefore `COMPLETED PRODUCTION ≠ COMPLETED ORDER`.

------------------------------------------------------------------------

# PAYMENT

Payment is record-based:

```text
Payment Records
    ↓
Total Paid
    ↓
Balance
    ↓
Payment Status
```

Statuses:

- UNPAID
- PARTIALLY PAID
- PAID

Payment history must remain preserved. Marketplace orders create/receive an automatic PAID payment record. Payment alone must never automatically complete an Order.

------------------------------------------------------------------------

# CANCELLATION

Cancellation means `INACTIVE`.

Never hard delete cancellation-controlled entities.

Whole Order:

```text
SO → INACTIVE
```

Partial cancellation:

```text
SO Item → INACTIVE
Related WO → INACTIVE
```

Cancellation is allowed only before Production starts. Inactive WOs/items do not participate in active aggregation.

------------------------------------------------------------------------

# UI / UX PRINCIPLES

1. Keep UI concise.
2. Use short badge labels.
3. Do not expose internal complexity when it does not help the operator.
4. Do not introduce unnecessary modals.
5. Prefer Right Drawer for detail where already locked.
6. Primary actions use the V3 approved brighter blue CTA treatment, not ARTKRILIK navy.
7. Red is reserved for destructive/error emphasis, not normal Save/Create/Update/Submit actions.
8. Do not introduce Save Draft where V3 explicitly removed it.
9. Do not use Delete for cancellation.
10. Do not over-engineer future modules into the current core engine.

------------------------------------------------------------------------

# IMPLEMENTATION DISCIPLINE

At the start of a new session:

1. Read `docs/phases/PHASE-EXECUTION-CONTROL.md`.
2. Read this AGENTS.md.
3. Determine the current phase from the execution control.
4. Read ONLY the active phase document and the dependencies needed for that phase.
5. Reuse completed phase outputs. Do not restart completed scans.
6. Inspect relevant source files only as required by the active task.
7. Implement the approved scope.
8. Validate.
9. Record the result.
10. Advance the current phase.

### Required behavior when encountering an issue

- **Known implementation conflict:** fix it within the active scope.
- **Ordinary technical choice:** choose the smallest architecture-consistent solution and proceed.
- **Genuine business ambiguity:** isolate the exact decision and request only that decision.
- **Missing legacy file:** record UNKNOWN; never reconstruct it by assumption.
- **Validation failure:** diagnose and fix; do not restart PHASE 01.

------------------------------------------------------------------------

# IMPLEMENTATION ROADMAP

```text
PHASE 00  Project Initialization                         COMPLETE
PHASE 01  Source / Legacy Deep Scan                      COMPLETE
PHASE 02  Business Requirement SSOT                     APPROVED
PHASE 03  Global System Architecture                    COMPLETE
PHASE 04  Database & Backend Architecture               COMPLETE
PHASE 05  API Contract                                  COMPLETE
PHASE 06  Frontend Architecture                          COMPLETE
PHASE 07  UI/UX Design System                            COMPLETE
PHASE 08  Master Data                                    CURRENT
PHASE 09  Sales Order
PHASE 10  Payment
PHASE 11  Work Order & Production
PHASE 12  Packing / RTS / Handover
PHASE 13  Dashboard / Reporting
PHASE 14  Full Integration
PHASE 15  Security
PHASE 16  Performance
PHASE 17  Testing / UAT
PHASE 18  Data Migration
PHASE 19  Deployment
PHASE 20  Final Audit / Release
```

**Do not reset this roadmap.** The goal is a working, validated ERP V3.3 release, not repeated analysis.

------------------------------------------------------------------------

# IMPORTANT

The existing V2 code is a reference for behavior and data discovery. It is NOT permission to preserve conflicting V2 behavior.

When V2 conflicts with this V3 baseline:

**V3 wins.**
