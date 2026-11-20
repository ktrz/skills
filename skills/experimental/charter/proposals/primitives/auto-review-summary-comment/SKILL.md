---
name: auto-review-summary-comment
version: 0.1.0
disable-model-invocation: true
description: The single grouped PR comment that summarises the auto-review findings a run addressed.
---

# Primitive: auto-review summary comment

**Primitive.** The single grouped PR comment that summarises the auto-review findings a run addressed.

**Consumer.** Human: the reviewer reading the PR conversation on GitHub.

**Artifact.** The body of one PR comment per run, not one comment per finding. Source: skills/review/execute-review-decisions/SKILL.md:267-314

```text
## Auto-review items addressed

<N> findings addressed — 🚨 <c> critical, ⚠️ <i> important, 💡 <s> suggestion.

<details>
<summary>Details</summary>

### 🚨 Critical
- `router.ts:42` — Added null check; covered by new test.

### ⚠️ Important
- `api-client.ts:88` — Narrowed return type to union of states.

### 💡 Suggestion
- `types.ts:15` — Renamed for clarity.

</details>
```

**Slots.**

| Slot                    | Filled with                                                              | Required | When empty                                  |
| ----------------------- | ------------------------------------------------------------------------ | -------- | ------------------------------------------- |
| `<N>`                   | total item count                                                         | yes      | never empty                                 |
| `<c>`, `<i>`, `<s>`     | critical, important, suggestion counts; `<s>` covers `suggestion` and `nit` | yes   | a zero-count severity is omitted            |
| `### <severity>` lists  | one bullet per item: `` `file:line` — reply text``                       | yes      | zero-count heading and list omitted         |

Omitted severities disappear from both the summary line and the `<details>` block. A blank line is required after `<summary>` and before `</details>` or the list does not render (source lines 301-310).

**Check.** The posted comment URL and a slot-by-slot comparison: heading line, count line, `<details>` block with blank lines, no empty severity section, one comment for the whole batch.

**Version.** 0.1.0. Changing the heading, the count line or the severity headings is a major bump. Producer: goal `review-decisions-applied`. Consumer: the reviewer.
