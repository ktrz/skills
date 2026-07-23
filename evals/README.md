# Eval specs (live-only)

These specs gate Phase 5 (bridge-vs-field loosening): _when we rewrite a skill
to be less prescriptive, did we keep every load-bearing behaviour?_ You record
how the **stable** skill behaves, rewrite into a `wip/` variant, then re-run the
identical scenarios A/B against a real model and compare.

## Why live-only (no deterministic layer)

An earlier draft of this harness parsed `SKILL.md` and asserted substrings
against it — "the description still contains this phrase", "the body still has
that heading". That machinery tested the **input**, not the model: it is like
asserting the string we passed into a React component renders that same string
back. A zero-variance check parsed from the file we just wrote proves nothing
about how a model reads and acts on it. So the deterministic layer is gone.

Rule in force repo-wide: **models get format docs; evals need live calls.**
Deterministic validators live only where a non-LLM parser consumes the output
(e.g. narrate-pr's `render.mjs`). Skill behaviour is only observable by running
a real model, so every eval here is a live call.

## Layout

```text
evals/
  README.md                          # this file
  scenarios/<target>.md              # live scenario spec — prompts + expected
                                     # behaviours a human/model runner checks
  scenarios/<target>.trigger.json    # skill-creator-compatible trigger eval-set
                                     # ({query, should_trigger}[]) — valid JSON,
                                     # consumed by the skill-creator plugin runner
```

Two artifacts per target:

- **`<target>.trigger.json`** — a trigger eval-set in the skill-creator plugin's
  schema. The JSON format is the non-LLM deterministic contract; the plugin's
  runner reads it and drives live `claude -p` calls, so the file itself stays
  valid JSON in that exact shape. Answers: _does the description actually fire
  for these paraphrases?_
- **`<target>.md`** — the scenario spec. Its consumer is a human plus a model,
  so it is prose: each scenario gives a prompt, `should_trigger`, and the
  observable behaviours to check. Answers: _does a real run stay in-contract?_

## Running trigger sets (skill-creator plugin)

The trigger sets are skill-creator-compatible eval-sets. Point the plugin's
runner at one, with a model available:

```bash
# from the skill-creator plugin dir:
python scripts/run_eval.py \
  --skill-path skills/delivery/create-pr \
  --eval-set   evals/scenarios/create-pr.trigger.json \
  --runs-per-query 5
```

This spawns `claude -p` subprocesses and reports the trigger rate + variance per
query. High variance on the **stable** wording is itself useful signal — it
means the prescriptive text wasn't binding behaviour anyway, so loosening it is
low risk.

## Running scenario specs (`claude -p`)

The `.md` specs are for a driven run against a real model. For each scenario,
feed the prompt to a session that has the target skill installed and judge the
result against the listed expectations:

```bash
# one scenario, by hand:
claude -p "open a pull request for my branch"
# → confirm the create-pr skill fired and the PR body carries the
#   ### Ticket / ### Description / ### Test scenario sections, etc.
```

There is no runner that fakes a model result — a scenario passes only when a
real run satisfies its expectations, judged by the person (or plugin) driving.

## The A/B loop — Phase 5's graduation gate (manual, Chris-triggered)

This is run by hand at graduation, not in CI:

1. **Baseline** — run the trigger set and scenario specs against the **stable**
   skill; record the trigger rates and which scenario expectations hold.
2. **Rewrite** — copy the skill to `skills/wip/<skill>/` and loosen it.
3. **Compare (A/B)** — run the identical trigger set and scenario specs against
   the `wip` variant. Every behaviour that held for stable must still hold for
   wip; a dropped expectation, or a _materially_ worse trigger rate — judged
   across the 5 runs, not a single-point threshold — is a regression that
   blocks graduation.

Graduation criterion: eval parity or better vs the stable baseline (plus the
contract validators in `skills/wip/README.md`).

## Adding a target

1. Add `scenarios/<name>.md` — a header (target + stable/wip paths + a link to
   the trigger set) and one section per scenario with a prompt, `should_trigger`,
   and the observable behaviours to check.
2. Add `scenarios/<name>.trigger.json` — a JSON array of `{ "query": …,
"should_trigger": … }` objects, one per trigger the plugin should exercise.
   Keep the paraphrases in sync with the spec's trigger scenarios. Include at
   least one `should_trigger: false` case — an adjacent-but-wrong prompt a
   too-loose description might wrongly catch.
