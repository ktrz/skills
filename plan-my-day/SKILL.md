---
name: plan-my-day
description: >
  Build a prioritised work-item list for today by reading git worktrees
  from your configured repositories, matching each branch to its Jira
  ticket and open PR, layering in Slack activity, and grouping everything
  into Active worktrees / Jira tickets to pick up / Stale branches.
  Use this skill when the user asks for a daily plan, work items for today,
  what to work on today, a morning brief, or anything about planning the day.
model: sonnet
allowedTools:
  - Read
  - Bash(git worktree list:*)
  - Bash(git -C *:*)
  - Bash(date -v-24H +%Y-%m-%d)
  - Bash(date -v-24H +%s)
  - Bash(date +%Y-%m-%d)
  - Bash(date +%s)
  - Bash(gh pr list:*)
  - Bash(mkdir -p *:*)
  - Write
  - mcp__plugin_atlassian_atlassian__getAccessibleAtlassianResources
  - mcp__plugin_atlassian_atlassian__searchJiraIssuesUsingJql
  - mcp__plugin_atlassian_atlassian__getJiraIssue
  - mcp__plugin_slack_slack__slack_read_user_profile
  - mcp__plugin_slack_slack__slack_search_public_and_private
---

Build a prioritized work-item list for today by gathering data from git
worktrees, Jira, GitHub PRs, and Slack, then synthesizing into a clear plan.

## Phase 0 — Load configuration

Read `config.yaml` from this skill's directory (`~/.claude/skills/plan-my-day/config.yaml`).

If the file does not exist, stop and output:

> No `config.yaml` found. Run `/plan-my-day-setup` to configure, or copy
> `config.example.yaml` to `config.yaml` and edit it manually:
>
> ```
> cp ~/.claude/skills/plan-my-day/config.example.yaml ~/.claude/skills/plan-my-day/config.yaml
> ```

Extract the following from the config:
- **BRANCH_PREFIX** — the user's branch naming prefix (may be empty string)
- **JIRA_KEYS** — list of Jira project keys to scan
- **OUTPUT_PATH** — where to save the daily plan file
- **REPOS** — list of repos, each with: `name`, `path`, `github_repo`, `branch_ticket_format`

Also determine:
- **MULTI_REPO** — true if REPOS has more than one entry

---

## Phase 1 — Compute timestamps (run in parallel, no deps)

Run both commands concurrently:

```bash
date -v-24H +%Y-%m-%d
```
→ save as DATE (used for GitHub queries)

```bash
date -v-24H +%s
```
→ save as UNIX_TS (used for Slack `after` param)

---

## Phase 2 — Gather IDs and worktree list (all in parallel)

Run all of these concurrently using the literal values from Phase 1:

**1. Jira cloudId**: Call `getAccessibleAtlassianResources` and extract the
`id` field from the first result. Save as CLOUD_ID.

**2. Slack user profile**: Call `slack_read_user_profile` (no args needed for
current user). Save the user's Slack user ID as SLACK_USER_ID.

**3. Git worktrees** — for **each** repo in REPOS:
```bash
git -C <repo.path> worktree list --porcelain
```
Parse each stanza. Extract:
- `worktree <path>`
- `HEAD <commit>`
- `branch refs/heads/<branch>`

For each branch, extract the ticket key based on the repo's `branch_ticket_format`
and the global BRANCH_PREFIX:
- If `branch_ticket_format` is `prefix/key-NNN`: match branches like
  `BRANCH_PREFIX/<key>-NNN` (case-insensitive) where `<key>` is any of the
  JIRA_KEYS. Extract ticket key (e.g. `CPD-123`).
- If `branch_ticket_format` is `key-NNN`: match branches like `<key>-NNN`
  (case-insensitive). Extract ticket key.
- Otherwise, keep the branch name as the label.
- Skip the bare main worktree.
- **Tag each worktree with its repo name** (e.g. `repo: "my-repo"`).

**4. GitHub open PRs** — for **each** repo in REPOS (two `gh` commands per repo, all in parallel):
```bash
gh pr list --repo <repo.github_repo> --author @me --state open --limit 20 \
  --json title,url,headRefName,number
```
```bash
gh pr list --repo <repo.github_repo> --author @me --state merged --limit 10 \
  --search "merged:>=DATE" --json title,url,headRefName,number
```
(substitute literal DATE from Phase 1)

**Tag each PR with its repo name.**

---

## Phase 3 — Per-worktree git status + Jira + Slack (all in parallel)

Run everything concurrently:

**For each worktree path** from Phase 2 (fast bash, not sub-agents):

```bash
git -C <path> status --porcelain 2>/dev/null | wc -l
```
→ dirty file count

```bash
git -C <path> log @{u}..HEAD --oneline 2>/dev/null | wc -l
```
→ commits ahead of remote (0 if no remote tracking branch)

```bash
git -C <path> log -1 --format="%ar" 2>/dev/null
```
→ last commit relative time

