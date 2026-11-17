# Catalog: fixed texts

Each entry: id, when it is shown, the exact text, source lines. Text inside `<...>` is a slot.

The old skills are replaced by goals, so a command or file path from the old text is a slot. Fill each slot with the new value; the old text stays in the table only so a diff against the source reads.

| Slot | Old text | New value |
| --- | --- | --- |
| `<plan command>` | `/plan-my-day` | the invocation of goal `daily-plan` |
| `<standup command>` | `/plan-my-day standup` | the invocation of goal `standup-snapshot` |
| `<close command>` | `/plan-my-day close` | the invocation of goal `day-closed` |
| `<setup command>` | `/plan-my-day-setup` | the invocation of goal `daily-plan-configured` |
| `<config example path>` | `~/.claude/skills/plan-my-day/config.example.yaml` | absolute path of `plan-my-day-config/artifact.yaml` |

### plan.no-config

Shown when: daily-plan starts and `~/.claude/plan-my-day.yaml` does not exist. Source: skills/workflow/plan-my-day/SKILL.md:105-110

````text
No `~/.claude/plan-my-day.yaml` found. Run `<setup command>` to configure,
or copy the example config and edit it manually:

```
cp <config example path> ~/.claude/plan-my-day.yaml
```
````

### plan.gap

Shown when: the last plan is more than three days old. Source: skills/workflow/plan-my-day/SKILL.md:232-233

````text
Last plan was `<LAST_PLAN_DATE>` (`<DAYS_SINCE>` days ago). Look back
that far, or use a shorter window (e.g. 24h, or a date you choose)?
````

### plan.warn-slack

Shown when: Slack data could not be read. Source: skills/workflow/plan-my-day/SKILL.md:697-698

````text
⚠ Slack unavailable
````

### plan.warn-github

Shown when: the GitHub GraphQL call failed entirely. Source: skills/workflow/plan-my-day/SKILL.md:700-703

````text
⚠ GitHub unavailable
````

### plan.warn-git

Shown when: every worktree shows DIRTY=0, AHEAD=0 and LAST=unknown. Source: skills/workflow/plan-my-day/SKILL.md:708-709

````text
⚠ Git status collection failed — worktree data may be incomplete
````

### plan.warn-tracker

Shown when: the tracker query returned 0 results. Source: skills/workflow/plan-my-day/SKILL.md:710-711

````text
⚠ Tracker (<TRACKER_TYPE>) returned no results — check connectivity or query
````

### plan.warn-slack-empty

Shown when: both Slack queries returned 0 results. Source: skills/workflow/plan-my-day/SKILL.md:712-713

````text
⚠ Slack returned no results — check token or date range
````

### standup.no-issue

Shown when: standup-snapshot finds no open issue for today. Source: skills/workflow/plan-my-day/references/standup.md:43-44

````text
  > No open day-plan issue for `<TODAY>` in `<DAY_PLAN_REPO>`. Run
  > `<plan command>` first.
````

### standup.multiple

Shown when: standup-snapshot finds more than one open issue for today. Source: skills/workflow/plan-my-day/references/standup.md:52-54

````text
  > Multiple open day-plan issues for `<TODAY>` in `<DAY_PLAN_REPO>`:
  > `#<N1>`, `#<N2>`. Close or retitle the stale ones, then re-run
  > `<standup command>`.
````

### standup.echo

Shown when: above the echoed Standup block. Source: skills/workflow/plan-my-day/references/standup.md:160-161

````text
Standup updated on `<DAY_PLAN_REPO>#<ISSUE_NUMBER>`. Copy below to
post.
````

### close.no-issue

Shown when: day-closed finds no issue for today. Source: skills/workflow/plan-my-day/references/close-day.md:48-50

````text
  > No day-plan issue for `<TODAY>` in `<DAY_PLAN_REPO>`. Run
  > `<plan command>` first to create one, or pass a date if you want to
  > close a different day.
````

### close.multiple

Shown when: day-closed finds more than one open issue for today. Source: skills/workflow/plan-my-day/references/close-day.md:68-70

````text
  > Multiple open day-plan issues for `<TODAY>` in `<DAY_PLAN_REPO>`:
  > `#<N1>`, `#<N2>`. Close or retitle the stale ones, then re-run
  > `<close command>`.
````

### close.already

Shown when: the selected issue is already closed. Source: skills/workflow/plan-my-day/references/close-day.md:75-76

````text
`<DAY_PLAN_REPO>#<ISSUE_NUMBER>` for `<TODAY>` is already closed.
Nothing to do.
````

### close.prompt

Shown when: unchecked items remain after ticking. Source: skills/workflow/plan-my-day/references/close-day.md:162-168

````text
Unchecked items remaining:

1. ...
2. ...

