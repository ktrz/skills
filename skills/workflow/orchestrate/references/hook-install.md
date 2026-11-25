# Sticky reminder hook

Claude Code only. `scripts/orchestrate-reminder.sh` (UserPromptSubmit) keeps a one-line `ORCHESTRATE ACTIVE` reminder on every prompt while the mode is on. When the effective top-level `runner:` is `hc` (repo `.claude/orchestrate.yaml` beats `~/.claude/orchestrate.yaml`; repo found from the payload `cwd`), the line adds the hc launch, correction and wait rules, so long sessions don't drift back to native subagents.

- **Arm:** a prompt starting with the exact `/orchestrate` command touches a flag keyed by session id under `${ORCHESTRATE_STATE_DIR:-${TMPDIR:-/tmp}}`. **Disarm:** a prompt starting with `/orchestrate off` or "stop orchestrat…" (case-insensitive).
- Off, it prints nothing. It never blocks: every failure (no `jq`, malformed stdin, missing or path-unsafe session id) exits 0 with empty stdout; flag write or delete failures may log one stderr line.
- It survives `claude --resume` only while the flag file lives: OS cleanup of `TMPDIR` or `/tmp` (e.g. reboot) silently disarms. To persist, set `ORCHESTRATE_STATE_DIR` to a durable dir before arming and keep it when resuming. To change it while armed: `/orchestrate off`, change it, `/orchestrate` again (a flag left in the old dir re-arms whenever it points back).

## Install

Merge into `~/.claude/settings.json` (assumes the skill is symlinked at `~/.claude/skills/orchestrate/`; needs `jq`):

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

Other harnesses: not built. Their hook points are on the Hook line of each `harnesses/<x>.md`; the script reads Claude's `.prompt` and `.session_id`, so each needs its own wiring and a payload check.
