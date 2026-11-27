Catalog of fixed texts. One entry per moment; text inside the fence is literal outside `<slots>`.

**No tracker config found** (goal `pr-opened`, `plan-delivered` when it must open a PR).

> No tracker config found. Create `<repo_root>/.claude/tracker.yaml` for a per-project tracker, or `~/.claude/tracker.yaml` for a shared default. Copy `<tracker example>` as a starting point.

**No plan or ticket given.**

> Which ticket or plan should I implement?

**Cohort ready, before any dispatch.**

> Cohort ready: **Phase X and Phase Y** (parallel — disjoint files). Dispatch both now, or only one?

**Cohort of one phase** — the phrase is "Dispatching Phase X now." (announced, no decision needed).

**Phase complete.**

> Phase N complete — PR at <url>. Ready to dispatch Phase M (and Phase P in parallel)?

**Summary table, when all phases are done.**

```markdown
| Phase   | Branch                   | PR                     |
| ------- | ------------------------ | ---------------------- |
| Phase 1 | `<username>/...-phase-1` | https://github.com/... |
| Phase 2 | `<username>/...-phase-2` | https://github.com/... |
```

**Review not configured** (no `review.yaml`; noted in the retrospective).

> <review goal> not configured — create `.claude/review.yaml` to enable the automated review pipeline.

**Per PR, after its review pipeline.**

> Review pipeline complete for PR `<N>` (draft). Decisions file: `<path>`. Edit and run `<apply command> <path>` when ready — that step will offer to mark PR `<N>` ready for review once findings are resolved. For flagged items: `<flagged command> <path>`.

**Retrospective, friction empty.**

> No friction noted — everything ran cleanly.

**Retrospective, friction present** — each friction point, which skill it implicates, and what the likely fix is; then:

> Want to open a skill-creator session to improve any of these?

**PR opened, stacked.**

> This PR is stacked on `<base-branch>`. Merge that one first.

**PR opened, draft.**

> Opened as draft. Mark ready with `gh pr ready <N>` when self-review is complete.
