# Artifact: review-reply

Each block reads exactly as written outside `<slots>`. Parts marked "(charter)" have no source text; they were written for the charter and await the user's confirmation. Everything else is copied from the sources named in `SKILL.md`.

## Thread reply

Body of `addPullRequestReviewThreadReply`.

From a handover item (`skills/review/execute-review-decisions/SKILL.md:186-245`):

```text
<prefix> — <reply text>
```

No handover (`skills/review/resolve-pr-comments/SKILL.md:232, 238`: the replies there carry no prefix):

```text
<reply text>
```

Prefix, by the severity persisted in the handover item (`skills/review/execute-review-decisions/SKILL.md:222-228`):

| Severity        | Prefix                       |
| --------------- | ---------------------------- |
| `critical`      | `🚨 Critical`                |
| `important`     | `⚠️ Important`               |
| `suggestion`    | `💡 Suggestion`              |
| `nit`           | `💡 Suggestion`              |
| (anything else) | `⚠️ Important` + log warning |

## Reply text, by outcome

| Outcome  | `<reply text>`                                                                           |
| -------- | ---------------------------------------------------------------------------------------- |
| fixed    | `<what changed>`, followed by ` Fixed in <commit>.` where `SKILL.md` makes `<commit>` required |
| declined | (charter) `Not changed: <reason>. <evidence>`                                            |
| deferred | (charter) `Deferred to <ticket URL>.`, optionally followed by ` <one-line reason>`       |

`<what changed>` is short and factual. `<evidence>` is something the reviewer can open or re-run: a `file:line`, a link, or a command and its result. `Fixed in <commit>` is the phrase of `skills/review/execute-review-decisions/SKILL.md:326-328`. Source examples of `<what changed>` (`skills/review/execute-review-decisions/SKILL.md:177-179, 245`; `skills/review/resolve-pr-comments/SKILL.md:232, 238`): `Added null check; covered by new test.`, `Narrowed return type to union of states.`, `Renamed for clarity.`, `Fixed: renamed variable to userCount`, `Added null check`.

## `+1` reply

Body of a reply on the existing comment that already flagged the same `file:line` as an item overlap-skim suppressed (`skills/review/execute-review-decisions/SKILL.md:207`, where that comment was a bot's; primitive `review-aggregation` skims comments of any author):

```text
+1 — fixed in <commit>
```

## Review-body comment (charter)

Body of one `gh pr comment` answering the items of one review body. The source asks only for one PR comment that references the review URL (`skills/review/resolve-pr-comments/SKILL.md:249`).

```text
Re: <review URL>

- <reply>
```

One `- <reply>` line per item answered, in the review body's order. `<reply>` is the thread-reply form of the goal's variant.

## Round summary (charter)

Body of one `gh pr comment` per PR, carrying what the round changed and declined (goal `stack-to-approved`).

```text
Review round summary at <head commit>

Changed:
- <thread URL> — <reply text>

Declined:
- <thread URL> — <reply text>
```

"Changed" lists the fixed outcomes; "Declined" lists the declined and deferred ones. A section with no entries holds the single line `- none`.
