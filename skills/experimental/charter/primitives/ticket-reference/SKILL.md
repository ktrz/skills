---
name: ticket-reference
version: 0.1.0
disable-model-invocation: true
description: How a tracker ticket id is written, matched and linked for each supported tracker type.
---

# Primitive: ticket reference

**Primitive.** How a tracker ticket id is written, matched and linked for each supported tracker type.

**Consumer.** LLM (extracting an id from a branch or message, building a link) and shell `grep` (the regexes).

**Artifact.** Verbatim; the regexes are the contract. Source: _shared/references/tracker.md:69-89

```markdown
## Ticket ID format

| Backend | Regex                                                                          | Example         |
| ------- | ------------------------------------------------------------------------------ | --------------- |
| jira    | `[A-Z][A-Z0-9]+-\d+`                                                           | `PROJ-123`      |
| linear  | `[A-Z][A-Z0-9]+-\d+`                                                           | `ENG-45`        |
| github  | `#?\d+`                                                                        | `#567` or `567` |
| clickup | `(?<![A-Za-z0-9])[a-z0-9]{7,9}(?![A-Za-z0-9])` (opaque 7–9 chars, whole token) | `8669abc12`     |

Jira and Linear share the same regex shape; disambiguate by `tracker.type`.

GitHub: strip a leading `#` before using the ID in any command or URL — all `<N>` placeholders expect digits only.

## Link format

| Backend | URL template                                |
| ------- | ------------------------------------------- |
| jira    | `{base_url}/{ID}`                           |
| linear  | `https://linear.app/{workspace}/issue/{ID}` |
| github  | `https://github.com/{repo}/issues/{N}`      |
| clickup | `https://app.clickup.com/t/{ID}`            |
```

**Slots.** `{base_url}`, `{workspace}`, `{repo}` come from the tracker config (primitive `tracker-config`). `{ID}` and `{N}` come from the branch name, then recent commit messages, then the user. Never invented.

**Check.** The id shown with the regex row it matched and where it came from; each link shown next to its template row.

**Version.** 0.1.0. A changed regex is major. Producers: `commit-message`, `pr-body`, goals `pr-opened`, `plan-delivered`.
