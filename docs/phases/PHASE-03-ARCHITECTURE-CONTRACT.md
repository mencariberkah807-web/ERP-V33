# ARTKRILIK ERP V3.3 — PHASE 03 ARCHITECTURE CONTRACT

## Status

**COMPLETE**

Phase 03 converts the approved Phase 02 business baseline into the global implementation architecture. This document is the architecture contract for subsequent phases.

The historical wording `Jangan coding` / `STOP` in the phase prompt does not reset execution. Per `PHASE-EXECUTION-CONTROL.md`, the project proceeds monotonically after prerequisite approval.

---

# 1. ARCHITECTURE DIAGRAM

```text
┌──────────────────────────────────────────────────────────────┐
│                        PRESENTATION                           │
│ React / Router / Forms / Drawers / Tables / UI State        │
└──────────────────────────────┬───────────────────────────────┘
                               │ commands / queries
┌──────────────────────────────▼───────────────────────────────┐
│                       APPLICATION                            │
│ Use Cases / Commands / Queries / Orchestration              │
└──────────────────────────────┬───────────────────────────────┘
                               │ domain operations
┌──────────────────────────────▼───────────────────────────────┐
│                          DOMAIN                              │
│ Entities / Invariants / Calculations / State Transitions   │
│ Customer · Product · SO · SO Item · Payment · WO           │
│ Production · Packing · RTS · Handover                      │
└──────────────────────────────┬───────────────────────────────┘
                               │ repository ports
┌──────────────────────────────▼───────────────────────────────┐
│                       REPOSITORY                             │
│ Persistence abstraction / retrieval / save / update / query│
└──────────────────────────────┬───────────────────────────────┘
                               │ adapters
┌──────────────────────────────▼───────────────────────────────┐
│                     INFRASTRUCTURE                           │
│ LocalStorage / API Client / Database Adapter / External    │
│ Services                                                     │
└──────────────────────────────────────────────────────────────┘
```

### Runtime deployment path

Current V3.3 runtime:

```text
React → Application → Domain → Repository → LocalStorage
```

Future backend runtime:

```text
React → Application → Domain → Repository → API → Backend → Database
```

The domain and application contracts MUST remain independent of the persistence transport so the future migration does not require a business/UI rewrite.

---

# 2. FOLDER STRUCTURE

The target structure is organized by architectural responsibility and domain ownership:

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── appShell/
├── presentation/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── drawers/
│   ├── forms/
│   └── state/
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
│   └── local/
├── infrastructure/
│   ├── storage/
│   ├── api/
│   └── external/
├── adapters/
└── legacy/
```

This is a target architecture, not authorization to perform an unrelated mass refactor. Existing files are moved or adapted only when required by the active implementation phase.

---

# 3. DEPENDENCY RULES

Allowed dependency direction:

```text
Presentation
    ↓
Application
    ↓
Domain
    ↑
Repository contracts
    ↑
Infrastructure adapters
```

More precisely:

1. Presentation may depend on Application contracts and presentation components.
2. Application may depend on Domain and Repository contracts.
3. Domain must not depend on React, browser APIs, LocalStorage, API clients, or UI components.
4. Repository contracts define persistence ports and must not depend on a concrete storage mechanism.
5. Infrastructure implements repository contracts.
6. Infrastructure may depend on external/browser APIs.
7. Legacy code is reference/protected behavior only and must not become an accidental dependency of the new domain engine.
8. No domain rule may be implemented only inside a React component.
9. No UI label may become a business-state definition.

---

# 4. DOMAIN BOUNDARIES

## Master Data

- Customer
- Product

## Sales Transaction

- Sales Order
- Sales Order Item
- Payment

## Production

- Work Order
- Production

## Fulfillment

- Packing
- RTS
- Handover

Ownership follows the approved Phase 02 baseline:

```text
SO                = customer transaction authority
WO                = production execution unit
Production        = execution authority only
Packing           = fulfillment authority
RTS               = fulfillment milestone
Handover          = final physical transfer gate
Payment           = SO transaction history
Admin             = customer/order authority and final completion
```

Cross-domain workflows belong in Application, while domain invariants remain in Domain.

---

# 5. REPOSITORY CONTRACTS

Repository interfaces must expose intent, not storage details.

Conceptual contracts:

```text
CustomerRepository
  getById
  list
  save
  update

