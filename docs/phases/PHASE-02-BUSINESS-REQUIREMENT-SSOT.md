# ARTKRILIK ERP V3.3 — PHASE 02
## BUSINESS SSOT PROMPT

Bangun Business Requirements Specification berdasarkan:

- V3 locked baseline
- project source
- approved decisions
- legacy behavior sebagai reference saja

Jangan coding.

## DOMAIN

MASTER

- Customer
- Product

TRANSACTION

- Sales Order
- Sales Order Item
- Payment
- Work Order
- Production
- Packing
- RTS
- Handover

## CORE RELATIONSHIP

Customer
↓
Sales Order
↓
Sales Order Items
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

Payment berhubungan dengan Sales Order.

## SALES ORDER

Order Type hanya:

- Direct Order
- Marketplace

Direct:

New Order
→ Direct Order
→ Create Order
→ SO Detail
→ Create WO

Marketplace:

New Order
→ Marketplace
→ Create WO
→ Automatic Payment
→ PAID

Create Order Direct tidak otomatis membuat WO.

## PAYMENT

Payment adalah transaction history.

Active Payment Records
→ Total Paid
→ Balance
→ Payment Status

Status:

UNPAID
PARTIALLY PAID
PAID

Marketplace automatic payment menjadi PAID.

## WORK ORDER

1 Active SO Item
→ 1 WO

Quantity tidak membuat WO tambahan.

## PRODUCTION

READY
→ IN PRODUCTION
→ COMPLETED PRODUCTION

Production Process bersifat non-sequential.

## FULFILLMENT

COMPLETED PRODUCTION
→ PACKING
→ PACK
→ RTS
→ HANDOVER
→ COMPLETED ORDER

Final completion membutuhkan:

RTS
+
HANDOVER
+
PAYMENT = PAID

## CANCELLATION

Cancel = INACTIVE.

Never hard delete untuk entity yang memiliki cancellation rule.

## OUTPUT

Buat:

- Business Domain Model
- Entity Definitions
- State Model
- State Transition Matrix
- Role/Permission Matrix
- Action Matrix
- Validation Matrix
- Business Invariants
- Cross-domain Rules
- Acceptance Criteria

STOP FOR APPROVAL.