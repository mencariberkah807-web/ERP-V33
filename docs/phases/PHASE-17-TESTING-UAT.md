# ARTKRILIK ERP V3.3 — PHASE 17
## QA / UAT MASTER PROMPT

Perform complete system testing.

## LEVELS

Unit Test
Integration Test
API Test
Repository Test
Domain Test
UI Test
End-to-End Test
Regression Test
UAT

## CRITICAL WORKFLOW

Customer
→ SO
→ Payment
→ WO
→ Production
→ Packing
→ RTS
→ Handover
→ Completed

## NEGATIVE TESTS

Invalid customer
Invalid product
Zero quantity
Negative quantity
Invalid deadline
Overpayment
Duplicate WO
Production cancellation
Unauthorized completion
Unpaid completion
Inactive record
Missing required field
Concurrent update

## REGRESSION

Verify all previously validated behavior.

No release if critical regression exists.

Output:

TEST MATRIX
PASS
FAIL
BLOCKED
KNOWN ISSUE
SEVERITY
REPRODUCTION
FIX
RETEST