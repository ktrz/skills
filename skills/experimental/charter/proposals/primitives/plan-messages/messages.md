# Plan messages

Each message is shown exactly as written below when its row applies. `<…>` is a slot.

| # | Shown when |
| - | ---------- |
| 1 | no tracker config exists (ticket planning) |
| 2 | a plan for the ticket already exists |
| 3 | the requirements interview is offered |
| 4 | a plan is presented: one opening sentence, by the shape of the plan |
| 5 | the user approved the plan |
| 6 | `plans.local` is a dangling symlink |
| 7 | `plans.local` is missing |
| 8 | flat file or topic directory is undecided |
| 9 | a flat file could be promoted to a topic directory |
| 10 | the target file exists |
| 11 | the file was written |

## 1

````markdown
No tracker config found. Create `<repo_root>/.claude/tracker.yaml` for a per-project tracker, or `~/.claude/tracker.yaml` for a shared default. Copy `<tracker example>` as a starting point.
````

## 2

````markdown
A plan already exists at `<path>`. Regenerate it?
````

## 3

````markdown
Shall I interview you about the requirements before planning? Recommended for new or ambiguous features.
````

## 4 (free text, shape only: one sentence giving the phase count and which phases run in parallel or in sequence; examples)

````markdown
Plan has 3 phases. Phase 1 must land first. Phases 2 and 3 are parallel afterwards (disjoint files).
Plan has 2 phases and they're fully parallel — both can dispatch immediately from `main`.
Plan is strictly sequential — Phase 2 depends on types from Phase 1, Phase 3 depends on the schema from Phase 2.
````

## 5

````markdown
Plan saved to `<resolved-dir>/<slug>.md`. Run `<deliver command>` to execute it.
````

## 6

````markdown
`./plans.local` exists but is a broken symlink — its target is missing. Repair or replace it, e.g.:

```bash
ln -sfn ~/projects/plans <REPO_ROOT>/plans.local
```

then re-run.
````

## 7

````markdown
No `./plans.local` in this repo. Create the symlink first:

```bash
ln -s ~/projects/plans <REPO_ROOT>/plans.local
```

then re-run.
````

## 8

````markdown
This looks like a chunky discussion — save it as a single
`PLAN-<slug>.md`, or give it its own topic dir
`plans.local/<project>/<slug>/`?
````

## 9

````markdown
`PLAN-<slug>.md` is growing — promote to topic dir
`plans.local/<project>/<slug>/` (moves existing file → `PLAN.md`
inside it) and save the new doc alongside?
````

## 10 (free text, shape only: the three options below are offered)

````markdown
overwrite, append today's date to slug (or add sub-slug in topic-dir case), or pick different name.
````

## 11

````markdown
Saved to `<absolute path>`.
````
