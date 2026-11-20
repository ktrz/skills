# Proposed charter skills

This folder holds _proposed_ primitives, goals and rules for the charter system, plus draft tool notes. They are not adopted. Adopted goals in `charter/goals` bind only adopted rules and primitives (in `charter/rules` and `charter/primitives`). A proposal goal may bind both kinds: it reads each rule and primitive from `proposals/` first, then from the adopted folder. Every proposed skill sets `disable-model-invocation`, so none can load by accident.

To adopt a proposal goal, `git mv` its folder into `charter/goals` together with every proposal rule it binds, every primitive in its "Conforms to", and every primitive a moved rule names, repeated until nothing it needs is left here. Drop the `proposals/` fallback from its path sentences once nothing it binds lives here, add rows to the charter README tables, and add a `CHANGELOG` entry. To adopt a rule or primitive on its own, move it the same way and add it to the "Bound by" list or "Conforms to" of the goals that should enforce it. The contract that admits primitives and tool notes is in the charter README.

## How these were mined

The source was several months of the user's Claude Code history (thousands of prompts across hundreds of sessions). Subagent transcripts and pastes over 2,000 characters were skipped.

Eight parallel shard miners each read a slice of the history and reported recurring corrections, repeated instructions and stated frustrations. A judged merge then deduplicated across shards, checked names against the existing rules, goals and installed skills, and kept a candidate only if it fit the charter litmus tests (a rule is one checkable restriction, a goal is one checkable outcome). Frequencies below are approximate distinct sessions, summed across shards.

Privacy: only generic patterns were kept. No project names, people, ticket ids or quotes appear in the proposals. Evidence was paraphrased.

## Proposed rules

`outward-on-go` (~60 sessions) was mined here and is now adopted.

| Rule                     | What it requires                                                                                    | ~Sessions                    |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------- |
| `answer-not-act`         | A question, "discuss" or "explain" message changes nothing until an action is asked for.            | 40                           |
| `decisions-stand-alone`  | Every decision handed to the user defines its terms, lists lettered options, and marks one pick.    | 40                           |
| `defer-means-ticket`     | Deferred or out-of-scope work ends as a linked tracker item, never a chat mention only.             | 31                           |
| `stack-commands-only`    | A stacked branch is rebased, pushed and submitted only through the stack tool.                      | 29                           |
| `read-before-claim`      | No claim about code, environment, PR or ticket state without reading or running the source.         | 29                           |
| `one-worktree-per-stack` | A stack lives in exactly one worktree; no branch of it is checked out twice.                        | 23                           |
| `diff-stays-in-scope`    | Every changed file and line traces to the request; no drive-by changes or generated files.          | 20                           |
| `pr-body-matches-head`   | A PR description describes the diff at its head and its current place in the stack.                 | 18                           |
| `named-means-used`       | When the user names a tool, source, location or format, exactly that is used.                       | 16                           |
| `named-targets-only`     | Nothing this session did not create is deleted, reset or modified unless the user named the target. | 12                           |
| `fix-where-written`      | A fix to lines from a lower stack branch is committed on that branch, not above it.                 | 12                           |
| `new-commits-only`       | A pushed commit is never amended, squashed or dropped; changes arrive as new commits.               | 12                           |
| `spend-on-agreement`     | No run that spends real money starts before the user agreed its call count and cost.                | 6 (lowest confidence)        |
| `house-tools-only`       | Where the toolchain map names a tool for a job, that tool is used, not a raw substitute.            | from user request, not mined |

## Proposed goals

| Goal                   | Outcome                                                                                      | ~Sessions |
| ---------------------- | -------------------------------------------------------------------------------------------- | --------- |
| `resume-ready-handoff` | A blank session can continue the work from one file and one prompt, asking nothing.          | 49        |
| `stack-to-approved`    | Every PR in a stack is ready, green and approved, or listed with the exact reason it is not. | 30        |
| `explain-change`       | A reader who did not build it understands a PR, design or plan from one page.                | 17        |
| `review-others-pr`     | Someone else's PR has a comment-only review whose every finding was verified against code.   | 16        |
| `manual-test-script`   | The user can verify or demo a change by following a file, without thinking.                  | 11        |

## Proposed primitives

From coverage of the old skills, not mined. Exact artifacts, copied from the old skills with a `Source:` line each; text marked "(charter)" inside a primitive has no source and awaits the user's confirmation. Adopted primitives (`pr-body`, `commit-message`, `ticket-reference`, `tracker-config`, `review-reply`, `external-data-fence`, `delivery-messages`) are listed in the charter README.

