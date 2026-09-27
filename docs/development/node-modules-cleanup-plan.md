# Stopping `node_modules/` tracking — a future cleanup plan

**Status: not executed. This is a plan for a future, standalone task —
see CLAUDE.md §14: "Never commit `node_modules/` or `dist/`... this rule
is currently violated by repo history and should be fixed deliberately,
not incidentally, as part of an unrelated commit."** This document is
that deliberate plan, prepared during the Stripe reference implementation
review (see ARCHITECTURE.md's "Server/client boundary" section) but not
acted on here.

## Current state (measured at the time this plan was written)

- `git ls-files node_modules/ | wc -l` → 12,357 tracked files.
- `node_modules/` on disk → ~246 MB.
- `.git/` on disk → ~68 MB.
- No `.gitignore` entry for `node_modules/` exists (`.gitignore` today
  only covers `.env*` — see the pre-Stripe readiness review).

## Goal

Stop tracking `node_modules/` **going forward**, so future dependency
installs/updates don't produce thousands-of-files diffs, without
rewriting existing commit history (no changed commit hashes, no forced
re-clone, no coordinated team disruption).

## What this plan deliberately does NOT do

Rewriting history to *remove* `node_modules/` from every past commit
(e.g. `git filter-repo` or BFG Repo-Cleaner) would shrink `.git/` for
real, but it rewrites every commit hash after the first one that added
`node_modules/` — every clone, fork, and open branch would need to be
re-cloned or hard-reset, and any in-flight PRs would need to be
rebased or recreated. That's a coordinated, disruptive, team-wide
operation — explicitly out of scope for "without breaking repository
history." If reclaiming that ~68MB of historical bloat is ever wanted,
it's a separate future decision requiring explicit sign-off and a
coordinated maintenance window, not a follow-on to this plan.

## The safe approach

1. **Add `node_modules/` to `.gitignore`.**
   ```
   node_modules/
   ```
2. **Stop tracking it going forward** — this removes it from git's
   index without touching the working directory (the files stay on
   disk, `npm install` doesn't need to re-run):
   ```
   git rm -r --cached node_modules
   ```
3. **Commit as its own, clearly-labeled commit** — nothing else in the
   same commit, per CLAUDE.md's "fixed deliberately, not incidentally"
   instruction:
   ```
   git add .gitignore
   git commit -m "Stop tracking node_modules/ going forward (history preserved)"
   ```
4. **Push to `main` directly** (not via a feature branch merge — this is
   infrastructure housekeeping, not a product feature, and per CLAUDE.md
   §14's Git Workflow it doesn't need a Release Candidate cycle) once
   the team has agreed on timing (see "Rollout" below).

## Rollout considerations

- **Every existing local clone keeps working** — nothing is force-pushed,
  no history changes. `git pull` after this commit will simply stop
  showing `node_modules/` changes in `git status` from then on.
- **CI/Vercel is unaffected.** Vercel's build (and any CI) already runs
  its own `npm install`/`npm ci` from `package-lock.json` regardless of
  whether `node_modules/` is committed — nothing about the deploy
  pipeline depends on the tracked copy.
- **Open PRs/branches that touch files inside `node_modules/`** (e.g. a
  branch created before this change, mid-dependency-update) may show a
  large diff or a conflict when rebased past this commit — a one-time,
  self-resolving nuisance (accept "theirs" on `node_modules/` paths,
  since those files should no longer be tracked at all going forward, or
  simply re-run `npm install` after rebasing).
- **Timing recommendation:** land this when no other branch has pending
  dependency changes in flight (check `git log --all -- node_modules`
  branches before merging), and announce it in whatever the team's normal
  "heads up, pull latest before starting new work" channel is — a
  one-line courtesy notice, not a maintenance window.

## Verification after executing

- `git ls-files node_modules/ | wc -l` → `0`.
- `git status` after a fresh `npm install` (which changes files under
  `node_modules/`) shows no changes — confirming the ignore rule works.
- A fresh `git clone` + `npm install` + `npm run build` still succeeds
  (proves nothing relied on the tracked copy being present without
  running install first).
- Vercel's next deploy (Preview or Production) succeeds normally.
