---
name: delivery-messages
version: 0.1.0
disable-model-invocation: true
description: The fixed messages shown while opening PRs and delivering a plan, each keyed by the moment it is shown.
---

# Primitive: delivery messages

**Primitive.** The fixed messages shown while opening PRs and delivering a plan, each keyed by the moment it is shown.

**Consumer.** Human: the user reading the session. No parser.

**Artifact.** See `artifact.md` beside this file: a catalog of "shown when" → exact text. Commands and example-file paths that named old skills are slots, filled from the mapping below; `skill-creator` and `gh pr ready` still exist and stay literal. Source: skills/delivery/create-pr/SKILL.md:19-21, 146-150; skills/delivery/implement-feature/SKILL.md:35-37, 65-75, 106-118, 126, 134-136, 144-149

**Slots.**

| Slot                   | Filled with                                              | Required | When empty                |
| ---------------------- | -------------------------------------------------------- | -------- | ------------------------- |
| `X`, `Y`, `M`, `P`, `N` | phase numbers or PR number                               | yes      | never empty               |
| `<url>`, `<path>`      | the PR URL, the decisions file's absolute path           | yes      | never empty               |
| `<base-branch>`        | the branch the PR is stacked on                          | yes      | message not shown         |
| friction list          | one line per friction point: item, implicated step, fix  | no       | the no-friction message   |

| Slot                | Old skill text                     | Fill with (charter)                                   |
| ------------------- | ---------------------------------- | ----------------------------------------------------- |
| `<tracker example>` | `_shared/tracker.example.yaml`     | absolute path of primitive `tracker-config`'s `artifact.yaml` |
| `<review goal>`     | `review-pr`                        | `pr-reviewed`                                         |
| `<apply command>`   | `/execute-review-decisions`        | `/review-decisions-applied`                           |
| `<flagged command>` | `/resolve-pr-comments --from-doc`  | `/review-comments-resolved --from-doc`                |

**Check.** The entries shown this session, each quoted next to its catalog entry; a message shown only when its moment occurred, and not reworded.

**Version.** 0.1.0. Changing a literal is major; adding an entry is minor. Producers: goals `pr-opened`, `plan-delivered`.
