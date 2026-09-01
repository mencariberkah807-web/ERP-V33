# ARTKRILIK ERP V3.3 — PHASE 06 FRONTEND ARCHITECTURE CONTRACT

## Status

**COMPLETE**

Phase 06 defines the React frontend architecture required to implement ERP V3.3. It converts the approved Phase 02 business baseline and the Phase 03–05 architecture/contracts into presentation, feature, application, state, repository-client, and infrastructure boundaries.

This document is an implementation contract. It does not authorize business-rule invention, unrelated refactoring, or redesign of approved V3.3 behavior.

The historical wording `STOP FOR APPROVAL` in the phase prompt is superseded for execution sequencing by `docs/phases/PHASE-EXECUTION-CONTROL.md`. Phase 06 is complete when this contract is recorded and validated; execution advances immediately to Phase 07.

---

# 1. FRONTEND PRINCIPLES

1. React owns presentation and UI interaction.
2. Business rules remain in Domain/Application layers, never only inside React components.
3. Feature modules own feature-specific presentation and orchestration adapters.
4. Persisted/server data is distinct from derived data, UI state, and form state.
5. API/repository details do not leak into components.
6. Existing V3 locked behavior has priority over current implementation conventions when they conflict.
7. Legacy code is protected/reference behavior only and is not a dependency of the new frontend architecture.
8. UI badge labels are presentation; business status values remain canonical domain values.
9. Right-drawer interaction is the approved Sales Order detail pattern; the obsolete JOB Card Modal is not a frontend architecture reference.
10. Implementation proceeds incrementally by the controlled Phase 08–13 feature sequence; Phase 06 does not trigger a mass rewrite.

---