| Primitive                     | Artifact                                                                   |
| ----------------------------- | -------------------------------------------------------------------------- |
| `phase-progress`              | The per-phase progress file                                                |
| `phase-brief`                 | The brief handed to a phase-executing child                                |
| `plan-file`                   | The phased plan file format (`format.md`)                                  |
| `exploration-brief`           | The codebase-exploration child brief and its five-section return           |
| `saved-plan`                  | Saved plan, session and notes file formats and naming                      |
| `plan-messages`               | Fixed messages of planning and plan saving                                 |
| `checkpoint-prompts`          | The compact and handoff prompts                                            |
| `review-handover`             | The review decisions document (`format.md`) with its validator             |
| `review-finding`              | The review finding schema                                                  |
| `review-agent-brief`          | Briefs for the review specialist children                                  |
| `review-aggregation`          | The finding aggregation procedure                                          |
| `comment-relevance`           | Relevance rules for existing PR comments                                   |
| `rereview-briefs`             | Briefs for the re-review children                                          |
| `rereview-report`             | The re-review report                                                       |
| `investigation-brief`         | The brief for a comment-investigation child                                |
| `prior-handled`               | The prior-handled note and its matching rule                               |
| `review-comment`              | The posted review comment, the PR-level finding and the deep-mode review (charter) |
| `auto-review-summary-comment` | The grouped GitHub comment for auto-review items                           |
| `review-messages`             | Fixed messages, tables and prompts of the review flows                     |
| `review-request-message`      | The Slack review-request message                                           |
| `walkthrough-json`            | The walkthrough schema, derivation rules and validator                     |
| `walkthrough-research-brief`  | The research child brief for walkthroughs                                  |
| `walkthrough-edge-brief`      | The edge-verification child brief                                          |
| `day-plan-issue`              | The day-plan issue body                                                    |
| `day-plan-file`               | The day-plan file                                                          |
| `standup-block`               | The Standup section                                                        |
| `monthly-review-issue`        | The monthly review issue                                                   |
| `review-ask-triage`           | The review-ask triage table                                                |
| `plan-my-day-config`          | The daily-plan config file                                                 |
| `daily-plan-messages`         | Fixed messages of the daily-plan flows                                     |

## Proposed goals from coverage

From coverage of old skills, not mined.

| Goal                       | Outcome                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `plan-ticket`              | A tracker ticket is an approved, phased plan file that phase agents can execute without the chat.           |
| `plan-saved`               | The conversation's plan, session or notes is one file in the plans tree, resumable without the chat.        |
| `phase-executed`           | One plan phase is built and green in its own worktree, with progress written back beside the plan.         |
| `plan-delivered`           | Every phase of a plan is a draft PR with its review findings ready for triage.                              |
| `pr-opened`                | The current branch has a PR titled per `pr-body`, with the repo's own template as body, else `pr-body`.     |
| `pr-reviewed`              | A PR has severity-ranked findings in the handover format, written to a file, posted, or triaged.            |
| `findings-investigated`    | Every auto-review finding and relevant reviewer comment is one item in a validated decisions file.          |
| `review-decisions-applied` | Every approved item in a decisions file is implemented, pushed and answered in one confirmed batch.         |
| `review-comments-resolved` | Every unresolved review comment has a user decision, and the decided fixes and replies are on the PR.       |
| `pr-walkthrough`           | A PR has a validated walkthrough whose every claim cites code, rendered by the renderer.                    |
| `request-review-posted`    | A PR has one review request in the configured channel and its ticket shows In Review.                       |
| `daily-plan`               | Today's prioritised work list exists as the day-plan issue or file.                                         |
| `standup-snapshot`         | Today's day-plan issue carries a current Standup section the user can copy.                                 |
| `day-closed`               | Today's day-plan issue is closed with shipped items ticked and abandoned ones recorded.                     |
| `daily-plan-configured`    | The daily-plan config exists, confirmed by the user, and the tracker config is seeded or deliberately left. |
| `compact-or-handoff`       | At a checkpoint the user holds one recommendation and a paste-ready prompt for each path.                   |
| `orchestrate`              | The task is done with this session only decomposing, briefing, judging and synthesizing.                    |

## Proposed rules from coverage

From coverage of old skills, not mined. `exact-artifacts`, `fence-external-text` and `ticket-traceable` came from here and are now adopted.

