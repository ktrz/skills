# Changelog

## 1.4.1

- Fixed two unlabeled fenced code blocks in Stage 1 (Step A's jira example, Step B's exploration-agent prompt) that tripped MD040 — both now tagged ```text.
- Fixed the Steps B+C heading claiming parallel execution while Step B's Agent call was pinned `run_in_background: false`. Step B now dispatches in the background so it genuinely runs concurrently with Step C's local `architecture.md` read; Stage 2 already gates on Stage 1 completing, so nothing waits on B any earlier than it needs to.
- Removed a leftover truncation placeholder ("first ~300 chars of ticket description") from the exploration-agent prompt — the full ticket description is now passed through.
- Added the blank line MD031 still required between Step A's `- **jira**:` list item and its ` ```text ` fence — the MD040 language-tag fix above didn't add the missing blank line before it.

## 1.4.0

- **Plan-file contract** — the phased plan-file format is now an owned contract doc (`references/plan-file-format.md`): exactly one H1 title, a `## Context` section, an `## Execution Order` section when the plan has ≥ 2 phases, at least one `## Phase <N>` section, unique phase numbers forming a contiguous run from 0 or 1, and a non-empty body per phase. Headings inside fenced code blocks are ignored. The plan file is the artifact `plan-feature` produces and `implement-feature` / `execute-phase` consume — all of them models that LLM-parse the markdown, so the doc is the contract and Stage 3 self-checks against it; there is no runtime validator (nothing but models reads a plan file).
- **Fix** — the Stage 3 post-write self-check in `SKILL.md` now mirrors every conformance rule in `references/plan-file-format.md` (it previously omitted the required phase count, unique/contiguous phase numbering starting at 0 or 1, and the fenced-code-block exclusion for headings).
- **Fix** — `references/plan-file-format.md` no longer refers to a "validator" for the optional-sections note; the plan/findings validators were removed from the runtime (docs are the canonical contract), so the note now says extra prose/sections are "outside the conformance rules" instead of "ignored by the validator".

## 1.3.1

- The repo-name derivation that matches the current repository against existing `plans.local/<subdir>/` project directories now uses the main repository's git directory instead of `basename "$(pwd)"`, so it is stable across worktrees. Running from a worktree previously yielded the worktree's name, which failed to match the real project subdirectory.
- Sync `references/tracker.md` and `references/prompt-injection-defense.md` from `_shared/`. The prompt-injection-defense change is wording only, no normative change: the re-fencing rule's example now names any verbatim external payload (comment body, issue or ticket description, Slack message, fetched web page) rather than only a comment body.
- Sync `references/tracker.md` from `_shared/` again: the generic fallback steps (recent-commit scan, then ask the user) are now explicitly scoped to jira/linear/clickup, and to github only when no PR exists yet — the `github` bullet's own fallback (PR title, else ask the user) is terminal, so a reading agent can no longer fall through a deliberate "ask the user" into a multi-commit scan where an unrelated `#<n>` in older history could win.

## 1.3.0

- Fence external content per `references/prompt-injection-defense.md`. Tracker ticket bodies are wrapped in `<external_data trust="untrusted">` before being forwarded to the codebase-exploration subagent, the grill-me session, and the plan-writer step. Trust Boundaries section added to `SKILL.md`.

## 1.2.0

- Earlier history not tracked in this file (see git log for prior commits)
