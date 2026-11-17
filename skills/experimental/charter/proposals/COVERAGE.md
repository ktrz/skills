# Charter coverage of existing skills

Maps every skill under `skills/{delivery,review,workflow,wip}/` to the charter world. Obligation-level detail (every id → item) is in the coverage map kept with the build plan; this table is the summary.

Legend. Adopted items: goals `deliver-feature`, `fix-bug`, `address-review`, and the rules and primitives in the charter README tables. Every other goal, rule and primitive lives under `proposals/`. The tools column names tool notes (drafts in `proposals/tools/<tool>.md`, installed at `~/.claude/charter/tools/`; byte-copied scripts sit in `tools/<tool>/`) and toolchain-map rows (`TM <capability>`).

| skill | group | goals | rules | primitives | tools | verdict |
| --- | --- | --- | --- | --- | --- | --- |
| commit-message-format | delivery | `deliver-feature`, `fix-bug`, `address-review` (bind it) | `commit-format` | `commit-message` | TM Commits | covered |
| create-pr | delivery | `pr-opened` | `pr-template`, `ticket-traceable`, `pr-body-matches-head` | `pr-body`, `ticket-reference`, `delivery-messages` | `github-pr` | covered |
| execute-phase | delivery | `phase-executed` | `isolated-worktree`, `green-before-done`, `brief-carries-rules` | `phase-brief`, `phase-progress` | `nwt`, `plans-local` | covered |
| implement-feature | delivery | `plan-delivered`, `deliver-feature` | `stack-dependent-work`, `protected-main`, `stack-commands-only` | `delivery-messages` | `tracker` | covered |
| nwt | delivery | none (a tool) | `isolated-worktree`, `house-tools-only` | none | `nwt` (+ `tools/nwt/`), TM Isolated worktree | covered |
| plan-feature | delivery | `plan-ticket` | `plans-stay-local`, `ticket-traceable`, `named-targets-only` | `plan-file`, `exploration-brief`, `plan-messages` | `tracker`, `plans-local` | covered |
| save-plan | delivery | `plan-saved`, `resume-ready-handoff` | `plans-stay-local` | `saved-plan` | `plans-local` | covered |
| execute-review-decisions | review | `review-decisions-applied` | `verify-reviewer-claims`, `outward-on-go`, `defer-means-ticket`, `fence-external-text` | `review-reply`, `review-messages`, `auto-review-summary-comment`, `review-aggregation` | `github-review` | covered |
| investigate-pr-comments | review | `findings-investigated` | `verify-reviewer-claims`, `decisions-stand-alone`, `fence-external-text` | `review-handover`, `investigation-brief`, `prior-handled` | `github-review` | covered |
| narrate-pr | review | `pr-walkthrough`, `explain-change` | `no-secrets`, `record-dont-guess`, `quote-untrusted-in-shell` | `walkthrough-json`, `walkthrough-research-brief`, `walkthrough-edge-brief` | `narrate-pr` (+ `tools/narrate-pr/`) | covered |
| request-review | review | `request-review-posted` | `outward-on-go`, `ticket-traceable`, `fence-external-text` | `review-request-message`, `review-messages` | `request-review`, `tracker` | covered |
| resolve-pr-comments | review | `review-comments-resolved` | `verify-reviewer-claims`, `outward-on-go`, `new-commits-only`, `fix-where-written` | `review-reply`, `review-messages` | `github-review` | covered |
| review-pr | review | `pr-reviewed`, `review-others-pr` | `read-before-claim`, `fence-external-text`, `quote-untrusted-in-shell` | `review-handover`, `review-finding`, `review-agent-brief`, `review-aggregation`, `comment-relevance`, `rereview-briefs`, `rereview-report`, `review-comment`, `review-messages` | `review`, `github-review` | covered |
| checkpoint | workflow | `compact-or-handoff`, `resume-ready-handoff` | `record-dont-guess` | `checkpoint-prompts` | none | covered |
| orchestrate | workflow | `orchestrate` | `parent-only-judges`, `delegate-by-tier`, `foreground-below-root`, `brief-carries-rules` | none | `orchestrate-hook` (+ `tools/orchestrate-hook/`) | covered |
| plan-my-day-setup | workflow | `daily-plan-configured` | `named-targets-only`, `fence-external-text` | `plan-my-day-config`, `tracker-config` | `plan-my-day` | covered |
| plan-my-day | workflow | `daily-plan`, `standup-snapshot`, `day-closed` | `ticket-traceable`, `fence-external-text`, `outward-on-go` | `day-plan-issue`, `day-plan-file`, `standup-block`, `monthly-review-issue`, `review-ask-triage`, `daily-plan-messages` | `plan-my-day`, `tracker` | covered |