ProductRepository
  getById
  list
  save
  update

SalesOrderRepository
  getById
  list
  save
  update
  query

PaymentRepository
  listBySalesOrder
  save

WorkOrderRepository
  getBySoItem
  listBySalesOrder
  save
  update

ProductionRepository
  getByWorkOrder
  save
  update

PackingRepository
  getBySalesOrder
  save
  update

RTSRepository
  getBySalesOrder
  save
  update

HandoverRepository
  getBySalesOrder
  save
```

These are architectural ports. Exact field signatures remain subject to the later Database/Backend and API phases and must respect the Phase 02 open decisions.

Critical repository queries include:

```text
WorkOrderRepository.getBySoItem(soNumber, soItemId)
```

and must not establish Product ID as the SO Item → WO identity.

---

# 6. APPLICATION USE CASES

Application use cases orchestrate cross-domain behavior without owning the underlying business invariant.

### Sales Order

```text
CreateDirectOrder
CreateMarketplaceOrder
UpdateSalesOrder
CancelSalesOrder
CancelSalesOrderItem
GetSalesOrderDetail
```

### Work Order

```text
CreateWorkOrder
GetWorkOrderForSoItem
```

`CreateWorkOrder` must enforce the application workflow around the domain invariant that one active SO Item has at most one active WO.

### Payment

```text
RecordPayment
GetPaymentHistory
CalculatePaymentSummary
```

Payment history is append-preserving; payment status derives from transaction records.

### Production

```text
StartProduction
CompleteProduction
UpdateProductionProcessExecution
```

Production processes remain independently executable; no mandatory sequential routing is introduced.

### Fulfillment

```text
GetPackableSalesOrder
CompletePacking
MarkReadyToShip
RecordHandover
CompleteSalesOrder
```

`CompleteSalesOrder` orchestrates the final gates:

```text
RTS + HANDOVER + PAYMENT=PAID + ADMIN COMPLETE
```

---

# 7. STATE OWNERSHIP

## Sales Order

Application/domain owns business lifecycle state:

```text
NEW ORDER
→ READY PRODUCTION
→ IN PRODUCTION
→ PACKING
→ RTS
→ COMPLETED
```

Cancellation before Production starts produces `INACTIVE`.

## Work Order / Production

Production domain owns:

```text
READY PRODUCTION
→ IN PRODUCTION
→ COMPLETED PRODUCTION
```

## Payment

Payment domain owns transaction records and derives:

```text
UNPAID
PARTIALLY PAID
PAID
```

## UI

React owns only presentation/interaction state, including drawer visibility, form input state, filters, selection and navigation state.

React must not become the authoritative owner of business lifecycle state.

---

# 8. ERROR BOUNDARY STRATEGY

Errors are classified by layer:

```text
Presentation Error
  → UI boundary / user feedback

Application Error
  → use-case failure / actionable operation message

Domain Error
  → invariant/state-transition violation

Repository Error
  → persistence operation failure

Infrastructure Error
  → storage/API/external dependency failure
```

Rules:

1. Domain errors must be deterministic and transport-independent.
2. Application converts domain failures into operation results suitable for Presentation.
3. Infrastructure errors must not leak storage-specific implementation details into Domain.
4. UI must not swallow failed business operations and display false success.
5. Destructive/error emphasis uses the approved red treatment; normal Save/Create/Update/Submit actions use the approved brighter blue CTA treatment.

---

# 9. VALIDATION BOUNDARY

Validation is layered:

### Presentation validation

Input shape, required fields, formatting and immediate user feedback.

### Application validation

Use-case preconditions and cross-domain workflow gates.

### Domain validation

Business invariants, entity validity and legal state transitions.

### Repository validation

Persistence constraints and lookup integrity.

The same business rule must not be duplicated with contradictory implementations across UI components.

Critical V3 invariants remain domain/application protected:

```text
1 Active SO Item = 1 Active WO
Quantity ≠ WO count
SO Number + SO Item ID = WO relationship
All Active SO Items complete Production before Packing
RTS + HANDOVER + PAID + ADMIN COMPLETE = COMPLETED ORDER
Cancellation = INACTIVE
```

---

# 10. INTEGRATION BOUNDARY

The repository contract is the primary persistence boundary.

Current:

```text
React
  ↓
