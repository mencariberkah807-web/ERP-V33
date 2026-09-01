# ARTKRILIK ERP V3.3 — PHASE 04 DATABASE & BACKEND ARCHITECTURE CONTRACT

## Status

**COMPLETE**

This contract converts the approved Phase 02 business baseline and Phase 03 architecture into the persistence and backend architecture required for V3.3. It defines structure and boundaries without silently freezing unresolved Phase 02 business/schema decisions.

---

# 1. ERD

```text
CUSTOMERS
  1 │
    │ N
SALES_ORDERS
  1 │
    ├────────────── N PAYMENTS
    │
    │ 1
    │
    N
SALES_ORDER_ITEMS
    1 │
      │ 0..1
WORK_ORDERS
    1 │
      │ 1
PRODUCTION_RECORDS

SALES_ORDERS
    1 │
      │ 1
FULFILLMENT
    │
    ├── PACKING
    ├── RTS
    └── HANDOVER

PRODUCTS
  1 │
    │ N
SALES_ORDER_ITEMS
```

`SALES_ORDER_ITEMS → WORK_ORDERS` is constrained by the approved invariant: **one Active SO Item has at most one Active WO**. The relationship identity is `(sales_order_id, so_item_id)`, never Product ID.

Production process execution is represented under the WO/Production boundary and does not impose sequential routing.

---

# 2. TABLE DEFINITIONS

The following are logical relational tables. Exact physical SQL types remain an implementation detail of the selected database adapter.

## customers

Required conceptual identity: `customer_id`.

Purpose: customer master referenced by Sales Orders.

Canonical non-identity fields remain subject to Phase 02 OD-001.

## products

Required conceptual identity: `product_id`.

Purpose: product master referenced by SO Items.

Canonical non-identity fields remain subject to OD-002.

## sales_orders

Required identity: `sales_order_id`.

Required relationship: `customer_id`.

Business fields include order number, order type, lifecycle status and order-level transaction data required by the approved V3 flow.

Allowed order types:

- `DIRECT_ORDER`
- `MARKETPLACE`

Allowed business statuses:

- `NEW_ORDER`
- `READY_PRODUCTION`
- `IN_PRODUCTION`
- `PACKING`
- `RTS`
- `COMPLETED`
- `INACTIVE`

## sales_order_items

Required identity: `so_item_id`.

Required relationship: `sales_order_id`.

Product reference: `product_id` where applicable.

The table must support inactive line items without deletion.

Quantity is an SO Item attribute and is never a WO cardinality driver.

## payments

Required identity: `payment_id`.

Required relationship: `sales_order_id`.

Payment rows are append-preserving transaction history. Total Paid, Balance and Payment Status are derived from payment records under one authoritative calculation implementation.

Canonical payment fields remain subject to OD-003 and OD-010.

## work_orders

Required identity: `work_order_id` / WO Number as business identifier where applicable.

Required relationship identity:

```text
sales_order_id + so_item_id
```

Required references include SO Number and SO Item ID at the business contract level.

An active SO Item may have zero or one Active WO; duplicate Active WOs are prohibited.

## production_records

Required relationship: `work_order_id`.

Production lifecycle:

- `READY_PRODUCTION`
- `IN_PRODUCTION`
- `COMPLETED_PRODUCTION`

Process execution is independently represented so Laser Cutting, UV Printing, Assembly, Laser Marking and Finishing can operate independently/in parallel.

## fulfillment

Represents the SO-centered fulfillment boundary. It must support Packing, RTS and Handover milestones without collapsing them into Order Completion.

Canonical RTS/Handover persistence details remain subject to OD-005 and OD-006.

## audit_records

Required conceptual fields:

- audit identifier
- entity/domain reference
- action/event
- actor reference
- timestamp
- before/after or event payload where appropriate

Exact retention and actor schema remain implementation details unless later policy requires otherwise.

---

# 3. PRIMARY KEYS

All persisted entities require stable technical primary keys.

Business identifiers remain separate where required:

| Entity | Technical PK | Business identity / constraint |
|---|---|---|
| Customer | `customer_id` | customer identity |
| Product | `product_id` | product identity |
| Sales Order | `sales_order_id` | SO number |
| SO Item | `so_item_id` | SO number + SO item ID |
| Payment | `payment_id` | payment transaction |
| Work Order | `work_order_id` | SO number + SO item ID relationship |
| Production | `production_record_id` | Work Order reference |
| Fulfillment | `fulfillment_id` | Sales Order reference |
| Audit | `audit_id` | audit event |

No Product ID may replace `so_item_id` as the SO Item identity.

---

# 4. FOREIGN KEYS

