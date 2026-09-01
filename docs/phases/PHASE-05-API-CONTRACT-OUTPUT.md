# ARTKRILIK ERP V3.3 — PHASE 05 API CONTRACT

Status: COMPLETE

This contract operationalizes the approved V3.3 Business Requirement SSOT and the Phase 03/04 architecture contracts. It defines API behavior without inventing unresolved business policy.

## 1. API CONVENTIONS

Base path: `/api/v1`

Content-Type: `application/json`

Authentication: authenticated ERP user/session. Exact provider remains an infrastructure decision; API authorization is role-based.

Success envelope:
```json
{"data": {}, "meta": {}}
```

Error envelope:
```json
{"error":{"code":"ERROR_CODE","message":"Human-readable message","details":{}}}
```

HTTP semantics:
- 200 successful read/update/action
- 201 resource created
- 204 successful deletion only where deletion is explicitly permitted; business cancellation-controlled entities are never hard deleted
- 400 malformed/invalid request
- 401 unauthenticated
- 403 authenticated but unauthorized
- 404 resource not found
- 409 business/state/conflict violation
- 422 semantic validation failure
- 500 unexpected server error

Mutation requests that can be retried MUST support an `Idempotency-Key` header. The server stores the operation result for the key within the applicable idempotency scope.

List endpoints support `page`, `pageSize`, `sort`, and domain-specific filters. Response metadata:
```json
{"page":1,"pageSize":25,"total":100,"totalPages":4}
```

## 2. RESOURCE GROUPS

### Customers
- `GET /customers`
- `GET /customers/{customerId}`
- `POST /customers`
- `PATCH /customers/{customerId}`

Authorization: Admin for mutations; authenticated read access according to role policy. Canonical customer fields remain an open Phase 02 decision and must not be invented by this contract.

### Products
- `GET /products`
- `GET /products/{productId}`
- `POST /products`
- `PATCH /products/{productId}`

Authorization: Admin for mutations. Canonical product schema remains open.

### Sales Orders
- `GET /sales-orders`
- `GET /sales-orders/{soNumber}`
- `POST /sales-orders`
- `PATCH /sales-orders/{soNumber}`
- `POST /sales-orders/{soNumber}/cancel`
- `GET /sales-orders/{soNumber}/items`
- `POST /sales-orders/{soNumber}/items`
- `PATCH /sales-orders/{soNumber}/items/{soItemId}`
- `POST /sales-orders/{soNumber}/items/{soItemId}/cancel`

Order creation MUST accept exactly `Direct Order` or `Marketplace`.
Direct Order creation MUST NOT create a WO automatically.
Marketplace creation MUST create the automatic PAID payment record atomically with the marketplace transaction and enter the WO creation flow defined by the business baseline.

### Payments
- `GET /sales-orders/{soNumber}/payments`
- `GET /payments/{paymentId}`
- `POST /sales-orders/{soNumber}/payments`

Payment creation is append-oriented transaction history. Historical records are not overwritten. Payment status is derived from total paid and balance using the approved statuses `UNPAID`, `PARTIALLY PAID`, `PAID`.

Direct Order payment timing remains an open business decision; the API therefore permits a valid payment transaction without assigning an undocumented creation-time requirement.

### Work Orders
- `GET /work-orders`
- `GET /work-orders/{woNumber}`
- `POST /sales-orders/{soNumber}/items/{soItemId}/work-orders`
- `GET /sales-orders/{soNumber}/items/{soItemId}/work-orders`

WO creation is atomic and guarded by the invariant `1 Active SO Item = 1 Active WO`. Identity is based on SO Number + SO Item ID, never Product ID. A second active WO returns 409.

### Production
- `GET /production/work-orders`
- `GET /production/work-orders/{woNumber}`
- `POST /production/work-orders/{woNumber}/start`
- `POST /production/work-orders/{woNumber}/complete`
- `PATCH /production/work-orders/{woNumber}/execution`

State transitions are strictly `READY PRODUCTION → IN PRODUCTION → COMPLETED PRODUCTION`.
Production processes may execute independently/in parallel. No sequential routing requirement may be encoded.
Production mutation endpoints MUST reject attempts to modify customer/order instruction fields.

### Packing
- `GET /packing/orders`
- `GET /packing/orders/{soNumber}`
- `POST /packing/orders/{soNumber}/pack`

Packing uses Sales Order as its primary transaction lookup. Packing is allowed only when every Active SO Item has completed production. Incomplete active items cause 409.

### Fulfillment / RTS / Handover
- `POST /fulfillment/orders/{soNumber}/rts`
- `POST /fulfillment/orders/{soNumber}/handover`
- `POST /sales-orders/{soNumber}/complete`

RTS is distinct from completed order. Handover records the transfer gate. Completion requires RTS + Handover + Payment=PAID + Admin Complete.

### Reports
- `GET /reports/sales-orders`
- `GET /reports/payments`
- `GET /reports/production`
- `GET /reports/fulfillment`

Reports are read-only and MUST exclude inactive records from active aggregation unless a report explicitly requests historical/inactive data.

## 3. CORE REQUEST SCHEMAS

### Create Sales Order
```json
{
  "orderType":"Direct Order | Marketplace",
  "customerId":"string",
  "items":[{"soItemId":"string","productId":"string","quantity":"number"}]
}
```
Additional fields may be added only when defined by the canonical schema decision or existing approved contract.

### Create Payment
```json
{
  "amount":"number",
  "paymentDate":"datetime",
  "method":"string",
  "reference":"string"
}
```
The exact payment record schema remains open; these fields are contract placeholders for the transaction boundary, not a frozen Phase 02 entity schema.

