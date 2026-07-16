# Changelog

## 1.4.0

- **Plan-file contract** — the phased plan-file format is now an owned contract doc (`references/plan-file-format.md`): exactly one H1 title, a `## Context` section, an `## Execution Order` section when the plan has ≥ 2 phases, at least one `## Phase <N>` section, unique phase numbers forming a contiguous run from 0 or 1, and a non-empty body per phase. Headings inside fenced code blocks are ignored. The plan file is the artifact `plan-feature` produces and `implement-feature` / `execute-phase` consume — all of them models that LLM-parse the markdown, so the doc is the contract and Stage 3 self-checks against it; there is no runtime validator (nothing but models reads a plan file).
- **Fix** — the Stage 3 post-write self-check in `SKILL.md` now mirrors every conformance rule in `references/plan-file-format.md` (it previously omitted the required phase count, unique/contiguous phase numbering starting at 0 or 1, and the fenced-code-block exclusion for headings).

## 1.3.0

- Fence external content per `references/prompt-injection-defense.md`. Tracker ticket bodies are wrapped in `<external_data trust="untrusted">` before being forwarded to the codebase-exploration subagent, the grill-me session, and the plan-writer step. Trust Boundaries section added to `SKILL.md`.

## 1.2.0

- Earlier history not tracked in this file (see git log for prior commits)
