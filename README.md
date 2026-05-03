# Dashboard

Delivery dashboard built with Next.js App Router.

## Main docs

- UI spec: [docs/ui-spec/SPEC.md](/Users/phungnguyen/Downloads/delivery-system/dashboard/docs/ui-spec/SPEC.md)
- Spec template for future screens: [docs/ui-spec/SPEC-TEMPLATE.md](/Users/phungnguyen/Downloads/delivery-system/dashboard/docs/ui-spec/SPEC-TEMPLATE.md)
- Functional spec: [docs/functional-spec/SPEC.md](/Users/phungnguyen/Downloads/delivery-system/dashboard/docs/functional-spec/SPEC.md)
- Functional spec template: [docs/functional-spec/SPEC-TEMPLATE.md](/Users/phungnguyen/Downloads/delivery-system/dashboard/docs/functional-spec/SPEC-TEMPLATE.md)

## Current app surfaces

- `app/page.tsx`: portfolio dashboard (`v1`)
- `app/resource/page.tsx`: resource capacity view (`v1`)
- `app/projects/[code]/page.tsx`: project detail (`v1`)
- `app/v2/page.tsx`: delivery dashboard (`v2`)
- `app/v2/[projectId]/page.tsx`: project detail page (`v2`)

## Data sources

- `input/<domain>/<projectCode>/...`: sprint and source tracking files
- `processed/<domain>/<projectCode>/...`: derived metrics and insights
- `lib/parser/*`: markdown parsers
- `app/v2/realDataLoader.ts`: adapts parsed data into `v2` UI models

## Local run

```bash
npm run dev
```
