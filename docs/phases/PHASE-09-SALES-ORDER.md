# ARTKRILIK ERP V3.3 — PHASE 09
## SALES ORDER IMPLEMENTATION PROMPT

Implement Sales Order according to locked V3 SSOT.

## ORDER TYPES

Only:

Direct Order
Marketplace

## DIRECT

New Order
→ Direct Order
→ Form
→ Create Order
→ SO Detail

Create Order does not automatically create WO.

## MARKETPLACE

New Order
→ Marketplace
→ Form
→ Create WO pathway
→ Automatic Payment
→ PAID

## ORDER ITEM

Each active SO Item:

Product
Quantity
Unit Price
Discount
Item Total
Custom/Special Request
Artwork
Production Notes

Minimum 1 item.

## PAYMENT

Do not duplicate payment calculation.

Payment domain owns:

Total Paid
Balance
Payment Status

## SO DETAIL

Provide:

Order Information
Customer
Items
Payment
Artwork
Production Notes
Work Orders

Actions must follow locked state.

## CANCELLATION

Cancel = INACTIVE.

Never hard delete.

## EDIT

Before Production:
SO changes may synchronize to related WO.

After Production:
production execution authority belongs to WO.

## IMPLEMENTATION CONTROL

Implement one vertical slice at a time.

After each slice:

VALIDATE.

Do not refactor unrelated code.

Do not modify Payment or Work Order internals outside approved dependency changes.