---
name: save-plan
version: 1.0.0
model: sonnet
description: >
  Save the current conversation's plan, design, or strategy discussion into
  `./plans.local/<repo>/` as a structured markdown file following the
  `PLAN-<slug>.md` / `SESSION-YYYY-MM-DD.md` naming convention. Use this skill
  whenever the user says "save this plan", "save the plan", "save to plans",
  "save session notes", "write this down", "checkpoint this discussion",
  "persist this plan", or asks to park a design/scoping conversation for
  later. Also trigger when the user says "save this" or "save it" in a
  planning context even without explicitly naming a destination.
allowedTools:
  - Read
  - Write
  - Bash(git rev-parse:*)
  - Bash(basename:*)
  - Bash(ls:*)
  - Bash(mkdir -p:*)
  - Bash(mv:*)
  - Bash(grep:*)
  - Bash(date:*)
  - Bash(test:*)
---

# save-plan

Persist an in-progress plan, design sketch, or session writeup from the
current conversation into the user's local plans tree, so it can be picked
back up in a future session without rereading the whole chat.

The convention the user follows:

- Every repo that accumulates plans has a `./plans.local` symlink (already
  gitignored) pointing into a central plans tree (e.g. `~/projects/plans`).
- Inside `plans.local`, plans are grouped by project/domain/scope — one
  subdirectory per project, named after the repo (e.g. `skills/`,
  `running-poc/`, `maelstrom/`).
- Small, self-contained plans live as a single file directly under the
  project subdir:
  - `PLAN-<slug>.md` — scoped proposal or roadmap (most common)
  - `SESSION-YYYY-MM-DD.md` — summary of a working session
  - `NOTES-<slug>.md` — looser capture, no formal plan structure
  - Plain `<slug>.md` — ad-hoc artefacts (treat as the fallback)
- **Large, sprawling discussions get their own topic directory** one level
  deeper: `plans.local/<project>/<topic-slug>/`. Inside that dir, files
  drop the topic from their names because the directory already carries
  it — e.g. `PLAN.md`, `DECISIONS.md`, `SESSION-YYYY-MM-DD.md`,
  `NOTES-<sub-slug>.md`. This keeps the project subdir scannable and
  lets a meaty topic grow into multiple linked documents without
  polluting its siblings.

Follow that layout so plans are findable by both the user and later
skills. Don't invent new conventions mid-save.

## Phase 0 — Locate `plans.local`

Find the repo root and the `plans.local` directory within it.

```bash
git rev-parse --show-toplevel
```

Call the result `REPO_ROOT`. Then check:

```bash
test -e "$REPO_ROOT/plans.local" && ls -ld "$REPO_ROOT/plans.local"
```

If `plans.local` is missing, stop and tell the user:

> No `./plans.local` in this repo. Create the symlink first:
> ```
> ln -s ~/projects/plans <REPO_ROOT>/plans.local
> ```
> then re-run.

