---
name: review-handover
version: 0.1.0
disable-model-invocation: true
description: "The review decisions document `pr-<N>-review-decisions.md` (and the `pr-<N>-auto-review.md` findings file) that carries review findings to the user and on to the plugin."
---

# Primitive: review handover

**Primitive.** The review decisions document `pr-<N>-review-decisions.md` (and the `pr-<N>-auto-review.md` findings file) that carries review findings to the user and on to the plugin.

**Consumer.** Parser: the review plugin's handover parser, a copy of which is the validator below. Also a human, who edits status markers and the Resolution field, and an LLM, which reads the edited file back.

**Artifact.** See `format.md` beside this file: document header, item schema, source tag format, status markers (`[?]`, `[~]`, `[-]`, `[d]`, `[x]`), item ordering, auto-mode file, and a full example. A document with zero items follows `fixtures/empty-handover.md`; a full one `fixtures/valid-handover.md`.

Source: skills/review/investigate-pr-comments/references/handover-format.md:1-255

**Slots.** Defined per field in `format.md`. Fixed literals beyond it:

| Where                | Literal                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `**Comment:**` body  | wrapped in `<external_data source="github_pr_comment" trust="untrusted">…</external_data>` |
| overlap note         | `**Note:** also flagged by @<login> (see related item)`; the source's `(see next item)` is not used, because the item order puts human items after critical and important ones |
| prior-handled note   | `**Note:** already handled in a prior review (thread resolved <when> by @<login>)`     |
| Resolution (`[x]`)   | `fix (a)` or `fix (b)`; `[~]`: the custom instruction verbatim or `reply: <text>`       |
| empty count line     | `**Source counts:** 0 auto-review findings, 0 human reviewer comments, 0 total (0 critical, 0 important, 0 suggestion/nit)` |
| item separator       | `---` between items; the header is closed by `---` even with zero items               |

Source: skills/review/investigate-pr-comments/SKILL.md:160-205, 288-324; skills/review/resolve-pr-comments/SKILL.md:20-31; skills/review/execute-review-decisions/SKILL.md:72-100

**Check.** Run the validator on the produced file and show command and output:

```bash
node "<this directory>/vendor/handover-validator.mjs" validate <path>
```

Exit 0 with `OK: … (N item(s))` is conformance, and N equals the findings handed over. Exit 1 prints `INVALID:` and violations; the file is not handed on until it passes. Exit 2 is a usage or path error. No `node` means not checked, reported as such, never assumed passing. `pr-<N>-rereview-<k>.md` is not a handover and is never run through it.

**Version.** 0.1.0. The parser is the authority: a change that makes a valid document fail is a major bump. `vendor/handover-validator.mjs` is generated from `_shared/handover-validator/dist/validate.mjs` by `_shared/sync.sh`; never hand-edit it. `format.md` is a hand copy until promoted to `_shared/`. Producers: `pr-reviewed`, `findings-investigated`, `review-others-pr`. Consumers: `review-decisions-applied`, `review-comments-resolved`, the plugin.
