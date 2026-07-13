# Changelog

## 1.0.0 - 2026-07-13

- Added: `walkthrough.json` v1 schema (`references/schema.md`) and a zero-dependency validator (10 rules, all-violations reporting); deterministic renderer (`render.mjs`) with lane, sequence, and depmap diagram renderers, a generated per-package palette, dual themes, sha-pinned code receipts and PR-diff-anchored doc receipts, and a `--standalone` flag; golden fixture; full `SKILL.md` workflow (scout → fan-out research → edge verification → synthesize → validate/render → artifact publish) with a trust-boundaries table.
- Changed: depmap redesigned after live acceptance feedback — exemplar label grammar (no tag backgrounds, wrapped/beside-the-line labels), label-width-aware gutter/row sizing, border-anchored perpendicular edge stubs, gutter-centerline routing (no through-node or collinear legs), chips wrap inside node rects.
- Note: acceptance-tested end-to-end on a real 112-file PR; version gate passed by Chris 2026-07-13.

## 0.1.0 - 2026-07-12

- Initial scaffold — skill directory, skeleton `SKILL.md` (frontmatter + outline, no step logic yet), and brief templates for the fan-out research and edge-verification subagent steps. No schema, validator, or renderer yet; those land in a later phase.
