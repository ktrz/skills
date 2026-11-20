---
name: pr-template
version: 0.2.0
disable-model-invocation: true
description: A PR is opened as draft, follows the repo template, and its title describes the change, not the process.
---

# Rule: PR template

**Rule.** A PR is opened as draft, follows the repo template, and its title describes the change, not the process.

**Why.** A draft keeps unreviewed work from being merged or requested for review early. A template gives reviewers the same fields every time, and a title like "address feedback" or "WIP changes" says nothing about what the PR does.

**Applies.** Every PR you open; marking one ready for review is the user's call, never yours. The template is the repository's own (for example `.github/pull_request_template.md`); if none exists, the `pr-body` primitive. Exempt: a goal whose done-conditions open the PR ready (proposal goal `pr-opened` without `--draft`).

**Check.** The PR is listed as draft, every section of the template is filled or marked not applicable, and the title names the change in a way that makes sense to someone who never saw this session. Show the PR URL.

**If it blocks you.** If the repo has several templates, do not pick silently. Record it as a `record-dont-guess` event.
