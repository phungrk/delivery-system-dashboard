# Dashboard UI Spec

> Version: 1.0  
> Last updated: 2026-04-24  
> Audience: product, designers, developers, AI coding agents

## 1. Purpose

This document is the UI source of truth for the `dashboard` app.

It is written so that:

- a developer can implement or refactor a screen without reverse-engineering the code
- an AI agent can map a request to the right route, component, and data shape
- future UI specs can be added in the same format without rewriting this document

## 2. Reading Guide

Use this order when working with the dashboard:

1. Read this file for global rules and route map.
2. If a screen has a dedicated spec, read that next.
3. If a detail is still unclear, inspect the component named in the component map.

When adding a new UI surface:

1. Keep global rules here.
2. Add one dedicated spec file for the surface.
3. Link that file from Section 13 of this document.
4. Use `SPEC-TEMPLATE.md` as the starting point.

## 3. Scope

This spec covers the current dashboard application under `dashboard/`, including both UI generations that coexist today.

### 3.1 UI generations

- `v1`: portfolio-centric dashboard driven directly by parsed metrics and resource data
- `v2`: delivery management dashboard with richer interactive views, detail pages, dialogs, and shared UI primitives

### 3.2 Out of scope

- backend pipeline internals outside of what the UI consumes
- processing logic details that do not affect visible behavior
- visual polish details not yet standardized in code

## 4. Product Goal

The dashboard helps delivery teams answer four questions quickly:

1. Which projects need attention now?
2. Where is each project in its lifecycle?
3. Which people are overloaded or available?
4. What should the team focus on today?

## 4A. Dashboard Structure

The dashboard should be understood as this top-level structure:

```text
dashboard
|_ project
|   |_ display: grid, phases, gantt
|   |_ type: scrum, waterfall
|   |_ project status: on-track, risk, delayed, completed
|   |_ search project
|_ resource
```

This structure is the preferred mental model for both humans and AI agents.

### 4A.1 `project`

`project` is the main operational area of the dashboard.

It groups all project-centric views and rules:

- project browsing
- project filtering
- project type handling
- project status display
- project detail inspection
- project timeline views

### 4A.2 `project > display`

The project area has 3 primary display modes:

- `grid`
  - card-based project browsing
  - fastest way to scan project summaries
- `phases`
  - phase-oriented board view
  - Waterfall phases and Scrum mini-cards
- `gantt`
  - timeline-oriented comparison view
  - projects can expand into phases or sprint rows

### 4A.3 `project > type`

A project belongs to one of 2 supported delivery types:

- `scrum`
- `waterfall`

Type changes how the dashboard renders detail and progress:

- `scrum` -> sprint-driven UI
- `waterfall` -> phase-driven UI

### 4A.4 `project > project status`

The dashboard uses these normalized project statuses:

- `on-track`
- `risk`
- `delayed`
- `completed`

UI labels may still appear in title case:

- `On Track`
- `At Risk`
- `Delayed`
- `Completed`

For spec purposes:

- use lowercase hyphenated names when discussing structure or filtering
- use UI labels when discussing visible text

### 4A.5 `project > search project`

Project search is a first-class dashboard function.

It should allow users to quickly narrow projects by:

- project name
- client/code
- status
- type

### 4A.6 `resource`

`resource` is the second top-level dashboard area.

It groups all resource-centric views and rules:

- resource browsing
- utilization review
- allocation review
- resource detail inspection
- capacity and overload detection

## 5. Global UX Rules

These rules apply across dashboard screens unless a dedicated surface spec says otherwise.

### 5.1 Information hierarchy

- Show operational status first.
- Show risk and delay signals before secondary metrics.
- Keep summary above detail.
- Put actions and editable controls near the data they change.

### 5.2 Layout

- Primary `v2` pages use a `max-w-7xl` centered container.
- Detail pages should match the same visual width as main `v2` tabs unless there is a strong reason not to.
- Cards and sections should use consistent border, radius, and muted background language from `app/v2/components/ui.tsx`.

### 5.3 Status language

Project status in `v2`:

- `On Track`
- `At Risk`
- `Delayed`
- `Completed`

Phase status:

- `Completed`
- `On Track`
- `At Risk`
- `Delayed`
- `To Do`

Sprint status:

- `Planning`
- `Active`
- `Completed`

### 5.4 Responsive behavior

- Summary cards collapse from 4 columns to 2 on narrower widths.
- Dense boards and gantt content may scroll horizontally.
- Detail views should preserve readability before preserving symmetry.

### 5.5 Editing behavior