Don't try to create the symlink automatically — the target path is
personal (it's how the user organises plans across machines) and a wrong
guess ends up stashing plans in the wrong place.

## Phase 1 — Pick the subdirectory (and decide on a topic dir)

### Step 1 — Project subdir

Default to `basename $REPO_ROOT` (so inside `~/projects/skills` the
project subdir is `skills`). Peek at what's already there so you reuse
existing layout:

```bash
ls -1 "$REPO_ROOT/plans.local/"
ls -1 "$REPO_ROOT/plans.local/<project>/" 2>/dev/null
```

### Step 2 — Flat file or topic directory?

Decide between:

- **Flat**: write a single file directly under the project subdir
  (`plans.local/skills/PLAN-<slug>.md`). Right when the plan is small,
  self-contained, and unlikely to spawn companion docs.
- **Topic dir**: create `plans.local/<project>/<topic-slug>/` and write
  inside it (`PLAN.md`, `DECISIONS.md`, etc.). Right when the discussion
  is sprawling, has multiple distinct artefacts to split out, or the
  user signals this is a long-lived topic they'll return to.

Signals that a topic dir is the right move:

- The conversation that produced this plan is long and covered several
  sub-topics (architecture + rollout + open questions, say).
- The user said things like "this has been a big discussion",
  "we'll keep coming back to this", "save the whole thing".
- A matching topic dir already exists (`plans.local/<project>/<slug>/`)
  — reuse it rather than creating a parallel flat file.
- The plan naturally splits into more than one document (e.g. a plan
  plus a decisions log, or a plan plus session notes from earlier
  rounds of the same topic).

If none of those apply, stay flat. Don't pre-emptively carve out a
topic dir for a plan that fits in 200 lines — it just adds a directory
to navigate.

If you're undecided between the two, ask the user in one line:

> This looks like a chunky discussion — save it as a single
> `PLAN-<slug>.md`, or give it its own topic dir
> `plans.local/<project>/<slug>/`?

Respect an existing topic dir over a flat file: if
`plans.local/<project>/<slug>/` is already there, default to writing
inside it even for a short follow-up, so the topic stays together.

### Step 2b — Promote an existing flat file into a topic dir

Check whether a flat file for this slug already exists:

```bash
ls -1 "$REPO_ROOT/plans.local/<project>/" 2>/dev/null | grep -E "^(PLAN|SESSION|NOTES)-<slug>\.md$|^<slug>\.md$"
```

If a matching flat file is there, decide whether to promote it to a
topic dir before writing the new save. Promotion is the right move
when any of these hold:

- The new save adds a **different KIND** alongside the existing file
  (e.g. existing `PLAN-foo.md`, now saving a decisions log or a
  session summary).
- The user signals the topic is outgrowing a single file
  ("add a decisions doc", "keep notes for this topic", "this has
  gotten big", "we'll keep coming back to this").
- The user explicitly asks to promote (e.g. "give it its own dir").

When promoting, do the file move and the new save as two visible
steps so the user can see the migration:

1. Confirm with the user in one line:

   > `PLAN-<slug>.md` is growing — promote to topic dir
   > `plans.local/<project>/<slug>/` (moves existing file → `PLAN.md`
   > inside it) and save the new doc alongside?

2. On `yes`, migrate:

   ```bash
   mkdir -p "$REPO_ROOT/plans.local/<project>/<slug>"
   mv "$REPO_ROOT/plans.local/<project>/PLAN-<slug>.md" \
      "$REPO_ROOT/plans.local/<project>/<slug>/PLAN.md"
   ```

   Translate the KIND/slug pattern for non-PLAN files:
   - `PLAN-<slug>.md`    → `<slug>/PLAN.md`
   - `NOTES-<slug>.md`   → `<slug>/NOTES.md`
   - `SESSION-<date>.md` → `<slug>/SESSION-<date>.md` (preserve date)
   - `<slug>.md`         → `<slug>/NOTES.md` (plain files promote to NOTES)

3. Continue with Phase 2 using the topic-dir branch and the new
   filename inside `<slug>/`.

The flat file lives under `plans.local/` (gitignored, via the symlink),
so a plain `mv` is the right tool — no git history to preserve.

Don't promote silently. The user might want to keep the flat file and
write the new doc somewhere else entirely (e.g. a wider-scope plan);
one confirmation keeps that door open.

### Step 3 — Create the target directory

```bash
mkdir -p "$REPO_ROOT/plans.local/<project>"          # flat case
mkdir -p "$REPO_ROOT/plans.local/<project>/<topic>"  # topic dir case
```

## Phase 2 — Pick KIND and filename

Default KIND is `PLAN`. Override when the user's language points
elsewhere:

- `SESSION` — user said "session", "today's work", "summary of this
  session", or the content is a retrospective/log of what was already
  done rather than a forward plan.
- `NOTES` — user said "notes", "quick notes", "jot this down", or
  content is too loose for the plan template.
- Plain slug (no prefix) — user explicitly asks for it, or the artefact
  isn't really a plan (e.g. a reference doc). Follow their lead.

Pick the identifier and filename based on the layout from Phase 1:

**Flat case** (writing directly under `plans.local/<project>/`):

- **Slug** (for PLAN/NOTES) — 2–5 kebab-case words capturing the topic,
  derived from the conversation (e.g. `nwt-cli`,
  `v3-migration-rollout`). Read the conversation; don't ask if the
  topic is obvious.
- **Date** (for SESSION) — `YYYY-MM-DD` from `date +%Y-%m-%d`.
- Filename: `<KIND>-<identifier>.md` (or `<slug>.md` for plain).

**Topic-dir case** (writing under `plans.local/<project>/<topic>/`):

The topic is already carried by the directory name, so filenames drop
it to avoid repetition. Use short, role-based names:

- `PLAN.md` — the canonical plan for this topic (most common target).
- `DECISIONS.md` — running log of decisions made on this topic.
- `SESSION-YYYY-MM-DD.md` — dated session summaries.
- `NOTES-<sub-slug>.md` — a sub-topic note that doesn't fit elsewhere
  (e.g. `NOTES-performance.md`).

If the user is saving the first document in a fresh topic dir and it's
a forward-looking plan, `PLAN.md` is the default.

### Conflict check

Before writing, check for a conflict:

```bash
test -e "$REPO_ROOT/plans.local/<project>/<...>/<filename>"
```

If it exists, ask the user whether to overwrite, append today's date to
the slug (or add a sub-slug in the topic-dir case), or pick a different
name. Don't silently clobber — plans are often the only record of a
decision. For topic dirs, "update the existing `PLAN.md` in place" is
often the right answer, since that's what the topic dir is for.

## Phase 3 — Compose the content

Use this template as the default shape for `PLAN-*.md`. Adapt or drop
sections that don't fit; empty scaffolding is worse than a shorter,
honest file.

```markdown
# <Title that reads like a sentence, not a filename>

## Context

What's the current state and why is this plan needed? A few sentences
is fine — enough that someone (including future-you) can pick it up
without rereading the chat.

## Goal

What does "done" look like? Keep this tight — one or two paragraphs
or a short bullet list.

## Proposal

The actual plan: approach, key decisions, shape of the solution. This
is usually the longest section. Use sub-headings if it's branching.

## Open questions

Things that are still unresolved and need a decision before or during
execution. Lead with the biggest unknowns.

## Status

Short note on where this sits: not started, in progress, blocked on X,
etc. Include the date so stale plans are obvious.
```

For `SESSION-*.md`, swap "Proposal" for "What we did" + "What's next".
For `NOTES-*.md`, just write freeform with whatever headings fit.

Write in the user's own voice where the conversation provided it — don't
launder their phrasing into neutral prose. Plans are meant to be read
later as a reminder, not polished.

## Phase 4 — Write and report

Write the file with the `Write` tool, then tell the user the absolute
path (not a relative one — the user often jumps to it from another
directory). Example:

> Saved to `/Users/chris/projects/skills/plans.local/skills/PLAN-nwt-cli.md`.

Don't echo the file's contents back — they just wrote it, they know what
it says. One short confirmation line is enough.

## Behaviour notes

- **Group by repo, not by date.** The user's convention keeps plans
  searchable by project; dated filenames are for sessions, not plans.
- **Don't ask for every field.** Read the conversation, propose a
  filename and content, write it. Ask only when the KIND or slug is
  genuinely ambiguous.
- **Respect existing plans.** If a plan with a similar slug already
  exists, offer to update it in place rather than creating `PLAN-foo-2.md`.
  If a topic directory with a matching slug exists, write inside it
  (usually as `PLAN.md` or a dated session) rather than making a flat
  sibling — the topic dir is the signal that this subject is its own
  thing.
- **The symlink is load-bearing.** Always write under `plans.local/`
  (the gitignored symlink), never under `plans/`. Writing under `plans/`
  would check the plan into the skills repo, which defeats the point.
