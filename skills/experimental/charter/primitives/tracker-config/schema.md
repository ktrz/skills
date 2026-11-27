## Config schema

```yaml
tracker:
  type: jira | linear | github | clickup

  # Only the block matching `type` is required. Others may be absent.

  jira:
    cloud_id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    project_keys: ["PROJ"] # used for branch-key extraction
    base_url: "https://org.atlassian.net/browse"
    in_review_transition_id: "21" # from GET /rest/api/3/issue/{key}/transitions

  linear:
    workspace: "acme" # URL slug: linear.app/<workspace>
    team_keys: ["ENG"] # used for branch-key extraction
    in_review_state_name: "In Review" # human state name; the skill resolves its ID at runtime

  github:
    repo: "owner/name" # single-repo default; override per-skill when multi-repo
    in_review_label: "in-review" # label applied when transitioning to "in review"

  clickup:
    team_id: "12345"
    list_ids: ["67890"] # lists to search for assigned tasks
    in_review_status_name: "in review" # case-insensitive match against ClickUp statuses
```
