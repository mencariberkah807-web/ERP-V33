# ARTKRILIK ERP V3.3 — PHASE 06
## FRONTEND ARCHITECTURE PROMPT

Design the complete React frontend architecture.

## PRINCIPLE

React owns presentation.

Do not put business logic directly inside components.

## TARGET

src/
├── app/
├── components/
│   ├── ui/
│   └── layout/
├── features/
│   ├── dashboard/
│   ├── customers/
│   ├── products/
│   ├── sales-orders/
│   ├── payments/
│   ├── work-orders/
│   ├── production/
│   └── fulfillment/
├── domain/
├── application/
├── repositories/
├── infrastructure/
├── state/
├── styles/
└── legacy/

## STATE SEPARATION

Separate:

- persisted state
- server state
- derived state
- UI state
- form state

Do not mix them.

## OUTPUT

Design:

- routing
- feature boundaries
- component boundaries
- hooks
- application services
- repository clients
- state management
- loading states
- error states
- empty states
- optimistic update rules
- cache invalidation
- form strategy

Do not implement modules yet.

STOP FOR APPROVAL.