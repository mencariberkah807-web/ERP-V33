# ARTKRILIK ERP V3.3 — PHASE CONTROL

This directory contains the ERP V3.3 phase specifications and execution controls.

## AUTHORITATIVE EXECUTION CONTROL

Read `PHASE-EXECUTION-CONTROL.md` first.

It is the authoritative state machine for project progression. It prevents completed phases from being restarted and prevents the project from looping in SCAN / approval stages.

## CURRENT BASELINE

```text
PHASE 00  COMPLETE
PHASE 01  COMPLETE
PHASE 02  APPROVED
PHASE 03  CURRENT
```

## EXECUTION RULE

The project advances monotonically:

```text
READ ACTIVE PHASE
→ IMPLEMENT / PRODUCE REQUIRED OUTPUT
→ VALIDATE
→ RECORD RESULT
→ ADVANCE
```

A new chat/session MUST continue from the current phase. It MUST NOT restart PHASE 01 merely because repository inspection is needed.

Generic approval between phases is not required. Approval is required only for a genuinely new business/product/design decision not covered by the approved V3.3 baseline.

The phase documents define the required outcomes. `PHASE-EXECUTION-CONTROL.md` defines how the project moves from one phase to the next.

## PHASE ROADMAP

```text
00 Project Initialization
01 Source / Legacy Deep Scan
02 Business Requirement SSOT
03 Global System Architecture
04 Database & Backend Architecture
05 API Contract
06 Frontend Architecture
07 UI/UX Design System
08 Master Data
09 Sales Order
10 Payment
11 Work Order & Production
12 Packing / RTS / Handover
13 Dashboard / Reporting
14 Full Integration
15 Security
16 Performance
17 Testing / UAT
18 Data Migration
19 Deployment
20 Final Audit / Release
```

**Objective: finish ERP V3.3. This directory is an execution roadmap, not a perpetual scan loop.**
