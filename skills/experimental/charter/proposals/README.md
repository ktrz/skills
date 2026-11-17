# Proposed charter skills

This folder holds _proposed_ goals and rules for the charter system. They are not adopted. Nothing in `charter/goals` binds them, and no goal's "Bound by" list names them yet. Every proposed skill sets `disable-model-invocation`, so none can load by accident.

To adopt one, `git mv` its folder into `charter/rules` or `charter/goals`, add a `CHANGELOG` entry, and add it to the "Bound by" list of any goal that should enforce it. Move a goal together with every proposal rule it binds, restore the adopted path sentence (including the flat-install fallback `../<name>/SKILL.md`), and add rows to the charter README tables. Adopting `house-tools-only` requires amending the charter contract line "No references, scripts, or shared files". Until then it is reading material.

## How these were mined

The source was several months of the user's Claude Code history (thousands of prompts across hundreds of sessions). Subagent transcripts and pastes over 2,000 characters were skipped.

Eight parallel shard miners each read a slice of the history and reported recurring corrections, repeated instructions and stated frustrations. A judged merge then deduplicated across shards, checked names against the existing rules, goals and installed skills, and kept a candidate only if it fit the charter litmus tests (a rule is one checkable restriction, a goal is one checkable outcome). Frequencies below are approximate distinct sessions, summed across shards.

Privacy: only generic patterns were kept. No project names, people, ticket ids or quotes appear in the proposals. Evidence was paraphrased.

## Proposed rules

| Rule                     | What it requires                                                                                    | ~Sessions                       |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------- |
| `outward-on-go`          | Nothing visible to others happens without the user's go for that exact action and destination.      | 60                              |
| `answer-not-act`         | A question, "discuss" or "explain" message changes nothing until an action is asked for.            | 40                              |
| `decisions-stand-alone`  | Every decision handed to the user defines its terms, lists lettered options, and marks one pick.    | 40                              |
| `defer-means-ticket`     | Deferred or out-of-scope work ends as a linked tracker item, never a chat mention only.             | 31                              |
| `stack-commands-only`    | A stacked branch is rebased, pushed and submitted only through the stack tool.                      | 29                              |
| `read-before-claim`      | No claim about code, environment, PR or ticket state without reading or running the source.         | 29                              |
| `one-worktree-per-stack` | A stack lives in exactly one worktree; no branch of it is checked out twice.                        | 23                              |
| `diff-stays-in-scope`    | Every changed file and line traces to the request; no drive-by changes or generated files.          | 20                              |
| `pr-body-matches-head`   | A PR description describes the diff at its head and its current place in the stack.                 | 18                              |
| `named-means-used`       | When the user names a tool, source, location or format, exactly that is used.                       | 16                              |
| `named-targets-only`     | Nothing this session did not create is deleted, reset or modified unless the user named the target. | 12                              |
| `fix-where-written`      | A fix to lines from a lower stack branch is committed on that branch, not above it.                 | 12                              |
| `new-commits-only`       | A pushed commit is never amended, squashed or dropped; changes arrive as new commits.               | 12                              |
| `spend-on-agreement`     | No run that spends real money starts before the user agreed its call count and cost.                | 6 (lowest confidence)           |
| `house-tools-only`       | Where the toolchain map names a tool for a job, that tool is used, not a raw substitute.            | from user request, not mined    |

## Proposed goals

| Goal                   | Outcome                                                                                       | ~Sessions |
| ---------------------- | --------------------------------------------------------------------------------------------- | --------- |
| `resume-ready-handoff` | A blank session can continue the work from one file and one prompt, asking nothing.           | 49        |
| `stack-to-approved`    | Every PR in a stack is ready, green and approved, or listed with the exact reason it is not.  | 30        |
| `explain-change`       | A reader who did not build it understands a PR, design or plan from one page.                 | 17        |
| `review-others-pr`     | Someone else's PR has a comment-only review whose every finding was verified against code.    | 16        |
| `manual-test-script`   | The user can verify or demo a change by following a file, without thinking.                   | 11        |

## Tool adherence

`house-tools-only` came from a direct user request, not from the history. The history shows the symptom (raw `git worktree add` instead of the worktree helper, plain git instead of the stack tool, a different tracker path), but each tool was a separate complaint with separate wording.

