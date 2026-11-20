# Plans location notes

Facts about where plan, progress, review and session files live and how paths are derived. Referenced by the toolchain map; read before first use.

## Write directory resolution (plan files)

Source: skills/delivery/plan-feature/SKILL.md:156-169

### Resolve the write directory

Pick the first candidate that applies, and `mkdir -p` it before writing:

1. **`./plans.local/<subdir>/`** — if `./plans.local/` exists and contains subdirectories, match one to the current repo.
   - Derive the repo name from the main repo's `.git` location, not `pwd` — `pwd` reports the current worktree's own path, which would fragment the match across worktrees of the same repo: `REPO_NAME=$(basename "$(cd "$(dirname "$(git rev-parse --git-common-dir)")" && pwd)")`. This stays stable (e.g. `skills`) whether run from the main checkout or any linked worktree.
   - Case-insensitive substring match either way (repo contains subdir, or subdir contains repo). Example: repo `your-app-frontend` matches subdir `frontend`.
   - If multiple subdirs match, pick the longest.
   - If none match but only one subdir exists, use it.
   - If none match and multiple subdirs exist, ask the user which one.
2. **`./plans.local/`** — if the directory exists with no subdirectories.
3. **`./plans/`** — legacy fallback when `./plans.local/` does not exist.

Save to `<resolved-dir>/<ticket-slug>.md`. When you tell the user where the plan landed in Stage 4, use the full relative path.

## Finding an existing plan by ticket key (planning)

Source: skills/delivery/plan-feature/SKILL.md:55-55

2. Search both `./plans.local/**/*<lowercased-key>*.md` and `./plans/*<lowercased-key>*.md` for an existing plan. If found, ask: "A plan already exists at `<path>`. Regenerate it?"

## Plan lookup locations (delivery)

Source: skills/delivery/implement-feature/SKILL.md:32-33

   1. `./plans.local/**/*<lowercased-key>*.md` (preferred — new location, subdirectory per project)
   2. `./plans/*<lowercased-key>*.md` (legacy)

## Locating plans.local and picking the project directory (saving)

Source: skills/delivery/save-plan/SKILL.md:49-107

Find repo root + `plans.local` dir in it.

```bash
git rev-parse --show-toplevel
```

Call result `REPO_ROOT`. Then check, distinguishing a dangling symlink from a genuinely missing path — `test -d` alone follows symlinks and reports a broken one as simply missing, which would send the user to re-run `ln -s` at a path that already exists (and fails):

```bash
if [ -L "$REPO_ROOT/plans.local" ] && [ ! -e "$REPO_ROOT/plans.local" ]; then
  echo "dangling"
elif [ -d "$REPO_ROOT/plans.local" ]; then
  ls -ld "$REPO_ROOT/plans.local"
else
  echo "missing"
fi
```

If the check reports `dangling`, stop + tell user:

> `./plans.local` exists but is a broken symlink — its target is missing. Repair or replace it, e.g.:
>
> ```bash
> ln -sfn ~/projects/plans <REPO_ROOT>/plans.local
> ```
>
> then re-run.

If the check reports `missing`, stop + tell user:

> No `./plans.local` in this repo. Create the symlink first:
>
> ```bash
> ln -s ~/projects/plans <REPO_ROOT>/plans.local
> ```
>
> then re-run.

No auto-create symlink — target path personal (how user organises plans across machines). Wrong guess = plans stashed wrong place.

## Phase 1 — Pick the subdirectory (and decide on a topic dir)

### Step 1 — Project subdir

Derive the project subdir name from the repo's stable identity, not from `$REPO_ROOT` — `REPO_ROOT` is this worktree's own path, and a plain `basename` of it would fragment plans per-worktree instead of sharing one project subdir:

```bash
GIT_COMMON_DIR=$(git rev-parse --git-common-dir)
REPO_NAME=$(basename "$(cd "$(dirname "$GIT_COMMON_DIR")" && pwd)")
```

`--git-common-dir` resolves to the main repo's `.git` even from a linked worktree, which is what keeps `REPO_NAME` identical across every worktree of this repo. Its output isn't always absolute — a plain (non-worktree) checkout reports a relative `.git` or `../.git` — so the `cd … && pwd` wrapper is required to canonicalize before taking the basename; do not simplify this to `basename $(git rev-parse --show-toplevel)`, which silently returns the _worktree_ name instead of the repo name.

