# ARTKRILIK ERP V3.3 — PHASE 07
## UI/UX DESIGN SYSTEM CONTRACT

**Status:** COMPLETED
**Mode:** DESIGN CONTRACT → RECORD → CONTINUE
**Implementation:** NOT AUTHORIZED IN THIS PHASE

This document is the authoritative UI/UX contract for ARTKRILIK ERP V3.3.

Old Index UI is obsolete as a design reference. The V3.3 interface is designed from zero. Existing working App Shell behavior must be preserved unless explicitly approved for change.

---

# 1. UX PRINCIPLES

1. **Operational speed** — common ERP actions require minimal navigation and interaction.
2. **Clarity first** — status, ownership, next action, and blocking conditions are immediately visible.
3. **Information hierarchy** — primary transaction data dominates secondary metadata.
4. **Low cognitive load** — avoid decorative UI, redundant controls, and ambiguous actions.
5. **Desktop productivity** — dense but readable information presentation is preferred for ERP workflows.
6. **Responsive behavior** — layouts remain usable on narrower screens without changing business meaning.
7. **Consistent interaction** — identical component types behave identically throughout the application.
8. **Role-based actions** — users see only actions appropriate to their role and current entity state.
9. **Business state is authoritative** — UI labels and badges represent business state; they do not redefine it.
10. **Destructive actions are explicit** — cancellation/destructive operations require clear distinction from ordinary actions.

---

# 2. INFORMATION ARCHITECTURE

The application is organized around the V3.3 business domains:

```text
CORE
├── Dashboard
├── Notifications / Activity
└── Settings

SALES
├── Customers
├── Sales Orders
└── Payments

MASTER DATA
└── Products

PRODUCTION
├── Work Orders
└── Production

FULFILLMENT
├── Packing
├── RTS
└── Handover

``` 

Business authority remains unchanged:

```text
Customer → Sales Order → SO Items → Work Order → Production → Packing → RTS → Handover → Completed Order
```

Payment remains transaction history attached to the Sales Order.

---

# 3. NAVIGATION ARCHITECTURE

## Primary navigation

The persistent App Shell consists of:

```text
Sidebar
Header
Main Content
Page Header
Content Container
```

The Sidebar is the structural navigation surface. The Header provides global context and utility actions. Main Content contains the active module. Page Header establishes page title, context, and primary page action. Content Container controls readable content width and page rhythm.

## Navigation rules

- Navigation groups follow business domains, not implementation folders.
- Navigation must not expose obsolete V2 concepts as primary modules.
- The active module and current location must be visually obvious.
- Deep transaction work may use drawers/dialogs without losing page context.
- Back/close behavior must preserve the user's working context where practical.
- Navigation visibility is role-aware where permissions require it.

---

# 4. DESIGN TOKENS

## Color

```text
--color-brand-navy: #1F3356
--color-primary: bright/light blue direction for primary actions
--color-danger: #ED1C24
--color-success: semantic success token
--color-warning: semantic warning token
--color-info: semantic information token
--color-surface: application surface token
--color-background: application background token
--color-text-primary: primary text token
--color-text-secondary: secondary text token
--color-border: neutral border token
```

**Locked brand rule:** ARTKRILIK navy is structural/brand color. Primary CTA uses a lighter/brighter blue visual direction. Red is reserved for destructive/error emphasis and is never the default Save/Create/Update/Submit CTA.

The exact non-brand semantic palette may be implemented through centralized tokens and must remain visually consistent; individual pages must not invent local color systems.

## Typography

- Use a single coherent UI font stack.
- Establish distinct tokens for page title, section title, body, metadata, table text, labels, and action text.
- Typography hierarchy must communicate importance without excessive size variation.

## Spacing

Use a centralized spacing scale. Components and pages must consume spacing tokens rather than arbitrary per-element values.

## Radius / shadows / borders

- Radius uses a centralized scale.
- Shadows are restrained and communicate elevation/context, not decoration.
- Borders are primarily used to establish grouping and table/form boundaries.

---

# 5. COMPONENT SPECIFICATION

## Buttons

Primary action:
- bright/light blue direction
- used for Save, Create, Update, Submit and other primary non-destructive actions

Secondary action:
- neutral/outlined treatment
- used for supporting actions

Destructive action:
- red treatment
- used only for cancellation, deletion where permitted by business policy, and other destructive/error emphasis

## Inputs / Selects

- Clear labels are mandatory.
- Validation feedback appears adjacent to the affected field.
- Required fields are visually identifiable.
- Disabled/read-only states must be distinguishable from editable states.

## Tables

Tables are the primary dense-data component for ERP lists.

Requirements:
- stable column hierarchy
- readable density
- consistent alignment by data type
- row-level action affordance
- visible status
- predictable sorting/filtering when supported by the page
- responsive fallback for narrow screens

## Cards

Cards group related information or summary metrics. They must not replace tables where row-level operational scanning is required.

## Badges

Badges communicate state. They are presentation only and must map to authoritative business states.

Examples include:

```text
NEW ORDER
READY PRODUCTION
IN PRODUCTION
COMPLETED PRODUCTION
PACKING
RTS
COMPLETED
INACTIVE
UNPAID
PARTIALLY PAID
PAID
```

## Drawers

