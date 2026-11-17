# Saved plan: layout, names, templates

**[skills/delivery/save-plan/SKILL.md:34-45]**

User convention:

- Every repo with plans has `./plans.local` symlink (gitignored) pointing to central plans tree (e.g. `~/projects/plans`).
- Inside `plans.local`, plans grouped by project/domain/scope — one subdir per project, named after repo (e.g. `skills/`, `running-poc/`, `maelstrom/`).
- Small self-contained plans = single file directly under project subdir:
  - `PLAN-<slug>.md` — scoped proposal or roadmap (most common)
  - `SESSION-YYYY-MM-DD.md` — session summary
  - `NOTES-<slug>.md` — loose capture, no formal plan structure
  - Plain `<slug>.md` — ad-hoc artefacts (fallback)
- **Large sprawling discussions get own topic dir** one level deeper: `plans.local/<project>/<topic-slug>/`. Inside, files drop topic from names since dir carries it — e.g. `PLAN.md`, `DECISIONS.md`, `SESSION-YYYY-MM-DD.md`, `NOTES-<sub-slug>.md`. Keeps project subdir scannable. Lets meaty topic grow into multiple linked docs without polluting siblings.

Follow layout so plans findable by user + later skills. No new conventions mid-save.

**[skills/delivery/save-plan/SKILL.md:109-123]**

### Step 2 — Flat file or topic directory?

Decide:

- **Flat**: single file directly under project subdir (`plans.local/skills/PLAN-<slug>.md`). Right when plan small, self-contained, unlikely to spawn companion docs.
- **Topic dir**: create `plans.local/<project>/<topic-slug>/`, write inside (`PLAN.md`, `DECISIONS.md`, etc.). Right when discussion sprawling, multiple distinct artefacts to split, or user signals long-lived topic.

Signals topic dir right:

- Conversation long, covered several sub-topics (architecture + rollout + open questions).
- User said "this has been a big discussion", "we'll keep coming back to this", "save the whole thing".
- Matching topic dir exists (`plans.local/<project>/<slug>/`) — reuse over parallel flat file.
- Plan splits into >1 doc (plan + decisions log, or plan + session notes from earlier rounds).

None apply → stay flat. No pre-emptive topic dir for 200-line plan — adds dir to navigate.

**[skills/delivery/save-plan/SKILL.md:135-147]**

Check flat file for slug exists — only slug-bearing names count:

```bash
ls -1 "$REPO_ROOT/plans.local/<project>/" 2>/dev/null | grep -E "^(PLAN|NOTES)-<slug>\.md$|^<slug>\.md$"
```

Separately, list any `SESSION-*` files in the project dir:

```bash
ls -1 "$REPO_ROOT/plans.local/<project>/" 2>/dev/null | grep -E "^SESSION-[0-9]{4}-[0-9]{2}-[0-9]{2}\.md$"
```

`SESSION-*` files are named by date (`SESSION-YYYY-MM-DD.md`, see Phase 2), not by slug — an unrelated session file from some other topic will always match that pattern, so a `SESSION-*` hit never by itself means this slug already exists. Only fold one into the topic dir if the user confirms it's actually about this topic.

**[skills/delivery/save-plan/SKILL.md:149-181]**

Matching flat file (slug form) there → decide promote to topic dir before new save. Promote when:

- New save adds **different KIND** alongside existing (e.g. existing `PLAN-foo.md`, now saving decisions log or session summary).
- User signals topic outgrowing single file ("add a decisions doc", "keep notes for this topic", "this has gotten big", "we'll keep coming back to this").
- User explicitly asks to promote ("give it its own dir").

When promoting, do file move + new save as two visible steps so user sees migration:

1. Confirm user one line:

   > `PLAN-<slug>.md` is growing — promote to topic dir
   > `plans.local/<project>/<slug>/` (moves existing file → `PLAN.md`
   > inside it) and save the new doc alongside?

2. On `yes`, migrate:

   ```bash
   mkdir -p "$REPO_ROOT/plans.local/<project>/<slug>"
   mv "$REPO_ROOT/plans.local/<project>/PLAN-<slug>.md" \
      "$REPO_ROOT/plans.local/<project>/<slug>/PLAN.md"
   ```

   Translate KIND/slug pattern for non-PLAN files:
   - `PLAN-<slug>.md` → `<slug>/PLAN.md`
   - `NOTES-<slug>.md` → `<slug>/NOTES.md`
   - `SESSION-<date>.md` → `<slug>/SESSION-<date>.md` (preserve date; only migrate if user confirms this session belongs to the topic — date alone doesn't establish that)
   - `<slug>.md` → `<slug>/NOTES.md` (plain files promote to NOTES)

3. Continue Phase 2 with topic-dir branch + new filename inside `<slug>/`.

Flat file lives under `plans.local/` (gitignored, via symlink) → plain `mv` right tool. No git history to preserve.

No silent promote. User might want keep flat file + write new doc elsewhere (wider-scope plan). One confirmation keeps door open.

**[skills/delivery/save-plan/SKILL.md:192-215]**

Default KIND = `PLAN`. Override when user's language points elsewhere:

- `SESSION` — user said "session", "today's work", "summary of this session", or content retrospective/log of done work not forward plan.
- `NOTES` — user said "notes", "quick notes", "jot this down", or content too loose for plan template.
- Plain slug (no prefix) — user explicitly asks, or artefact not really plan (reference doc). Follow lead.

Pick identifier + filename per Phase 1 layout:

**Flat case** (writing directly under `plans.local/<project>/`):

- **Slug** (PLAN/NOTES) — 2–5 kebab-case words capturing topic, derived from conversation (e.g. `nwt-cli`, `v3-migration-rollout`). Read conversation. No ask if topic obvious.
- **Date** (SESSION) — `YYYY-MM-DD` from `date +%Y-%m-%d`.
- Filename: `<KIND>-<identifier>.md` (or `<slug>.md` for plain).

**Topic-dir case** (writing under `plans.local/<project>/<topic>/`):

Topic already carried by dir name → filenames drop it to avoid repetition. Short role-based names:

- `PLAN.md` — canonical plan for topic (most common target).
- `DECISIONS.md` — running log of decisions on topic.
- `SESSION-YYYY-MM-DD.md` — dated session summaries.
- `NOTES-<sub-slug>.md` — sub-topic note not fit elsewhere (e.g. `NOTES-performance.md`).

User saving first doc in fresh topic dir + forward-looking plan → `PLAN.md` default.

**[skills/delivery/save-plan/SKILL.md:229-263]**

Use template as default shape for `PLAN-*.md`. Adapt or drop sections that don't fit. Empty scaffolding worse than shorter honest file.

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

For `SESSION-*.md`, swap "Proposal" for "What we did" + "What's next". For `NOTES-*.md`, freeform with whatever headings fit.

Write in user's own voice where conversation provided it — no laundering phrasing into neutral prose. Plans read later as reminder, not polished.

