# ARTKRILIK ERP V3.3 — PHASE 04
## DATABASE & BACKEND ARCHITECTURE PROMPT

Design backend and database architecture.

Jangan coding implementation terlebih dahulu.

## DATABASE

Design relational model for:

- customers
- products
- sales_orders
- sales_order_items
- payments
- work_orders
- production records
- fulfillment
- handover
- audit records

## REQUIREMENTS

Preserve:

- business identity
- relationships
- historical records
- inactive records
- transaction history

Avoid unnecessary duplication.

Derived values should not become conflicting sources of truth.

## BACKEND

Design:

- service architecture
- domain services
- repository
- transaction boundaries
- validation
- authorization
- error handling
- audit logging
- API versioning
- idempotency where required

## IMPORTANT

Payment calculation must have one authoritative implementation.

Sales Order must not implement competing payment calculation.

## OUTPUT

Provide:

1. ERD
2. Table definitions
3. Primary keys
4. Foreign keys
5. indexes
6. constraints
7. status fields
8. audit strategy
9. transaction boundaries
10. backend folder structure
11. service boundaries
12. repository interfaces

Do not implement until approved.