Which were abandoned today? Reply with the numbers (e.g. `1,3`),
`none`, or `all`.
````

### close.summary

Shown when: after the issue is closed. Source: skills/workflow/plan-my-day/references/close-day.md:204-205

````text
Closed `<DAY_PLAN_REPO>#<ISSUE_NUMBER>`. Refreshed Standup, ticked
`<N>` shipped items, moved `<M>` to "Not done".
````

### monthly.multiple

Shown when: more than one open retro has the target title. Source: skills/workflow/plan-my-day/references/monthly-review.md:72-74

````text
  > WARNING: multiple open `<MONTHLY_TITLE>` issues in `<DAY_PLAN_REPO>`:
  > `#<N1>`, `#<N2>`. Skipping the posture hint — close or retitle the
  > duplicates.
````

### monthly.created

Shown when: a retro was just created (never for an existing one). Source: skills/workflow/plan-my-day/references/monthly-review.md:159-160

````text
Drafted retro for <PREVIOUS_LABEL>: <url> — review and edit if needed.
````

### monthly.dropped

Shown when: a retro bullet matched the injection scan and was dropped. Source: skills/workflow/plan-my-day/references/monthly-review.md:211-211

````text
WARNING: dropped bullet from monthly_review#<MONTHLY_REVIEW_NUMBER> — matched injection pattern <pattern>.
````

### setup.existing

Shown when: an existing plan-my-day config is found. Source: skills/workflow/plan-my-day-setup/SKILL.md:56-58

````text
You already have a config. Would you like to edit it, replace it, or cancel?
````

### setup.new

Shown when: no plan-my-day config exists. Source: skills/workflow/plan-my-day-setup/SKILL.md:60-60

````text
Let's set up your daily plan config.
````

### setup.repos

Shown when: asking which repos to scan. Source: skills/workflow/plan-my-day-setup/SKILL.md:67-67

````text
What repos do you work in? Give me their local paths.
````

### setup.tracker-keep

Shown when: a shared tracker config exists. Source: skills/workflow/plan-my-day-setup/SKILL.md:126-127

````text
Your shared tracker config is `<TRACKER_TYPE>`. Keep it as-is, or rewrite?
````

### setup.tracker-pick

Shown when: no tracker config, or the user chose to rewrite. Source: skills/workflow/plan-my-day-setup/SKILL.md:131-131

````text
Which issue tracker do you use? (jira / linear / github / clickup)
````

### setup.jira

Shown when: jira chosen: questions in this order. Source: skills/workflow/plan-my-day-setup/SKILL.md:136-138

````text
  - "What's your Atlassian cloud ID?" (hint: from `https://<org>.atlassian.net/_edge/tenant_info`)
  - "What project key(s) do you use?" (e.g. `PROJ`, `ENG`)
  - "What's your Jira browse base URL?" (e.g. `https://<org>.atlassian.net/browse`)
````

### setup.linear

Shown when: linear chosen: questions in this order. Source: skills/workflow/plan-my-day-setup/SKILL.md:141-142

````text
  - "What's your Linear workspace slug?" (the `<ws>` in `linear.app/<ws>`)
  - "What team key(s) do you use?" (e.g. `ENG`)
````

### setup.clickup

Shown when: clickup chosen: questions in this order. Source: skills/workflow/plan-my-day-setup/SKILL.md:147-148

````text
  - "What's your ClickUp team (workspace) id?"
  - "Which list ids should I scan for assigned tasks?"
````

### setup.output-file

Shown when: asking the plan file location. Source: skills/workflow/plan-my-day-setup/SKILL.md:167-167

````text
Where should I save the daily plan file?
````

### setup.output-issue

Shown when: asking about issue output. Source: skills/workflow/plan-my-day-setup/SKILL.md:168-168

````text
Want to publish the daily plan as a GitHub issue instead of a local file? If so, which repo (owner/repo)?
````

### setup.prefix

Shown when: a branch prefix was detected. Source: skills/workflow/plan-my-day-setup/SKILL.md:174-174

````text
Your branches seem to use the prefix 'jsmith'. Is that right?
````

### setup.gh-auth

Shown when: `gh auth status` shows no authentication. Source: skills/workflow/plan-my-day-setup/SKILL.md:189-190

````text
"GitHub CLI isn't authenticated. Run `gh auth login` before using
`<plan command>`. PR lookups won't work without it."
````

### setup.overwrite

Shown when: before overwriting an existing tracker config. Source: skills/workflow/plan-my-day-setup/SKILL.md:223-223

````text
Overwrite `~/.claude/tracker.yaml`?
````

### setup.done

Shown when: after the generated configs are shown. Source: skills/workflow/plan-my-day-setup/SKILL.md:232-233

````text
"Config saved to `~/.claude/plan-my-day.yaml`. You can now
run `<plan command>` to generate your daily plan."
````
