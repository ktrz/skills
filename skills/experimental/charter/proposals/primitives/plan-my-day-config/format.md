# Format: plan-my-day config

## Location
Source: skills/workflow/plan-my-day/SKILL.md:100-101

`````markdown
Read `~/.claude/plan-my-day.yaml` (stored outside the skill directory so it
survives skill updates).
`````
## Fields read
Source: skills/workflow/plan-my-day/SKILL.md:112-117

`````markdown
Extract the following from the config:

- **BRANCH_PREFIX** — the user's branch naming prefix (may be empty string)
- **OUTPUT_PATH** — where to save the daily plan file
- **DAY_PLAN_REPO** — optional `owner/repo` for GitHub issue output (may be absent)
- **REPOS** — list of repos, each with: `name`, `path`, `github_repo`, `branch_ticket_format`
`````
## Generated file, quoting rule, tracker rule
Source: skills/workflow/plan-my-day-setup/SKILL.md:194-228

`````markdown
Assemble `~/.claude/plan-my-day.yaml`:

```yaml
branch_prefix: <detected or user-provided>
output_path: <user-provided or ~/Desktop/dayplan>
# day_plan_repo: owner/repo       # only if user opted in
repos:
  - name: <short-name>
    path: <path>
    github_repo: <org/repo>
    branch_ticket_format: <detected-format>
```

Write every user-supplied scalar as a double-quoted YAML string, not a
bare/plain scalar — e.g. `name: "my: repo"`. Double-quoting sidesteps
plain-scalar parsing rules entirely (`:`, `#`, leading/trailing
whitespace, and other YAML-special bytes are all safe inside `"..."`),
provided embedded double quotes and backslashes are themselves escaped
(`\"`, `\\`) before writing. If a value contains a literal newline,
don't attempt to inline it — reject it and ask the user to resupply
the value without one.

Tracker settings are **never** embedded in `plan-my-day.yaml` any more —
they live in `~/.claude/tracker.yaml` (shared) so every skill in the
stack sees the same backend. When Step 3a collected tracker inputs,
write them to `~/.claude/tracker.yaml`:

- If that file doesn't exist: create it with the collected `tracker:` block.
- If it exists and the user chose "rewrite" in Step 3a: overwrite it
  after confirming once more ("Overwrite `~/.claude/tracker.yaml`?").
- If the user chose "keep as-is": leave `~/.claude/tracker.yaml` alone.

Per-project overrides (`<repo>/.claude/tracker.yaml`) are out of scope
for this wizard — users who need them can copy
`<tracker-config path>/artifact.yaml` into a given repo and edit by hand.
`````
