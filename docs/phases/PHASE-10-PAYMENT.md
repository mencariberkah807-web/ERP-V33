# ARTKRILIK ERP V3.3 — PHASE 10
## PAYMENT IMPLEMENTATION PROMPT

Implement Payment as an independent domain authority.

## CORE

Payment Records
→ SUM active payments
→ Total Paid
→ Grand Total - Total Paid
→ Balance
→ Payment Status

Statuses:

UNPAID
PARTIALLY PAID
PAID

## RULES

Payment is transaction history.

Never overwrite previous payment records.

Payment cannot exceed current Balance.

Existing active records must remain preserved.

Marketplace automatically becomes PAID.

Final Order completion requires PAID.

## UI

Implement:

- Payment Summary
- Payment History
- Add Payment
- Validation
- Balance
- Status

## INTEGRATION

Sales Order provides Grand Total.

Payment returns:

Total Paid
Balance
Payment Status

SO Detail displays the result.

No competing calculation may exist inside Sales Order UI.

## VALIDATE

Test:

0 payment
partial payment
full payment
multiple payments
overpayment
edit SO
payment history
refresh
Marketplace
completion gate