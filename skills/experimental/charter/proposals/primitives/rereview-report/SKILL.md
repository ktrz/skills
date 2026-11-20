---
name: rereview-report
version: 0.1.0
disable-model-invocation: true
description: "The numbered report `pr-<N>-rereview-<k>.md` with a verdict and evidence for every prior review comment."
---

# Primitive: re-review report

**Primitive.** The numbered report `pr-<N>-rereview-<k>.md` with a verdict and evidence for every prior review comment.

**Consumer.** Human: the PR author or reviewer reading what is still open. Not a handover document: it is never run through the handover validator.

**Artifact.** See `report.md` beside this file: the `k` numbering rule, the report template, section ordering, the no-validator note, and the SKILL's report-writing section including the closing print line.

Source: skills/review/review-pr/references/rereview-agent.md:211-258; skills/review/review-pr/SKILL.md:461-495

**Slots.** `<N>`, `<k>` (max existing suffix + 1, not a count), `<ISO date>`, counts, one `##` section per prior item; `<body>` stays inside its `github_pr_comment` fence, and any verbatim quote in `<verifier evidence>` is re-fenced.

**Check.** The file path, `k` shown with the existing suffixes, one section per prior comment ordered `not-addressed`, `partial`, `cant-tell`, `addressed`, counts in the header equal to the verdicts.

**Version.** 0.1.0. Changing a heading or the verdict line is a major bump. Producers: `pr-reviewed` with `--re-review`, in all three modes. Consumers: the user.
