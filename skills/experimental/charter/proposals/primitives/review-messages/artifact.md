# Artifact: review-messages

A catalog. Each entry is shown exactly when its row says, and reads exactly as written, outside `<slots>`. Entries copied from line-wrapped source text are joined on one line; the wrap is not part of the message. Rows whose Source says "charter" have no source text; they were written for the charter and await the user's confirmation.

## Command and file slots

The old skills' messages name their own commands and example files. Those are slots, filled from this table: the charter value when that charter goal is linked into `~/.claude/skills`, else the old value.

| Slot | Old value | Charter value |
| --- | --- | --- |
| `<apply command>` | `/execute-review-decisions` | `/review-decisions-applied` |
| `<from-doc command>` | `/resolve-pr-comments --from-doc` | `/review-comments-resolved --from-doc` |
| `<request-review example>` | `` `~/.claude/skills/request-review/config.example.yaml` `` | the "Config file shape" block of tool note `request-review.md`, named by its absolute path |

## review-pr (`skills/review/review-pr/SKILL.md`, `skills/review/review-pr/references/agents.md`)

| Shown when | Text | Source |
| --- | --- | --- |
| pipeline mode and neither review config file exists | `review-pr not configured for pipeline use — create .claude/review.yaml to enable` | SKILL.md:103-106 |
| `--re-review` and the prior-findings set is empty | `re-review: no prior review history found — running as a normal review` | SKILL.md:197-200 |
| file written (pipeline mode) | `wrote <count> findings to <path>` | SKILL.md:391 |
| the written file fails validation a second time | `review-pr: refusing to emit an auto-review file the review plugin cannot load` | SKILL.md:416-424 |
| auto standalone mode finished | `posted <count> comments, suppressed <skim_count> via overlap-skim, wrote findings to <path>` | SKILL.md:439-440 |
| re-review report written | `wrote resolution report (<a> addressed, <p> partial, <n> not-addressed, <c> cant-tell) to <path>` | SKILL.md:494-495 |
| a configured agent entry cannot be resolved | `agent "<entry>" not found — skipping` | agents.md:50-51 |
| `agents` omitted and the specialist plugin is not installed | `pr-review-toolkit not installed — running single-pass review. Install for parallel specialised review.` | agents.md:62-65 |
| the PR's diff is empty; the run stops before any child is briefed | `PR #<N> has an empty diff — nothing to review.` | charter (SKILL.md:140-141 asks only for "a clear message") |
| deep mode, before the walk, when overlap-skim suppressed at least one finding | the skimmed block below | charter (SKILL.md:446 names a "skimmed" summary the user can override) |
| deep mode, after the review is posted | `posted <p> comments (<e> edited), dropped <d>, suppressed <s> via overlap-skim` | charter (SKILL.md:459 asks for posted / edited / dropped counts) |

Deep-mode per-finding options, shown with `(file, line)`, severity, description and recommendation (SKILL.md:447-452):

```text
- `(p)` post as-is
- `(e)` edit the comment text, then post
- `(d)` drop
```

Skimmed block, one numbered line per suppressed finding (the line repeats the overlap-skim log line of `review-aggregation`):

```text
Skimmed <count> findings already raised on the PR:
  <i>. <severity> on <file>:<line> (@<login> already flagged)
Name a number to walk it anyway.
```

## investigate-pr-comments (`skills/review/investigate-pr-comments/SKILL.md`)

| Shown when | Text | Source |
| --- | --- | --- |
| the decisions file fails validation a second time (printed after the violation list) | `investigate-pr-comments: refusing to emit a handover doc the review plugin cannot load` | SKILL.md:351-355 |
| the run ends (always) | the summary block below | SKILL.md:359-372 |
| the run ends and the total is 0 (appended to the summary block) | the trailing line below | SKILL.md:374-379 |

Summary block:

```text
Handover document written to <path>
  Auto-review: <N> items (<N> critical, <N> important, <N> suggestion/nit)
  Human comments: <N> items
  Total: <N> items

Next steps:
  Edit and run: <apply command> <path>
  For [d] items: <from-doc command> <path>
```

