# Sticky reminder hook — mechanism and install

Skill instructions injected at invocation fade as a session grows. The optional
`scripts/orchestrate-reminder.sh` UserPromptSubmit hook fixes that:

- A prompt starting with `/orchestrate` or `orchestrate:` touches a flag file
  keyed by the session id, under `${ORCHESTRATE_STATE_DIR:-${TMPDIR:-/tmp}}` —
  parallel sessions stay independent.
- While the flag exists, every prompt gets a one-line `ORCHESTRATE ACTIVE`
  reminder prepended.
- `/orchestrate off` or `stop orchestrating` clears the flag.
- When off, the hook prints nothing and costs zero context. It never blocks a
  prompt — every failure path (missing `jq`, malformed stdin, missing or
  path-unsafe session id) exits 0 silently.

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
