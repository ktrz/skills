# codex (OpenAI Codex CLI)

As of 2026-11-19. **Untested:** not installed here; every flag, the busy marker and trust prompt need a live check. (S) = from a model summary of a truncated docs page (docs moved to `learn.chatgpt.com/docs/…`).

- **Detect:** `command -v codex`; `codex --version` UNVERIFIED. Install: `npm i -g @openai/codex` or `brew install --cask codex`.
- **Native:** on by default; built-ins `default`, `worker`, `explorer`; custom TOML agents in `~/.codex/agents/`, `.codex/agents/` (S). Model and effort per call: undocumented; a TOML agent may pin a model (UNVERIFIED), else the session model, stated in the brief. Foreground switch and nesting limit: unknown.

## hc launch

```bash
codex --model <id> -c model_reasoning_effort=<level> --sandbox workspace-write -a never "Read <brief path> and do it."
```

The positional prompt starts the TUI (S). `-c model_reasoning_effort` and the `--sandbox workspace-write -a never` combination: UNVERIFIED. Banned for children: `codex exec`.

| Short name                    | codex ID                     |
| ----------------------------- | ---------------------------- |
| gpt-6-luna                    | `gpt-6-luna` (S, UNVERIFIED) |
| gpt-6.1-sol                   | `gpt-6.1-sol` (S)            |
| gpt-6-astra                   | `gpt-6-astra` (S)            |
| every claude, gemini and grok | unsupported (not documented) |

- **Effort:** `model_reasoning_effort` = the tier word (levels `low` … `xhigh`, `max`, `ultra`, per model (S)). `xhigh` rejected → `high`, reported. xhigh on 6.x models: unknown.
- **Permissions:** `--sandbox read-only|workspace-write|danger-full-access`, `-a on-request|never` (S). `--yolo` (`--dangerously-bypass-approvals-and-sandbox`): sandboxes only.
- **Trust prompt:** untrusted dirs start read-only with an onboarding prompt; project `.codex/` loads only when trusted. Pre-trust, with the user's OK (it edits their config): `[projects."/abs/path/to/worktree"]` with `trust_level = "trusted"` in `~/.codex/config.toml` (S).
- **Busy marker:** unknown (find it per `runners/hc.md`).
- **Skills:** `.agents/skills` (cwd up to repo root), `~/.agents/skills`, `/etc/codex/skills` (S); not `.claude/skills`. As root: symlink into `~/.agents/skills/orchestrate`. `disable-model-invocation` and `/orchestrate`: unknown.
- **Hook:** `UserPromptSubmit` (adds context or blocks) in `~/.codex/hooks.json` or `.codex/hooks.json` (trusted projects); needs `[features] hooks` and the user trusting it via `/hooks` (S). Payload fields unknown.
