# ARTKRILIK ERP V3 --- AGENTS.md

## Project Identity

ARTKRILIK ERP V3 is a production ERP redesign and implementation
project.

The current project phase is transitioning from locked design into
controlled implementation.

**Primary principle:** \> Design decisions are the source of truth.
Existing code is a baseline/reference, not raw material to redesign
freely.

------------------------------------------------------------------------

## Global Change Control

Every implementation task MUST follow:

**SCAN → IDENTIFY → PROPOSE → APPROVE → APPLY → VALIDATE**

Rules:

1.  No approval = no code change when the task requires a new
    business/design decision.
2.  Do not silently alter locked business behavior.
3.  Do not refactor unrelated code during a scoped task.
4.  Do not redesign an existing locked UI/behavior without explicit
    approval.
5.  Keep each implementation task small and independently testable.
6.  After applying a change, run the relevant application/build/test
    validation.
7.  If the current code conflicts with the V3 baseline, report the
    conflict before changing behavior.

------------------------------------------------------------------------

## V3 Authority Hierarchy

Use this order of authority:

1.  Latest explicitly approved V3 decision in the project
    conversation/checkpoint.
2.  Current V3 architecture/baseline documentation.
3.  Existing V3 code, only where it does not conflict with V3 decisions.
4.  V2/source code as behavior reference only.
5.  General assumptions are NOT authoritative.

Never use V2 behavior to override an approved V3 decision.

------------------------------------------------------------------------

# SALES ORDER → WORK ORDER → PACKING CORE ENGINE

## Core Lifecycle

``` text
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

-   Direct Order
-   Marketplace

## Direct Order

``` text
New Order
→ Direct Order
→ Create Order
→ SO Detail
→ Create WO
```

Create Order does NOT automatically create a WO.

## Marketplace

``` text
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

-   NEW ORDER
-   READY PRODUCTION
-   IN PRODUCTION
-   PACKING
-   RTS
-   COMPLETED
-   INACTIVE

### Table Badge Labels

Use these short UI labels:

  Business Status    Badge
  ------------------ -------------
  NEW ORDER          New Order
  READY PRODUCTION   Ready WO
  IN PRODUCTION      In Progress
  PACKING            Packing
  RTS                RTS
  COMPLETED          Completed
  INACTIVE           Inactive

Badge labels are presentation only. Do not create new business statuses
from these labels.

------------------------------------------------------------------------

# SALES ORDER ITEMS

1 SO may contain multiple Order Items.

**Locked relationship:**

``` text
1 Active SO Item
        ↓
1 WO
```

Quantity does NOT create additional WOs.

Example:

``` text
SO-001
├── Item A → WO-A
├── Item B → WO-B
└── Item C → WO-C
```

### SO Item Identity

Use:

``` text
soItemId
```

WO relationship:

``` text
SO Number + SO Item ID
```

Do NOT use SO Number + Product ID as the unique relationship.

Duplicate WO creation is prohibited.

------------------------------------------------------------------------

# SALES ORDER DETAIL

SO Detail uses a **Right Drawer**, not the old JOB Card Modal.

Primary actions:

-   Edit
-   Create WO
-   Print

There is NO Save Draft.

After all Active SO Items have a WO, Create WO must not create
duplicates.

------------------------------------------------------------------------

# EDIT / SYNC

Before Production starts:

``` text
Admin edits SO
→ SO updates
→ Related WO data syncs
```

After Production starts:

``` text
WO = Production execution authority
```

However, Production does NOT become customer/order data authority.

------------------------------------------------------------------------

# CUSTOMER COMMUNICATION

Customer communication is a **single-gate Admin process**.

``` text
CUSTOMER
    ↕
  ADMIN
    ↕
   ERP
    ↓
PRODUCTION
```

Production/operators may report issues to Admin.

Production/operators must NOT directly change or negotiate
customer-facing information.

------------------------------------------------------------------------

# PRODUCTION AUTHORITY

Production is responsible for execution only.

Production actions:

``` text
READY PRODUCTION
    ↓ START
IN PRODUCTION
    ↓ DONE
COMPLETED PRODUCTION
```

### Production UI labels

``` text
Ready Production     [ START ]
In Production        [ IN PROGRESS ]
Completed Production [ DONE ]
```

`IN PROGRESS` is a UI label, NOT a separate business status.

------------------------------------------------------------------------

## Production Process

Current processes:

-   Laser Cutting
-   UV Printing
-   Assembly
-   Laser Marking
-   Finishing

Production processes are:

-   non-sequential
-   potentially parallel
-   dependent on actual production conditions
-   not governed by a mandatory route in V3

Do NOT implement a sequential `Next Production Stage` workflow.

Do NOT add a mandatory production routing/scheduling engine.

**Production Routing / Scheduling is a future module.**

------------------------------------------------------------------------

# PRODUCTION DATA OWNERSHIP

Production can execute production state.

Production cannot edit customer/order/instruction data, including:

-   Customer
-   Sales Order
-   SO Item
-   Quantity
-   Price
-   Discount
-   Deadline
-   Artwork
-   Specification
-   Production Notes
-   Customer requests

These remain under Admin authority.

If Production finds an issue:

``` text
Production
→ Admin
→ Admin communicates/reviews with customer
→ Admin updates ERP if approved
→ Production receives updated instruction
```

------------------------------------------------------------------------

# WORK ORDER

## Relationship

``` text
Sales Order
    ↓
SO Item
    ↓
Work Order
```

1 Active SO Item = 1 WO.

WO inherits transaction data from SO and SO Item.

WO must NOT ask the user to re-enter data already available from the
SO/SO Item.

## WO Identity

WO must contain/reference:

-   WO Number
-   SO Number
-   SO Item ID

