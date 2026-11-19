# opencode

Facts as of 2026-11-19, opencode v2.3.0. "Local" = checked by running the CLI here (`--help`, `--version`; no child launched). "(S)" = from a model-made summary of a truncated docs page. Where local help and the docs (which describe V2) disagree, local wins.

## Detect

`command -v opencode || test -x ~/.opencode/bin/opencode`. The installer puts it in `~/.opencode/bin`, which is often not on PATH (true locally) — then launch it by full path. Version: `opencode --version` (local: `opencode v2.3.0`).

## Native subagents

- Tool `subagent`. Built-in subagents `general` and `explore`; primary agents `build` and `plan`; `@general` mention.
- **Nesting:** `experimental.subagent_depth` defaults to 1, so a child usually can't spawn grandchildren — it does those steps itself.
- **Model per call:** not documented. Agent config can presumably pin a model (UNVERIFIED); otherwise the session model, reported.
- **Foreground switch:** unknown. A child that can't confirm it waits for its own subagents does the step itself.

## Interactive launch via hc

Two forms (local help). `<opencode>` is the path the Detect line found (`opencode` on PATH, else `~/.opencode/bin/opencode`). Neither form is verified to stay alive in the TUI with the prompt submitted:

```bash
# Full TUI, unattended, but no --model flag: runs the configured default model (report it).
<opencode> --auto --prompt "Read <brief path> and do it." <directory>

# Minimal UI with a model, but no --auto flag: unattended only if opencode's
# `permissions` config already allows what the child needs.
<opencode> mini --model <provider/model> --prompt "Read <brief path> and do it."
```

Prefer the first unless the tier's model matters more than unattended running and the permissions config covers the task. A request that names a model always takes the `mini` form; if the permissions config doesn't cover the task, tell the user the requested model can't run unattended here, then fall back as SKILL.md says. The docs don't mention `--prompt` or `--auto`; local help does. `mini --agent <name>` picks a configured agent (which may pin a model and permissions; UNVERIFIED). Banned for children: `opencode run` (scripts and CI). `--standalone` runs a private server so env and config apply; the default uses a shared background service.

## Model aliases

IDs are `provider/model`; `#variant` selects effort (`run --model`, docs). Only the two `anthropic/claude-sonnet-5-5` and `anthropic/claude-haiku-5-5` forms appear in the docs; every other row follows the same pattern and is UNVERIFIED.

| Short name            | opencode ID                                 |
| --------------------- | ------------------------------------------- |
| haiku                 | `anthropic/claude-haiku-5-5`                |
| sonnet                | `anthropic/claude-sonnet-5-5`               |
| opus                  | `anthropic/claude-opus-5-5` (UNVERIFIED)    |
| fable                 | `anthropic/claude-fable-5-2` (UNVERIFIED)   |
| gpt-6-luna            | `openai/gpt-6-luna` (UNVERIFIED)            |
| gpt-6.1-sol           | `openai/gpt-6.1-sol` (UNVERIFIED)           |
| gpt-6-astra           | `openai/gpt-6-astra` (UNVERIFIED)           |
| gemini-3.5-flash-lite | `google/gemini-3.5-flash-lite` (UNVERIFIED) |
| gemini-4-hydrogen     | `google/gemini-4-hydrogen` (UNVERIFIED)     |
| gemini-4-neon         | `google/gemini-4-neon` (UNVERIFIED)         |
| gemini-4-carbon       | `google/gemini-4-carbon` (UNVERIFIED)       |
| grok-4.7              | `xai/grok-4.7` (UNVERIFIED)                 |

Support also depends on which providers this machine has signed in to: `opencode models` lists what it can run (locally it showed only `opencode/*` and `xai/*`; others need `opencode auth`). Treat a model whose provider isn't listed there as unsupported.

## Effort translation

Effort is a model "variant": append `#<variant>` to the ID (`openai/gpt-6.1-sol#high`). Variant names come from the model catalog; not every model has every level. In the TUI, `ctrl+t` cycles variants. Config: `settings.reasoningEffort`, `capabilities.reasoning`. Whether `mini --model` accepts `#variant` (its help says `provider/model`): unknown.

| Tier word | Variant                                                          |
| --------- | ---------------------------------------------------------------- |
| low       | `#low`, if the catalog has it; else no suffix                    |
| medium    | no suffix (model default), or `#medium` if the default is higher |
| high      | `#high`                                                          |
| xhigh     | `#xhigh`; if missing, `#high` (and report it)                    |

## Unattended permissions + trust prompt

- `--auto`: "Auto-approve permissions that are not explicitly denied" (local help, root command and `run`; not on `mini`). The docs don't mention it.
- **Posture:** `--auto` approves everything not explicitly denied. Before the first `--auto` child of a session, tell the user that and get a go-ahead; without one, fall back as SKILL.md says and report it.
- `permissions` config has allow / deny / ask rules; `deny` is always enforced.
- **Trust prompt** for new directories: not documented — unknown. Check first-run prompts on a live child.

## Busy marker

Unknown. The docs say Enter steers the active session and `esc` interrupts. Confirm on a live child: `hc read <t>` while it works, and note text that shows only then.

## Skills dirs + hook equivalent

- **Skills:** SKILL.md. Dirs: `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`, and per project (walking up) `.opencode/skills`, `.claude/skills`, `.agents/skills`. The usual `~/.claude/skills/orchestrate` symlink already works. It also reads CLAUDE.md when AGENTS.md is absent (`OPENCODE_DISABLE_CLAUDE_CODE=1` turns that off). Whether it honours `disable-model-invocation` and a `/orchestrate` command: unknown.
- **Hook:** a plugin's session `prompt` hook runs before the model call and can edit text and files, but cannot reject (S). Plugins live in `.opencode/plugins/` or `~/.config/opencode/plugins/`; signature unknown. Not built — see [`../hook-install.md`](../hook-install.md).

## Status

**Untested** — installed and `--help` read locally, but no child launched: `--prompt` staying alive in the TUI, `--auto` with the TUI, the busy marker and first-run prompts need a live check.