Instead of one rule per tool, the rule reads a toolchain map: a table of capability, tool, skill to read first, and notes. When a job in the table comes up, the agent uses the named tool and reads the named skill first. When no map exists, the rule is inert.

The map lives in one of two places. The user-level file is `~/.claude/charter/toolchain.md`. A repo can override it with `.claude/charter-toolchain.md`. See `toolchain.example.md` for a filled-in template.

Per-tool notes live in `proposals/tools/<tool>.md` and are referenced from the map (see `tools/hc.md`).

One generic rule beats one per tool for three reasons. A new tool is one table row, not a new skill with its own changelog. The restriction logic is written and checked once. And the per-tool facts (which command, which caveat) live in a file the user edits, not in skill text that has to be released.

Rules bound by no goal, adopted or proposed, are meant for these goals: `decisions-stand-alone` for goals that hand decisions to the user (`resume-ready-handoff`, `explain-change`); `diff-stays-in-scope` for `stack-to-approved` and adopted delivery goals; `named-targets-only` for `stack-to-approved`; `spend-on-agreement` for goals that run metered work.

`stack-commands-only` and `named-means-used` overlap with it for the stack tool and for user-named tools. They stay because they carry their own checks and are cited by goals.

## Sharpen existing

Changes to existing skills that the mining supports. None applied here.

- `address-review`: add done-conditions. Post-flight fetch after the last push shows zero unresolved, including the re-review round the push triggered. Replies follow their pushed fix. Deferred findings carry a ticket. One summary comment. An unrelated comment gets a reply, not a fix.
- `green-before-done`: the final run is uncached, every PR head in a stack is green, and no check is suppressed to get green.
- `isolated-worktree`: state the stack exception, base on the freshly pulled default branch, never nest worktrees, give each worktree its own env, database and ports.
- `commit-format`: "project format" covers sign-off trailers where required (a GPG signature is not a sign-off), no attribution lines, no ticket ids unless given.
- `record-dont-guess`: add the unattended case. Reversible choices are made and listed as a numbered block; only outward or irreversible ones stop the work. This removes the need for an AFK goal.
- `stack-dependent-work`: register the stack before the first PR.
- `verify-reviewer-claims`: a suggestion that contradicts a recorded user decision gets a reply citing it.
- `no-secrets`: also covers terminal output and commands that land a secret in shell history.
- `test-first`: for review fixes, no failing test means the fix is skipped and reported.
- `brief-carries-rules`: the brief names foreign dirty files. Open conflict to settle: whether children may delegate or only run foreground grandchildren.
- `deliver-feature`: consider a done-condition that follow-ups are ticketed.

## Open conflicts

- `protected-main` stops before force-pushing any branch not created in the task, but `stack-to-approved` restacks inherited stack branches after `fix-where-written`. On adoption, amend `protected-main` with: `...except a stack tool's restack of branches in a stack the user named.`

## Better as CLAUDE.md or memory, not rules

These recurred but are preferences or method, with no checkable evidence line.

- Explain from zero in plain words (~53). Already in global CLAUDE.md. Add: it also covers the agent's own coined terms.
- Prose style for published text: no em or en dashes, no invented details (~15).
- Question batching size (~9). The signals conflict, so settle once in CLAUDE.md.
- Short, glanceable team messages with one ask (~4).
- Exact commands and expected results when asked how to run or test (~6).
- Descriptive names, no shorthand codes, no ticket ids in code comments (~6).
- Long output goes to a file; English-only code and comments (~5).
- Judge "why not just X" on merits, without conceding or re-pitching (~3).
- Stop at explicit pause points (~5), changelog and version policy (~11), phases as commits (~4), and child sessions needing the user's shell environment (~3): all already memory or project-level notes.

## Coverage

`COVERAGE.md` maps the existing and proposed skills against the workflow skills installed in this repo. Its "Gaps worth a goal next" section lists six goals no proposal covers yet: `plan-ticket`, `daily-plan`, `request-review-posted`, `compact-or-handoff`, `review-decisions-applied` and `phase-executed`. Start there when choosing what to write next.
