# opencode

As of 2026-11-19, opencode v2.3.0; local help beats the docs (which describe V2). `mini` launched, briefed and corrected via hc; `--auto` and first-run prompts untested.

- **Detect:** `command -v opencode || test -x ~/.opencode/bin/opencode` (the installer's dir, often off PATH: then launch by full path). `opencode --version`.
- **Native:** tool `subagent`; subagents `general`, `explore`; primaries `build`, `plan`. `experimental.subagent_depth` defaults to 1, so a child usually does grandchild steps itself. Per-call model undocumented; agent config may pin one (UNVERIFIED), else the session model, reported. Foreground switch: unknown.

## hc launch

```bash
# <opencode> = the path Detect found.
<opencode> mini --model <provider/model>#<variant>   # default
<opencode> --auto <directory>                        # go-ahead only, untested
```

- **mini** (default): applies the routed model and effort; unattended only if the `permissions` config allows what the child needs. `#<variant>` rejected → the nearest accepted variant, or no suffix; report the effort that applied. `mini --agent <name>` picks a configured agent (UNVERIFIED).
- **--auto:** approves everything not explicitly denied, and has no `--model`, so it runs the configured default model and effort. Only when permissions don't cover the task, and only after telling the user and getting a go-ahead before the session's first one; the report names the model that ran. No go-ahead → current harness, native, reported.
- Banned for children: `opencode run`. `--standalone` runs a private server so env and config apply. `--auto` is in local help only.

IDs are `provider/model`; only the haiku and sonnet IDs appear in the docs. `opencode models` lists what this machine can run (locally `opencode/*`, `xai/*`; others need `opencode auth`); an unlisted provider = unsupported.

| Short name                           | opencode ID                               |
| ------------------------------------ | ----------------------------------------- |
| haiku                                | `anthropic/claude-haiku-5-5`              |
| sonnet                               | `anthropic/claude-sonnet-5-5`             |
| opus                                 | `anthropic/claude-opus-5-5` (UNVERIFIED)  |
| fable                                | `anthropic/claude-fable-5-2` (UNVERIFIED) |
| gpt-6-luna, gpt-6.1-sol, gpt-6-astra | `openai/<short name>` (UNVERIFIED)        |
| gemini-4-*                           | `google/<short name>` (UNVERIFIED)        |
| grok-4.7                             | `xai/grok-4.7` (UNVERIFIED)               |

- **Effort:** append `#<variant>` (`openai/gpt-6.1-sol#high`): low `#low`, medium no suffix (or `#medium` if the default is higher), high `#high`, xhigh `#xhigh`. A variant the model's catalog doesn't list → the nearest listed one, or no suffix if it lists none; report the effort that applied. TUI: `ctrl+t` cycles.
- **Permissions:** `permissions` config allow / deny / ask; `deny` always enforced. Trust prompt: unknown. **Status to hc:** none (`null`). Busy text `esc interrupt`.
- **Skills:** `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`, and per project (walking up) `.opencode/skills`, `.claude/skills`, `.agents/skills`, so the usual symlink works. Reads CLAUDE.md when AGENTS.md is absent. `disable-model-invocation` and `/orchestrate`: unknown.
- **Hook:** a plugin's session `prompt` hook (edits text, can't reject; signature unknown) in `.opencode/plugins/` or `~/.config/opencode/plugins/` (S).
