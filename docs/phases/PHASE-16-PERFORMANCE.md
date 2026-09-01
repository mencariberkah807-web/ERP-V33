# ARTKRILIK ERP V3.3 — PHASE 16
## PERFORMANCE OPTIMIZATION PROMPT

Perform a performance audit only after functional behavior is stable.

Measure:

- initial load
- route load
- API latency
- database query latency
- rendering
- re-render frequency
- large table performance
- search/filter
- storage access
- cache behavior
- network payload
- image loading
- bundle size

Do not optimize based on assumption.

For every optimization:

CURRENT
MEASUREMENT
BOTTLENECK
PROPOSED CHANGE
EXPECTED IMPROVEMENT
RISK
VALIDATION

No unrelated refactor.

Do not sacrifice correctness for speed.

Validate before and after.