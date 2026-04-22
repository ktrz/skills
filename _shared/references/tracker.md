# Tracker Dispatch

Skills that touch an issue tracker (fetch a ticket, transition status, list assigned items, link a ticket in a PR or commit) read this file to dispatch calls to the right backend.

Supported backends: **jira**, **linear**, **github**, **clickup**.

## Config resolution

Two config locations, checked in this order:

1. **Skill-specific config** — `~/.claude/<skill>.yaml`. If it has a top-level `tracker:` block, use it as-is (no merging with shared).
2. **Shared config** — `~/.claude/tracker.yaml`. Used when the skill config has no `tracker:` block.

If neither exists, stop and tell the user:

> No tracker config found. Create `~/.claude/tracker.yaml` (shared across skills) or add a `tracker:` block to this skill's config. See `<skill>/references/tracker.md` for the schema.

## Config schema

```yaml
tracker:
  type: jira | linear | github | clickup

  # Only the block matching `type` is required. Others may be absent.

  jira:
    cloud_id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    project_keys: ["PROJ"]              # used for branch-key extraction
    base_url: "https://org.atlassian.net/browse"
    in_review_transition_id: "21"       # from GET /rest/api/3/issue/{key}/transitions

  linear:
    workspace: "acme"                   # URL slug: linear.app/<workspace>
    team_keys: ["ENG"]                  # used for branch-key extraction
    in_review_state_name: "In Review"   # human state name; the skill resolves its ID at runtime

  github:
    repo: "owner/name"                  # single-repo default; override per-skill when multi-repo
    in_review_label: "in-review"        # label applied when transitioning to "in review"

  clickup:
    team_id: "12345"
    list_ids: ["67890"]                 # lists to search for assigned tasks
    in_review_status_name: "in review"  # case-insensitive match against ClickUp statuses
```

## Per-skill override

A skill's own config (`~/.claude/<skill>.yaml`) may declare its own `tracker:` block. When present, it **replaces** the shared config wholesale for that skill — no field-level merging. Use this when one skill needs a different backend (e.g. `plan-my-day` scans Linear workspace A, `create-pr` links GitHub issues on a fork).

## Ticket ID format

| Backend | Regex | Example |
|---------|-------|---------|
| jira | `[A-Z][A-Z0-9]+-\d+` | `PROJ-123` |
| linear | `[A-Z][A-Z0-9]+-\d+` | `ENG-45` |
| github | `#?\d+` | `#567` or `567` |
| clickup | `[a-z0-9]+` (opaque 7–9 chars) | `8669abc12` |

Jira and Linear share the same regex shape; disambiguate by `tracker.type`.

## Link format

| Backend | URL template |
|---------|--------------|
| jira | `{base_url}/{ID}` |
| linear | `https://linear.app/{workspace}/issue/{ID}` |
| github | `https://github.com/{repo}/issues/{N}` |
| clickup | `https://app.clickup.com/t/{ID}` |

## Operations

### Fetch a ticket (id → title/description/status)

| Backend | Call |
|---------|------|
| jira | `mcp__plugin_atlassian_atlassian__getJiraIssue` with `cloudId`, `issueIdOrKey`, `fields: ["summary","description","status","issuetype","subtasks","parent","priority"]` |
| linear | `mcp__linear-server__get_issue` with `id` (accepts key like `ENG-45`) |
| github | `gh issue view <N> --repo <repo> --json number,title,body,state,labels,assignees,url` |
| clickup | `mcp__claude_ai_ClickUp__clickup_get_task` with `taskId` |

### Transition a ticket to "In Review"

| Backend | How |
|---------|-----|
| jira | `mcp__plugin_atlassian_atlassian__transitionJiraIssue` with `cloudId`, `issueIdOrKey`, `transitionId = in_review_transition_id` |
| linear | Resolve state id: `mcp__linear-server__list_issue_statuses` for the issue's team, pick the one whose name equals `in_review_state_name` (case-insensitive). Then `mcp__linear-server__save_issue` with `id` + `stateId` |
| github | `gh issue edit <N> --repo <repo> --add-label <in_review_label>` |
| clickup | `mcp__claude_ai_ClickUp__clickup_update_task` with `taskId`, `status = in_review_status_name` |

If the transition fails (invalid id, missing state, label not present), report the underlying error and keep going — do not silently swallow.

### List tickets assigned to the current user (not done)

| Backend | How |
|---------|-----|
| jira | `mcp__plugin_atlassian_atlassian__searchJiraIssuesUsingJql` with `cloudId`, `jql: "assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC"`, `fields: ["key","summary","status","priority"]`, `maxResults: 30` |
| linear | `mcp__linear-server__list_issues` with `assignee: "me"`, `state: { type: { nin: ["completed","canceled"] } }`, `limit: 50` |
| github | `gh issue list --assignee @me --repo <repo> --state open --json number,title,url,state,labels,updatedAt --limit 50` |
| clickup | `mcp__claude_ai_ClickUp__clickup_filter_tasks` with `listIds: <list_ids>`, `assignees: ["me"]`, `statuses` excluding done/closed |

### Extract a ticket key from a git branch name

Pattern depends on `tracker.type`:

- **jira / linear**: match `[A-Za-z][A-Za-z0-9]+-\d+` anywhere in the branch, uppercase the result. Prefer matches whose prefix appears in `project_keys` / `team_keys` when multiple candidates exist.
- **github**: match `\b\d+\b` after stripping any user prefix (`user/`, `feat/`, etc.). If multiple numbers, prefer the first 3+ digit run. If unclear, fall back to PR title.
- **clickup**: match `[a-z0-9]{7,9}` in the branch; if none, fall back to the task's custom-id if the team uses one.

If extraction fails:
1. Check recent commit messages on the branch (`git log --format=%s main..HEAD`).
2. If still empty, ask the user for the key.

## Notes for skill authors

- Never write Jira-specific regex, URL format, or MCP call in a skill body. Always dispatch through this table.
- When a skill needs a new operation (e.g. "add comment"), extend this file in the `_shared/references/tracker.md` source and re-sync to each consumer skill.
- The source of truth lives at `_shared/references/tracker.md` in the skills repo. Each consumer skill carries an identical copy at `<skill>/references/tracker.md`. Keep them in sync.
