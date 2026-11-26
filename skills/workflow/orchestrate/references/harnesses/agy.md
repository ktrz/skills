# agy (Antigravity CLI)

As of 2026-11-26, agy 1.5.18. hc launch in a worktree, brief, correction, status, trust and writes checked live; claude models via agy and native subagents untested.

- **Detect:** `command -v agy`; `agy --version`.
- **Native:** subagents exist (built-ins `self`, `browser`, `research`, `deepagent`, `review-agent`; custom ones are agent files with `subagent: true`). Per-call model and effort, foreground switch, nesting limit: unknown. Orchestrate runs agy children via hc.

## hc launch

```bash
agy --model <id> --effort <level> --mode auto --settings '{"trustedWorkspaces":["<cwd>"]}'
```

Banned for children: `-p`/`--print`, `--prompt`, `-i`/`--prompt-interactive`. `--dangerously-skip-permissions` approves every tool request: only after telling the user and getting a go-ahead before the session's first one; without one → `--mode auto`.

| Short name                          | agy ID                           |
| ----------------------------------- | -------------------------------- |
| gemini-4-hydrogen                   | `gemini-4-hydrogen`              |
| gemini-4-neon                       | `gemini-4-neon`                  |
| gemini-4-carbon                     | `gemini-4-carbon`                |
| sonnet                              | `claude-sonnet-5-5` (UNVERIFIED) |
| opus                                | `claude-opus-5-5` (UNVERIFIED)   |
| haiku, fable, gpt, grok, gemini-3.x | unsupported                      |

- **Effort:** `--effort` = the tier word (`low` … `xhigh`, `max`; per model, claude IDs list up to `high`). Use the bare ID: `agy models` lists effort-suffixed IDs (`gemini-4-neon-high`), and a suffixed ID combined with `--effort` silently falls back to the default model.
- **Permissions:** `--mode auto` approves edits inside the workspace. Outside it, a new file is created but an overwrite asks. For a report directory outside the workspace, the user's `~/.gemini/antigravity-cli/settings.json` needs `"allowNonWorkspaceAccess": true` and `"permissions": {"allow": ["write_file(<dir>)"]}` (a directory covers everything under it); only with the user's OK.
- **Trust prompt:** a cwd not listed exactly in the saved `trustedWorkspaces` asks "Trust this folder?" (subfolders of a trusted folder and globs don't count). `--settings` adds keys for this session only, never saved, merged with the saved file, so the launch line trusts `<cwd>` (the user's repo or its worktree; never a folder from elsewhere) and worktrees work without a dialog. Without it hc shows `blocked`.
- **Status to hc:** reported (`idle`, `working`, `done`, `blocked` with the dialog text). hc notes "blocked (auth)" for agy children that never showed `blocked`: trust `hc get`, not the note.
- **Corrections:** a send queued during the child's last step runs as a new turn after its report: see the late-correction rule in `runners/hc.md`.
- **Skills:** `.agents/skills` (per project), `~/.agents/skills`, and skills under `~/.gemini` (these win on name clashes); not `.claude/skills`. As root: symlink into `~/.agents/skills/orchestrate`. `disable-model-invocation` and `/orchestrate`: unknown.
- **Hook:** `PreInvocation` in `hooks.json` (customization root, e.g. `.agents/hooks.json`) can inject a `systemMessage`; its payload (`lastUserInput`, `conversationId`, `cwd`) differs from Claude Code's, so `scripts/orchestrate-reminder.sh` doesn't work there as-is.