- Inline edits should update local UI immediately where practical.
- File-backed edits must write back to the underlying markdown source through server actions.
- If a field is editable in UI, the source-of-truth file path must be discoverable from code.

## 6. Data Model Overview

The dashboard is markdown-driven.

### 6.1 Source folders

- `input/<domain>/<projectCode>/...`
- `processed/<domain>/<projectCode>/...`

### 6.2 Main parsers

- `lib/parser/sprint.ts`: project tracking file, tasks, sprint metadata, milestones, timelog
- `lib/parser/metrics.ts`: derived project metrics and risk signals
- `lib/parser/insights.ts`: narrative insights, risks, actions, standup prompts
- `lib/parser/resource.ts`: team capacity forecast

### 6.3 `v2` adaptation layer

`app/v2/realDataLoader.ts` maps parsed markdown data into UI-facing `Project` and `Resource` objects.

This is the layer to update when:

- a new UI field is needed
- status logic changes
- sprint history or phase mapping changes

### 6.4 Key `v2` entities

`Project`

- identity: `id`, `name`, `client`
- type: `Waterfall` or `Scrum`
- health: `status`, `priority`, `progress`, `overdueTasks`, `activeRisks`
- timing: `startDate`, `endDate`
- staffing: `lead`, `team`
- delivery breakdown:
  - Waterfall: `phases`
  - Scrum: `currentSprint`, `sprintHistory`, `totalSprints`, `completedSprints`, `velocity`, `backlogItems`
- detail tabs: `tasks`, `risks`, `dependencies`, `budget`, `kpis`

`Resource`

- identity: `id`, `name`, `role`, `department`
- health: `utilization`, `projectCount`
- staffing context: `skills`, `projects`

## 7. Status Rules

### 7.1 `v2` project status

`v2` uses detailed status derivation from `lib/projectStatus.ts`, then applies one final `Completed` override.

Mapping:

- derived `on-track` -> UI `On Track`
- derived `at-risk` -> UI `At Risk`
- derived `delayed` -> UI `Delayed`
- derived `unknown` -> UI `At Risk`

Completion override:

- Waterfall: all phases completed -> `Completed`
- Scrum or non-phase project: completion rate >= 98 -> `Completed`

### 7.2 Meaning

- `On Track`: progress is consistent with timing and no strong delay signal exists
- `At Risk`: blockers, overdue work, or progress/timeline mismatch exists, but the project is not yet clearly late
- `Delayed`: the sprint or timeline has effectively slipped
- `Completed`: delivery is materially done for UI purposes

## 8. Route Map

### 8.1 `v1`

- `/`
  - portfolio summary
  - active alerts
  - project cards
- `/projects/[code]`
  - daily focus
  - task table
  - insights panel
- `/resource`
  - capacity forecast and member-by-week allocation table

### 8.2 `v2`

- `/v2`
  - tabs:
    - `Projects` -> `project > display > grid`
    - `Phase Board` -> `project > display > phases`
    - `Gantt` -> `project > display > gantt`
    - `Resources` -> `resource`
- `/v2/[projectId]`
  - full project detail page
- modal/detail sub-surfaces inside `v2`
  - project detail dialog
  - resource detail dialog

## 9. `v2` Surface Summary

### 9.1 Dashboard shell

File: `app/v2/DeliveryDashboard.tsx`

Responsibilities:

- app header
- theme toggle
- top-level tabs
- shared container width
- top-level information architecture:
  - `project`
  - `resource`

### 9.2 Projects tab

Main purpose:

- browse projects
- act as `project > display > grid`
- filter by type and status
- scan budget and health summary quickly

Core UI:

- KPI stat row
- search box for `search project`
- type toggle
- status select
- grid of project cards

Primary component:

- `app/v2/components/ProjectCard.tsx`

### 9.3 Phase Board tab

Main purpose:

- act as `project > display > phases`
- show Waterfall projects by current phase
- show Scrum projects as sprint-based cards

Primary component:

- `app/v2/components/PhaseBoard.tsx`

### 9.4 Gantt tab

Main purpose:

- act as `project > display > gantt`
- compare project and phase timing on one timeline
- expand projects into sub-rows
- show sprint history for Scrum projects

Primary component:

- `app/v2/components/GanttChart.tsx`

### 9.5 Resources tab

Main purpose:

- act as the `resource` area of the dashboard
- find overloaded or available people
- review allocations by department and skill

Primary components:

- `app/v2/components/ResourceCard.tsx`
- `app/v2/components/ResourceDetailDialog.tsx`

## 10. Project Detail Spec Summary

Applies to:

