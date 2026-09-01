# ARTKRILIK ERP V3.3 — PHASE 14
## FULL SYSTEM INTEGRATION PROMPT

Integrate the complete ERP workflow.

## MASTER FLOW

Customer
↓
Sales Order
↓
Order Items
↓
Payment
↓
Work Order
↓
Production
↓
Packing
↓
RTS
↓
Handover
↓
Completed Order

## TEST SCENARIOS

Scenario 1:
Direct Order → unpaid

Scenario 2:
Direct Order → partial payment

Scenario 3:
Direct Order → paid

Scenario 4:
Direct Order → multiple items → multiple WO

Scenario 5:
Marketplace → automatic PAID

Scenario 6:
Production incomplete → packing blocked

Scenario 7:
All production completed → packing allowed

Scenario 8:
RTS → handover → completed

Scenario 9:
Unpaid → final completion blocked

Scenario 10:
Cancel before Production

Scenario 11:
Cancel after Production → blocked

Scenario 12:
Partial item cancellation

Scenario 13:
SO edit before Production → WO sync

Scenario 14:
SO edit after Production → restricted

Do not fix unrelated issues during integration.

Every failure must be classified:

BUG
BUSINESS RULE GAP
ARCHITECTURE GAP
DATA GAP
UI BUG
INTEGRATION BUG
PERFORMANCE ISSUE

Then stop for approval before structural changes.