wip/ holds no skills at the time of writing (`find` returned none).

## Counts

covered 17 (17 skills). Each obligation of an old skill is a done-condition, a rule, an exact artifact, a tool fact, or an explicitly dropped method; none is unmapped.

Retained procedure: some tool notes still carry the old skills' sequencing prose and numbered steps, copied verbatim. `plan-my-day.md` keeps phase and step labels inside its blocks (`Phase 4`, `C1–C4`); `github-review.md` keeps numbered fetch, reply and post-flight steps; `review.md`, `nwt.md` and `plans-local.md` keep numbered lists. Until those notes are reduced to facts, plan-my-day, plan-my-day-setup and the review skills are covered by goal + rules + primitives + retained procedure, not by the first three alone (see Open).

## Pending user confirmation

These resolve conflicts or behaviour changes between old skills, or fix literals the sources never fixed; all need the user's yes.

- **D1** Commits outside a goal: the charter cannot auto-trigger. Suggest one CLAUDE.md line pointing at `commit-message`.
- **D2** `pr-opened` standalone opens ready unless `--draft` (old `create-pr` behaviour); `pr-template` exempts it.
- **D3** No tracker config: commits waive the ticket; PR, plan and daily-plan goals stop; request-review skips only the transition.
- **D4** Phase work is committed incrementally (`implement-feature`) rather than left unstaged (`execute-phase`).
- **D5** Invoking `pr-reviewed` in default mode is the go for posting its comments; in deep mode the go is the per-finding answer; pipeline mode posts nothing. Stated in the goal's Done-when.
- **D6** Superseded by D16.
- **D7** Scripts (`nwt.zsh`, `install.sh`, `render.mjs`, `orchestrate-reminder.sh`) are byte-copied under `tools/<tool>/` so coverage does not depend on old skill folders; they install with the notes at `~/.claude/charter/tools/`.
- **D8** Copied messages that named old slash commands or example files now carry slots, filled from the old → charter tables in each `*-messages` primitive and in proposals/README.md.
- **D9** The repo's own PR template outranks `pr-body` (old `create-pr` always used the house template); the title rule still applies, and `### Self-review` and `### Open decisions` follow a repo template when the goal requires them.
- **D10** Review comment literal (`review-comment`): `<prefix> — <description>`, a blank line, `<recommendation>`; a review carrying several puts its PR-level findings in the body joined by `---`; a deep-mode `(e)` edit keeps the prefix.
- **D11** Empty-diff message: `PR #<N> has an empty diff — nothing to review.`
- **D12** Deep-mode skimmed block: `Skimmed <count> findings already raised on the PR:`, then `  <i>. <severity> on <file>:<line> (@<login> already flagged)` per finding, then `Name a number to walk it anyway.`
- **D13** Deep-mode count line `posted <p> comments (<e> edited), dropped <d>, suppressed <s> via overlap-skim`; bucket line `execute: <e>, pending: <p>, discuss: <d>, skip: <s>`.
- **D14** `review-reply` variants: a reply from a handover item is `<prefix> — <reply text>`; a reply with no handover (`review-comments-resolved`, `address-review`, `stack-to-approved`) is `<reply text>` only; a fix reply ends ` Fixed in <commit>.`, required in `address-review` and `stack-to-approved`.
- **D15** `review-reply` charter texts: declined `Not changed: <reason>. <evidence>`; deferred `Deferred to <ticket URL>.` plus an optional reason; review-body comment `Re: <review URL>` then one `- <reply>` line per item; round summary `Review round summary at <head commit>` with `Changed:` and `Declined:` lists, an empty list reading `- none`.
- **D16** Gates: `request-review-posted` posts on invocation, as the old skill did (this replaces the draft-first D6); `review-others-pr` keeps its draft gate; `review-decisions-applied` and `review-comments-resolved` keep their confirm gates, as the old skills did.
- **D17** The `+1 — fixed in <commit>` reply goes on the earlier comment whatever its author (the old skill said bot only; `review-aggregation` skims all authors) and is always posted for a suppressed fixed item.
- **D18** Handover note literal `(see related item)`, not `(see next item)`: human items sort between auto-review items, so "next" is often false.
- **D19** `investigation-brief` drops the old "See references/execute.md." line instead of pointing the child at a rule.
- **D20** `<request-review example>` fills with the "Config file shape" block of tool note `request-review`; no primitive holds that config.
- **D21** `pr-body` optional-section literals: `- <finding on the final diff> — fixed in <SHA>` or `— known gap`; a required but empty list reads `- None — checked <what was checked>`; `- <open decision or assumption> — <decision-log path>`.
- **D22** Old commands in copied messages fill as: `/implement-feature` → `/plan-delivered`, `/execute-review-decisions` → `/review-decisions-applied`, `/resolve-pr-comments --from-doc` → `/review-comments-resolved --from-doc`, `review-pr` → `pr-reviewed`, `<tracker example>` → `tracker-config/artifact.yaml`; `skill-creator` and `gh pr ready` stay literal.
- **D23** `checkpoint-prompts` layout: `**<compact | handoff>** — <reason>`, then `compact<marker>` and `handoff<marker>`, each followed by its code block, with `<marker>` = ` ← recommended` on the recommended one.
- **D24** `parent-only-judges` lets the parent read the goal files in play (`orchestrate` and a goal named with `using`) and the rules and primitives they bind; "invoking is the go" is not applied to `orchestrate`.
- **D25** `phase-brief`'s `<commit format>` is the project's own format source, else `commit-message`; `plan-delivered` also binds `phase-brief`.
- **D26** `plans-stay-local` exempts the in-worktree working copy of `phase-progress` (`<worktree>/.claude/plans/`); the finished copy still goes beside the plan.
- **D27** Invoking is the go: `daily-plan` for creating the issue, closing the previous open plan and creating last month's retro (confirm the retro is in scope); `standup-snapshot` for replacing the Standup section; `day-closed` for closing the issue.
- **D28** `daily-plan-messages` command slots fill with the invocation of the matching goal, and `<config example path>` with `plan-my-day-config/artifact.yaml`.
- **D29** `plan-my-day-config/artifact.yaml`, the example users copy, now carries a `<tracker-config path>` slot and is no longer byte-identical to the old example.
- **D30** Adoption set: rules `exact-artifacts`, `fence-external-text`, `ticket-traceable`, `outward-on-go`; primitives `pr-body`, `commit-message`, `ticket-reference`, `review-reply`, `external-data-fence`, and `delivery-messages` and `tracker-config` because adopted items name them (`ticket-traceable`; the slots of `ticket-reference` and `delivery-messages`).
- **D31** Contract: tool notes are a fourth kind (facts about a tool, no ordering or numbered steps), and a primitive may be a shape or a deterministic procedure whose result must be reproducible.
- **D32** The decision log is `plans.local/<repo>/<ticket, PR number, or short slug>-decision-log.md`; the three-way key stays because a delivery goal writes to it before any PR number exists.
- **D33** The toolchain map's Handoff row names the `/handoff` skill only, matching the `/handoff <focus>` literal in `checkpoint-prompts`.
- **D34** `house-tools-only`: with no map, a goal that needs a tool note stops and names the missing file; with no map and no note needed, there is nothing to enforce.

