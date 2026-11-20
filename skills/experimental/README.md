# `skills/experimental/` — experimental paradigms bucket

This bucket holds competing ways of structuring skills that may not survive.
Unlike `skills/wip/` (reworks and primitives that graduate into a group), an
experiment here is a whole paradigm that can be judged and discarded as a unit.

## Contract

- **Deletable wholesale.** Nothing outside this folder depends on it. Removing
  `skills/experimental/` must leave every other skill working.
- **Excluded from the public surface.** Experimental skills are omitted from
  the root `README.md` index and from any plugin manifest.
- **Never auto-trigger.** Every skill sets `disable-model-invocation: true`
  in its `SKILL.md` frontmatter, so it costs no listing context and is
  reachable only by explicit `/<name>` or by path read.
- **Stable skills stay the daily drivers.** Experiments are compared against
  them and do not replace them.

## Current experiments

- `charter/` — goal skills and rule skills: say what done is and what is forbidden, leave the path to the agent.
