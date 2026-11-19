# codex (OpenAI Codex CLI)

Facts as of 2026-11-19. Not installed on the machine this was written on, so nothing here is verified locally. Most facts come from model-made summaries of truncated docs pages — marked (S); re-check before relying on them. The docs moved: `developers.openai.com/codex/*` redirects to `learn.chatgpt.com/docs/…`.

## Detect

`command -v codex`. Version: `codex --version` (UNVERIFIED, not documented). Installs: `npm i -g @openai/codex`, `brew install --cask codex`, or the install script from github.com/openai/codex.

## Native subagents

- On by default. Built-ins `default`, `worker`, `explorer`; custom TOML agents in `~/.codex/agents/` or `.codex/agents/`; `[agents]` config keys; `/subagents` in the TUI (S).
- **Model / effort per call:** not documented. A custom agent TOML can presumably pin a model (UNVERIFIED). Otherwise the child runs on the session model — say so in the brief.
- **Foreground switch, nesting limit:** unknown. A child that can't confirm it waits for its own subagents does the step itself.

## Interactive launch via hc

```bash
codex --model <id> -c model_reasoning_effort=<level> --sandbox workspace-write -a never "Read <brief path> and do it."
```

The positional prompt starts the TUI with it (S). `-c model_reasoning_effort=…` is UNVERIFIED (`-c/--config` overrides exist, this key's use with them is not shown). Banned for children: `codex exec` (non-interactive, read-only sandbox by default).

## Model aliases

GPT 6.2 models are excluded on purpose (user decision, 2026-11-19): use `gpt-6.1-sol` in place of `gpt-6.2-sol` and `gpt-6-astra` in place of `gpt-6.2-astra`.

| Short name                                                               | codex ID                     |
| ------------------------------------------------------------------------ | ---------------------------- |
| haiku, sonnet, opus, fable                                               | unsupported (not documented) |
| gpt-6-luna                                                               | `gpt-6-luna` (S, UNVERIFIED) |
| gpt-6.1-sol                                                              | `gpt-6.1-sol` (S)            |
| gpt-6-astra                                                              | `gpt-6-astra` (S)            |
| gemini-3.5-flash-lite, gemini-4-hydrogen, gemini-4-neon, gemini-4-carbon | unsupported (not documented) |
| grok-4.7                                                                 | unsupported (not documented) |

Set with `--model <id>` or config `model`. Other providers go through `model_provider` + `model_providers.<id>` (Responses wire API only; reserved ids `openai`, `ollama`, `lmstudio`). `gpt-5.5` is API-key only and leaves ChatGPT sign-in on 2026-10-14.

## Effort translation

Config `model_reasoning_effort`; documented levels `low`, `medium`, `high`, `xhigh`, `max`, `ultra`, depending on the model (S). In the TUI: `/model`.

| Tier word | `model_reasoning_effort`                                 |
| --------- | -------------------------------------------------------- |
| low       | `low`                                                    |
| medium    | `medium`                                                 |
| high      | `high`                                                   |
| xhigh     | `xhigh`; if the model rejects it, `high` (and report it) |

Whether `xhigh` exists for the 6.1 / 6.x models: unknown.

## Unattended permissions + trust prompt

- `--sandbox workspace-write -a never` (UNVERIFIED combination). Flags: `--sandbox read-only|workspace-write|danger-full-access`; `--ask-for-approval`/`-a on-request|never` (`untrusted` retired) (S).
- `--dangerously-bypass-approvals-and-sandbox` (alias `--yolo`): no limits — sandboxes only.
- `--full-auto`: not supported in `exec`; TUI status unknown.
- **Trust prompt:** untrusted directories start read-only with an onboarding prompt (or `/permissions`). Pre-trust in `~/.codex/config.toml` (S) — editing the user's config is their call, so ask first:

  ```toml
  [projects."/abs/path/to/worktree"]
  trust_level = "trusted"
  ```

  Project `.codex/` layers load only in trusted projects.

## Busy marker

Unknown. Confirm on a live child: launch one with a trivial prompt, run `hc read <t>` while it works, and note text that shows only then (`hc get <t>` status helps too).

## Skills dirs + hook equivalent

- **Skills:** SKILL.md with name + description. Dirs: `.agents/skills` (cwd, parents, repo root), `~/.agents/skills`, `/etc/codex/skills` (S). It does NOT read `.claude/skills` or `~/.codex/skills` — to run `/orchestrate` as the root in codex, symlink the skill into `~/.agents/skills/orchestrate`. Whether codex honours `disable-model-invocation` and a `/orchestrate` command: unknown.
- **Hook:** event `UserPromptSubmit` (can add context or block) in `~/.codex/hooks.json` or `.codex/hooks.json` (trusted projects only); enable `[features] hooks`; the user trusts hooks via `/hooks` (S). Not built — see [`../hook-install.md`](../hook-install.md).

## Status

**Untested** — not installed; version command, busy marker, trust prompt and every flag above need a live check.
