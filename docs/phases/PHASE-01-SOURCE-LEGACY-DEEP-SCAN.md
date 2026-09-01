# ARTKRILIK ERP V3.3 — PHASE 01
## LEGACY & PROJECT DEEP SCAN PROMPT

Gunakan project yang tersedia sebagai source aktual.

Lakukan DEEP SCAN sebelum melakukan perubahan apa pun.

Jangan coding.

Jangan refactor.

Jangan memperbaiki source.

## SCAN TARGET

Scan:

- project structure
- package.json
- Vite configuration
- React entry
- App
- App Shell
- legacy JavaScript
- Customer
- Product
- Sales Order
- Payment
- Work Order
- Production
- storage
- localStorage keys
- IDs
- business keys
- event handlers
- calculations
- status transitions
- cross-module dependencies

## OUTPUT FORMAT

Untuk setiap domain:

FILE
FUNCTION
DATA
STORAGE
CURRENT BEHAVIOR
DEPENDENCIES
BUSINESS RULE
UI DEPENDENCY
RISK
MIGRATION DIFFICULTY

## IMPORTANT

Jangan menyimpulkan bahwa current behavior adalah V3 requirement.

Pisahkan:

CURRENT SOURCE
VERSUS
V3 LOCKED REQUIREMENT.

Cari juga:

- duplicate logic
- duplicate state
- duplicated calculation
- global variables
- DOM coupling
- storage coupling
- business logic inside UI
- naming collision
- hidden dependency
- syntax risk
- performance risk

## FINAL OUTPUT

Buat:

1. Legacy System Map
2. React System Map
3. Domain Map
4. Dependency Map
5. Storage Map
6. Business Rule Map
7. Risk Register
8. Migration Map

STOP.

Do not modify files.