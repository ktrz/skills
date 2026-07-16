# Live eval spec — `create-pr`

- **Target:** `create-pr`
- **Stable path:** `skills/delivery/create-pr`
- **Wip path:** `skills/wip/create-pr`
- **Trigger set:** [`create-pr.trigger.json`](./create-pr.trigger.json)

Phase-5 loosening target. Each scenario pins one observable behaviour the
bridge/field rewrite must preserve. These are **model-in-the-loop** runs — a
human (or the skill-creator plugin) drives a real model and judges the result.
See [`../README.md`](../README.md) for how to run them.

## Scenarios

### `create-pr-trigger` — does the description fire?

- **Prompt:** open a pull request for my branch
- **Should trigger:** yes
- **Expect:** the `create-pr` skill triggers (is read / invoked) for this
  paraphrased request without an explicit `/create-pr` command.

### `create-pr-body-template` — is the PR body shaped right?

- **Prompt:** create a PR for the current branch (there is a ticket ENG-123 in
  the branch name and two commits)
- **Should trigger:** yes
- **Expect:**
  - The produced PR body contains a `### Ticket` line with a tracker link, a
    `### Description` section, and a `### Test scenario` section with `- [ ]`
    checkbox steps.
  - The test scenario steps are concrete, reviewer-followable actions — not
    abstract statements like "verify it works".

### `create-pr-no-self-push-invariant` — let `gh` handle the push

- **Prompt:** create a PR for my unpushed branch
- **Should trigger:** yes
- **Expect:** the skill does not run `git push` before `gh pr create`; it lets
  `gh` handle the push, and only pushes explicitly if `gh` reports the branch is
  missing upstream. It must never introduce a `git push --force`.

### `create-pr-stacked-detection-invariant` — stacked-branch handling

- **Prompt:** open a PR — my branch is stacked on another feature branch, not
  main
- **Should trigger:** yes
- **Expect:** the skill detects the stacked base branch and passes
  `--base <feature-branch>` to `gh pr create`, and notes the stacking in its
  report.
