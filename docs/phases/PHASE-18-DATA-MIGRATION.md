# ARTKRILIK ERP V3.3 — PHASE 18
## DATA MIGRATION PROMPT

Design and execute migration from legacy data to V3 backend only after UAT approval.

Do not mutate source data directly.

## PROCESS

BACKUP
↓
EXTRACT
↓
VALIDATE
↓
TRANSFORM
↓
IMPORT
↓
RECONCILE
↓
VERIFY

Preserve:

- IDs where required
- business keys
- relationships
- transaction history
- payment history
- inactive records

Never silently discard records.

Produce:

Migration Mapping
Validation Rules
Exception Report
Reconciliation Report
Rollback Plan

Do not migrate production data without explicit approval.