**Jira** — call `searchJiraIssuesUsingJql` with:
- cloudId: CLOUD_ID
- jql: `assignee = currentUser() AND updated >= -7d ORDER BY updated DESC`
  (this covers all JIRA_KEYS since the query is key-agnostic)
- fields: `key,summary,status,priority`
- maxResults: 30

**Slack** — call `slack_search_public_and_private` with:
- query: `from:<@SLACK_USER_ID>`
- after: UNIX_TS (from Phase 1)
- limit: 20
- include_context: true

---

## Phase 4 — Synthesize and output

**Match each Jira ticket to a repo** by scanning all repos' worktrees and PRs
for a branch or PR referencing the ticket key. If a ticket matches a worktree
in repo A and a PR in repo B, prefer the worktree match (it's where active
work happens). If no repo match is found, list the ticket as "unassigned to a repo".

**Match each worktree to data:**
- **Jira ticket**: match by ticket key extracted from branch name.
- **PR**: match by `headRefName` containing the ticket key (case-insensitive) or
  by ticket key appearing in the PR title.
- **Slack mention**: flag if any message in the Slack results references
  any ticket key (case-insensitive) in the past 24h.

**Classify each worktree:**
- **Active**: has uncommitted changes (dirty > 0) OR commits ahead of remote
  (ahead > 0) OR an open PR exists for this branch.
- **Done-ish**: Jira ticket status is Closed, Done, or Resolved — even if the
  worktree has some local state.
- **Stale**: none of the Active criteria met, AND last commit > 7 days ago.
  Also flag branches whose HEAD matches another worktree's HEAD (e.g. a
  phase0 branch tracking the same commit as its successor).

**Find orphan Jira tickets**: tickets assigned to currentUser, status not
Done/Closed/Resolved, where the ticket key doesn't match any worktree branch
across any repo. These go in "Jira tickets to pick up". If MULTI_REPO is true
and the ticket has no repo match, note it as "not yet linked to a repo".

**Sort Active worktrees by priority:**
1. PRs with review requests pending
2. Dirty worktrees (uncommitted changes)
3. Commits ahead of remote but no open PR
4. Clean, no commits ahead, but PR is open

**Non-ticket branches** (nx-migration, router-refactor, etc.): include in
Active if they have recent activity (dirty or ahead), otherwise in Stale.

**If a data source fails**: note it briefly inline (e.g. "⚠ Slack
unavailable") and continue with what's available.

---

## Output format

Write the plan to both the conversation AND a markdown file.

**File output**: Save to `OUTPUT_PATH/YYYY-MM-DD-<short-description>.md` where
`<short-description>` is a 2-4 word kebab-case summary of the main themes
(e.g. `2026-03-13-v3-migration-and-reviews.md`). Create the directory first
with `mkdir -p OUTPUT_PATH`.

Use checkbox syntax (`- [ ]`) for all actionable items so the user can mark
them done. Sub-bullets with details stay as plain list items (no checkbox).

**Multi-repo display**: When MULTI_REPO is true, prefix each item with the
repo name in bold brackets: `**[frontend]** CPD-123 — ...`. When only one
repo is configured, omit the prefix.

**Unresolved tickets**: If any Jira tickets could not be matched to a repo
(only possible in multi-repo mode), group them under a sub-heading
"Tickets not yet linked to a repo" within the appropriate urgency section.

Group items by urgency rather than by data source. The goal is to make it
immediately clear what to tackle first versus what can wait.

```markdown
# <Day of week>, <Month Day> — Daily Plan

## Do first (people are waiting)

Items where someone is blocked on you or expecting a response: pending PR
reviews from teammates, review requests on your own PRs, Slack messages
asking you for something, scheduled meetings to set up.

- [ ] **Item** — brief context

## Main focus (deep work)

The 2-4 most important implementation tasks for the day. Pick from Active
worktrees with the most recent activity or highest Jira priority.

- [ ] **CPD-NNN** — <summary> · <dirty/ahead/PR status>

## If you have time

Lower-priority tickets, orphan Jira tickets not yet started, and
non-urgent follow-ups.

- [ ] **CPD-NNN** — <summary> (<status>) — context

## Not today (but don't forget)

Blocked tickets or items that aren't actionable yet but should stay visible.

- [ ] **CPD-NNN** — <reason it's parked>

## Cleanup (end of day)

Stale worktrees to close, branches to delete, Done-ish tickets to tidy up.
Good for low-energy time.

- [ ] Close worktree **branch-name** — <reason: ticket closed / no activity / superseded>
```

Rules:
- Use the friendly date format in the header (e.g. "Friday, March 13").
- Omit any section that would be empty.
- Do not show Done-ish worktrees in "Main focus" — move them to "Cleanup".
- Keep descriptions concise; one line per item plus sub-bullets for detail.
- Distribute Slack follow-ups into the appropriate urgency section rather than
  grouping them separately (e.g. a review request goes in "Do first", a casual
  discussion thread goes in "If you have time").
- After writing the file, tell the user where it was saved.