# 2. TARGET FRONTEND STRUCTURE

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── appShell/
│
├── components/
│   ├── ui/
│   └── layout/
│
├── features/
│   ├── dashboard/
│   ├── customers/
│   ├── products/
│   ├── sales-orders/
│   ├── payments/
│   ├── work-orders/
│   ├── production/
│   └── fulfillment/
│
├── domain/
├── application/
├── repositories/
├── infrastructure/
├── state/
├── styles/
└── legacy/
```

Feature folders contain presentation concerns and feature-specific hooks/controllers. Domain and application remain independent of React.

The structure is a target boundary, not permission to move every existing file immediately.

---

# 3. APPLICATION SHELL AND ROUTING

## 3.1 App shell

`app/appShell` owns the persistent ERP chrome:

- sidebar/navigation
- top/header region
- main content outlet
- global notifications/toasts
- global loading/error boundary
- drawer/modal host where required

The existing approved App Shell is protected. Feature implementation must plug into the shell rather than replacing it casually.

## 3.2 Router

`app/router` owns route definitions and route-level composition only.

Conceptual route map:

```text
/
/dashboard
/customers
/products
/sales-orders
/sales-orders/:soId
/payments
/work-orders
/work-orders/:woId
/production
/fulfillment
```

Routes must not contain business mutations. Route components invoke application/query hooks.

## 3.3 Route data boundaries

A route may establish:

- route parameters
- route-level query loading
- route-level error handling
- route-level authorization guard

It must not calculate domain totals, manufacture status transitions, or directly mutate persistence.

---

# 4. FEATURE BOUNDARIES

## Customers

Owns customer list/detail/form presentation and invokes Customer application operations.

## Products

Owns product list/detail/form presentation and invokes Product application operations.

## Sales Orders

Owns:

- New Order entry
- Direct Order / Marketplace gate
- SO list
- SO detail
- SO item presentation
- payment summary presentation
- Create WO action presentation
- Edit/Cancel actions
- right drawer

Sales Order is the customer transaction feature. It does not directly own Work Order persistence.

## Payments

Owns payment-history presentation and payment-entry presentation. Payment totals/status are derived from preserved transaction records through application/domain services.

## Work Orders

Owns WO list/detail and production execution presentation. WO lookup identity is `SO Number + SO Item ID`; Product ID is not the SO Item → WO identity.

## Production

Owns execution controls and process views only. It cannot edit customer/order instructions.

The five approved processes are:

- Laser Cutting
- UV Printing
- Assembly
- Laser Marking
- Finishing

The frontend must not impose a mandatory sequential route among these processes.

## Fulfillment

Owns Packing, RTS, and Handover presentation. Packing lookup is Sales Order based and evaluates Active SO Items.

---

# 5. COMPONENT BOUNDARIES

## 5.1 Shared UI components

`components/ui` contains reusable visual primitives such as:

- Button
- Input
- Select
- Date/number controls
- Table
- Badge
- Drawer
- Modal
- EmptyState
- LoadingState
- ErrorState
- Confirmation dialog
- Toast/notification

These components contain no ERP business rules.

Primary action styling follows the approved V3.3 visual direction: use the lighter/brighter blue CTA treatment; ARTKRILIK navy remains a structural/brand color and red remains accent/destructive, not the default Save/Create/Update/Submit color.

## 5.2 Layout components

`components/layout` contains reusable structural compositions. It must not own domain mutations.

## 5.3 Feature components

Feature components compose shared UI with feature data and application hooks. They may decide presentation, visibility, local interaction, and formatting, but not redefine domain invariants.

---

# 6. STATE SEPARATION

The frontend MUST maintain explicit separation among five state categories.

## 6.1 Persisted state

Business data that has been accepted by the repository/backend boundary.

Examples:

- customers
- products
- sales orders
- SO items
- payment records
- work orders
- production records
- packing/RTS/handover records

Persisted state is never treated as UI-only state.

## 6.2 Server/query state

Remote or repository-backed data used by screens, including:

- loading
- fetching
- success
- error
- stale/refresh state
- pagination/filter/sort state where applicable

The frontend must be able to invalidate and refresh affected queries after mutations.

## 6.3 Derived state

Computed from authoritative persisted/query data rather than independently stored when avoidable.

Examples:

```text
Total Paid
Balance
Payment Status
Active SO Items
Production completion gate
Order completion eligibility
```

The UI must not independently maintain a second authoritative version of these values.

## 6.4 UI state

Transient presentation state:

- open drawer
- selected row
- active tab
- expanded section
- confirmation dialog
- toast visibility
- table display preferences

UI state must not be persisted as business data unless explicitly required later.

## 6.5 Form state

Unsubmitted/editing values held by a form.

Form state becomes persisted business state only through an approved application command.

---

# 7. HOOK ARCHITECTURE

Hooks are adapters between React presentation and application/query services.

Recommended categories:

```text
useCustomerQuery
useProductQuery
useSalesOrderQuery
useSalesOrderDetail
useCreateDirectOrder
useCreateMarketplaceOrder
useUpdateSalesOrder
useCancelSalesOrder
useCancelSalesOrderItem
useCreateWorkOrder
usePaymentHistory
useRecordPayment
useWorkOrderQuery
useProductionActions
usePackingQuery
usePackSalesOrder
useRtsAction
useHandoverAction
useCompleteOrder
```

Rules:

1. Hooks may manage query/mutation lifecycle.
2. Hooks must call application/repository contracts rather than LocalStorage directly.
3. Hooks may map API DTOs to presentation models only at the boundary.
4. Hooks must not redefine business invariants.

---

# 8. APPLICATION SERVICE BOUNDARY

Application services orchestrate commands and queries.

Conceptual command set:

```text
CreateDirectOrder
CreateMarketplaceOrder
UpdateSalesOrder
CancelSalesOrder
CancelSalesOrderItem
CreateWorkOrder
RecordPayment
StartProduction
CompleteProduction
PackSalesOrder
MarkRTS
RecordHandover
CompleteOrder
```

Conceptual query set:

```text
GetSalesOrder
ListSalesOrders
GetSalesOrderDetail
ListPaymentsBySalesOrder
GetWorkOrderBySoItem
ListWorkOrdersBySalesOrder
GetProductionByWorkOrder
GetPackingBySalesOrder
GetRTSBySalesOrder
GetHandoverBySalesOrder
```

Cross-domain orchestration belongs here. Examples:

```text
Create Marketplace Order
→ create SO
→ create required WO flow
→ create automatic PAID payment record
```

```text
Complete Order
→ verify RTS
→ verify Handover
→ verify Payment = PAID
→ verify Admin completion action
→ complete SO
```

The application layer may reject invalid operations but must delegate invariant definitions to Domain.

---

# 9. REPOSITORY CLIENT BOUNDARY

React must not know whether data comes from LocalStorage, an API, or a future backend.

Feature hooks call application services; application services call repository contracts.

```text
React Component
      ↓
