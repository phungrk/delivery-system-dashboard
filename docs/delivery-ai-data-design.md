# Delivery AI Data Design

## Goal

Design a data model for delivery management that combines:

- JSON business database for resource/dashboard calculations.
- Markdown AI database for project tracking, analysis, and generated reports.

Claude Code should implement this design as a schema and loader refactor before adding new UI behavior.

## Decisions

- Dashboard resource views read JSON.
- Dashboard project views read Markdown.
- `projects.json` must be split out from `allocations.json`.
- Allocation models `member <-> project <-> weekly hours plan`.
- Member aliases are required so Markdown owner names can be mapped to canonical member codes.
- Project folders must be standardized as `input/[Domain]/[ProjectCode]`.
- AI is allowed to update JSON files directly.
- Implementation order:
  1. Split JSON schema.
  2. Add Zod schemas and validation.
  3. Add unified loaders.
  4. Standardize Markdown conventions.
  5. Add AI extraction/update workflow.

## Data Ownership

### JSON Business Database

Path:

```text
dashboard/data/
├── members.json
├── projects.json
├── allocations.json
└── capacity.json
```

Purpose:

- Source of truth for resources, allocation, capacity, utilization, and project master data.
- Used by dashboard resource views.
- May be updated by AI when new reliable facts are extracted from Markdown input.

### Markdown AI Database

Path:

```text
input/[Domain]/[ProjectCode]/
processed/[Domain]/[ProjectCode]/
output/reports/[Domain]/[ProjectCode]/
output/alerts/[Domain]/[ProjectCode]/
output/meetings/[Domain]/[ProjectCode]/
```

Purpose:

- Source of truth for project tracking narrative, tasks, blockers, decisions, meeting notes, sprint notes, and AI-generated insights.
- Used by dashboard project views.
- Used by AI pipeline to produce metrics, insights, reports, alerts, and JSON updates.

## Entity Relationship

```text
Member 1 ───< Allocation >─── 1 Project

Member 1 ───< Leave
Project 1 ───< MarkdownInput
Project 1 ───< ProcessedInsight
Project 1 ───< Report
```

## JSON Schemas

### members.json

Shape:

```json
{
  "version": "3.0",
  "updatedAt": "2026-05-05",
  "data": [
    {
      "code": "caophung.nguyen",
      "name": "Nguyen Cao Phung",
      "aliases": ["Phung", "Cao Phung", "NCP"],
      "initials": "NCP",
      "role": "BrSE / Delivery Lead",
      "department": "RFV",
      "email": "phungnc@gmail.com",
      "startDate": "2022-01-01",
      "status": "active",
      "avatarColor": "violet",
      "weeklyCapacityHours": 40,
      "skills": ["BrSE", "Delivery Management"]
    }
  ]
}
```

Rules:

- `code` is the primary key.
- `aliases` is required and must include common names used in Markdown task owner fields.
- `weeklyCapacityHours` replaces `weeklyCapacity`.
- `status`: `active | inactive | on_leave`.
- Alias lookup must be case-insensitive and trim whitespace.
- If two members share the same alias, validation must fail.

### projects.json

Shape:

```json
{
  "version": "3.0",
  "updatedAt": "2026-05-05",
  "data": [
    {
      "code": "AMTK",
      "name": "Automated Billing Email",
      "domain": "Mail",
      "folder": "Mail/AMTK",
      "color": "blue",
      "status": "Active",
      "phase": "Verification",
      "type": "Waterfall",
      "budget": 0,
      "eac": 0,
      "actualFees": 0,
      "startDate": "2025-08-27",
      "endDate": "2026-05-12"
    }
  ]
}
```

Rules:

- `code` is the primary key.
- `folder` must be `[domain]/[code]`.
- `domain` must match the first folder segment under `input`, `processed`, and `output`.
- `status`: `Active | Pipeline | Paused | Complete`.
- `phase` should follow the dashboard's existing phase vocabulary.
- Project master data lives here, not in `allocations.json`.