Trailing line when the total is 0:

```text
  (No findings or comments to triage — the doc records a clean review.)
```

## execute-review-decisions (`skills/review/execute-review-decisions/SKILL.md`)

| Shown when | Text | Source |
| --- | --- | --- |
| no item is marked `[x]` or `[~]` | `Mark items `[x]` or `[~]` in `<file>` and re-run.` | SKILL.md:102-104 |
| the items are bucketed and at least one is `[x]` or `[~]` | `execute: <e>, pending: <p>, discuss: <d>, skip: <s>` | charter (SKILL.md:106-107 says only "print the four counts") |
| before the first GitHub write: the proposed reply table, then the question | the table below, then `Post all replies and resolve threads?` | SKILL.md:169-184 |
| the run ends | the report below | SKILL.md:346-367 |
| the PR is a draft and post-flight passed | `All auto-findings resolved. Mark PR `<N>` ready for review? [y/N]` | SKILL.md:382-384 |
| answer `N` or no answer | `Leaving PR `<N>` as draft. Run `gh pr ready <N>` when ready.` | SKILL.md:388 |

Proposed reply table:

```
| #  | File:Line         | Severity   | Source            | Reply preview                           |
|----|-------------------|------------|-------------------|------------------------------------------|
| 1  | router.ts:42      | 🚨 Critical | reviewer: @alice  | Added null check; covered by new test.   |
| 2  | api-client.ts:88  | ⚠️ Important| auto-review       | Narrowed return type to union of states. |
| 3  | types.ts:15       | 💡 Suggestion| reviewer: @bob   | Renamed for clarity.                     |
```

Report:

```
Executed: <N> items
  Files changed: <list, one per line if short>
  Tests added: <count> (or "none" if no bug fixes)
  Commits: <list of commit subjects>

Posted to PR #<N>:
  Replies: <count>
  Threads resolved: <count>
  Auto-review summary comment: 1 (or "skipped — no auto-review items")
  Overlap-skim suppressed: <count>

Skipped: <len(skip)> items marked [-]
Discuss later: <len(discuss)> items marked [d] — run <from-doc command> <file>
Still pending: <len(pending)> items marked [?] — edit <file> and re-run

Ambiguous resolutions (please review): <list, or "none">
```

## resolve-pr-comments (`skills/review/resolve-pr-comments/SKILL.md`)

| Shown when | Text | Source |
| --- | --- | --- |
| `--from-doc`: every `[d]` item is processed | `Decisions written back to `<file>`. Run `<apply command> <file>` when ready.` | SKILL.md:20-22 |
| after the thread fetch | `Total: 55, Unresolved: 9` (shape: total and unresolved counts) | SKILL.md:117 |
| after each decision | `Progress: 5/12 — 3 fix, 1 defer, 1 reply` (shape: done/total and a count per action) | SKILL.md:181 |
| every comment is decided: the decision table, then the question `Ready to implement?` | the table below | SKILL.md:189-209 |

Decision table:

```
| #  | File              | Action | Detail                              |
|----|-------------------|--------|-------------------------------------|
| 1  | router.ts:42      | Fix    | Add null check before access        |
| 2  | api-client.ts:88  | Reply  | Retry logic is intentional          |
| 3  | types.ts:15       | Fix    | Narrow type from string to union    |
| 4  | schema.ts:7       | Defer  | Needs broader refactor              |
| ...| ...               | ...    | ...                                 |
```

## request-review (`skills/review/request-review/SKILL.md`)

| Shown when | Text | Source |
| --- | --- | --- |
| no `~/.claude/request-review.yaml` | `No config found. Copy <request-review example> to `~/.claude/request-review.yaml` and fill in your values.` | SKILL.md:28-30 |
| no tracker config exists | `No tracker configured — skipping status transition.` | SKILL.md:42 |
| the run ends | the two lines below | SKILL.md:113-116 |

Final report lines:

```text
- Slack message sent to the configured channel
- Ticket `<TICKET_KEY>` transitioned to "In Review" (or skipped, with reason)
```
