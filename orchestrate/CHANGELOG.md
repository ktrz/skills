# Changelog

## 0.1.0 - 2026-07-15

Initial release: a delegation-mode skill plus a sticky-reminder hook (the caveman-plugin architecture — full rulebook injected once at invocation, tiny per-prompt reminder while active, session-keyed state flag).

- **Delegation protocol** — parent does only decomposition, briefing, judgment, and synthesis; everything else is dispatched to subagents by model tier (haiku bulk/low, sonnet research/medium, opus multi-step/xhigh, fable judgment/medium). Independent chunks go out as parallel Agent calls; work above a child's tier escalates back through the parent. No `model` frontmatter — the skill inherits the session's model so orchestration judgment stays at the parent's tier.
- **Composability** — `/orchestrate /other-skill X` runs the referenced skill under the delegation rules: it defines the workflow, orchestrate defines who does the work.
- **Sticky reminder hook** — `scripts/orchestrate-reminder.sh` (UserPromptSubmit): `/orchestrate*` / `orchestrate:*` prompts set a session-keyed flag under `${ORCHESTRATE_STATE_DIR:-${TMPDIR:-/tmp}}`; while set, every prompt gets a one-line `ORCHESTRATE ACTIVE` reminder; `/orchestrate off` / `stop orchestrat*` clears it. All failure paths (missing jq, malformed stdin, missing or path-unsafe session_id) exit 0 with empty stdout — the hook can never block prompt submission. Manual install via a documented `~/.claude/settings.json` snippet; auto-registration deferred to the future plugin packaging of this repo.
- **Tests** — zero-dependency `node:test` suite (`tests/orchestrate/hook.test.mjs`, 11 cases) covering activation, stickiness, both off-forms, per-session flag isolation, and the never-block failure paths.
