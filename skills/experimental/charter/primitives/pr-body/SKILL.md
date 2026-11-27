---
name: pr-body
version: 0.1.0
disable-model-invocation: true
description: The pull request body (Ticket, Description, Test scenario, optional Self-review and Open decisions) and the shape of its title.
---

# Primitive: PR body

**Primitive.** The pull request body (Ticket, Description, Test scenario, optional Self-review and Open decisions) and the shape of its title.

**Consumer.** Human: the reviewer reading the PR on GitHub. No parser.

**Artifact.** The body below, plus the title rule: `<type>(<scope>): <short description>`, under 72 characters, describing the change, never the orchestration. Source: skills/delivery/create-pr/SKILL.md:76-111; skills/delivery/implement-feature/SKILL.md:103 (title example)

```markdown
### Ticket

<TICKET_LINK> — One-line summary of the ticket

### Description

- What changed and why (bullet points)
- Key technical decisions if non-obvious

### Test scenario

- [ ] Step 1: How to set up / navigate to the feature
- [ ] Step 2: What to do
- [ ] Step 3: What to verify / expected outcome
- [ ] Edge case or error state to test (if applicable)

### Self-review

- <finding on the final diff> — fixed in <SHA>
- <finding on the final diff> — known gap

### Open decisions

- <open decision or assumption> — <decision-log path>
```

`<TICKET_LINK>` is rendered per the link template for the tracker:

- jira: `[PROJ-123](https://org.atlassian.net/browse/PROJ-123)`
- linear: `[ENG-45](https://linear.app/acme/issue/ENG-45)`
- github: `[#567](https://github.com/owner/repo/issues/567)`
- clickup: `[8669abc12](https://app.clickup.com/t/8669abc12)`

Title: ✅ `feat(skills): decouple PR review pipeline` / ❌ `feat(skills): decouple PR review pipeline (Plan 1)`. Do not include `(Plan N)`, `(Phase N)`, or similar scaffolding.

**Slots.**

| Slot            | Filled with                                              | Required | When empty                                                       |
| --------------- | -------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `<TICKET_LINK>` | link per `ticket-reference`                              | yes      | no ticket known (none configured, or declined): omit `### Ticket` |
| Description     | what and why, from the commits and branch; for `fix-bug`, the cause and the fix | yes | never empty                                    |
| Test scenario   | concrete, short, imperative steps a reviewer can follow (the goals' "how to verify") | yes | never empty; "verify it works" is not a step |
| `### Self-review` | each self-review finding on the final diff, marked fixed (SHA) or known gap | goals `deliver-feature`, `fix-bug` | omit; a goal that requires it writes `- None — checked <what was checked>` |
| `### Open decisions` | each open decision or assumption in the decision log    | no       | omit the section                                                 |

**Check.** The PR URL, each section present matched against the artifact, the ticket line a link, and the title matched to the title rule.

**Version.** 0.1.0. Renaming a heading is major; adding an optional section is minor. Producers: goals `pr-opened`, `plan-delivered`, `deliver-feature`, `fix-bug`. A repo's own PR template outranks this primitive (rule `pr-template`); the title rule still applies, and `### Self-review` and `### Open decisions` are appended after that template where the goal requires them.
