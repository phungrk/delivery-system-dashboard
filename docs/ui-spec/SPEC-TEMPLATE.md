# UI Spec Template

> Version: 1.0  
> Last updated: YYYY-MM-DD  
> Parent spec: `SPEC.md`

## 1. Overview

Describe the UI surface in 2 to 5 lines.

Include:

- what this surface is for
- where it appears
- who uses it

## 2. Scope

State exactly what this spec covers.

Example:

- one page
- one tab
- one dialog
- one shared component family

## 3. Route Or Parent Surface

- Route: `/example`
- Parent: `Dashboard > Projects > Detail`
- Entry points:
  - click project card
  - deep link
  - modal open from another page

## 4. Data Contract

Document only the fields this UI uses.

```ts
interface ExampleViewModel {
  id: string;
  title: string;
  status: "A" | "B" | "C";
}
```

Rules:

- list required fields first
- separate optional fields clearly
- include enum values explicitly

## 5. UX Goal

List the top user questions this surface should answer.

Example:

1. What needs attention now?
2. What can I edit here?
3. What should I do next?

## 6. Layout

Describe the visual structure from top to bottom.

Recommended format:

- header
- summary row
- main content
- side panel
- footer

If useful, add a simple text wireframe.

## 7. Components

Map each visible part to a component or planned component.

Example:

- `HeaderCard`
- `StatusBadge`
- `FilterBar`
- `DetailTable`

## 8. States

Document all user-visible states.

Include:

- default
- loading
- empty
- error
- collapsed/expanded
- editable/read-only

## 9. Status And Business Rules

State when a certain badge, label, or visual treatment is used.

Example:

- `Delayed` when end date passed and completion < 100
- `At Risk` when overdue > 0 but not delayed

## 10. Interactions

List the important interactions and what each does.

Example:

- clicking row opens detail
- changing status updates source file
- expand button reveals advanced content

## 11. Responsive Behavior

Explain what changes between desktop and mobile.

## 12. Edge Cases

List cases that can break the UI if unspecified.

Example:

- missing dates
- empty arrays
- invalid status
- undefined budget

## 13. Accessibility Notes

Include only practical rules.

Example:

- expandable headers must be buttons
- icon-only actions require labels or tooltips
- color should not be the only status signal

## 14. Implementation Notes

Optional section.

Use this only for details that help implementation but are not product behavior.

Example:

- source parser file
- action used to persist edits
- fallback mapping logic

## 15. Open Questions

Capture unresolved product or UI choices here.
