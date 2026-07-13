# Branching Strategy

This is the operating contract for how work moves from a feature branch to
production. It replaces the previous approach of committing every sprint
onto one long-running branch (`claude/engineering-foundation-p70xwe`) —
that branch is now frozen as historical record; no new work is added to it
going forward. See CLAUDE.md §14 for how this fits into the rest of the
engineering rules.

## 1. Branch naming

One branch per major feature, off `main`:

```
feature/<feature-name>
```

Examples already named for the current roadmap:

- `feature/product-engine`
- `feature/payment-engine`
- `feature/member-area`
- `feature/product-runtime`
- `feature/search`
- `feature/checkout`
- `feature/studio-sync`

`<feature-name>` is kebab-case and names the feature, not the sprint number
or the person working on it — a sprint can span multiple commits on one
feature branch, but the branch name stays the feature's name for its whole
lifetime.

## 2. Feature workflow

1. Branch from the current tip of `main`.
2. Develop the complete feature on that branch. Commit as often as makes
   sense for the work — multiple commits per feature branch is expected and
   fine (see §4 for why this doesn't mean multiple Previews).
3. Run the project's existing verification gate before considering the
   feature done: `npm run build` must pass with zero errors, and any
   touched route/page gets manually exercised (per CLAUDE.md §13, §15).
4. Once the feature is internally complete and verified, cut a **Release
   Candidate** commit (§4) — that commit, and only that commit, is what
   gets reviewed via its Vercel Preview Deployment.
5. Address review feedback with additional commits on the same branch.
   Cut a new Release Candidate commit if the feature changed materially;
   a small fixup doesn't necessarily need a new RC label if the existing
   Preview still accurately reflects the branch (use judgment — the point
   of §4 is signal, not ceremony).
6. Once approved, merge into `main` (§5).

## 3. Commit messages

Every commit on a feature branch — RC or not — uses this format:

```
Sprint XX
Feature Name

Summary

• Bullet
• Bullet
• Bullet
```

Example:

```
Sprint 09
Product Runtime Integration

• Connected Product Engine to Runtime
• Homepage now loads ProductService
• Catalog now uses Published Products
• Dynamic Product Pages enabled
```

Not this:

```
Fix bug
Add feature
Update stuff
```

The sprint number is sequential across the whole project (not per-branch,
not reset per feature) — check the most recent commit message across
branches before picking the next number, since the previous "Sprint N -
Theme" one-line convention (`Sprint 5 - Member Experience Foundation`,
`Sprint 6 - ...`, `Sprint 7 - ...`, `Sprint 8 - ...`) already used this same
counter. `Sprint 09` continues that sequence, not a new one.

## 4. Release Candidates

**Do not create a Vercel Preview after every small commit.** A feature
branch can and should accumulate several commits while the feature is
still being built — that's normal, in-progress work, and it doesn't need
to be reviewable yet.

A **Release Candidate** is the one commit per feature (or per significant
round of review feedback) that actually represents something ready to
look at:

- The feature is internally complete against what was asked.
- `npm run build` passes with zero errors.
- The feature has been manually verified (routes resolve, the UI does what
  it's supposed to do) — not just type-checked.
- It's pushed to the feature branch, which is what Vercel's Preview
  Deployment tracks.

That Release Candidate commit's Preview Deployment is what gets reviewed
and approved. If review asks for changes, make them, then cut the next RC
once the branch is ready to look at again — not after every intermediate
commit in between.

## 5. Merge process

1. Open a pull request from the feature branch into `main` (if one doesn't
   already exist for it).
2. The PR description should summarize what the feature does and link to
   the Release Candidate's Preview Deployment that was actually reviewed.
3. Once approved, merge into `main`. Use a regular merge (not squash)
   unless asked otherwise, so the Sprint-numbered commit history stays
   intact and readable in `main`'s own log.
4. Do not delete the feature branch as part of the merge — branch deletion
   still requires explicit user instruction, same as everywhere else in
   this repo's git rules (CLAUDE.md §14).
5. Do not force-push or rewrite history on a feature branch once it has an
   open PR against it, for the same reason.

## 6. Production deployment

`main` is the production branch: Vercel deploys `main` to the production
URL on every merge, and deploys every other branch (feature branches, and
their Release Candidate commits specifically) to its own Preview URL.
Nothing is ever deployed to production directly from a feature branch —
production only ever moves forward by a merge into `main` landing.

## Current state (read before starting the next feature)

`main` is currently frozen at "Sprint 5 - Member Experience Foundation."
Sprints 6, 7, and 8 (the Product Engine, its Content Source/Assets/
Versioning/Preview foundation, and the Runtime↔Product Engine connection)
exist only on `claude/engineering-foundation-p70xwe` and have not been
merged into `main` yet — no pull request has ever been opened for that
branch. Before cutting a fresh `feature/*` branch that depends on that
work (e.g. `feature/product-runtime`), that gap needs to be resolved
first — branching from today's `main` would silently lose Sprints 6-8.
This is flagged here rather than resolved silently; see the chat response
that introduced this document for the options.
