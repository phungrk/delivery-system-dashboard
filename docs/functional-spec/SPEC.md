# Dashboard Functional Spec

> Version: 1.0  
> Last updated: 2026-04-24  
> Audience: product, delivery leads, developers, AI coding agents

## 1. Purpose

This document is the functional source of truth for the `dashboard` app.

It explains:

- what the dashboard must do
- what users can see, inspect, and update
- what data sources drive each function
- where to extend functionality in a predictable way

Use this document with the UI spec:

- `docs/functional-spec/SPEC.md` answers: "What does the product do?"
- `docs/ui-spec/SPEC.md` answers: "How is that functionality represented in UI?"

## 2. Reading Guide

Recommended reading order:

1. Read this file for product capabilities and functional boundaries.
2. Read the UI spec for route and component behavior.
3. Read a dedicated module spec if the change only affects one area.

When adding a new feature:

1. Update this file if the feature changes shared dashboard behavior.
2. Add a dedicated functional spec if the feature is large enough to stand alone.
3. Update the UI spec only for the parts that affect rendering or interaction.

## 3. Product Goal

The dashboard exists to support day-to-day delivery operations.

It should let users:

1. identify unhealthy projects quickly
2. inspect project delivery state in detail
3. understand where Scrum and Waterfall projects currently are
4. monitor resource pressure and team capacity
5. update selected operational data directly from the dashboard

## 3A. Functional Structure

The dashboard should be understood as this functional tree:

```text
dashboard
|_ project
|   |_ display: grid, phases, gantt
|   |_ type: scrum, waterfall
|   |_ project status: on-track, risk, delayed, completed
|   |_ search project
|_ resource
```

This structure defines how the product should be reasoned about.

### 3A.1 `project`

`project` is the main delivery management function.

It includes:

- project discovery
- project filtering and search
- project health interpretation
- project display switching
- project detail inspection

### 3A.2 `project > display`

Project data must support 3 display modes:

- `grid`
- `phases`
- `gantt`

These are different views over the same project set, not separate product domains.

### 3A.3 `project > type`

Project behavior depends on type:

- `scrum`
- `waterfall`

Type affects:

- delivery breakdown
- timeline representation
- detail-page sections
- phase or sprint visualization

### 3A.4 `project > project status`

The normalized project status set is:

- `on-track`
- `risk`
- `delayed`
- `completed`

Notes:

- `risk` maps to the visible UI state `At Risk`
- `on-track`, `delayed`, and `completed` map directly to visible product concepts

### 3A.5 `project > search project`

Project search is a required function, not just a visual control.

It must support narrowing the project set by the fields used in dashboard browsing.

### 3A.6 `resource`

`resource` is the second top-level function.

It includes:

- utilization review
- allocation review
- capacity review
- resource inspection

## 4. Primary Users

### 4.1 Delivery lead / PM

Main goals:

- scan portfolio health
- inspect overdue or blocked work
- determine daily focus
- review project timeline and risk posture

### 4.2 Team lead / engineering lead

Main goals:

- inspect sprint or phase progress
- review dependencies and risks
- check individual utilization or ownership concentration

### 4.3 Contributor

Main goals:

- update task status
- update task owner/title/due date
- log work time

### 4.4 AI coding agent / automation

Main goals:

- infer which parser or loader is responsible for a field
- implement behavior without guessing product intent
- add new screens or logic in the right layer

## 5. System Context

The dashboard is a markdown-driven operational frontend.

### 5.1 Inputs

- raw project tracking files under `input/<domain>/<projectCode>/`
- derived metrics and insights under `processed/<domain>/<projectCode>/`
- resource forecast under `input/_capacity-forecast.md`

### 5.2 Processing layers

- parsers convert markdown into structured data
- loaders adapt structured data into UI-facing view models
- server actions persist selected edits back into source markdown

### 5.3 Functional boundary

The dashboard does not own the upstream delivery process.

It reads and updates markdown-based project artifacts, but it is not a full project management backend.

## 6. Functional Modules

The dashboard currently has 6 main functional modules.

### 6.1 Portfolio Monitoring

Purpose:

- provide a portfolio-wide view of project health

Functions:

- load all active projects from available input/processed folders
- derive project health from metrics
- sort and group project signals by severity
- present active alerts for quick triage

Primary routes:

- `v1`: `/`
- `v2`: `/v2` > `Projects`

Primary data sources:

- `lib/parser/metrics.ts`
- `lib/projectStatus.ts`
- `app/v2/realDataLoader.ts`

### 6.2 Project Delivery Tracking

Purpose:

- expose the detailed state of one project

Functions:

- show progress and project metadata
- show delivery breakdown:
  - Waterfall -> phases and milestones
  - Scrum -> sprint timeline and sprint phases
- show tasks, risks, dependencies, team, budget, KPIs
- show daily focus priorities

Primary routes:

- `v1`: `/projects/[code]`
- `v2`: `/v2/[projectId]`

Primary data sources:

- `lib/parser/sprint.ts`
- `lib/parser/metrics.ts`
- `lib/parser/insights.ts`
- `app/v2/realDataLoader.ts`

### 6.3 Scrum Delivery Support

Purpose:

- support sprint-based project tracking in a way that differs clearly from Waterfall

Functions:

- parse sprint number and sprint period from source tracking files
- represent current sprint and sprint history
- render 7 canonical sprint phases
- support sprint-level timing and status in:
  - project cards
  - phase board
  - gantt
  - project detail

Primary logic locations:

