# Tracker Dispatch

Skills that touch an issue tracker (fetch a ticket, transition status, list assigned items, link a ticket in a PR or commit) read this file to dispatch calls to the right backend.

Supported backends: **jira**, **linear**, **github**, **clickup**.

## Config resolution

Two config locations, checked in this order (first hit wins — no merging):

1. **Repo-local config** — `<repo_root>/.claude/tracker.yaml`, resolved from `git rev-parse --show-toplevel`. Right when this specific project uses a different backend than your default (e.g. Jira at work, Linear in a side project). Lets a single machine serve projects on different trackers without editing a global file every time you switch repos.
2. **Shared config** — `~/.claude/tracker.yaml`. The default when a repo doesn't declare its own.

If neither exists, stop and tell the user:

> No tracker config found. Either:
> - create `<repo_root>/.claude/tracker.yaml` for a per-project tracker, or
> - create `~/.claude/tracker.yaml` for a shared default across projects.
>
> See `<skill>/references/tracker.md` for the schema.

Both files use the same `tracker:` block schema. Whether to commit the repo-local file depends on the team: commit it so teammates inherit the setup, or gitignore it when it carries personal values (cloud IDs, transition IDs, etc.).

**Per-skill config files** (`~/.claude/<skill>.yaml`) still exist for non-tracker settings — Slack channel, output paths, GitHub day-plan repo, and so on. They no longer carry a `tracker:` block; tracker settings live only in the two locations above so skills running in the same repo always agree on which backend they're hitting.

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
