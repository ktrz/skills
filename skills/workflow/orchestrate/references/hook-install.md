# Sticky reminder hook — mechanism and install

**Claude Code only.** The hook below is built and tested for Claude Code. The other harnesses have hook points that could carry the same reminder; they are listed at the end as untested follow-ups, not built.

Skill instructions injected at invocation fade as a session grows. The optional
`scripts/orchestrate-reminder.sh` UserPromptSubmit hook fixes that:

Contract: arm on the exact `/orchestrate` slash command; disarm on
`/orchestrate off` or "stop orchestrat…", case-insensitive. Both the arm and
disarm phrases are prefix-anchored — they must start the prompt to match.

- A prompt starting with the exact `/orchestrate` slash command touches a flag
  file keyed by the session id, under `${ORCHESTRATE_STATE_DIR:-${TMPDIR:-/tmp}}`
  — parallel sessions stay independent.
- While the flag exists, every prompt gets a one-line `ORCHESTRATE ACTIVE`
  reminder prepended.
- `/orchestrate off` or "stop orchestrat…" (case-insensitive) clears the flag.
- When off, the hook prints nothing and costs zero context. It never blocks a
  prompt and never injects failure output into stdout — every failure path
  (missing `jq`, malformed stdin, missing or path-unsafe session id) exits 0
  with empty stdout. Flag persistence/removal failures (unwritable state dir,
  undeletable flag) may log a one-line diagnostic to stderr.
- The mode persists across session resume (`claude --resume`) until explicitly
  turned off — the flag file is not garbage-collected at session end. It lasts
  only as long as that file: the OS may clean `TMPDIR` or `/tmp` (on reboot,
  for example), which silently turns the mode off. Point
  `ORCHESTRATE_STATE_DIR` at a persistent directory to avoid that. Set it
  before arming and keep it the same when resuming: an armed session's flag
  stays in the old directory, so after changing it, run `/orchestrate` again.

## Install

One-time manual step — merge this into `~/.claude/settings.json` (a future
plugin packaging of this repo will make the hook auto-register instead):

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/.claude/skills/orchestrate/scripts/orchestrate-reminder.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

The path assumes the skill is installed (symlinked) at
`~/.claude/skills/orchestrate/`. Requires `jq`.

## Other harnesses — untested follow-ups

Not built. Each would need its own wiring and a check that the payload carries
the prompt text and a session id (the script reads Claude's `.prompt` and
`.session_id`). Facts from the harness docs as of 2026-11-19; (S) = from a
summary of a truncated page.

- **codex:** `UserPromptSubmit` hook (can add context or block) in
  `~/.codex/hooks.json` or `.codex/hooks.json` (trusted projects only); needs
  `[features] hooks` enabled and the user trusting the hook via `/hooks` (S).
  Payload field names unknown.
- **opencode:** a plugin's session `prompt` hook runs before the model call and
  can edit the text, but cannot reject (S). Plugins live in `.opencode/plugins/`
  or `~/.config/opencode/plugins/`; the hook signature is unknown. It would be a
  plugin, not this shell script.
- **cursor-agent:** `beforeSubmitPrompt` in `.cursor/hooks.json` or
  `~/.cursor/hooks.json`. Whether the Cursor CLI runs these hooks is unknown.