### allocations.json

Shape:

```json
{
  "version": "3.1",
  "updatedAt": "2026-05-05",
  "data": [
    {
      "id": "a001",
      "memberCode": "cao-phung",
      "projectCode": "ML-AMTK",
      "weeklyHours": [
        { "weekStart": "2026-04-06", "hours": 8 },
        { "weekStart": "2026-04-13", "hours": 12 },
        { "weekStart": "2026-04-20", "hours": 6 }
      ]
    }
  ]
}
```

Rules:

- `id` is the primary key.
- `memberCode` must exist in `members.json`.
- `projectCode` must exist in `projects.json`.
- `weeklyHours` contains one entry per planning week.
- `weeklyHours[].weekStart` must be a Monday and unique inside the record.
- `weeklyHours[].hours` must be `>= 0`.
- Utilization percentage is derived:

```text
utilizationPct = allocation.weeklyHours[week].hours / member.weeklyCapacityHours * 100
```

- Overload is derived:

```text
weeklyAllocatedHours(member, week) > effectiveCapacityHours(member, week)
```

### capacity.json

Keep the current split between holidays and leaves, but normalize naming:

```json
{
  "version": "3.0",
  "updatedAt": "2026-05-05",
  "holidays": [
    {
      "date": "2026-05-01",
      "name": "International Labor Day",
      "impactPct": 100,
      "scope": "all"
    }
  ],
  "leaves": [
    {
      "memberCode": "caophung.nguyen",
      "from": "2026-04-28",
      "to": "2026-05-02",
      "type": "annual",
      "days": 3,
      "status": "approved",
      "notes": "Golden Week"
    }
  ]
}
```

Rules:

- Rename `impact` to `impactPct`.
- `scope`: `all | VN | JP | US | opt`.
- `leave.status`: `approved | pending | rejected`.
- `wfh` must not reduce capacity.
- Approved leave reduces capacity.

## Markdown Conventions

### Project Folder Standard

Canonical folder:

```text
input/[Domain]/[ProjectCode]/
processed/[Domain]/[ProjectCode]/
output/reports/[Domain]/[ProjectCode]/
output/alerts/[Domain]/[ProjectCode]/
output/meetings/[Domain]/[ProjectCode]/
```

Example:

```text
input/Mail/AMTK/
processed/Mail/AMTK/
output/reports/Mail/AMTK/
```

Migration required:

```text
input/Mail/AMTK -> input/Mail/AMTK
processed/AMTK/AMTK -> processed/Mail/AMTK
output/reports/AMTK/AMTK -> output/reports/Mail/AMTK
```

Claude Code should scan all existing folders and create a migration map before moving files.

### Required Project Markdown Files

Each project should support:

```text
project-context.md or project-context.txt
project-tracking.md or project-tracking.txt
sprint-[N].md or sprint-[N].txt
meeting-YYYY-MM-DD.md
transcript-YYYY-MM-DD.txt
```

Dashboard project views should read:

- `project-context.md` or `project-context.txt` for project overview.
- `project-tracking.md` or `project-tracking.txt` for milestones, tasks, blockers, decisions, and team notes.
- latest `processed/[Domain]/[ProjectCode]/metrics-YYYY-MM-DD.md`.
- latest `processed/[Domain]/[ProjectCode]/insights-YYYY-MM-DD.md`.

## AI JSON Update Workflow

AI may update JSON directly when extracted facts are reliable.

Allowed updates:

- Add or update member aliases.
- Add or update project master data.
- Add or update allocations.
- Add or update leave records.
- Add or update holiday records.

Required guardrails:

- Validate all JSON after every update.
- Preserve existing IDs when modifying records.
- Generate stable IDs for new allocation records.
- Add or update `updatedAt`.
- Do not remove records unless explicitly requested.
- If an extracted fact conflicts with existing JSON, write a warning to processed insights and avoid overwriting unless confidence is high.

Recommended conflict rule:

