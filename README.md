# ARTKRILIK ERP V3

React-based UI/UX migration architecture.

## Locked principles

- Index UI starts from zero.
- Old Index visual design is not a design reference.
- Existing working business behavior is preserved.
- `src/legacy/` is a reference/archive area for verified working source.
- Do not refactor legacy code while copying it.
- Change control: SCAN → IDENTIFY → PROPOSE → APPROVE → APPLY → VALIDATE.

## Initial target

React App Shell → shared UI system → full ERP vertical slice:
Customer → Product → Sales Order → Payment → Work Order → Production → RTS → Admin → COMPLETED.
