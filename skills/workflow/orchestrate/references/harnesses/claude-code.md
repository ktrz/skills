# claude (Claude Code)

Facts as of 2026-11-19, Claude Code 2.1.328. "Local" = checked by running the CLI here. "(S)" = from a model-made summary of a truncated docs page; re-check before relying on it.

## Detect

`command -v claude` (native installer: `~/.local/bin/claude`; npm `@anthropic-ai/claude-code` also works). Version: `claude --version`.

## Native subagents

- **Tool:** the `Agent` tool. Built-in types `general-purpose`, `Explore`, `Plan`; custom agents in `.claude/agents/`, `~/.claude/agents/`.
- **Model:** the Agent tool's `model` param — `haiku` | `sonnet` | `opus` | `fable`. Omitted, the child inherits the parent's model.
- **Effort:** the Agent tool's `effort` param (`low` | `medium` | `high` | `xhigh` | `max`) where the tool offers it — this skill's tier table is the explicit instruction that param asks for. Where it isn't offered, state the effort in the brief.
- **Background root, foreground below:** the root passes `run_in_background: true`, so the user is never blocked, and acts on each completion notification by dispatching the next dependent step. Every child passes `run_in_background: false` and waits for the result.
- **No foreground option:** some sessions' Agent tool has no `run_in_background` param and starts every subagent in the background (observed 2026-11-19). A child in such a session does the step itself or, if its brief allows hc, runs an interactive claude child through `runners/hc.md` and waits with `hc wait`.
- **Parallel:** several Agent calls in one message.
- **Fresh child per step:** never keep a child alive across steps with `SendMessage`.
- **Nesting:** limited by `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (the variable and the over-limit error are in the 2.1.328 binary). Default depth 3: UNVERIFIED.

## Interactive launch via hc

```bash
claude --model <id> --effort <level> --permission-mode auto "Read <brief path> and do it."
```

The positional prompt starts the TUI with that prompt (local `claude --help`: `claude [options] [command] [prompt]`). Banned for children: `-p`/`--print` (answers once and exits) and `--bg` (detached background session).

## Model aliases

| Short name                                                               | claude ID                      |
| ------------------------------------------------------------------------ | ------------------------------ |
| haiku                                                                    | `haiku` (`claude-haiku-5-5`)   |
| sonnet                                                                   | `sonnet` (`claude-sonnet-5-5`) |
| opus                                                                     | `opus` (`claude-opus-5-5`)     |
| fable                                                                    | `fable` (`claude-fable-5-2`)   |
| gpt-6-luna, gpt-6.1-sol, gpt-6-astra                                     | unsupported                    |
| gemini-3.5-flash-lite, gemini-4-hydrogen, gemini-4-neon, gemini-4-carbon | unsupported                    |
| grok-4.7                                                                 | unsupported                    |

Claude Code runs Claude models only. Bedrock, Vertex and Foundry host Claude; `ANTHROPIC_BASE_URL` moves the endpoint, not the model. `--model` takes the alias or the full ID; the Agent `model` param takes the alias.

## Effort translation

| Tier word | Agent `effort` / `--effort` |
| --------- | --------------------------- |
| low       | `low`                       |
| medium    | `medium`                    |
| high      | `high`                      |
| xhigh     | `xhigh`                     |

Levels depend on the model; medium is the default on current models (S). `max` and `ultracode` exist; no tier uses them. Also settable via settings `effortLevel` or env `CLAUDE_CODE_EFFORT_LEVEL`.

## Unattended permissions + trust prompt

- `--permission-mode auto`: a classifier model reviews actions and blocks escalation. Needs a supported model (Opus 4.6+, Sonnet 4.6+, Haiku 5.5, Fable) — every model in the tiers qualifies. Pass the flag: `auto` set in project `settings.json` does not take effect.
- `bypassPermissions` / `--dangerously-skip-permissions`: sandboxes only.
- **Trust prompt:** shown for a new directory (state kept in `~/.claude.json`). The docs give no skip flag and no dialog text — unknown. A fresh worktree is a new directory, so expect it there. `-p` skips it but is banned for children. If `hc read <t>` shows it, don't answer it: ask the user.

## Busy marker

`esc to interrupt` — seen on a live child (2026-11-19).

## Skills dirs + hook equivalent

- **Skills:** `~/.claude/skills/<name>/`, `.claude/skills/<name>/`, nested `<sub>/.claude/skills`, plugin `skills/`. This skill is usually symlinked at `~/.claude/skills/orchestrate`.
- **Hook:** `UserPromptSubmit` (plus 30+ other events) in `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, plugins, or skill/agent frontmatter. The sticky reminder hook ships for Claude only: [`../hook-install.md`](../hook-install.md).

## Status

- Native (`Agent` tool): **verified** — in use in this harness.
- CLI flags: **verified** locally (`claude --help`, 2.1.328).
- hc launch line: **verified** — an orchestrator started its claude children with `hc run --bg ... -- claude --model <id> --effort <level> --permission-mode auto "<prompt>"` (2026-11-19).
- Busy marker: **seen** on a live child (2026-11-19). Trust prompt: **untested**.
