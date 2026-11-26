# cursor-agent (Cursor CLI)

As of 2026-11-19, from cursor.com/docs/cli. **Untested:** not installed here; binary name, model IDs, every flag, busy marker and trust prompt need a live check.

- **Detect:** `command -v agent || command -v cursor-agent`; `agent` below means whichever exists (the docs say `agent`; check `agent --version` is Cursor's). Install: `curl https://cursor.com/install -fsS | bash`, with `~/.local/bin` on PATH.
- **Native:** built-ins `explore`, `browser`; custom agents in `.cursor/agents/`, `.claude/agents/`, `.codex/agents/` and their `~/` versions. Frontmatter model with effort: `claude-opus-5[effort=high]`. Per-call model: undocumented. Foreground switch and nesting limit: unknown.

## hc launch

```bash
agent --model <id> --force
```

Banned for children: `-p`/`--print`. **Go-ahead first:** `--force` (`--yolo`) runs commands without per-command approval. Before the session's first cursor-agent child, tell the user and get a go-ahead; without one → current harness, native, reported. `--sandbox enabled` may narrow it (UNVERIFIED).

- **Models:** no tier model has a documented ID. Before routing here, run `agent models` (or `agent --list-models`) once and map each short name to its listed ID; unlisted = unsupported.
- **Effort:** no flag; it rides on the model ID. Nearest listed variant: low and medium → the bare ID; high and xhigh → the `-high` variant if listed, else bare. Report every mismatch. Whether `--model` takes `[effort=…]`: unknown. Native: `<id>[effort=<word>]` in the frontmatter `model`.
- **Permissions:** `approvalMode` `allowlist|auto-review|unrestricted` in `~/.cursor/cli-config.json`; project `.cursor/cli.json` holds `permissions.allow` / `deny` only. `--approve-mcps` approves MCP servers.
- **Trust prompt:** `--trust` is headless-only; an interactive prompt: unknown. **Status to hc:** unknown.
- **Skills:** `.agents/skills`, `.cursor/skills`, `.claude/skills`, `.codex/skills` and their `~/` versions, so the `~/.claude/skills/orchestrate` symlink works. `disable-model-invocation` and `/orchestrate`: unknown.
- **Hook:** `beforeSubmitPrompt` in `.cursor/hooks.json` or `~/.cursor/hooks.json`; whether the CLI runs it: unknown.
