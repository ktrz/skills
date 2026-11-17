# Toolchain map (EXAMPLE)

Example only. Copy to `~/.claude/charter/toolchain.md` (user level), or to
`<repo>/.claude/charter-toolchain.md` to override it for one repo. Read by the
`house-tools-only` rule. If neither file exists, the rule is inert.

| Capability             | Tool or location                   | Skill to read first     | Notes                                                                         |
| ---------------------- | ---------------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| Isolated worktree      | `nwt`                              | `nwt`                   | Never raw `git worktree add`.                                                 |
| Stacked branches / PRs | `gh stack`                         | `gh-stack`              | Never hand-rolled rebases or manual PR base edits.                            |
| Child agent sessions   | `hc run ... claude --model <tier>` | `tools/hc.md`           | Use `hc wait`, not sleep. Name every child. The agent never removes children. |
| Commits                | project commit convention          | `commit-message-format` |                                                                               |
| Tracker                | ClickUp via MCP                    | none                    | Tracker work only through the MCP tools.                                      |
| Plan files             | `plans.local/<repo>/`              | none                    | Gitignored; not `.claude/plans/`.                                             |