------------------------------------------------------------------------

# JOB CARD → RIGHT DRAWER

The existing V2 JOB Card is a behavior/content reference.

V3 replaces it with a **Work Order Right Drawer**.

Retain relevant information such as:

-   WO Number
-   SO Number
-   Customer
-   Channel
-   Priority
-   Deadline
-   Product
-   Quantity
-   Dimension
-   Material
-   Thickness
-   Color
-   Finishing
-   Special Instruction
-   Artwork
-   Google Drive link
-   Production Process
-   Production Notes
-   Production timeline

Do NOT carry over these V2 behaviors:

-   Next Production Stage
-   sequential stage control
-   free stage selector used as sequential workflow

The Right Drawer is both WO Detail and Production Control.

------------------------------------------------------------------------

# PACKING

Packing is a **fulfillment process**, not a Production process.

## Critical rule

**Packing lookup is based on Sales Order, NOT Work Order.**

``` text
PACKING
   ↓
Lookup SO
   ↓
SO Packing Detail
   ↓
All Active Order Items
```

Packing works at SO/customer-order level.

WO is only the source of Production completion state.

------------------------------------------------------------------------

## PACK Gate

All Active Order Items must have completed Production before the SO can
be packed.

``` text
All Active Items
    ↓
Completed Production
    ↓
PACK
    ↓
RTS
```

------------------------------------------------------------------------

# RTS

RTS means:

**Ready to Ship / Ready to hand over**

RTS does NOT mean Completed Order.

``` text
PACK
 ↓
RTS
 ↓
Customer / Courier waiting
```

------------------------------------------------------------------------

# HANDOVER / FINAL COMPLETION

Final Order Completion is Admin-controlled.

Mandatory gates:

``` text
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

Therefore:

``` text
COMPLETED PRODUCTION
≠
COMPLETED ORDER
```

Payment alone must never automatically complete an Order.

------------------------------------------------------------------------

# PAYMENT

Payment is record-based.

Do NOT model payment as a single overwritten Amount Paid field.

Use:

``` text
Payment Records
    ↓
Total Paid
    ↓
Balance
    ↓
Payment Status
```

Payment statuses:

-   UNPAID
-   PARTIALLY PAID
-   PAID

Payment record history must remain preserved.

Marketplace orders create/receive an automatic PAID payment record.

Final Order Completion requires Payment = PAID.

------------------------------------------------------------------------

# CANCELLATION

Cancellation means:

``` text
INACTIVE
```

Never Delete.

Whole Order cancellation:

``` text
SO → INACTIVE
```

Partial cancellation:

``` text
SO Item → INACTIVE
Related WO → INACTIVE
```

There is NO Cancel WO button.

Cancellation is allowed only before Production starts.

Inactive WOs/items do not participate in active aggregation.

------------------------------------------------------------------------

# SO AGGREGATION

Sales Order status is an aggregate of its Active WOs plus
fulfillment/payment conditions.

Examples:

``` text
Any Active WO in Production
→ SO = In Progress

All Active WOs Completed Production
→ SO = Packing

All Active WOs RTS
→ SO = RTS

RTS + Handover + PAID + Admin Complete
→ SO = Completed
```

Inactive WOs are ignored by active aggregation.

SO is the customer transaction unit.

WO is the production execution unit.

------------------------------------------------------------------------

# UI / UX PRINCIPLES

1.  Keep UI concise.
2.  Use short badge labels.
3.  Do not expose internal complexity when it does not help the
    operator.
4.  Do not introduce unnecessary modals.
5.  Prefer Right Drawer for detail where already locked.
6.  Primary actions must use the V3 approved brighter blue CTA
    treatment, not ARTKRILIK navy.
7.  Red is reserved for destructive/danger actions, not normal
    Save/Create/Update/Submit actions.
8.  Do not introduce Save Draft where V3 explicitly removed it.
9.  Do not use Delete for cancellation.
10. Do not over-engineer future modules into the current core engine.

------------------------------------------------------------------------

# IMPLEMENTATION DISCIPLINE

For every Codex task:

1.  Read this AGENTS.md first.
2.  Inspect the relevant existing implementation.
3.  Scope the task narrowly.
4.  Do not modify unrelated modules.
5.  Do not invent business rules.
6.  Do not silently resolve conflicts.
7.  If a new business decision is required, STOP and report it.
8.  Apply only the approved scope.
9.  Run the relevant validation.
10. Report exactly what changed and what was validated.

Recommended task pattern:

``` text
SCAN
→ IDENTIFY
→ PROPOSE
→ APPROVE
→ APPLY
→ VALIDATE
```

Do not combine the entire ERP implementation into one task.

------------------------------------------------------------------------

# CURRENT IMPLEMENTATION PHASE

The Sales Order → Work Order → Packing core engine is **design locked**.

Implementation should proceed incrementally.

Recommended sequence:

``` text
TASK 01
Repository Scan / Baseline Validation

TASK 02
Sales Order Page Shell

TASK 03
New Order / Order Type Gate

TASK 04
Direct Order Form

TASK 05
Marketplace Order Form

TASK 06
SO Items / soItemId

TASK 07
Payment Records

TASK 08
SO Detail Right Drawer

TASK 09
WO Creation

TASK 10
WO Right Drawer / Production

TASK 11
Packing — SO Based Lookup

TASK 12
RTS / Handover / Complete Order

TASK 13
Full Validation
```

Do not start later tasks until the current task is validated.

------------------------------------------------------------------------

# IMPORTANT

The existing V2 code is a reference for behavior and data discovery.

It is NOT permission to preserve conflicting V2 behavior.

When V2 conflicts with this V3 baseline:

**V3 wins.**