```text
sales_orders.customer_id → customers.customer_id
sales_order_items.sales_order_id → sales_orders.sales_order_id
sales_order_items.product_id → products.product_id
payments.sales_order_id → sales_orders.sales_order_id
work_orders.sales_order_id → sales_orders.sales_order_id
work_orders.so_item_id → sales_order_items.so_item_id
production_records.work_order_id → work_orders.work_order_id
fulfillment.sales_order_id → sales_orders.sales_order_id
audit_records → audited entity references
```

The WO foreign-key relationship must be validated so the referenced SO Item belongs to the referenced Sales Order.

Cancellation is represented as state, not FK deletion.

---

# 5. INDEXES

Minimum logical indexes:

```text
customers(customer_id)
products(product_id)
sales_orders(customer_id)
sales_orders(order_number)
sales_orders(status)
sales_orders(order_type)
sales_order_items(sales_order_id)
sales_order_items(so_item_id)
payments(sales_order_id)
work_orders(sales_order_id, so_item_id)
work_orders(status)
production_records(work_order_id, status)
fulfillment(sales_order_id)
audit_records(entity_type, entity_id, created_at)
```

Critical uniqueness constraint:

```text
UNIQUE ACTIVE WORK ORDER (sales_order_id, so_item_id)
```

The physical implementation may use a partial/filtered unique index or an equivalent constraint where supported.

---

# 6. CONSTRAINTS

## Business constraints

1. Only Direct Order and Marketplace are valid order types.
2. `so_item_id` is mandatory for SO Items.
3. One Active SO Item has at most one Active WO.
4. Quantity cannot create additional WOs.
5. Duplicate Active WO creation is rejected.
6. Cancellation produces `INACTIVE`.
7. Cancellation-controlled records are not hard deleted.
8. Inactive records are excluded from active aggregation.
9. Packing is permitted only when every Active SO Item has completed Production.
10. Order completion requires RTS + Handover + PAID + Admin Complete.
11. Production completion never directly means Order completion.
12. Production processes must not have a mandatory sequential dependency.

## Referential constraints

- SO Items cannot reference a different Sales Order through a WO.
- Payments cannot belong to a nonexistent SO.
- Production records cannot belong to a nonexistent WO.
- Fulfillment records are SO-centered.

---

# 7. STATUS FIELDS

## Sales Order

```text
NEW_ORDER
READY_PRODUCTION
IN_PRODUCTION
PACKING
RTS
COMPLETED
INACTIVE
```

## Work Order / Production

```text
READY_PRODUCTION
IN_PRODUCTION
COMPLETED_PRODUCTION
INACTIVE
```

`INACTIVE` is cancellation state where applicable; it is not a production-completion state.

## Payment

Payment status is derived:

```text
UNPAID
PARTIALLY_PAID
PAID
```

Payment status must not become an independently conflicting source of truth.

---

# 8. AUDIT STRATEGY

Audit is event-oriented and append-preserving.

Audit important mutations including:

- create/update/cancel Sales Order;
- create/update/cancel SO Item;
- create/cancel Work Order;
- production start/complete;
- payment creation;
- packing;
- RTS;
- handover;
- final order completion.

Cancellation must retain actor/time/reason when the canonical cancellation metadata decision is eventually frozen.

Historical payment records must never be overwritten to simulate a new transaction.

Audit infrastructure must not alter domain behavior; it records accepted domain/application events.

---

# 9. TRANSACTION BOUNDARIES

Critical operations are atomic at the Application/Repository boundary.

### Create Direct Order

Atomic creation of SO and its SO Items. No automatic WO creation.

### Create Marketplace Order

Atomic creation of SO, SO Items, required WO workflow and automatic PAID payment record according to the approved Marketplace rule.

### Create Payment

Atomic append of a payment record. Payment summary is recalculated from preserved records.

### Create Work Order

Atomic validation + creation. Must reject an existing Active WO for the same SO Item.

### Complete Production

Atomic production state transition and associated execution updates.

### Pack Order

Atomic validation that all Active SO Items have completed Production, followed by packing completion.

### Handover Order

Atomic validation of RTS and creation/recording of handover milestone.

### Complete Order

Atomic validation of:

```text
RTS
+ HANDOVER
+ PAYMENT = PAID
+ ADMIN COMPLETE
```

Only then may SO transition to `COMPLETED`.

---

# 10. BACKEND FOLDER STRUCTURE

Aligned to Phase 03 boundaries:

```text
backend/
├── app/
│   ├── routes/
│   ├── middleware/
│   └── bootstrap/
├── application/
│   ├── commands/
│   ├── queries/
│   └── workflows/
├── domain/
│   ├── customer/
│   ├── product/
│   ├── salesOrder/
│   ├── payment/
│   ├── workOrder/
│   ├── production/
│   ├── packing/
│   ├── rts/
│   └── handover/
├── repositories/
│   ├── contracts/
│   └── database/
├── infrastructure/
│   ├── database/
│   ├── auth/
│   ├── audit/
│   └── external/
└── shared/
    ├── errors/
    └── transaction/
```

This is a target architecture, not an instruction to introduce a backend before its implementation phase.

