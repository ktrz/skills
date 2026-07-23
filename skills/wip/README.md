# `skills/wip/` — work-in-progress bucket

This bucket holds skills that are **not yet stable**: parallel-test reworks of an
existing skill and newborn primitives that have not yet earned a home in a
semantic group (`delivery/`, `review/`, `workflow/`).

## Contract

- **Excluded from the public surface.** WIP skills are omitted from the root
  `README.md` index and from any future plugin manifest until they graduate.
  They exist to be iterated on and A/B-evaluated, not advertised.
- **Never auto-trigger.** Every WIP skill sets `disable-model-invocation: true`
  in its `SKILL.md` frontmatter. This keeps it out of the model's skill listing
  (zero context cost) and guarantees the stable variant stays the deterministic
  daily driver. A WIP skill is reachable only via its explicit `/<name>` slash
  command.
- **Parallel-test naming.** A rework of an existing skill lives at
  `skills/wip/<skill>/` and carries a `-v2` suffix on both its frontmatter
  `name:` and its installed symlink (`<skill>-v2`) **only while both variants are
  installed side by side**. The suffix and the `disable-model-invocation` flag
  are dropped at graduation. Newborn primitives have no stable counterpart, so
  they need no suffix — just the disable flag while they live here.

## Graduation

Graduation is a single `git mv skills/wip/<skill>` into the target group (or
`skills/primitives/`, created when the first primitive graduates). At that move:

1. `git mv` the directory into its group.
2. Drop the `-v2` name suffix and the `disable-model-invocation: true` flag
   (unless the skill is a primitive, which keeps the flag permanently — a
   primitive is composed by explicit path reads, never model invocation).
3. Swap the skill's `_shared/manifest.yaml` consumer entries to the new path and
   re-run `_shared/sync.sh`.
4. Rename the installed symlink to match the dropped suffix. The old
   `<skill>` symlink pointed at the pre-rework skill this `git mv` just
   replaced, so remove it; then point a fresh `<skill>` symlink at the
   new group path and remove `<skill>-v2`:

   ```bash
   rm ~/.claude/skills/<skill> ~/.claude/skills/<skill>-v2
   ln -sfn <new-path> ~/.claude/skills/<skill>
   ```

   Exactly one symlink survives, named `<skill>` with no suffix,
   matching the frontmatter `name:` from step 2.

5. Add a CHANGELOG entry.

Graduation criteria: eval parity or better vs the stable baseline plus all
contract validators green.
