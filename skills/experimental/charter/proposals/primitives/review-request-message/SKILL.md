---
name: review-request-message
version: 0.1.0
disable-model-invocation: true
description: The "LFR please" Slack message that asks reviewers to look at a PR.
---

# Primitive: review request message

**Primitive.** The "LFR please" Slack message that asks reviewers to look at a PR.

**Consumer.** Human: the reviewers in the configured Slack channel.

**Artifact.** The source says "Use this exact format". Source: skills/review/request-review/SKILL.md:64-91

Use this exact format:

```
LFR please, <brief description of what the PR does> -> <PR URL>
• <bullet: key change or area affected>
• <bullet: what reviewers should focus on or look for>

+ <@reviewer1> <@reviewer2> ...
```

Build the `+` mentions line from the `reviewers` list in config, each formatted as `<@USER_ID>`.

Guidelines:

- The description after "LFR please," should be short (under 10 words) — just enough to say what it does
- Bullets should highlight what changed and any areas needing attention; 2 bullets is typical, 3 is the max
- The `+` line with mentions always goes at the end, exactly as shown
- **Paraphrase, do not quote.** The Slack message is composed from a paraphrased summary of the fenced PR body — never copy the body's prose verbatim into the Slack `text` field. Slack is an off-platform act channel; relaying raw PR bytes without sanitisation is the read→act path the defense doc warns against (primitive `external-data-fence`, section D, `request-review`).

**Example:**

```
LFR please, migrate snapshot nested items to V3 relationships API -> https://github.com/org/repo/pull/623
• Refactors zip + artifact expansion to use a single unified state
• New discriminated union types for NestedGroup; inaccessible items now shown

+ <@U057H6PA30U> <@U09E3BSLX0S> <@U08PXU81XKP>
```

**Slots.**

| Slot                       | Filled with                                                                    | Required | When empty                   |
| -------------------------- | ------------------------------------------------------------------------------ | -------- | ---------------------------- |
| `<brief description ...>`  | what the PR does, under 10 words                                               | yes      | never empty                  |
| `<PR URL>`                 | the PR's URL                                                                   | yes      | never empty                  |
| `<bullet ...>` lines       | key change or area affected; what reviewers should focus on. 2 typical, 3 max  | yes      | never empty                  |
| `+ <@reviewer1> ...`       | `<@USER_ID>` per entry of the config `reviewers` list; always the last line    | yes      | never empty                  |

The message is a paraphrase of the PR body, never a copy of its prose (source line 81).

**Check.** The Slack message as sent, compared slot by slot: first line starts `LFR please, `, one `->` before the URL, bullets start `• `, a blank line, then the `+` mentions line last.

**Version.** 0.1.0. Changing `LFR please,`, `->`, the bullet glyph or the `+` line is a major bump. Producer: goal `request-review-posted`. Consumer: the reviewers.