- `app/v2/[projectId]/ProjectDetailPage.tsx`
- `app/v2/components/ProjectDetailDialog.tsx`

### 10.1 Shared structure

- header with badges and meta
- overview tab
- budget tab
- tasks tab
- risks tab
- dependencies tab
- team tab
- optional insights tab on full page

### 10.2 Overview tab sections

Shared sections:

- Daily Focus
- Overall Progress
- KPIs

Waterfall-only sections:

- Phase Pipeline
- Milestones & Timeline

Scrum-only sections:

- Sprint Timeline

### 10.3 Daily Focus

Purpose:

- surface the most urgent work for today
- show watch items and suggested focus

Behavior:

- expandable and collapsible
- summary visible when collapsed
- uses current tasks plus sprint/timeline progress

Primary component:

- `app/v2/components/DailyFocusPanel.tsx`

### 10.4 Scrum overview

Purpose:

- show sprint history and current sprint in one place

Primary component:

- `app/v2/components/SprintTimeline.tsx`

Shared sprint visualization:

- `app/v2/components/SprintPhaseStepper.tsx`

### 10.5 Tasks tab

Purpose:

- inspect and edit tasks
- change status
- log time
- update assignee/title/due date

### 10.6 Risks, dependencies, team, budget

Purpose:

- provide structured operational detail for project follow-up

## 11. Scrum UI Rules

Scrum projects are sprint-based and should never be rendered as Waterfall phase pipelines.

### 11.1 Sprint phases

Canonical order:

1. `Planning`
2. `PBI Approval`
3. `Implementation + UT`
4. `Verification + Fix Bug`
5. `Review`
6. `Release`
7. `Retrospective`

### 11.2 Shared sprint phase stepper

Use `SprintPhaseStepper` wherever a compact sprint phase visualization is needed.

Fallback rules:

- if explicit phases exist, use them
- if sprint is completed and phases are missing, treat all phases as completed
- otherwise treat all missing phases as `To Do`

### 11.3 Sprint numbering

Sprint number should come from parsed sprint source data when available.

Do not derive sprint number from duration alone if the markdown source already provides an explicit sprint number.

## 12. Waterfall UI Rules

Waterfall projects are phase-based.

Phase UI should support:

- pipeline summary
- phase progress rows
- milestone dates
- status and progress per phase

## 13. Component Map

Global/shared:

- `app/v2/components/ui.tsx`
- `app/v2/components/StatCard.tsx`

Project browsing:

- `app/v2/components/ProjectCard.tsx`
- `app/v2/components/PhaseBoard.tsx`
- `app/v2/components/GanttChart.tsx`

Project detail:

- `app/v2/components/DailyFocusPanel.tsx`
- `app/v2/components/SprintPhaseStepper.tsx`
- `app/v2/components/SprintTimeline.tsx`
- `app/v2/components/ProjectDetailDialog.tsx`
- `app/v2/[projectId]/ProjectDetailPage.tsx`

Resource views:

- `app/v2/components/ResourceCard.tsx`
- `app/v2/components/ResourceDetailDialog.tsx`

Legacy `v1`:

- `components/ProjectCard.tsx`
- `components/TaskTable.tsx`
- `components/InsightPanel.tsx`
- `components/ResourceTable.tsx`

## 14. How To Extend This Spec

When a new UI surface is added:

1. Create a dedicated spec file next to this one, for example:
   - `SPEC-PROJECT-DETAIL.md`
   - `SPEC-RESOURCE.md`
   - `SPEC-SETTINGS.md`
2. Use `SPEC-TEMPLATE.md`.
3. Link it from this section.
4. Keep only shared rules in `SPEC.md`.
5. Put surface-specific behavior, edge cases, and component contracts in the dedicated spec.

Recommended naming:

- `SPEC.md`: global dashboard spec
- `SPEC-<SURFACE>.md`: dedicated screen or component-family spec

## 15. Writing Rules For Future Specs

Every new UI spec should include:

- purpose
- route or parent surface
- data contract
- component map
- layout rules
- status/state rules
- responsive behavior
- edge cases

Every new UI spec should avoid:

- vague terms like “nice”, “modern”, or “clean” without UI meaning
- duplicating global rules from this document
- mixing implementation notes and behavior without labeling them

## 16. Open Gaps

These areas still deserve dedicated follow-up specs:

- full `Projects` tab card/filter behavior
- `Phase Board` column behavior and Waterfall/Scrum bucketing rules
- `Gantt` interaction rules and timeline edge cases
- `Resource` tab and resource detail dialog behavior
- `v1` deprecation strategy and parity expectations
