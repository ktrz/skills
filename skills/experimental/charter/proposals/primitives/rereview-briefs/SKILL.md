---
name: rereview-briefs
version: 0.1.0
disable-model-invocation: true
description: "The prior-findings set, identity rule, upstream injection block and verifier prompt used on a `--re-review` pass."
---

# Primitive: re-review briefs

**Primitive.** The prior-findings set, identity rule, upstream injection block and verifier prompt used on a `--re-review` pass.

**Consumer.** LLM: the specialists (injection block) and the resolution verifier (verifier prompt); the parent parses the verifier JSON.

**Artifact.** See `brief.md` beside this file: the prior-findings set JSON, the prior-item identity rule, the upstream injection block (appended after the diff fence, before `# Your task`), the verifier prompt, and the verifier output handling.

Source: skills/review/review-pr/references/rereview-agent.md:33-209

**Slots.** `<PR_NUMBER>`, `<REPO_NAME>`, one line per prior item `<file>:<line> (@<login>, resolved|unresolved): <body>` (PR-level: `(no anchor)`), the diff. Bodies are stored raw and fenced fresh at each forwarding site with `source="github_pr_comment"`. Verifier verdicts are `addressed | partial | not-addressed | cant-tell`, one entry per prior comment, same order.

**Check.** Each brief sent: both fences present, one verifier entry per prior comment, a parse failure retried once then every verdict `cant-tell` with a note.

**Version.** 0.1.0. Changing a verdict value or a fence literal is a major bump. Producers: `pr-reviewed` with `--re-review`. Consumers: specialists, verifier, `rereview-report`.
