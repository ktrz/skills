# Sticky reminder hook — mechanism and install

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
