# Repository Strategy — Two-Repo Model

## Overview

We maintain two GitHub repos to separate proprietary work from upstream contributions:

| Repo                     | Visibility                             | Purpose                      | Git Remote    |
| ------------------------ | -------------------------------------- | ---------------------------- | ------------- |
| `bmeyer99/openclaw-no13` | **PRIVATE**                            | All day-to-day development   | `origin`      |
| `bmeyer99/openclaw`      | **PUBLIC** (fork of openclaw/openclaw) | Upstream PR submissions only | `public-fork` |
| `openclaw/openclaw`      | **PUBLIC** (upstream)                  | Pull upstream updates        | `upstream`    |

## Golden Rules

1. **`git push` always goes to the private repo** — `origin` is `openclaw-no13`
2. **Never push `main` to `public-fork`** — our `main` has proprietary features
3. **`public-fork` is for PR branches only** — cherry-picked, generic code
4. **A pre-push hook warns** if you target `public-fork`

## Daily Workflow

```bash
# Normal development — always goes to private repo
git checkout -b feature/my-thing
# ... work ...
git push -u origin feature/my-thing    # → openclaw-no13 (private)
```

## Pulling Upstream Updates

```bash
git fetch upstream
git merge upstream/main                # Into our main
git push origin main                   # Push updated main to private repo
```

## Submitting an Upstream PR

Only for **generic, non-proprietary** features:

```bash
# 1. Create a clean branch from upstream's main
git fetch upstream
git checkout -b pr/my-generic-fix upstream/main

# 2. Cherry-pick the relevant commit(s) from our main
git cherry-pick <commit-hash>

# 3. Verify no proprietary references
git diff upstream/main..HEAD | grep -iE '(no13|smykowski|pitchpen|aidition|c-suite|baos|brandon|meyer)'
# ^^^ This MUST return empty

# 4. Push to public fork
git push public-fork pr/my-generic-fix

# 5. Open PR on GitHub from bmeyer99/openclaw → openclaw/openclaw
```

## What Goes Where

### Private repo (openclaw-no13) — EVERYTHING

- All feature development
- SOUL framework, Inception Layer docs
- MCP context hook, identity-first prompting
- Model aliases (4.6)
- Project-specific test fixtures
- Smykowski integration (future)

### Public fork (bmeyer99/openclaw) — GENERIC ONLY

- Bug fixes applicable to all users
- Generic features with no No13 references
- Test files must use generic examples (not "PitchPen", "Aidition", etc.)

## Audit Checklist (Before Any Public Push)

- [ ] `grep -riE '(no13|smykowski|pitchpen|aidition|c-suite|baos|brandon|meyer|no13productions)' <files>` returns nothing
- [ ] No API keys, tokens, or credentials
- [ ] No internal architecture details
- [ ] Test fixtures use generic examples
- [ ] Commit messages are clean

## Recovery

If proprietary code accidentally gets pushed to `public-fork`:

1. `git push public-fork --delete <branch-name>` — delete the branch immediately
2. If pushed to `main` on public fork — force-push upstream's main:
   ```bash
   git fetch upstream
   git push public-fork upstream/main:main --force
   ```
3. Note: GitHub may cache commits even after deletion. Contact GitHub support if needed.

---

_Created: 2026-02-06. This is a living doc — update as the strategy evolves._
