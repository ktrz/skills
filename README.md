# Claude Code skills

Personal collection of [Claude Code](https://docs.claude.com/en/docs/claude-code) skills for ticket-driven development: plan a day, plan a feature, ship it, review it, resolve review comments.

Each top-level directory is a self-contained skill (`SKILL.md` + optional `references/`, `scripts/`, `assets/`).

## Skills

### Daily flow

| Skill                                           | What it does                                                                                                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [plan-my-day](plan-my-day/SKILL.md)             | Build today's prioritised work list from your worktrees, tracker tickets, open PRs, and Slack activity. Groups into Active worktrees / Tickets to pick up / Stale branches. |
| [plan-my-day-setup](plan-my-day-setup/SKILL.md) | Interactive wizard that writes `~/.claude/plan-my-day.yaml` and seeds `~/.claude/tracker.yaml`.                                                                             |

### Plan and build features

| Skill                                           | What it does                                                                                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [plan-feature](plan-feature/SKILL.md)           | Deep-plan a tracker ticket into a phased, parallelism-annotated implementation plan. Optionally grills you on requirements first. Writes to `./plans.local/<subdir>/`. |
| [implement-feature](implement-feature/SKILL.md) | Execute a multi-phase plan via parallel worktree agents and open PRs. Auto-invokes `plan-feature` if no plan exists.                                                   |
| [execute-phase](execute-phase/SKILL.md)         | Run a single plan phase in an isolated git worktree.                                                                                                                   |
| [save-plan](save-plan/SKILL.md)                 | Persist the current conversation's plan or design discussion into `./plans.local/<repo>/` as a structured markdown file.                                               |

### Ship and review

| Skill                                                   | What it does                                                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [commit-message-format](commit-message-format/SKILL.md) | Write or validate a Conventional-Commits-style git commit message with the right scope and ticket reference.                                                 |
| [create-pr](create-pr/SKILL.md)                         | Open a GitHub PR following the project template; detects stacked branches and fills ticket reference, description, and test scenario from context.           |
| [request-review](request-review/SKILL.md)               | Post an LFR to Slack and transition the tracker ticket to "In Review".                                                                                       |
| [resolve-pr-comments](resolve-pr-comments/SKILL.md)     | Two-phase PR review walk-through: collect decisions on every unresolved comment via parallel investigation subagents, then implement and bulk-reply/resolve. |

## Conventions

- **Tracker dispatch.** Skills that touch a tracker (jira / linear / github / clickup) read `~/.claude/tracker.yaml` (shared default) or `<repo>/.claude/tracker.yaml` (per-project override). Template at [`_shared/tracker.example.yaml`](_shared/tracker.example.yaml). Each consumer skill ships a copy of [`_shared/references/tracker.md`](_shared/references/tracker.md) — see [`_shared/README.md`](_shared/README.md) for the sync procedure when the canonical version changes.
- **Plans.** Plans live in `./plans.local/<project>/` (gitignored — typically a symlink to `~/projects/plans`). Legacy plans may live in `./plans/`.
- **Versioning.** SKILL.md frontmatter uses semver. Bump the minor on feature additions; bump major only for breaking workflow changes. Each skill keeps its own `CHANGELOG.md`.
- **Progressive disclosure.** SKILL.md stays small; long-form spec lives in `references/*.md` and is loaded only when the skill needs it.
- **Markdown formatting.** Tables and prose are auto-aligned via prettier. Two layers:
  - Pre-commit hook ([`.pre-commit-config.yaml`](.pre-commit-config.yaml)) runs prettier on staged `*.md` / `*.yaml` / `*.json` for any contributor — install once with `pip install pre-commit && pre-commit install`.
  - Claude Code PostToolUse hook ([`.claude/hooks/format-md.sh`](.claude/hooks/format-md.sh), wired in [`.claude/settings.json`](.claude/settings.json)) reformats any `.md` file Claude edits, so tables stay aligned mid-session without waiting for the commit.

## Installation

Install via [`skills`](https://github.com/vercel-labs/skills) — the open agent skills CLI:

```bash
# all skills, this project only
npx skills add ktrz/skills

# all skills, globally available to every project
npx skills add ktrz/skills -g

# pick specific skills
npx skills add ktrz/skills --skill resolve-pr-comments plan-my-day

# target a specific agent (defaults to auto-detect)
npx skills add ktrz/skills --agent claude-code
```

The CLI symlinks each skill into your agent's skills directory (e.g. `~/.claude/skills/`). Skills that consume `_shared/references/tracker.md` already ship with their copy bundled — no extra step.
