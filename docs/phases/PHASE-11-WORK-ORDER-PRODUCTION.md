# ARTKRILIK ERP V3.3 — PHASE 11
## WORK ORDER & PRODUCTION IMPLEMENTATION PROMPT

Implement Work Order and Production.

## RELATIONSHIP

Sales Order
↓
SO Item
↓
Work Order

Rule:

1 Active SO Item = 1 WO.

Quantity does not create additional WO.

## WO DATA

WO inherits transaction information from:

SO
+
SO Item

Do not force users to re-enter existing order data.

## PRODUCTION STATUS

READY
→ IN PRODUCTION
→ COMPLETED PRODUCTION

UI labels may use:

Ready Production
In Production
Completed Production

Do not create an artificial sequential production-stage engine.

## PRODUCTION PROCESS

Processes are non-sequential.

Possible processes:

Laser Cutting
UV Printing
Assembly
Laser Marking
Finishing

Processes may occur in different orders or in parallel.

## PRODUCTION AUTHORITY

Production may control execution state.

Production must not independently alter:

Customer
SO
Quantity
Price
Discount
Deadline
Artwork
Specification
Production Notes

unless an explicitly approved exception exists.

## JOB DETAIL

Use a right drawer/detail panel.

Show:

WO
SO
Customer
Product
Qty
Specification
Artwork
Production Notes
Process
Timeline
Status

Do not introduce:

Next Production Stage
Free Stage Selector
Sequential Stage Engine

## VALIDATE

Test:

SO → WO
duplicate protection
multiple SO items
multiple WOs
start
progress
complete
inactive
production restrictions