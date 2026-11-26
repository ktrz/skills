# claude (Claude Code)

As of 2026-11-19, Claude Code 2.1.328. Native tool, CLI flags and hc launch line verified; trust prompt untested. (S) = from a model summary of a truncated docs page.

- **Detect:** `command -v claude`; `claude --version`.
- **Native:** the `Agent` tool (types `general-purpose`, `Explore`, `Plan`; custom in `.claude/agents/`, `~/.claude/agents/`). Parallel: several calls in one message. Fresh child per chunk: never reuse one via `SendMessage`.
- **Model:** Agent `model` takes the alias only; omitted = the parent's model. `--model` takes the alias or the full ID.
- **Effort:** Agent `effort` where the tool offers it (the tier table is the explicit instruction it asks for), else state it in the brief; CLI `--effort`. Tier words map 1:1 (`low` … `xhigh`); `max` and `ultracode` unused. Default medium (S).
- **Background:** the root passes `run_in_background: true` and dispatches the next dependent chunk on each completion notice; children may pass either and wait for every completion before returning.
- **Nesting:** `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (in the binary); default 3 UNVERIFIED.

## hc launch

```bash
claude --model <id> --effort <level> --permission-mode auto
```

Banned for children: `-p`/`--print`, `--bg`.

| Short name                               | claude ID                      |
| ---------------------------------------- | ------------------------------ |
| haiku                                    | `haiku` (`claude-haiku-5-5`)   |
| sonnet                                   | `sonnet` (`claude-sonnet-5-5`) |
| opus                                     | `opus` (`claude-opus-5-5`)     |
| fable                                    | `fable` (`claude-fable-5-2`)   |
| every gpt-, gemini- and grok- tier model | unsupported                    |

- **Permissions:** `--permission-mode auto` (classifier; every tier model qualifies; pass the flag, `auto` in project settings doesn't apply). `--dangerously-skip-permissions`: sandboxes only.
- **Trust prompt:** on new directories, fresh worktrees included; no skip flag, text unknown. Seen in `hc read <t>` → ask the user, don't answer it.
- **Status to hc:** reported (`idle` before its first turn). Busy text `esc to interrupt`.
- **Skills:** `~/.claude/skills/`, `.claude/skills/`, plugin `skills/`. **Hook:** `UserPromptSubmit`, built for this harness only ([`../hook-install.md`](../hook-install.md)).