Default project subdir to `$REPO_NAME` (so in `~/projects/skills` project subdir = `skills`, and stays `skills` from any of its worktrees). Peek existing layout to reuse:

```bash
ls -1 "$REPO_ROOT/plans.local/"
ls -1 "$REPO_ROOT/plans.local/<project>/" 2>/dev/null
```

## Creating the target directory (saving)

Source: skills/delivery/save-plan/SKILL.md:183-188

### Step 3 — Create the target directory

```bash
mkdir -p "$REPO_ROOT/plans.local/<project>"          # flat case
mkdir -p "$REPO_ROOT/plans.local/<project>/<topic>"  # topic dir case
```

## Review output directory (review config key)

Source: skills/review/review-pr/SKILL.md:341-385

**`output_dir` resolution rules:**

- **Default** (key missing or empty): `$REPO_ROOT/plans.local/<repo>/`.
  The literal `<repo>` token is substituted with the repo directory
  name, derived with:

  ```bash
  GIT_COMMON_DIR=$(git rev-parse --git-common-dir)
  REPO_NAME=$(basename "$(cd "$(dirname "$GIT_COMMON_DIR")" && pwd)")
  REPO_ROOT=$(git rev-parse --show-toplevel)   # prefix anchor — not the agent's CWD
  ```

  `--git-common-dir` points at the main repo's `.git` even when run
  from a linked worktree, and the `cd … && pwd` wrapper canonicalizes
  its output (which isn't always absolute — a plain checkout reports a
  relative `.git` or `../.git`) before taking the basename. This is
  what keeps `<repo>` identical across every worktree of the same
  repo — do not simplify it back to
  `basename $(git rev-parse --show-toplevel)`, which resolves to the
  _worktree_ name instead. `REPO_ROOT` anchors the `plans.local/`
  prefix itself to the repo root instead of leaving it a bare relative
  path resolved against the agent's current working directory — a
  bare `plans.local/…` would otherwise land inside whatever
  subdirectory the skill happened to be invoked from. `plans.local` is
  conventionally a symlink to a tree shared by every worktree (created
  by `nwt`), which is what makes `review-pr` and
  `investigate-pr-comments` agree on this path when they run from
  different worktrees of the same repo; if a worktree has its own real
  `plans.local/` directory instead of the symlink, its artifacts stay
  local to that worktree — pass `--auto-review-file` explicitly to
  `investigate-pr-comments` in that case. Multiple repos sharing the
  default get per-repo subdirectories automatically.

- **User override** (key present): the value is taken **verbatim** —
  no automatic `<repo>` append. The user is in control. Tilde (`~`),
  environment variables, and absolute paths are honoured. If the user
  wants per-repo subdirectories under a custom root, they must include
  the `<repo>` token in their config (e.g.
  `output_dir: ~/code-reviews/<repo>/`), which the skill substitutes
  the same way as the default.

This split keeps the default ergonomic (multi-repo users get
per-repo subdirs for free) without surprising a user who points
`output_dir` at a specific directory and expects writes to land
exactly there.

## Auto-review file lookup (investigation)

Source: skills/review/investigate-pr-comments/SKILL.md:76-117

**Source A — auto-review file**:

Resolve the auto-review file path before reading:

- If `--auto-review-file <path>` was passed, use it verbatim.
- If it was **not** passed, auto-detect the default location
  `$REPO_ROOT/plans.local/<repo>/pr-<N>-auto-review.md` before
  concluding there is no Source A. `<repo>` is the repo directory
  name, derived the same stable way as in `review-pr` Step 9
  (`git rev-parse --git-common-dir`, then canonicalize and take the
  basename) — **not** `basename $(git rev-parse --show-toplevel)`,
  which would resolve to the current _worktree_'s name and miss the
  file `review-pr` actually wrote when the two skills run from
  different worktrees of the same repo:

  ```bash
  GIT_COMMON_DIR=$(git rev-parse --git-common-dir)
  REPO_NAME=$(basename "$(cd "$(dirname "$GIT_COMMON_DIR")" && pwd)")
  REPO_ROOT=$(git rev-parse --show-toplevel)   # prefix anchor — not the agent's CWD
  ```

  `review-pr` auto-mode writes here by default, so the file usually
  exists even when the caller forgot to pass the flag. `plans.local` is
  conventionally a symlink to a tree shared by every worktree (created
  by `nwt`), which is what makes `review-pr` and
  `investigate-pr-comments` agree on this path when they run from
  different worktrees of the same repo; if a worktree has its own real
  `plans.local/` directory instead of the symlink, its artifacts stay
  local to that worktree — pass `--auto-review-file` explicitly in
  that case.

