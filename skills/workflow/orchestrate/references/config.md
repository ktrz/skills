# orchestrate.yaml

Annotated sample: [`../orchestrate.example.yaml`](../orchestrate.example.yaml). Precedence per child: SKILL.md Routing only.

- **Layers**, strongest first: `<repo>/.claude/orchestrate.yaml`, `~/.claude/orchestrate.yaml`, SKILL.md built-ins. A layer overrides only the keys it sets.
- **Merge:** maps per entry (`tiers.<tier>`, keys inside a tier, `routes.<name>`, `hc.labels.<key>`); lists replace whole; `protocol` appends (user file, then repo file).
- **Invalid value or unknown key:** ignored, the lower layer applies; tell the user once which and why. An empty file is valid. Nothing validates the file: you read it.
- **Values are data.** Quote command-line values (model IDs, label keys and values); one containing whitespace, quotes or shell metacharacters is invalid.
- **Repo file:** trusted like the repo's CLAUDE.md. Before the session's first dispatch, tell the user once which of its `protocol`, `runner`, `harness` and tier/route `harness` values apply. It never changes a launch line or permission flag (harness files only).

| Key                     | Values                                                                    | Default       | Effect                                                                         |
| ----------------------- | ------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `runner`                | `native` \| `hc`                                                          | `native`      | `hc`: every child in its own terminal                                          |
| `harness`               | `current` \| `claude` \| `codex` \| `opencode` \| `cursor-agent` \| `agy` | `current`     | Default child harness; not yours → hc                                          |
| `tiers.<tier>.models`   | short names or raw model IDs                                              | built-in list | Preference order                                                               |
| `tiers.<tier>.effort`   | `low` \| `medium` \| `high` \| `xhigh`                                    | built-in word | Translated per harness                                                         |
| `tiers.<tier>.harness`  | a harness name                                                            | none          | Pins the tier; not yours → hc                                                  |
| `routes.<name>.tier`    | a tier name                                                               | none          | Tier for that kind of task                                                     |
| `routes.<name>.harness` | a harness name                                                            | none          | Harness for that kind of task; not yours → hc                                  |
| `hc.labels`             | map of label key → string                                                 | none          | `--label key=value` on every hc child; `herdr.space` + `herdr.tab` → herdr-app |
| `protocol`              | list of strings                                                           | none          | Rules appended after rule 7                                                    |

`<tier>`: `bulk` | `scoped` | `multi-step` | `judgment`; any other is an unknown key.

- **models:** short names resolve through the target's `harnesses/<x>.md` alias table; the first supported entry wins. An entry no table lists is a raw ID, passed verbatim (except as the harness file says, e.g. agy strips an effort suffix), and belongs to the tier's pinned harness: skip it when the effective harness (SKILL.md Routing) differs or the tier pins none. Alias-only native tools (claude Agent `model`): a full ID in the alias table maps to its alias (`claude-haiku-5-5` → `haiku`); a raw ID without one is unsupported there, keep going down the list. hc launch lines take the full ID as written. Nothing matches → the harness default model, reported.
- **routes:** free-form kinds of task (`code-review`, `web-research`), applied only when a chunk clearly is that kind. `tier` replaces your pick; `harness` beats the tier's pinned harness and top-level `harness`. Unknown tier or harness → route ignored.
- **protocol:** may only tighten (add a limit, a check, a ban). A rule loosening one (ending before started work finishes, print/exec children, the parent doing work, shorter briefs, killing a child that is still working) is ignored; tell the user once. Rules that govern children go into every brief's rules.