## Open

- **Bundled rules.** `fence-external-text`, `brief-carries-rules`, `pr-template`, `ticket-traceable`, `delegate-by-tier` (with an embedded table) and `house-tools-only` each hold several restrictions. Proposed: one sentence per rule, mechanics moved to the primitive it names, `pr-template` split into draft and template, the delegation table moved to a primitive `delegation-table`.
- **Retained procedure.** The tool notes named under Counts still carry sequencing prose and numbered steps; reduce them to facts under the tool-note litmus, or move a reproducible procedure into a primitive.
- **`walkthrough-json/validate.mjs`** is a byte copy of narrate-pr's validator with no drift check, unlike the handover validator. Proposed: canonical copy in `_shared/`, distributed by `sync.sh`.
- **`review-handover/format.md`** lines 75, 120 and 124 still name `/resolve-pr-comments --from-doc`, and line 12 names the old skill as Owner. Line 75 is written into every handover file the validator parses, so the text cannot change without checking the validator.
- **`tracker-config/artifact.yaml:24`** still says `See <skill>/references/tracker.md`. The file is the example users copy, so it needs a decision: point at tool note `tracker`, or drop the line.
- **`day-closed` selection table** is missing. The none / one / several-open / already-closed cases exist only as `daily-plan-messages` texts (`close.*`) and in tool note `plan-my-day`; no primitive holds the selection itself.
- **Old names inside copied text.** `plan-file/format.md` and `phase-progress/artifact.md:35` name old skills (names, not paths); `phase-brief` keeps the verbatim `npm run typecheck && npm test`; tool-note blocks still mention `references/prompt-injection-defense.md` and old command names.
- **Skim edge case.** An auto-review item skimmed against a human comment that is also a thread item gets both the `+1` reply and that thread's own reply.
- **`plan-saved`** still carries an `allowed-tools` list, a tool list inside a goal.
- **Versions.** Proposal items stay at 0.1.0 and the charter is unreleased; adopted items keep their own version lines.
