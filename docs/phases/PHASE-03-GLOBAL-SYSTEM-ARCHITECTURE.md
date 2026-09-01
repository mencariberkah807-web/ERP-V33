# ARTKRILIK ERP V3.3 — PHASE 03
## GLOBAL SYSTEM ARCHITECTURE PROMPT

Design the complete global architecture.

Jangan coding.

## LAYERS

Presentation
Application
Domain
Repository
Infrastructure

## FRONTEND

React owns:

- rendering
- interaction
- navigation
- form state
- presentation state

React tidak menjadi business engine.

## APPLICATION

Application layer owns:

- use cases
- commands
- orchestration
- cross-domain workflows

## DOMAIN

Domain owns:

- entities
- business rules
- invariants
- calculations
- state transitions

## REPOSITORY

Repository owns:

- persistence abstraction
- retrieval
- save
- update
- query

## INFRASTRUCTURE

Infrastructure owns:

- local storage adapter
- API client
- database adapter
- external services

## DESIGN REQUIREMENT

Architecture harus memungkinkan:

CURRENT:
React → Repository → LocalStorage

FUTURE:
React → Repository → API → Backend → Database

tanpa rewrite business/UI layer.

## OUTPUT

Buat:

1. Architecture Diagram
2. Folder Structure
3. Dependency Rules
4. Domain Boundaries
5. Repository Contracts
6. Application Use Cases
7. State Ownership
8. Error Boundary Strategy
9. Validation Boundary
10. Integration Boundary
11. Migration Strategy
12. Architecture Decision Record

STOP.

WAIT FOR APPROVAL.