Then:

- Parse every `[?]`-marked section from the resolved file. Each section
  already conforms to `references/handover-format.md`; no
  re-normalisation needed.
- Tag each item `source: "auto-review"`.
- If the resolved file is missing or unreadable (flag pointed at a bad
  path, or the default location has no file), log a one-line warning and
  continue with zero auto-review items. This is **not** a fatal
  condition — a PR with no auto-review file and no human comments still
  produces a valid empty handover doc (see the Workflow invariant).

## Decisions file path (investigation)

Source: skills/review/investigate-pr-comments/SKILL.md:276-282

Resolve output path:
`$REPO_ROOT/plans.local/<repo>/pr-<N>-review-decisions.md`, where
`<repo>` and `REPO_ROOT` are derived the same way as in Step 1 Source A
above (`git rev-parse --git-common-dir`, canonicalized, then basename
for `<repo>`; `git rev-parse --show-toplevel` for `REPO_ROOT`) so this
write lands in the same per-repo directory regardless of which
worktree this skill runs from.

## Plan file lookup by ticket key (phase execution)

Source: skills/delivery/execute-phase/SKILL.md:22-57

Resolve the repo root first so every later step works regardless of the current working directory — this matters once Step 5 changes into the new worktree: `REPO_ROOT=$(git rev-parse --show-toplevel)`

**If source looks like a file path** (contains `/` or ends in `.md`):

- Resolve it to an absolute path under `$REPO_ROOT` if it isn't already absolute. Verify the file exists. Store as `PLAN_FILE`.

**If source looks like a ticket key** (matches any tracker's id regex — see `references/tracker.md` → Ticket ID format):

- Search for a matching plan file, including the `plans.local/` tree that `save-plan` writes to. `save-plan` may store a plan as a flat file (`plans.local/<project>/PLAN-<ticket-key>.md`) or, for topic-directory plans, drop the identifying slug from the filename entirely and carry it only in the directory name (`plans.local/<project>/<ticket-key>/PLAN.md`) — so match the ticket key against the full candidate path, not just the filename. `plans.local` is typically a symlink, so pass `-L` to traverse into it:

  ```bash
  KEY=$(printf '%s' "<TICKET-KEY>" | tr -d '#' | tr '[:upper:]' '[:lower:]')
  (cd "$REPO_ROOT" && find -L plans .claude/plans plans.local -name "*.md" 2>/dev/null) \
    | grep -Ei "(^|[^a-z0-9])$KEY([^a-z0-9]|$)" \
    | awk -v root="$REPO_ROOT" '{ print root "/" $0 }'
  ```

  Three details that snippet depends on — don't simplify them away:

  - **Normalise the key first.** Strip a leading `#`: GitHub ids are written `#567` but nothing on
    disk carries the `#` (`references/tracker.md` → Ticket ID format). Substitute the key through
    `printf`, never `echo` — a raw `#567` inside `$(echo …)` opens a shell comment, so the command
    substitution is never closed and the whole command fails to parse.
  - **Match the key as a whole token.** The `(^|[^a-z0-9])` / `([^a-z0-9]|$)` guards require the key
    to be bounded by non-alphanumeric characters or the ends of the path, so `PROJ-1` selects
    `PROJ-1` but not `PROJ-10`. A plain substring test — `find … -ipath "*proj-1*"` — does not.
  - **Search relative to `$REPO_ROOT`, then re-absolutise with `awk`.** The repo root's own path must
    stay out of the matched text: this repo checks phases out under `worktrees/<feature>/`, so with
    absolute paths a worktree named `skl-1-move` would make key `SKL-1` match _every_ plan file.
    `plans.local` usually symlinks to a central tree covering every project, so an over-broad pattern
    has a very large blast radius.

- If exactly one match, use it.
- If multiple matches, list them and ask the user to pick.
- If no match, tell the user no plan file was found for that ticket and stop.
- Store the absolute match as `PLAN_FILE`.

