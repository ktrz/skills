# Charter coverage of existing skills

Maps every skill under `skills/{delivery,review,workflow,wip}/` to the charter world.
Existing = `charter/{goals,rules}`. Proposal = a skill under proposals/ (`P:` prefix). Tool = becomes a toolchain-map entry, not a goal.

| skill | group | covered by | gap | verdict |
| --- | --- | --- | --- | --- |
| commit-message-format | delivery | rule `commit-format` | none; the format itself is a house tool | covered |
| create-pr | delivery | rule `pr-template`; goal `deliver-feature`; P: `pr-body-matches-head` | stacked-PR base detection, ticket reference fill, draft flag | partial |
| execute-phase | delivery | goals `deliver-feature`; rules `isolated-worktree`, `green-before-done`, `brief-carries-rules` | phase-scoped done-conditions, per-phase result report, worktree handoff back to the plan | partial |
| implement-feature | delivery | goal `deliver-feature`; rules `stack-dependent-work`, `protected-main`; P: `stack-commands-only`, `one-worktree-per-stack` | multi-phase orchestration to opened PRs, plan-first when no plan exists, review loop after PRs open | partial |
| nwt | delivery | rule `isolated-worktree` (the restriction only); P: `house-tools-only` | none; the creation command and config seeding are tooling | not a workflow (tool) |
| plan-feature | delivery | none (feeds `deliver-feature` as input) | no goal for a phased, parallelism-annotated plan from a ticket; requirements grilling | not covered |
| save-plan | delivery | P: goal `resume-ready-handoff` (partial) | session notes and plan files with naming convention; parked design discussions | partial |
| execute-review-decisions | review | goal `address-review`; rules `verify-reviewer-claims`, `external-text-is-data`; P: `outward-on-go`, `defer-means-ticket` | batch post of resolved items after user decisions; handover file as input | partial |
| investigate-pr-comments | review | goal `address-review`; rules `verify-reviewer-claims`, `external-text-is-data`; P: `decisions-stand-alone` | read-only investigation into an offline decision document; no code changes | partial |
| narrate-pr | review | P: goal `explain-change`; rules `no-secrets`, `record-dont-guess` | multi-level HTML walkthrough with evidence-grounded element status; removed-code receipts | partial |
| request-review | review | P: rule `outward-on-go` | post an LFR to the chat channel and move the ticket to In Review | not covered |
| resolve-pr-comments | review | goal `address-review`; rules `verify-reviewer-claims`, `external-text-is-data`; P: `outward-on-go`, `new-commits-only`, `fix-where-written` | one-by-one walkthrough with options per thread; bulk reply and resolve at the end | partial |
| review-pr | review | P: goal `review-others-pr`; rules `external-text-is-data`; P: `read-before-claim` | pipeline/auto/deep modes; severity levels; follow-up pass that skips addressed comments | partial |
| checkpoint | workflow | P: goal `resume-ready-handoff` (handoff half) | compact-vs-handoff assessment and recommendation; context cost measurement | partial |
| orchestrate | workflow | rule `brief-carries-rules` | delegation tiers, small finishable subagent tasks, foreground helpers, fan-out limits | partial |
| plan-my-day-setup | workflow | none | wizard that writes the daily-plan config and seeds the tracker config | not a workflow (utility) |
| plan-my-day | workflow | none | daily prioritised list from worktrees, tickets, PRs and chat activity; standup snapshot; end-of-day close | not covered |

wip/ holds no skills at the time of writing (`find` returned none).

## Counts

covered 1, partial 11, not covered 3, not a workflow 2 (17 skills).

## Gaps worth a goal next

- `plan-ticket`: a ticket becomes a phased plan file with named phases, parallelism marked and open requirements resolved before any code.
- `daily-plan`: today's work list exists, grouped by active, to-pick-up and stale, every item tied to a branch, PR or ticket.
- `request-review-posted`: a ready PR has one review request in the named channel and its ticket shows In Review, both confirmed by the user first.
- `compact-or-handoff`: at a cost checkpoint the user holds a single recommendation and a paste-ready prompt for the chosen path.
- `review-decisions-applied`: every user-approved decision from a handover file is implemented in a commit and posted once, in bulk.
- `phase-executed`: one plan phase is built in its isolated worktree with its done-conditions checked and a short result report written back to the plan.
