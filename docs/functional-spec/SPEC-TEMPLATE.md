# Functional Spec Template

> Version: 1.0  
> Last updated: YYYY-MM-DD  
> Parent spec: `SPEC.md`

## 1. Overview

Explain the module or feature in 2 to 5 lines.

Include:

- what the feature does
- why it exists
- who uses it

## 2. Scope

State what this spec covers and what it does not cover.

## 3. Actors

List the users or systems involved.

Examples:

- delivery lead
- contributor
- AI agent
- parser
- server action

## 4. Entry Points

List how the feature is reached.

Examples:

- route
- tab
- dialog
- button
- background load

## 5. Data Dependencies

Document the data sources this function depends on.

Examples:

- parser output
- source markdown file
- derived metrics
- UI view model

## 6. Functional Goals

List the questions or outcomes this feature must support.

Example:

1. Help users identify urgent work.
2. Let users update delivery state safely.
3. Keep UI aligned with source markdown.

## 7. Core Flows

Describe the major flows step by step.

Examples:

- load
- inspect
- edit
- save
- refresh

## 8. Business Rules

List the rules that control behavior.

Examples:

- which status wins
- when a value is computed vs read from source
- fallback rules

## 9. Allowed Actions

List what users can do.

## 10. Disallowed Or Out-Of-Scope Actions

List what this feature should not do.

## 11. Edge Cases

List important boundary cases.

Examples:

- missing file
- malformed source data
- empty state
- conflicting inputs

## 12. Implementation Mapping

Map the function to files or layers.

Examples:

- parser file
- loader file
- action file
- route file

## 13. Open Questions

Capture unresolved behavior here.