| Rule                       | What it requires                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `quote-untrusted-in-shell` | PR-author-controlled strings reach a shell only single-quoted, paths with `:(literal)`. |
| `plans-stay-local`         | Plan, progress, review and session files live only under the plans location.           |
| `delegate-by-tier`         | Each child runs on the model and effort the delegation table assigns.                   |
| `parent-only-judges`       | While orchestrating, the parent only decomposes, briefs, judges and synthesizes.        |
| `foreground-below-root`    | Only the root session dispatches in the background.                                     |

## Tool adherence

`house-tools-only` came from a direct user request, not from the history. The history shows the symptom (raw `git worktree add` instead of the worktree helper, plain git instead of the stack tool, a different tracker path), but each tool was a separate complaint with separate wording.

Instead of one rule per tool, the rule reads a toolchain map: a table of capability, tool, note or skill to read first, and notes. When a job in the table comes up, the agent uses the named tool and reads the named note or skill first. When no map exists and a goal needs a tool note, the goal stops and names the missing file.

The map lives in one of two places. The user-level file is `~/.claude/charter/toolchain.md`. A repo can override it with `.claude/charter-toolchain.md`. See `toolchain.example.md` for a filled-in template. Paths in the toolchain map resolve relative to the map file; install tool notes at `~/.claude/charter/tools/` beside `~/.claude/charter/toolchain.md`.

Install: copy `toolchain.example.md` to `~/.claude/charter/toolchain.md`, and copy `proposals/tools/` (the notes and the scripts under `tools/<tool>/`) to `~/.claude/charter/tools/`. Draft notes live in `proposals/tools/<tool>.md` until installed.

One generic rule beats one per tool for three reasons. A new tool is one table row, not a new skill with its own changelog. The restriction logic is written and checked once. And the per-tool facts (which command, which caveat) live in a file the user edits, not in skill text that has to be released.

Rules bound by no goal, adopted or proposed: `diff-stays-in-scope` (meant for `stack-to-approved` and the adopted delivery goals) and `spend-on-agreement` (for goals that run metered work). `decisions-stand-alone` is bound only by `findings-investigated`; it was also meant for `resume-ready-handoff` and `explain-change`.

`stack-commands-only` and `named-means-used` overlap with `house-tools-only` for the stack tool and for user-named tools. They stay because they carry their own checks and are cited by goals.

## Sharpen existing

Changes to adopted skills that the mining supports. Applied in 0.2.0: `address-review` (zero unresolved on a fresh fetch after the last push, replies after their pushed fix, deferred findings link a ticket) and `record-dont-guess` (the unattended case). Still proposed:

- `address-review`: one summary comment; an unrelated comment gets a reply, not a fix.
- `green-before-done`: the final run is uncached, every PR head in a stack is green, and no check is suppressed to get green.
- `isolated-worktree`: state the stack exception, base on the freshly pulled default branch, never nest worktrees, give each worktree its own env, database and ports.
- `commit-format`: "project format" covers sign-off trailers where required (a GPG signature is not a sign-off) and no attribution lines. Ticket ids follow `ticket-traceable`: present where a tracker is configured, unless the project's own format says otherwise.
- `stack-dependent-work`: register the stack before the first PR.
- `verify-reviewer-claims`: a suggestion that contradicts a recorded user decision gets a reply citing it.
- `no-secrets`: also covers terminal output and commands that land a secret in shell history.
- `test-first`: for review fixes, no failing test means the fix is skipped and reported.
- `brief-carries-rules`: the brief names foreign dirty files. Whether children may delegate or only run foreground grandchildren is settled by proposal rule `foreground-below-root` once adopted.
- `deliver-feature`: consider a done-condition that follow-ups are ticketed.

## Open conflicts

- `protected-main` stops before force-pushing any branch not created in the task, but `stack-to-approved` restacks inherited stack branches after `fix-where-written`. On adoption, amend `protected-main` with: `...except a stack tool's restack of branches in a stack the user named.`
- `one-worktree-per-stack` forbids a worktree per phase, but `phase-executed` builds each phase in its own worktree and stacks dependent phases on the parent phase branch, so a stack from `plan-delivered` fails `stack-to-approved`. Proposed exemption for the rule: `Exempt: phase worktrees created by plan-delivered or phase-executed, each holding only its own phase branch, removed once the phase's PR is open.`

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

## Old path → charter item

Old skills cite their own files and commands. Charter items do not; a copied text that named one now carries a slot, filled from this table (or from the slot table in the primitive itself).