Drawers are preferred for contextual detail/edit workflows where the user must retain the underlying list/page context.

## Dialogs

Dialogs are reserved for focused confirmation, destructive confirmation, short forms, and decisions requiring immediate attention.

## Forms

Forms use consistent field grouping, labels, validation, action placement, and save/cancel behavior. Business rules must not be hidden inside visual-only validation.

## Alerts

Alerts communicate blocking errors, warnings, or important system/business information. Do not use alerts as substitute navigation.

## Empty states

Empty states explain what is empty and, when permitted, expose the relevant next action.

## Loading states

Loading states must preserve layout stability and communicate that work is in progress.

## Error states

Errors must identify the affected operation/data and provide a clear recovery path where possible.

---

# 6. PAGE TEMPLATES

## List / operational page

```text
Page Header
  ├── Title / context
  └── Primary action

Toolbar
  ├── Search
  ├── Filters
  └── Secondary controls

Data Table

Context Drawer / Dialog
```

## Detail page

```text
Page Header
  ├── Entity identity
  ├── Status
  └── Allowed actions

Summary / key information

Primary content sections

Related records

Context Drawer / Dialog
```

## Form page / drawer

```text
Header

Grouped fields

Validation / helper text

Footer actions
  ├── Cancel / secondary
  └── Primary save/submit action
```

## Transaction workflow

The UI must make the current business state and next permitted action obvious without changing the underlying lifecycle.

---

# 7. RESPONSIVE RULES

- Desktop is the primary ERP productivity target.
- Narrower layouts must preserve business hierarchy and action meaning.
- Tables may transform into stacked records or horizontally scroll when necessary; data must not silently disappear.
- Sidebar may collapse responsively while preserving navigation access.
- Drawers/dialogs must remain usable on narrow viewports.
- Primary actions remain discoverable and reachable.
- Touch targets must remain practical on smaller screens.

---

# 8. INTERACTION RULES

1. Every visible action must have a defined business purpose.
2. Actions must be enabled/disabled according to entity state and permission.
3. Primary actions use the bright/light blue CTA direction.
4. Red is reserved for destructive/error emphasis.
5. Cancellation is visually and behaviorally distinct from ordinary editing.
6. Confirmation is required for destructive state changes.
7. Save/Create/Update/Submit must not be styled as destructive actions.
8. Status badges never become action controls by themselves unless explicitly designed as such.
9. Successful operations provide clear feedback without unnecessarily removing the user's context.
10. Errors do not silently discard entered data.
11. Loading states prevent duplicate submission where applicable.
12. UI interaction must never create business behavior that contradicts the PHASE 02 approved baseline.

---

# 9. ACCESSIBILITY RULES

- Keyboard navigation must be supported for all interactive controls.
- Focus state must remain visible.
- Form controls require programmatically associated labels.
- Color must not be the sole carrier of meaning.
- Status badges require text or another accessible semantic representation.
- Contrast must meet appropriate accessibility requirements.
- Dialogs/drawers must manage focus correctly.
- Interactive targets require clear names/labels.
- Error messages must be associated with affected controls.
- Responsive behavior must not remove essential information or actions.

---

# 10. ROLE / ACTION VISIBILITY MODEL

UI visibility follows business authority and permissions. Hiding an action is a presentation rule; the underlying business rule remains authoritative.

| Domain / Action | Admin | Production | Fulfillment |
|---|---:|---:|---:|
| Customer management | YES | NO | NO |
| Product management | YES | NO | NO |
| Sales Order creation/edit | YES | NO | NO |
| Sales Order cancellation | YES, before production | NO | NO |
| Work Order creation | YES / approved system flow | NO | NO |
| Production START | NO | YES | NO |
| Production DONE | NO | YES | NO |
| Packing | NO | NO | YES |
| RTS | NO | NO | YES |
| Handover | YES | NO | NO |
| Admin Complete | YES | NO | NO |
| Customer/order instruction editing | YES | NO | NO |

Production UI must not expose controls that permit modification of customer/order instructions, including customer, SO, SO Item, quantity, price, discount, deadline, artwork, specification, production notes, or customer requests.

---

# 11. V3.3 BUSINESS/UI BOUNDARY

The UI/UX layer must not redefine the approved business model.

Authoritative examples:

```text
Direct Order → does not automatically create WO
Marketplace → automatic PAID payment
1 Active SO Item → 1 Active WO
Quantity ≠ WO count
SO Number + SO Item ID → WO relationship
Production → non-sequential execution
Packing → SO-based lookup
All Active SO Items complete production → Packing eligible
RTS ≠ Completed Order
RTS + Handover + PAID + Admin Complete → Completed Order
Cancellation → INACTIVE
Inactive records → excluded from active aggregation
```

---

# 12. COMPLETION RECORD

PHASE 07 is considered complete when this document contains the ten required outputs:

- UX principles
- Information architecture
- Navigation architecture
- Design tokens
- Component specification
- Page templates
- Responsive rules
- Interaction rules
- Accessibility rules
- Role/action visibility model

All ten outputs are now defined in this contract.

**PHASE 07 STATUS: COMPLETE**

**NEXT:** proceed directly to the next implementation phase defined by the repository execution sequence. Do not restart repository/phase scanning unless a concrete validation failure requires it.