```text
Markdown explicit date + explicit owner + explicit project > existing unknown/null field.
Existing JSON with non-null value > ambiguous Markdown.
```

## Loader Contracts

### Resource Loader

Create or refactor:

```text
dashboard/lib/resource-db.ts
```

Responsibilities:

- Load `members.json`, `projects.json`, `allocations.json`, `capacity.json`.
- Validate with Zod schemas.
- Join allocations with members and projects.
- Compute weekly allocated hours.
- Compute weekly utilization percentage.
- Compute overload from hours, not stored pct.
- Expose backward-compatible fields only if current UI needs them.

Required exports:

```ts
getMembers();
getProjects();
getAllocations();
getCapacity();
getResourceOverview();
getMemberUtilization(memberCode, range);
resolveMemberCode(nameOrAlias);
```

### Project Markdown Loader

Create or refactor:

```text
dashboard/lib/project-db.ts
```

Responsibilities:

- Load project folders by canonical `domain/projectCode`.
- Parse `project-context.md`.
- Parse `project-tracking.md`.
- Locate latest processed metrics and insights.
- Return project detail data for dashboard project pages.

Required exports:

```ts
getProjectListFromMarkdown();
getProjectDetailFromMarkdown(projectCode);
getLatestProjectMetrics(projectCode);
getLatestProjectInsights(projectCode);
```

## Validation

Add a script:

```text
dashboard/scripts/validate-data.ts
```

The script should:

- Validate all JSON schema files.
- Check foreign keys:
  - allocation member exists.
  - allocation project exists.
  - leave member exists.
- Check alias uniqueness.
- Check canonical project folders exist.
- Warn about Markdown folders that do not match `projects.json`.
- Warn about member overload by week.

Add package script:

```json
{
  "scripts": {
    "validate:data": "tsx scripts/validate-data.ts"
  }
}
```

## Migration Plan

### Step 1: Split JSON

- Create `dashboard/data/projects.json`.
- Move `projects` from `allocations.json` to `projects.json`.
- Change `allocations.json.records` to `allocations.json.data`.
- Convert allocation `pct` to `weeklyHours[]`.
- Add `aliases` and `weeklyCapacityHours` to members.
- Rename capacity `impact` to `impactPct`.

Initial conversion formula:

```text
weeklyHours[].hours = round(member.weeklyCapacityHours * pct / 100, 1)
```

### Step 2: Add Zod Schemas

- Add schemas for member, project, allocation, capacity.
- Keep old parser compatible only during migration if needed.

### Step 3: Refactor Loaders

- Update `resource-db.ts` to read split JSON.
- Update resource UI components only where data shape changes.
- Keep derived `pct` for UI bars if current components depend on it.

### Step 4: Standardize Markdown Paths

- Create migration map from current paths to canonical paths.
- Move project folders carefully.
- Update any hardcoded path assumptions.
- Ensure project code in Markdown headers matches `projects.json`.

### Step 5: Add AI Update Workflow

- Add a documented prompt/workflow for extracting reliable updates from Markdown.
- Validate after update.
- Write extraction summary to `processed/[Domain]/[ProjectCode]/json-updates-YYYY-MM-DD.md`.

## Acceptance Criteria

- `dashboard/data/projects.json` exists and contains all project master data.
- `dashboard/data/allocations.json` contains only allocation records.
- Allocations store `weeklyHours[]`, not `pct`.
- Resource dashboard still renders member allocation bars and overload state.
- Project dashboard reads project data from Markdown canonical folders.
- Member alias resolution maps names like `Phung`, `Hoang`, and `Vuong` to canonical member codes.
- Data validation fails on broken foreign keys or duplicate aliases.
- AI can update JSON and immediately run validation.

## Notes for Claude Code

- Keep migration commits small and reviewable.
- Do not delete old Markdown folders until the canonical copy is verified.
- Prefer adding compatibility adapters while UI is being migrated.
- Avoid changing visual UI behavior during the data model refactor unless required by the new shape.
