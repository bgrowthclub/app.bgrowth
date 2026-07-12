# BGrowth Content Architecture (Phase 1 — Foundation)

This directory is **not wired into the running app**. Nothing here is
imported by any page, component, or route yet. It exists purely as the
future, structured source of truth for BGrowth content — the shape every
Builder inside **BGrowth Studio** will eventually generate files against.

## Why this exists

Today, catalog content is hardcoded TypeScript in `src/data/systems.ts`
(see CLAUDE.md §3 — explicitly a stand-in for a future Studio export).
This directory defines what that future export actually looks like: a
real file-based content structure, one folder per piece of content, each
folder holding a `manifest.json` (catalog-facing metadata) and a
`product.json` (the full authored content).

## Relationship to existing data models

This is **not** a second, competing runtime data source. Two models
already exist and are actively used by the running app:

- `src/types/system.ts` → `BusinessSystem` — the Runtime's live data shape.
- `src/modules/commerce/types/product.ts` → `Product` — Commerce's
  sellable-listing shape.

The types in `content/` (`ContentManifest`, `ContentProduct`) are
deliberately named to avoid colliding with either. The intended future
direction (not built in this phase) is an adapter that reads
`content/products/*/manifest.json` and produces `BusinessSystem` /
`Product` records — i.e., this becomes the *authoring* format, and the
existing types stay the *runtime* format. Until that adapter exists,
`data/systems.ts` remains the only real source the app reads from.

## Structure

```
content/
  shared/     — cross-ecosystem vocabulary (Category, Goal, Difficulty, Language, Tag, Author, Status)
  products/   — the Manifest + Product schema; one subfolder per product once populated
  knowledge/  — future article/guide content (not yet defined)
  academy/    — future course content (not yet defined)
```

Each product will eventually live at:

```
content/products/<slug>/
  manifest.json   — conforms to ContentManifest
  product.json    — conforms to ContentProduct
```

No sample content, publish engine, search, registry, or rendering exists
yet — this phase is types only. See CLAUDE.md and ARCHITECTURE.md for how
this fits into the wider BGrowth ecosystem.