Feature Hook
      ↓
Application Service
      ↓
Repository Contract
      ↓
Infrastructure Adapter
      ↓
LocalStorage / API
```

Required repository identity rule:

```text
WorkOrderRepository.getBySoItem(soNumber, soItemId)
```

Product ID must never replace SO Item identity.

---

# 10. FORM STRATEGY

Forms are responsible for:

- field state
- touched/dirty state
- client-side shape validation
- field error presentation
- submit/cancel behavior
- disabling submission while mutation is active

Application/domain validation remains authoritative.

## Direct Order

The form creates the Sales Order only. It must not silently create a WO.

## Marketplace

The form invokes the Marketplace application command, which orchestrates the approved automatic payment behavior and WO flow.

## SO Item

Every item must receive/use canonical `soItemId`.

## Production

Production forms expose execution data only. Customer/order instruction fields are read-only/non-editable from the production role.

---

# 11. LOADING, ERROR, AND EMPTY STATES

Every data-driven feature must define three explicit states.

## Loading

Use skeleton/spinner/progressive loading appropriate to the component. Do not display misleading empty-state messaging while a query is still loading.

## Error

Show a recoverable error state with retry where appropriate. Do not silently substitute fake/default business data.

## Empty

Differentiate:

- no records exist
- current filters return no records
- required relation is missing
- operation is not yet eligible

An empty state must never be interpreted as proof that a business entity does not exist when data failed to load.

---

# 12. OPTIMISTIC UPDATE POLICY

Optimistic updates are permitted only for presentation-safe operations where rollback is deterministic and no business invariant can be bypassed.

Default policy for ERP mutations:

**prefer server/repository-confirmed updates over optimistic mutation.**

Do not optimistically finalize:

- payment status
- WO creation
- production completion
- packing
- RTS
- handover
- final order completion
- cancellation

These operations must reflect authoritative mutation success before the UI presents the new persisted state.

UI-only interactions such as opening drawers/tabs may be immediate.

---

# 13. CACHE INVALIDATION

After a successful mutation, invalidate/refetch affected query domains rather than manually maintaining duplicate derived copies.

Examples:

```text
Create/Update SO
→ invalidate SO list
→ invalidate SO detail
→ invalidate related payment/WO views when affected
```

```text
Create WO
→ invalidate SO detail
→ invalidate WO list/detail
```

```text
Record Payment
→ invalidate payment history
→ invalidate SO detail/payment summary
```

```text
Complete Production
→ invalidate WO detail
→ invalidate production data
→ invalidate affected SO detail
→ invalidate packing eligibility/query
```

```text
Pack / RTS / Handover / Complete
→ invalidate fulfillment data
→ invalidate SO detail/list
```

Invalidation must follow actual domain dependencies, not broad application-wide refreshes by default.

---

# 14. BUSINESS RULE PROTECTION IN FRONTEND

The frontend must visibly enforce, but never solely define, the following approved rules:

```text
Direct Order ≠ automatic WO creation
Marketplace → automatic PAID payment
1 Active SO Item = 1 Active WO
Quantity ≠ WO count
SO Number + SO Item ID = WO relationship
Duplicate active WO = prohibited
Production = non-sequential
Packing lookup = Sales Order based
All Active SO Items complete production before Packing
RTS ≠ Completed Order
RTS + Handover + PAID + Admin Complete → Completed Order
Cancellation = INACTIVE
Cancelled records are not hard deleted
Inactive records excluded from active aggregation
```

UI disable/hide behavior is a usability safeguard. Application/domain validation remains authoritative so rules cannot be bypassed through another client or direct API call.

---

# 15. STATUS REPRESENTATION

Canonical business status values remain:

```text
NEW ORDER
READY PRODUCTION
IN PRODUCTION
PACKING
RTS
COMPLETED
INACTIVE
```

Production states:

```text
READY PRODUCTION
IN PRODUCTION
COMPLETED PRODUCTION
```

Payment states:

```text
UNPAID
PARTIALLY PAID
PAID
```

Approved UI badge labels may use shorter presentation labels, but those labels must never become domain values.

---

# 16. SALES ORDER DETAIL DRAWER

The Sales Order detail experience uses the approved Right Drawer pattern.

Primary actions:

```text
Edit
Create WO
Print
```

There is no Save Draft action.

The drawer may present:

- customer summary
- order metadata
- order status
- SO items
- pricing/payment summary
- production/WO summary
- fulfillment status
- available actions

Action availability is derived from authoritative state/permissions. The drawer does not own mutation logic.

---

# 17. ROLE-AWARE PRESENTATION

Frontend authorization is a presentation safeguard layered over backend/application authorization.

Conceptual roles:

```text
Admin
Production
Fulfillment
```

Admin owns customer/order-facing operations and final completion.

Production owns execution operations and cannot edit customer/order instructions.

Fulfillment owns Packing/RTS execution according to the approved permission contract.

The frontend must never treat hidden UI as the sole authorization mechanism.

---

# 18. PERFORMANCE BOUNDARIES

The frontend must avoid:

- duplicated authoritative state
- unnecessary global rerenders
- application-wide refetch after local mutation
- business calculations repeated independently in multiple components
- direct persistence access from leaf components
- loading entire datasets when a scoped query is sufficient

Use feature-scoped queries, memoized derived presentation where justified, and targeted invalidation.

Performance optimization must not weaken business-state correctness.

---

# 19. LEGACY ISOLATION

`src/legacy` remains isolated.

Allowed use:

- behavioral comparison when legacy source is actually available
- migration/reference analysis

Not allowed:

- direct import into new domain logic
- direct import into new application services
- treating legacy UI labels as V3 business states
- reconstructing missing V2 behavior by assumption

Missing legacy behavior remains UNKNOWN.

---

# 20. IMPLEMENTATION SEQUENCE AFTER PHASE 06

The controlled implementation roadmap remains:

```text
PHASE 07  UI/UX Design System
PHASE 08  Master Data
PHASE 09  Sales Order
PHASE 10  Payment
PHASE 11  Work Order & Production
PHASE 12  Packing / RTS / Handover
PHASE 13  Dashboard / Reporting
PHASE 14  Full Integration
PHASE 15  Security
PHASE 16  Performance
PHASE 17  Testing / UAT
PHASE 18  Data Migration
PHASE 19  Deployment
PHASE 20  Final Audit / Release
```

Each implementation phase uses:

```text
READ → SCOPE → IMPLEMENT → VALIDATE → RECORD → ADVANCE
```

A targeted inspection required by a task is not a Phase 01 restart.

---

# 21. PHASE 06 VALIDATION

The contract was checked against:

- approved Phase 02 business baseline
- Phase 03 architecture boundaries
- Phase 04 database/backend contract
- Phase 05 API contract
- AGENTS.md execution rules

Validation result:

```text
PASS — frontend architecture boundaries are defined
PASS — state categories are separated
PASS — routing and feature boundaries are defined
PASS — hooks/application/repository boundaries are defined
PASS — loading/error/empty behavior is defined
PASS — optimistic update restrictions are defined
PASS — cache invalidation strategy is defined
PASS — form strategy is defined
PASS — approved SO/WO/payment/production/fulfillment invariants are protected
PASS — no new business rule was introduced
PASS — no legacy behavior was reconstructed
```

## PHASE 06 RESULT

**COMPLETE**

The project must advance immediately to **PHASE 07 — UI/UX DESIGN SYSTEM**.

No generic approval is required. Stop only if Phase 07 exposes a genuinely new Product Owner decision outside the approved baseline.