- `lib/parser/sprint.ts`
- `app/v2/scrum.ts`
- `app/v2/realDataLoader.ts`

### 6.4 Resource Capacity Monitoring

Purpose:

- expose allocation pressure across people and weeks

Functions:

- read team capacity forecast
- compute per-member weekly committed hours
- compute per-week free capacity
- classify utilization into capacity badges
- show resource allocations across projects

Primary routes:

- `v1`: `/resource`
- `v2`: `/v2` > `Resources`

Primary data source:

- `lib/parser/resource.ts`

### 6.5 Insight And Risk Review

Purpose:

- provide narrative context beyond raw metrics

Functions:

- show key risks
- show hidden risks
- show recommended actions
- show standup prompts
- show positives or noteworthy wins

Primary data source:

- `lib/parser/insights.ts`

### 6.6 Source-Backed Editing

Purpose:

- allow operational updates without leaving the dashboard

Functions:

- change task status
- change selected task fields
- log time entries
- update milestone dates

Primary implementation:

- `lib/actions.ts`

## 7. Core Functional Flows

### 7.1 Load portfolio data

Steps:

1. Discover projects from `input/` and `processed/`.
2. Load processed metrics where available.
3. Compute fallback metrics from sprint tracking if processed metrics do not exist.
4. Derive project status.
5. Present portfolio summary or tab-specific summaries.

### 7.2 Open a project

Steps:

1. Find the project in UI-facing project models.
2. Load sprint file, metrics, and optional insights.
3. Build detail sections based on project type.
4. Surface urgent information first:
   - status
   - overdue tasks
   - risks
   - daily focus

### 7.3 Edit a task

Steps:

1. User changes a field in the dashboard.
2. Server action locates the source sprint tracking file.
3. The markdown table row is updated in place.
4. Relevant routes are revalidated.
5. UI reflects the updated source-backed state.

### 7.4 Log time

Steps:

1. User opens log-time control for a task.
2. User enters date, duration, and optional note.
3. Dashboard appends a row into `timelog.md`.
4. Project detail route is revalidated.

## 8. Functional Rules

### 8.1 Project type behavior

Waterfall projects:

- are phase-driven
- may show milestones and phase pipeline
- should not be represented as sprint history

Scrum projects:

- are sprint-driven
- should use sprint-specific components and rules
- should use explicit sprint number from source data when available

### 8.2 Status derivation

Project status is derived from structured metrics and timing logic, not from a manually entered UI field.

Rules:

- use `deriveProjectStatus(...)` for detailed risk/timing interpretation
- allow `Completed` as a final override for truly completed delivery states

### 8.3 Editing safety

Dashboard editing must remain constrained.

Allowed:

- update existing tracked fields
- append time log rows
- update milestone dates

Not allowed by default:

- arbitrary markdown rewrites
- structural project creation flows
- deleting projects from the UI

## 9. Functional Capabilities By Surface

### 9.1 `v1`

Portfolio page:

- list projects
- show alerts
- open project detail

Project detail:

- show daily focus
- show tasks
- show insights

Resource page:

- show capacity table
- show overloaded/free slots

### 9.2 `v2`

Projects tab:

- search and filter projects
- scan summary KPIs
- open project detail page

Phase Board:

- inspect Waterfall projects by phase
- inspect Scrum projects via sprint cards

Gantt:

- compare project timing on one timeline
- expand to sub-rows for phases or sprints

Resources:

- search and filter resources
- inspect utilization and project allocations

Project detail:

- inspect overview, budget, tasks, risks, dependencies, team
- inspect Scrum or Waterfall-specific delivery breakdown
- update source-backed task and milestone fields

## 10. Data Ownership

Use this section to know where a functional change should be implemented.

### 10.1 Change parser behavior

Update parser files when:

- the source markdown format changes
- a field must be extracted differently
- a new source field must be introduced

Primary files:

- `lib/parser/sprint.ts`
- `lib/parser/metrics.ts`
- `lib/parser/insights.ts`
- `lib/parser/resource.ts`

### 10.2 Change business logic

Update logic files when:

- status derivation changes
- mapping between parsed data and UI models changes
- Scrum or Waterfall transformation rules change

Primary files:

- `lib/projectStatus.ts`
- `app/v2/realDataLoader.ts`
- `app/v2/scrum.ts`

### 10.3 Change persistence behavior

Update actions when:

- editable fields change
- source writeback behavior changes
- route revalidation behavior changes

Primary file:

- `lib/actions.ts`

## 11. Functional Non-Goals

The dashboard is not currently intended to:

- replace Jira, Azure DevOps, or a full PM tool
- manage authentication/authorization workflows
- manage multi-user conflict resolution
- guarantee perfect bidirectional sync with systems outside markdown sources

## 12. Open Extension Areas

These areas are good candidates for dedicated functional specs:

- project filtering and saved views
- alert lifecycle and acknowledgement behavior
- resource planning scenarios
- edit permissions and audit behavior
- project creation or onboarding flows

## 13. How To Extend This Spec

When a new functional area is large enough, add a dedicated module spec.

Recommended naming:

- `SPEC.md`: global functional spec
- `SPEC-<MODULE>.md`: dedicated module functional spec

Examples:

- `SPEC-PROJECT-DETAIL.md`
- `SPEC-RESOURCE.md`
- `SPEC-ALERTS.md`
- `SPEC-EDITING.md`

Every new functional spec should include:

- purpose
- functional scope
- actors
- entry points
- data dependencies
- core flows
- business rules
- edge cases
- out-of-scope items
