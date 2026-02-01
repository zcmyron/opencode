---
name: fork-update-safe
description: Safely merge upstream changes into a fork without losing local customizations
license: MIT
compatibility: opencode
metadata:
  workflow: git
  audience: maintainers
---

## What I do

- Keep a fork in sync with upstream using a non-destructive merge flow
- Preserve local customizations (e.g., Azure EntraID support)
- Provide a repeatable, safe sequence of steps

## When to use me

Use this when your fork is behind upstream and you want to pull official updates without rewriting history or losing your changes.

## Safe update workflow

1. Confirm remotes
   - origin: your fork
   - upstream: original repo

2. Create a backup branch

3. Fetch upstream

4. Merge upstream into your working branch with a merge commit

5. Resolve conflicts, then commit

6. Push to your fork

## Commands (copy/paste)

- Verify remotes:
  - git remote -v

- Create backup branch:
  - git switch dev
  - git branch dev-backup-$(date +%Y-%m-%d)

- Update from upstream:
  - git fetch upstream
  - git merge --no-ff upstream/dev

- If conflicts occur:
  - Resolve conflicts in files
  - git add <files>
  - git commit -m "Merge upstream/dev"

- Push to your fork:
  - git push origin dev

## Notes

- This flow avoids rebasing, so your history stays intact and safer for shared branches.
- If you want the fork to track upstream by default, keep upstream set to fetch-only and push only to origin.
