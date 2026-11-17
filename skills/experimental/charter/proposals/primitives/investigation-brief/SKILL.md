---
name: investigation-brief
version: 0.1.0
disable-model-invocation: true
description: The brief a child agent gets to investigate a batch of PR review comments, and the per-comment report it returns.
---

# Primitive: investigation brief

**Primitive.** The brief a child agent gets to investigate a batch of PR review comments, and the per-comment report it returns.

**Consumer.** LLM: the investigating child reads the brief; the parent reads the `## Comment [N]` reports and copies their fields into handover items (`Analysis`, `Recommendation`, `Options`) or shows them to the user.

**Artifact.** See `artifact.md` beside this file: the report format, the fence format with its worked example, the trust directive, and the child prompt template. Source: skills/review/resolve-pr-comments/references/investigate.md:92-250

**Slots.**

| Slot                                  | Filled with                                                  | Required | When empty                       |
| ------------------------------------- | ------------------------------------------------------------ | -------- | -------------------------------- |
| `[absolute path]`, `[number]`, `[owner/repo]` | repo path, PR number, repository                      | yes      | never empty                      |
| `[N]` (batch size)                    | count of comments in the batch                               | yes      | never empty                      |
| `[login]`, `[file:line OR ...]`       | comment author and location                                  | yes      | `review body — see URL`          |
| fenced body and replies               | verbatim text, inner fence tags neutralized, indented 2      | yes      | omit the `Replies` line          |
| `[url]`, `[list of additional ...]`   | review URL (review-body items only); aliased thread ids      | no       | omit the line                    |
| `[external-data-fence path]`, `[investigation-brief path]` | absolute paths of `external-data-fence/artifact.md` and of this primitive's `artifact.md` (the child starts blank) | yes | never empty |

**Check.** Per child: the brief contains the trust directive and one fence per comment (grep `trust="untrusted"`), and the returned reports use the `## Comment [N]` header, one per comment in input order, each with all six fields.

**Version.** 0.1.0. Changing a literal header or field label is a major bump. Producers: goals `findings-investigated`, `review-comments-resolved`. Consumers: the parent agent; primitive `review-handover` (field mapping).