Application
  ↓
Domain
  ↓
Repository
  ↓
LocalStorage adapter
```

Future:

```text
React
  ↓
Application
  ↓
Domain
  ↓
Repository
  ↓
API client
  ↓
Backend
  ↓
Database
```

The Application and Domain layers must not branch on `localStorage` versus API behavior. That decision belongs to Infrastructure/Repository implementations.

External services, marketplace imports, printing, and future integrations terminate at explicit infrastructure/application boundaries rather than entering Domain directly.

---

# 11. MIGRATION STRATEGY

Migration is incremental and compatibility-oriented:

1. Preserve the existing App Shell and approved navigation architecture.
2. Introduce or align repository contracts before replacing persistence implementations.
3. Move business rules out of UI components into Application/Domain as each implementation phase reaches the relevant module.
4. Keep LocalStorage as the current infrastructure adapter until backend phases authorize replacement.
5. Preserve existing valid data through explicit adapters/mappers where field contracts change.
6. Never infer unavailable V2 behavior.
7. Never let a legacy implementation override an approved V3 business rule.
8. Validate each migrated module independently before advancing.
9. Backend/API migration must replace infrastructure adapters, not rewrite the business domain.

No broad data migration or schema hardening is performed in Phase 03; those belong to later phases.

---

# 12. ARCHITECTURE DECISION RECORD

## ADR-001 — Layered architecture

**Decision:** V3.3 uses Presentation → Application → Domain → Repository → Infrastructure separation.

**Reason:** isolates UI, business behavior, persistence and external services.

## ADR-002 — Domain is the business-rule authority

**Decision:** business invariants and state transitions are not owned by React components.

**Reason:** prevents UI-specific duplication and enables backend migration.

## ADR-003 — Repository abstraction

**Decision:** current LocalStorage persistence is accessed through repository boundaries.

**Reason:** enables future API/backend/database replacement without rewriting business/UI layers.

## ADR-004 — SO Item identity

**Decision:** `soItemId` is the canonical SO Item identity and WO relationship uses SO Number + SO Item ID.

**Reason:** Product ID cannot uniquely represent a line item within an order.

## ADR-005 — One active WO per active SO Item

**Decision:** active WO cardinality is one per active SO Item, independent of quantity.

**Reason:** WO represents a production execution unit, not a unit-count record.

## ADR-006 — Production independence

**Decision:** production processes are non-sequential and may execute independently/in parallel.

**Reason:** approved V3 business behavior explicitly rejects mandatory sequential routing.

## ADR-007 — SO-centered fulfillment

**Decision:** Packing uses Sales Order as its primary lookup authority.

**Reason:** packing evaluates the complete active order, not an isolated WO.

## ADR-008 — Separate production completion from order completion

**Decision:** `COMPLETED PRODUCTION` is distinct from `COMPLETED ORDER`.

**Reason:** final order completion requires RTS, handover, PAID and Admin Complete.

## ADR-009 — Cancellation as inactive state

**Decision:** cancellation produces `INACTIVE`; cancellation-controlled records are not hard deleted.

**Reason:** preserves transactional history and prevents destructive deletion semantics.

## ADR-010 — No silent open-decision defaults

**Decision:** Phase 03 does not freeze the eleven Phase 02 open decisions.

**Reason:** architecture may define boundaries without inventing unresolved business/schema policy.

---

# PHASE 03 VALIDATION

Validated against:

- approved Phase 02 business baseline;
- `AGENTS.md` authority hierarchy;
- Phase 03 official architecture requirements;
- current execution-control roadmap.

Validation result:

**PASS — no architectural rule identified that conflicts with the approved V3.3 business baseline.**

Phase 03 is therefore complete and execution may advance to Phase 04.

---

# PHASE 03 → PHASE 04

**STATUS: COMPLETE**

Next phase:

**PHASE 04 — DATABASE & BACKEND ARCHITECTURE**

No generic Product Owner approval is required to advance. A genuinely new business decision will be isolated only if implementation of Phase 04 actually depends on one of the still-open Phase 02 decisions.