### Create Work Order
The endpoint derives `soNumber` and `soItemId` from the route. It MUST NOT accept a caller-selected Product ID as the identity relationship and MUST reject creation when an active WO already exists.

### Production action
```json
{"executionData":{}}
```
Execution data must not include customer/order instruction mutations.

### Pack / RTS / Handover / Complete
Action endpoints should use explicit command semantics and return the resulting aggregate state plus relevant audit/event identifiers.

## 4. RESPONSE CONTRACT

Resource responses expose canonical business identifiers and business states, not UI badge terminology.

Sales Order business status values:
- `NEW ORDER`
- `READY PRODUCTION`
- `IN PRODUCTION`
- `PACKING`
- `RTS`
- `COMPLETED`
- `INACTIVE`

Production/WO business status values:
- `READY PRODUCTION`
- `IN PRODUCTION`
- `COMPLETED PRODUCTION`

Payment status values:
- `UNPAID`
- `PARTIALLY PAID`
- `PAID`

SO Item identity MUST expose `soItemId`.
WO responses MUST expose `woNumber`, `soNumber`, and `soItemId`.

## 5. ATOMIC TRANSACTIONS

The following commands are atomic:

1. Create Sales Order — persist order and items consistently; Marketplace additionally persists automatic PAID payment as one transaction.
2. Create Payment — append payment record and recalculate derived payment state atomically.
3. Create Work Order — verify active SO Item, verify no active WO, create exactly one WO.
4. Complete Production — validate current state and persist completion atomically.
5. Pack Order — validate all Active SO Items completed, then transition packing state.
6. Handover Order — validate RTS and persist handover.
7. Complete Order — validate RTS, handover, PAID and Admin authorization before committing COMPLETED.
8. Cancel SO Item — set SO Item INACTIVE and related WO INACTIVE atomically; no hard delete.

Concurrent WO creation MUST be protected by a database uniqueness constraint/transaction boundary so race conditions cannot create two active WOs for one SO Item.

## 6. AUTHORIZATION

Admin:
- customer/product maintenance
- sales-order maintenance
- cancellation before production starts
- order completion
- handover authority where approved

Production:
- start/complete production
- production execution updates

Fulfillment:
- packing
- RTS

No role may bypass business invariants through the API.

The exact detailed permission granularity remains OD-007 and is therefore not silently frozen here.

## 7. VALIDATION / ERROR CODES

Recommended stable codes:
- `INVALID_ORDER_TYPE`
- `INVALID_STATE_TRANSITION`
- `DUPLICATE_ACTIVE_WORK_ORDER`
- `SO_ITEM_NOT_ACTIVE`
- `PRODUCTION_NOT_COMPLETE`
- `PAYMENT_NOT_PAID`
- `HANDOVER_REQUIRED`
- `RTS_REQUIRED`
- `ADMIN_COMPLETION_REQUIRED`
- `CANNOT_CANCEL_AFTER_PRODUCTION_START`
- `CANNOT_HARD_DELETE`
- `FORBIDDEN_PRODUCTION_DATA_MUTATION`
- `RESOURCE_NOT_FOUND`
- `VALIDATION_ERROR`
- `IDEMPOTENCY_CONFLICT`

Business conflicts return 409; malformed/semantic payload failures use 400/422 as appropriate.

## 8. IDEMPOTENCY

Required for POST command operations that create or transition business state:
- create sales order
- create payment
- create work order
- start/complete production
- pack
- RTS
- handover
- complete order
- cancellation commands

Repeated request with the same key and equivalent payload returns the original result. Reuse of a key with a materially different payload returns `IDEMPOTENCY_CONFLICT`.

## 9. FILTERING / SORTING

Sales orders: order type, status, customer, date range, active/inactive, payment status.
SO items: active/inactive.
Work orders: SO number, SO item ID, production status, active/inactive.
Production: status, process/execution criteria.
Packing/fulfillment: SO number, customer, fulfillment state.
Payments: SO number, status, date range.

Sorting must be deterministic and support a stable secondary key.

## 10. API VERSIONING

External contract is versioned under `/api/v1`. Breaking contract changes require a new major API version. Additive non-breaking fields/endpoints may remain in v1 subject to compatibility rules.

## 11. BUSINESS SAFETY RULES

The API MUST NOT:
- create WOs based on quantity;
- use Product ID as SO Item → WO identity;
- create duplicate active WOs;
- force sequential production routing;
- allow production operators to modify customer/order instructions;
- use WO as the primary packing lookup key;
- pack while an Active SO Item remains incomplete;
- equate RTS with order completion;
- complete an order without RTS + handover + PAID + Admin Complete;
- hard-delete cancellation-controlled records;
- include inactive records in active aggregation.

## 12. OPEN DECISION BOUNDARIES

This API contract intentionally does not freeze:
- canonical Customer schema;
- canonical Product schema;
- canonical Payment record schema;
- canonical WO schema beyond required identity/relationship fields;
- RTS/Handover persistence schemas;
- detailed permission granularity;
- cancellation audit metadata;
- Direct Order payment timing;
- payment edge-case policy;
- reopening policy.

When any of these becomes an implementation dependency, stop only at that narrow decision boundary; do not restart earlier phases.

## 13. VALIDATION RESULT

PHASE 05 output is aligned with:
- approved PHASE 02 business baseline;
- PHASE 03 architecture boundary;
- PHASE 04 database/backend transaction principles;
- non-loop execution control.

No new business rule has been invented.

**PHASE 05 COMPLETE.**
