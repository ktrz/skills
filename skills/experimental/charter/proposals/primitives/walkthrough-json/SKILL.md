---
name: walkthrough-json
version: 0.1.0
disable-model-invocation: true
description: The walkthrough.json v1 document — a PR walkthrough as data, every claim carrying a receipt — that the validator checks and the renderer turns into HTML.
---

# Primitive: walkthrough.json

**Primitive.** The walkthrough.json v1 document — a PR walkthrough as data, every claim carrying a receipt — that the validator checks and the renderer turns into HTML.

**Consumer.** Parser: `validate.mjs` (beside this file) and the renderer `~/.claude/charter/tools/narrate-pr/render.mjs` (tool note `narrate-pr`). Also a human reader of the rendered HTML.

**Artifact.** Two files beside this one. `schema.md` is the normative document shape, 19 validation rules, and status/legend rendering. `derivation.md` holds the rules for filling it from evidence: diff-marker to status map, `stats`, field order, status roll-ups, edge and node rules, receipts. Source: skills/review/narrate-pr/references/schema.md:1-790; skills/review/narrate-pr/SKILL.md:209-221, 279-294, 396-562. The golden example is `fixtures/sample-mini.json`.

**Slots.** Defined field by field in `schema.md`. Every `status` is derived from evidence or left off; `qa` and `prComments` are empty at build time.

**Check.** Run and show the command and output:

```bash
node "<this directory>/validate.mjs" <output-dir>/walkthrough.json
```

Exit 0 with `OK: … is a valid walkthrough.json v1` is conformance. Exit 1 lists violations, and the document is not rendered until it passes. Exit 2 is a usage error. Smoke test: `node validate.mjs fixtures/sample-mini.json`, expected `OK`.

**Version.** 0.1.0 (schema v1). The validator is the authority: a change that makes a valid document fail is a major bump. `validate.mjs` is a byte copy of `skills/review/narrate-pr/validate.mjs`; re-copy on change, never hand-edit. Producer: goal `pr-walkthrough`. Consumers: the validator, the renderer.
