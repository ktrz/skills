# Toolchain map (EXAMPLE)

Example only. Copy to `~/.claude/charter/toolchain.md` (user level), or to
`<repo>/.claude/charter-toolchain.md` to override it for one repo. Read by the
`house-tools-only` rule.

Paths in the toolchain map resolve relative to the map file; install tool notes at `~/.claude/charter/tools/` beside `~/.claude/charter/toolchain.md`.

Install by copying `proposals/tools/` (notes and scripts) to
`~/.claude/charter/tools/`. If the map is missing and a goal needs a tool note,
the goal stops and names the missing file. The map, the tool notes and their
scripts are user files: tool notes are the fourth kind in the charter README.

| Capability                             | Tool or location                                              | Read first                           | Notes                                                                         |
| -------------------------------------- | ------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| Isolated worktree                      | `nwt` (`tools/nwt/nwt.zsh`)                                   | `tools/nwt.md`                       | Never raw `git worktree add`.                                                 |
| Stacked branches / PRs                 | `gh stack`                                                    | `gh-stack`                           | Never hand-rolled rebases or manual PR base edits.                            |
| Child agent sessions                   | `hc run ... -- claude --model <tier> "<prompt>"`                            | `tools/hc.md`                        | Use `hc wait`, not sleep. Name every child. Never `claude -p`. The agent never removes children. |
| Commits                                | project commit convention                                     | primitive `commit-message`           |                                                                               |
| Tracker                                | per `<repo>/.claude/tracker.yaml`, then `~/.claude/tracker.yaml` | `tools/tracker.md`                | Tracker work only through the configured tracker. |
| Plan files                             | `plans.local/<repo>/`                                         | `tools/plans-local.md`               | Gitignored; not `.claude/plans/`.                                             |
| Open a PR                              | `gh pr create`                                                | `tools/github-pr.md`                 |                                                                               |
| Review threads: fetch, reply, resolve  | `gh api graphql`                                              | `tools/github-review.md`             |                                                                               |
| Review config and specialist agents    | `<repo>/.claude/review.yaml`, then `~/.claude/review.yaml`    | `tools/review.md`                    |                                                                               |
| Review request channel                 | Slack, per `~/.claude/request-review.yaml`                    | `tools/request-review.md`            |                                                                               |
| PR walkthrough render and publish      | `tools/narrate-pr/render.mjs` (run with `node`)               | `tools/narrate-pr.md`                |                                                                               |
| Daily-plan data and day-plan repo      | per `~/.claude/plan-my-day.yaml`                              | `tools/plan-my-day.md`               |                                                                               |
| Install and checks                     | repo's own (example: `npm install`; `npm run typecheck && npm test`) | none                          |                                                                               |
| Handoff                                | `/handoff` skill                                              | none                                 |                                                                               |
| Orchestrate reminder hook              | `tools/orchestrate-hook/orchestrate-reminder.sh`              | `tools/orchestrate-hook.md`          |                                                                               |
