# Code review guidelines — `ktrz/skills` repo

This repo is a collection of [Claude Code](https://docs.claude.com/en/docs/claude-code) skills. Skills are markdown documents (`SKILL.md` + optional `references/*.md`, `scripts/`, `assets/`) that the agent loads on demand. There is no compiled output and no test suite — the artefacts ARE the product, so reviews focus on judgement calls a CI lint cannot make.

CI / pre-commit / PostToolUse hooks already cover prettier formatting, frontmatter parse-validity, and `_shared/` sync drift (distributed by `_shared/sync.sh`, enforced by `.github/workflows/shared-refs-drift.yml`). Do not re-flag those here.

Reviewers should focus on the eight areas below. Each entry: **what to check**, **why it matters**, **how violations show up**.

---

## Repository layout

Skills live under `skills/<group>/<skill>/`. The grouping is deliberate, and a review that moves or adds a skill should respect it:

- **Semantic groups (stable): `delivery/`, `review/`, `workflow/`.** Membership follows _which multi-skill pipeline a skill belongs to_ — `delivery/` = plan → implement → ship (plan-feature, implement-feature, execute-phase, create-pr, nwt, commit-message-format, save-plan); `review/` = the review pipeline (review-pr → investigate-pr-comments → execute-review-decisions, plus resolve-pr-comments, request-review, narrate-pr); `workflow/` = standalone drivers that belong to no single pipeline (plan-my-day, plan-my-day-setup, checkpoint, orchestrate).
- **Lifecycle group: `wip/`.** Not a semantic bucket — it holds skills that are _not yet stable_ (parallel-test `-v2` reworks and newborn primitives). WIP skills are excluded from the root `README.md` index and the future plugin manifest, and set `disable-model-invocation: true` so they never auto-trigger while the stable variant remains the daily driver. See [`skills/wip/README.md`](../skills/wip/README.md) for the full bucket contract.

The bucket prefix never leaks into a skill's canonical name (`name:` = directory basename). Moving a skill between buckets — including graduation out of `wip/` — is a one-directory `git mv`, never a layout change or rename.

---

## 1. Description trigger quality

**Check:** the `description` field in SKILL.md frontmatter lists concrete user phrases or invocation patterns the skill should fire on. Trigger-rich descriptions ("Use when user says X, Y, or Z", "Triggers on /foo", "Auto-triggers when ...") surface the skill at the right moment. Docstring-style descriptions ("This skill helps with PR reviews") silently never trigger.

**Why:** Claude Code matches skills against the active conversation by description text. A skill the agent never picks is dead code.

**Violations:**

- Description reads like a function summary, not a routing rule.
- New skill description omits trigger phrases the user is likely to type.
- Description edited away from concrete phrasings toward abstract summary.
- Two skills claim overlapping triggers without clear precedence (see §8).
- Description enumerates the workflow ("dispatches N agents, then aggregates, then writes …") instead of the triggers. The mechanism belongs in the body; the description is a routing rule. (Rewrites landed in Phase 4: `narrate-pr`, `review-pr`, `implement-feature`.)

### 1a. Invocation mode — auto-trigger vs slash-only

**Check:** each skill is either **auto-triggering** (default — its `name` + `description` sit in the skill listing every conversation and the model may invoke it by matching the description) or **slash-only** (`disable-model-invocation: true` — the description never enters the listing, the model cannot invoke it, and it is reachable only via `/<name>` or an explicit file Read). Disabling reclaims listing budget (name + description per enabled skill, against a listing cost of ~1% of the window) at the cost of natural-language triggering.

**Rule — disable only when auto-trigger has no plausible value:** a pure downstream pipeline stage with no standalone natural-language entry, or an explicitly slash-driven workflow (needs an argument a user would never type in prose, or is deliberately command-gated). When in doubt, leave enabled: a skill users reach with natural phrases ("plan this feature", "execute phase 2", "review this PR") must stay auto-triggering, because disabling forces slash-only and regresses that path.

**Current state (Phase 4 audit):** slash-only = `narrate-pr`, `orchestrate` (both heavyweight, deliberately command-gated). Every other skill stays auto-triggering — each has natural-language triggers users actually type, so the listing-budget saving does not justify the triggering regression. `execute-review-decisions` is the closest disable candidate (terminal pipeline stage, takes a `<file>` argument) but was left enabled **and untouched** in Phase 4 because it is being edited on a parallel stream (the post-review-decisions split, Plan SKL-1 Phase 6); revisit its mode there.

**Violations:**

- A skill disabled despite having natural-language triggers users type (silently breaks that invocation path).
- A pure pipeline-internal / argument-only skill left auto-triggering with no natural entry, spending listing budget for triggers no one types.

---

## 2. Progressive disclosure

**Check:** SKILL.md stays focused on the routing surface (what the skill does, args, the workflow shape). Long-form spec — schemas, prompt templates, edge-case tables, agent dispatch rules — lives in `references/*.md` and is loaded only when the skill needs it. SKILL.md should link to refs, not inline them.

**Why:** every SKILL.md is loaded into the agent's context whenever its description is a candidate. Inlining 800 lines of schema cost tokens on every conversation, even when the skill never fires. References load only when the skill body cites them.

**Violations:**

- Reference-only material (table schemas, prompt body text, exhaustive examples) inlined into SKILL.md.
- SKILL.md duplicates content that already exists in `references/`.
- New skill ships everything in SKILL.md with no `references/` dir at all when the spec clearly has reusable sub-parts.

This is a concept, not a line target. A small skill with a single workflow can legitimately be all SKILL.md. Flag the bloat, not the absolute size.

### 2a. One-hop rule and the ref→ref violation register

**Rule:** `SKILL.md` is the hub (hop 0); it links or cites its own `references/*.md` (hop 1). A reference file that in turn points at another reference file is a two-hop chain — the agent must load a second file it was never routed to. **Fix same-skill ref→ref by citing, not hyperlinking** — a backtick path (`` `foo.md#anchor` ``), not `[text](foo.md#anchor)` — so the pointer stays informational and the agent is not invited to traverse. **Cross-skill ref→ref reach-ins are an ownership problem, not a link problem**: do not "fix" them by inlining (that duplicates a contract). They resolve in Plan SKL-1 Phase 6, which moves each target onto a contract-owned readable primitive surface. Register them here until then.

**Register (Phase 4 snapshot):**

_Same-skill ref→ref links — fixed in Phase 4:_

- `plan-my-day/references/monthly-review.md` → `prompt-injection-defense.md` (`#fence-it`, `#detect-flag`): two traversable markdown links converted to backtick citations.

_Same-skill ref→ref citations — already backtick form, compliant, no action:_

- `review-pr/references/{agents,guidelines-agent,review-prompt}.md` → `review-pr/references/findings-schema.md`; `findings-schema.md` → `agents.md` / `aggregation.md` (all cite the findings contract doc by path).

_Cross-skill ref→ref reach-ins — registered, deferred to Phase 6:_

- `investigate-pr-comments/references/handover-format.md` → `review-pr/references/findings-schema.md`.
- `review-pr/references/findings-schema.md` → `investigate-pr-comments/references/handover-format.md` (mutual contract-doc import).
- `investigate-pr-comments/references/prior-handled.md` → `review-pr/references/aggregation.md` (overlap-skim shape).

_Cross-skill SKILL.md → other-skill reference reach-ins — registered, deferred to Phase 6 (same migration target, not strictly ref→ref):_

- `execute-review-decisions/SKILL.md` → `resolve-pr-comments` / `review-pr` / `investigate-pr-comments` references (handover-format, findings-schema, aggregation, resolve execute).
- `investigate-pr-comments/SKILL.md` → `review-pr/references/aggregation.md`, `resolve-pr-comments/references/investigate.md`.
- `resolve-pr-comments/SKILL.md` → `investigate-pr-comments/references/handover-format.md`.

---

## 3. CHANGELOG entries and version bump judgement

**Check:** behaviour-changing PRs update the affected skill's `CHANGELOG.md` and bump the version in SKILL.md frontmatter. Bump granularity:

- **Patch** — internal cleanup, prompt rewording with no behaviour change, doc fixes.
- **Minor** — feature add, new arg, new mode, new sub-agent.
- **Major** — breaking workflow change, removed args, schema migration users must follow.

CHANGELOG entries should describe **what changed for the user**, not what files moved. "Added `--pipeline` flag for auto-mode file write only" beats "Refactored review-pr workflow."

**Why:** users install skills via `npx skills add`. Without a changelog they cannot tell whether a sync is safe. Bumping minor for a feature add is the agreed convention (see [`feedback_versioning.md`](../../.claude/projects/-Users-chris-projects-skills/memory/feedback_versioning.md) memory — conservative bumps preferred).

**Violations:**

- New mode / arg / agent added, version unchanged or only patch-bumped.
- CHANGELOG entry generic ("improvements", "cleanup") with no user-visible delta.
- Major bump applied to a back-compat-preserving change.
- CHANGELOG missing entirely on behaviour-changing PR.

---

## 4. Cross-skill contract consistency

**Check:** several artefacts are shared contracts across multiple skills:

- `_shared/tracker.example.yaml` schema — consumed by every tracker-aware skill.
- `_shared/review.example.yaml` schema — consumed by `review-pr`, `investigate-pr-comments`, `execute-review-decisions`, `resolve-pr-comments --from-doc`.
- `skills/review/review-pr/references/findings-schema.md` — single source of truth for the finding shape; `investigate-pr-comments` handover format imports from it.
- `skills/review/investigate-pr-comments/references/handover-format.md` — consumed by `execute-review-decisions` and `resolve-pr-comments --from-doc`.
- `_shared/references/tracker.md` — copied into 8 consumer skills. `_shared/references/` is canonical; consumer copies are generated by `_shared/sync.sh` (manifest-driven) and drift-enforced by `.github/workflows/shared-refs-drift.yml` — never hand-edit a consumer copy; edit the canonical and re-run `sync.sh`. Same machinery distributes `_shared/references/prompt-injection-defense.md` (10 consumers) and `_shared/references/comment-relevance.md` (`review-pr`, `investigate-pr-comments`).
- `_shared/handover-validator/dist/validate.mjs` — built validator bundle distributed (via `manifest.yaml` `bundles:` + `sync.sh`) into `skills/review/review-pr/vendor/` and `skills/review/investigate-pr-comments/vendor/`. Consumer copies are generated — never hand-edit; edit the canonical bundle source and rebuild. Drift-enforced by `shared-refs-drift.yml`.

**Why:** schema edits in one location without updates to consumers ship a broken pipeline that fails at runtime, not at lint time. The pipeline is opt-in per repo, so silent mismatches can sit undiscovered until someone tries the flow end-to-end.

**Violations:**

- Schema field added/renamed/removed without updates to every consumer skill.
- Example yaml updated, consumer SKILL.md still documents old shape.
- `findings-schema.md` changed without checking handover-format consumers.
- Canonical `_shared/references/*.md` edited without re-running `_shared/sync.sh`, leaving consumer copies stale (caught by `shared-refs-drift.yml`), or a consumer copy hand-edited instead of the canonical.

---

## 5. Workflow integrity

**Check:** the workflow described in SKILL.md actually executes as written.

- Bash snippets are runnable as shown — flags exist, commands resolve, env vars referenced are set or sourced explicitly.
- Cross-skill references (`references/foo.md`, `_shared/bar.yaml`) point to files that exist.
- Mode tables, decision tables, and step lists agree with the prose. (E.g., if Step 3 says "fall back to single-pass," the mode-resolution table must reflect single-pass as a possible outcome.)
- New args are documented in the args block AND threaded through the workflow steps.

**Why:** a skill is a runbook the agent follows turn by turn. A broken `gh` flag, a stale path, or a mode table that disagrees with the prose causes the skill to derail mid-flow with no test catching it.

**Violations:**

- Bash command uses a `gh` flag that doesn't exist on the installed gh.
- File reference points to a renamed / deleted path.
- Mode table contradicts the step-by-step section.
- New arg listed in args block, never used in workflow steps (or vice versa).
- Skill claims "auto-detects X" but workflow has no detect step.

---

## 6. Hooks & scripts safety

**Check:** `.claude/hooks/*.sh` and any other shell script in this repo runs unattended on every matching tool call. Review for:

- `set -euo pipefail` at top (or equivalent strictness).
- No unquoted variable expansion in paths or commands (`"$file"` not `$file`).
- No shell injection via `$CLAUDE_*` env vars or hook payload fields treated as code.
- Bounded recursion / loop conditions — a hook that can re-trigger itself must guard against it.
- Failure modes are non-fatal where the user's flow shouldn't be blocked.

**Why:** these scripts run on every tool call (PostToolUse, etc.). One unsafe expansion against a filename with spaces or backticks blocks the user's session or worse.

**Violations:**

- Missing `set -e` / `set -u` / `set -o pipefail`.
- Variable expansion without quotes.
- Hook payload field interpolated directly into a shell command.
- Hook can re-fire itself with no guard.

---

## 7. Secrets and plans hygiene

**Check:** examples, SKILL.md, references, and tests do not leak:

- Real ticket IDs from private trackers (anonymise to `PROJ-123`).
- Slack tokens, channel IDs that map to real workspaces, webhook URLs.
- User emails, names, internal repo paths, internal hostnames.
- Content from `plans.local/` (gitignored — but easy to paste into an example accidentally).

**Why:** this repo is published. Leaks via examples are still leaks. `plans.local/` is gitignored at the directory boundary, but content copied into a tracked file (an example yaml, a SKILL.md walkthrough) bypasses that.

**Violations:**

- A real Linear / Jira / ClickUp ticket key in an example.
- Slack channel name that maps to an internal channel.
- A user email or internal repo path inlined as an example value.
- A snippet of content lifted directly from a `plans.local/` file into a tracked doc.

---

## 8. Skill scope creep

**Check:** new skills and edits to existing skills respect the existing trigger surface.

- New skill's trigger phrases do not silently overlap with an existing skill (or, if they do, precedence is documented and intentional).
- An existing skill's responsibilities do not grow past its description (skill that "reviews PRs" should not start filing tickets, etc.).
- A new mode / arg fits the skill's stated purpose, or the description is updated to reflect the new surface.
- Splitting / merging skills follows the boundary the rest of the pipeline assumes (review-pr → investigate-pr-comments → execute-review-decisions is a contract; do not collapse without updating all three).

**Why:** trigger overlap means the agent picks unpredictably between two skills for the same user phrase. Scope creep produces skills that match too broadly and fire when the user wanted something else. The pipeline of skills (plan → implement → review → investigate → execute) only works if each skill's slot is well-defined.

**Violations:**

- New skill description trigger overlaps with an existing skill, no precedence note.
- Skill grows a responsibility (posting to Slack, mutating a tracker) that its description doesn't advertise.
- A workflow step belongs to a different skill (e.g., `review-pr` directly mutating a tracker ticket — that's `request-review`'s job).
- Boundary between two pipeline skills blurred without updating both.

---

## What this file is not

- Not a style guide for prose, formatting, or markdown alignment — prettier handles those.
- Not a frontmatter validator — schema validity is structural and CI-checkable.
- Not a substitute for reading the affected skill's `references/` before reviewing — judgement about contracts requires knowing the contract.
- Not exhaustive. New patterns will emerge; add categories here when a class of issue recurs across reviews.