| Old path or command                                                                      | Charter item                                                                     |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `_shared/references/prompt-injection-defense.md`, `references/prompt-injection-defense.md` | primitive `external-data-fence` (`artifact.md`; `#detect-flag` is section C)   |
| `_shared/references/tracker.md`, `references/tracker.md` (id regexes, link templates)    | primitive `ticket-reference`                                                     |
| `references/tracker.md` (config schema, dispatch per backend)                            | primitive `tracker-config` (`schema.md`); tool note `tracker`                    |
| `_shared/tracker.example.yaml`                                                           | primitive `tracker-config` (`artifact.yaml`)                                     |
| `/commit-message-format`                                                                 | primitive `commit-message` (or the project's own format, rule `commit-format`)   |
| `_shared/references/comment-relevance.md`, `references/comment-relevance.md`             | primitive `comment-relevance`                                                    |
| `~/.claude/skills/review-pr/references/findings-schema.md`                               | primitive `review-finding` (`artifact.md`)                                       |
| `review-pr/references/aggregation.md`                                                    | primitive `review-aggregation`                                                   |
| `review-pr/references/agents.md`, `review-prompt.md`, `guidelines-agent.md`              | primitive `review-agent-brief`; roster and config facts in tool note `review`    |
| `review-pr/references/rereview-agent.md`                                                 | primitives `rereview-briefs`, `rereview-report`                                  |
| `investigate-pr-comments/references/handover-format.md`                                  | primitive `review-handover` (`format.md`)                                        |
| `investigate-pr-comments/references/prior-handled.md`                                    | primitive `prior-handled`                                                        |
| `resolve-pr-comments/references/investigate.md`                                          | primitive `investigation-brief`                                                  |
| `resolve-pr-comments/references/execute.md`                                              | goal `review-comments-resolved` (the pointer was dropped)                        |
| `narrate-pr/references/schema.md`                                                        | primitive `walkthrough-json` (`schema.md`)                                       |
| `narrate-pr/references/research-brief.md`                                                | primitive `walkthrough-research-brief`                                           |
| `narrate-pr/references/edge-verification-brief.md`                                       | primitive `walkthrough-edge-brief`                                               |
| `plan-feature/references/plan-file-format.md`                                            | primitive `plan-file` (`format.md`)                                              |
| `plan-my-day/references/standup.md`                                                      | primitive `standup-block`; goal `standup-snapshot`                               |
| `plan-my-day/references/close-day.md`                                                    | primitive `day-plan-issue` (close edits); goal `day-closed`                      |
| `plan-my-day/references/monthly-review.md`                                               | primitive `monthly-review-issue`                                                 |
| `~/.claude/skills/plan-my-day/config.example.yaml`                                       | primitive `plan-my-day-config` (`artifact.yaml`)                                 |
| `~/.claude/skills/request-review/config.example.yaml`                                    | tool note `request-review` ("Config file shape")                                 |
| `orchestrate/references/hook-install.md`                                                 | tool note `orchestrate-hook`                                                     |
| `/create-pr`                                                                             | goal `pr-opened`                                                                 |
| `/implement-feature`                                                                     | goal `plan-delivered`                                                            |
| `/plan-feature`                                                                          | goal `plan-ticket`                                                               |
| `/execute-phase`                                                                         | goal `phase-executed`                                                            |
| `/save-plan`                                                                             | goal `plan-saved`                                                                |
| `/review-pr`, `review-pr`                                                                | goal `pr-reviewed`                                                               |
| `/investigate-pr-comments`                                                               | goal `findings-investigated`                                                     |
| `/execute-review-decisions`                                                              | goal `review-decisions-applied`                                                  |
| `/resolve-pr-comments`, `/resolve-pr-comments --from-doc`                                | goal `review-comments-resolved` (`--from-doc` kept)                              |
| `/narrate-pr`                                                                            | goal `pr-walkthrough`                                                            |
| `/request-review`                                                                        | goal `request-review-posted`                                                     |
| `/plan-my-day`, `/plan-my-day standup`, `/plan-my-day close`                             | goals `daily-plan`, `standup-snapshot`, `day-closed`                             |
| `/plan-my-day-setup`                                                                     | goal `daily-plan-configured`                                                     |
| `/checkpoint`                                                                            | goal `compact-or-handoff`                                                        |
| `/orchestrate`                                                                           | goal `orchestrate` (replaces the skill when adopted)                             |

## Coverage

`COVERAGE.md` maps all 17 old skills to the goals, rules and primitives that cover them, lists the decisions pending the user's confirmation, and lists what is still open. The `review-handover` primitive vendors the handover validator: `_shared/manifest.yaml` gained that consumer, and `.github/workflows/handover-validator-drift.yml` must be checked for it before adoption.
