# cursor-agent (Cursor CLI)

Facts as of 2026-11-19, from cursor.com/docs/cli/\*. Not installed on the machine this was written on, so nothing here is verified locally.

## Detect

`command -v agent || command -v cursor-agent`. The docs name the binary `agent`; no page uses `cursor-agent`, so check both and launch whichever one is found. `agent` is a generic name, so make sure `agent --version` is Cursor's. Install: `curl https://cursor.com/install -fsS | bash`, then put `~/.local/bin` on PATH. Version: `agent --version`.

## Native subagents

- Yes, in the CLI. Built-ins `explore` and `browser`; custom agents in `.cursor/agents/`, `.claude/agents/`, `.codex/agents/` and their `~/` versions.
- **Model per agent:** subagent frontmatter takes a model, with effort in brackets: `claude-opus-5[effort=high]` (docs). Per-call model: not documented.
- **Foreground switch, nesting limit:** unknown. A child that can't confirm it waits for its own subagents does the step itself.

## Interactive launch via hc

```bash
agent --model <id> --force "Read <brief path> and do it."
```

"Start with initial prompt" (docs overview). Banned for children: `-p`/`--print` (headless; can't ask for approval).

## Model aliases

Cursor is multi-vendor (Anthropic, OpenAI, Google, its own), but none of the current tier models appear in its docs under a known ID. Doc examples: `auto`, `gpt-5`, `sonnet-4-thinking`, `claude-opus-5`, `gpt-5.6-sol`, `composer-2`, plus `-high` / `-fast` suffixes (`gpt-5-high`).

Before routing a child here, run `agent models` (or `agent --list-models`) once and map each short name to the listed ID for that model and version. A short name with no listed ID is unsupported.

| Short name                                                               | cursor-agent ID                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------- |
| haiku, sonnet, opus, fable                                               | unknown — find the 5.5 / 5.2 ID in `agent models` |
| gpt-6-luna, gpt-6.1-sol, gpt-6-astra                                     | unknown — find in `agent models`                  |
| gemini-3.5-flash-lite, gemini-4-hydrogen, gemini-4-neon, gemini-4-carbon | unknown — find in `agent models`                  |
| grok-4.7                                                                 | unknown — find in `agent models`                  |

## Effort translation

No CLI flag. Effort is part of the model ID (`gpt-5-high`); the bracket form `[effort=high]` is documented only for subagent frontmatter, and whether `--model` accepts it is unknown.

| Tier word | Model ID                                                             |
| --------- | -------------------------------------------------------------------- |
| low       | the bare ID (no low suffix documented; report it)                    |
| medium    | the bare ID                                                          |
| high      | the `-high` variant if `agent models` lists one; else bare, reported |
| xhigh     | the `-high` variant if listed (no xhigh form documented; report it)  |

Native subagents: `<id>[effort=<word>]` in the frontmatter `model`.

## Unattended permissions + trust prompt

- `-f`/`--force` (alias `--yolo`): allow commands unless denied. `--approve-mcps` approves MCP servers. `--sandbox enabled|disabled`.
- **Posture:** `--force` runs commands without per-command approval, the mode the claude and codex files keep for sandboxes. Before the first cursor-agent child of a session, tell the user that and get a go-ahead; without one, fall back as SKILL.md says (current harness, native) and report it. `--sandbox enabled` may narrow it (UNVERIFIED).
- Config `approvalMode`: `allowlist` | `auto-review` | `unrestricted`, in `~/.cursor/cli-config.json`; project `.cursor/cli.json` holds permissions only (`permissions.allow` / `deny`, e.g. `Shell(git *)`).
- **Trust prompt:** `--trust` exists for headless mode only; an interactive workspace-trust prompt is not documented — unknown.

## Busy marker

Unknown. Confirm on a live child: `hc read <t>` while it works, and note text that shows only then.

## Skills dirs + hook equivalent

- **Skills:** SKILL.md. Dirs: `.agents/skills`, `.cursor/skills`, `~/.agents/skills`, `~/.cursor/skills`, and for compatibility `.claude/skills`, `.codex/skills`, `~/.claude/skills`, `~/.codex/skills` — the usual `~/.claude/skills/orchestrate` symlink works. Reads AGENTS.md and CLAUDE.md. Whether it honours `disable-model-invocation` and a `/orchestrate` command: unknown.
- **Hook:** `hooks.json` (`.cursor/hooks.json`, `~/.cursor/hooks.json`), event `beforeSubmitPrompt`; whether the CLI runs them is unknown. Not built — see [`../hook-install.md`](../hook-install.md).

## Status

**Untested** — not installed; binary name, model IDs, busy marker, trust prompt and every flag above need a live check.