---

# 11. SERVICE BOUNDARIES

## Customer Service

Owns customer master operations.

## Product Service

Owns product master operations.

## Sales Order Service

Owns SO lifecycle orchestration and SO Item relationship.

## Payment Service

Owns payment records and the **single authoritative payment calculation**.

Sales Order must consume the payment summary; it must not implement a competing payment calculation.

## Work Order Service

Owns WO creation and SO Item cardinality enforcement.

## Production Service

Owns production execution state and independent process execution.

## Fulfillment Service

Owns packing, RTS and handover milestones at Sales Order level.

## Audit Service

Owns immutable audit/event persistence.

Cross-service workflows are orchestrated by Application services; no service bypasses Domain invariants.

---

# 12. REPOSITORY INTERFACES

Conceptual ports:

```text
CustomerRepository
  getById(id)
  list(filter)
  save(customer)
  update(customer)

ProductRepository
  getById(id)
  list(filter)
  save(product)
  update(product)

SalesOrderRepository
  getById(id)
  getByOrderNumber(number)
  list(filter)
  save(order)
  update(order)

SalesOrderItemRepository
  listBySalesOrder(orderId)
  getById(soItemId)
  save(item)
  update(item)

PaymentRepository
  listBySalesOrder(orderId)
  append(payment)

WorkOrderRepository
  getBySoItem(orderId, soItemId)
  listBySalesOrder(orderId)
  save(workOrder)
  update(workOrder)

ProductionRepository
  getByWorkOrder(workOrderId)
  save(record)
  update(record)

FulfillmentRepository
  getBySalesOrder(orderId)
  save(record)
  update(record)

AuditRepository
  append(event)
  listByEntity(entityType, entityId)
```

Repository contracts expose business intent, not SQL, LocalStorage or transport details.

---

# 13. VALIDATION / AUTHORIZATION / ERROR HANDLING

Validation follows Phase 03 layering:

```text
Presentation → input validation
Application  → workflow preconditions
Domain       → invariants/state transitions
Repository   → persistence integrity
Infrastructure → dependency failures
```

Authorization is evaluated at the Application boundary using the approved role model. Exact permission granularity remains OD-007 and is not silently frozen here.

Errors use stable domain/application categories such as:

```text
VALIDATION_ERROR
AUTHORIZATION_ERROR
INVALID_STATE_TRANSITION
DUPLICATE_WORK_ORDER
NOT_FOUND
CONFLICT
PERSISTENCE_ERROR
INTEGRATION_ERROR
```

Storage-specific exceptions must not leak into Domain.

---

# 14. PAYMENT CALCULATION AUTHORITY

This is a mandatory Phase 04 architectural decision.

```text
Payment Records
      ↓
Payment Service / Domain Calculation
      ↓
Total Paid
      ↓
Balance
      ↓
Payment Status
```

There is exactly **one authoritative implementation** of payment calculation.

Sales Order, UI forms and UI previews consume the resulting summary and must not independently redefine payment arithmetic.

The exact edge-case policy for refunds, reversals, overpayment and payment timing remains open under OD-009/OD-010.

---

# 15. DATABASE / BACKEND MIGRATION STRATEGY

Current V3.3 may continue using LocalStorage through repository adapters.

The architecture prepares a later migration:

```text
React
 ↓
Application
 ↓
Domain
 ↓
Repository Port
 ↓
API / Backend
 ↓
Relational Database
```

Migration rules:

1. Preserve approved V3 business behavior.
2. Preserve historical transaction records.
3. Map legacy/current field differences explicitly.
4. Never infer unavailable V2 behavior.
5. Do not duplicate business calculations during migration.
6. Replace persistence adapters without rewriting Domain/Application contracts.
7. Validate migrated data and invariants before switching authority.

---

# 16. PHASE 04 OPEN-DECISION HANDLING

The following remain deliberately unfrozen:

- Customer canonical schema;
- Product canonical schema;
- Payment record edge-case fields/policy;
- complete WO schema;
- RTS schema;
- Handover schema;
- permission granularity;
- cancellation metadata/audit detail;
- Direct Order payment timing;
- payment edge cases;
- reopening policy.

Phase 04 defines safe relational boundaries around these decisions without inventing their business meaning.

---

# PHASE 04 VALIDATION

Validated against:

- approved Phase 02 business baseline;
- Phase 03 architecture contract;
- `AGENTS.md`;
- official Phase 04 requirements.

Validation result:

**PASS — relational and backend architecture satisfies the required Phase 04 outputs without conflicting with approved V3.3 business rules.**

No source implementation is introduced by this contract.

---

# PHASE 04 → PHASE 05

**STATUS: COMPLETE**

Next phase:

**PHASE 05 — API CONTRACT**

No generic Product Owner approval is required. Any genuinely new business decision encountered during API design must be isolated narrowly and must not reset completed phases.
