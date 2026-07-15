---
name: commit-message-format
description: This skill should be used whenever creating, writing, or validating a git commit message. Apply when the user asks to commit, when staged changes are present, or when reviewing a commit message draft.
version: 1.2.0
model: sonnet
---

# Commit Message Format

Apply this format for every git commit message on this machine.

## Required Format

```
type(scope): TICKET-ID short description

Optional body — explain the "why", not the "what".

Optional footer — BREAKING CHANGE: ..., Closes #n
```

### Rules

1. **type** — required, must be one of:
   `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`

2. **(scope)** — optional, lowercase noun in parentheses (e.g. `auth`, `api`, `ui`)

3. **TICKET-ID** — required ticket reference from the project's issue tracker, placed immediately after `type(scope): ` and before the description.
   The exact format depends on the configured tracker — see `references/tracker.md` for the ID regex per backend:
   - **jira / linear**: uppercase prefix + hyphen + number (e.g. `PROJ-123`, `ENG-45`)
   - **github**: `#` + number (e.g. `#567`)
   - **clickup**: opaque 7–9 char id (e.g. `8669abc12`)

   If the ticket cannot be determined from the branch name or conversation context, ask the user before committing.

4. **description** — imperative mood, lowercase, no trailing period, kept concise

5. **Body / footer** — separated from the subject by a blank line; use for breaking changes or issue references

### Valid Examples

```
feat(auth): PROJ-123 add OAuth2 login with Google
fix(api): ENG-456 handle null response from payment gateway
chore: #789 upgrade dependencies to latest
docs(readme): 8669abc12 update setup instructions
```

### Invalid Examples

```
# Missing ticket
feat(auth): add login flow

# Ticket in wrong position
feat(auth): add login flow PROJ-123

# Wrong type
update(auth): PROJ-123 change login button color

# Subject not imperative / starts uppercase
feat: PROJ-123 Added login flow
```

## Generation Workflow

1. Inspect the staged diff (`git diff --cached`) to understand the changes
2. Infer the appropriate `type` and optional `scope` from the diff
3. Resolve tracker config (`<repo_root>/.claude/tracker.yaml` → `~/.claude/tracker.yaml`; see `references/tracker.md`). If neither exists, the ticket requirement is waived for this repo — skip the ticket field and proceed.
4. Extract the ticket id from the branch name using the regex for the configured `tracker.type` (see `references/tracker.md`). If not found, check recent commit messages, then ask the user.
5. Write a concise imperative description
6. Add a body only if the change is non-obvious or has a breaking change

## Validation Checklist

Before finalising any commit message, verify:

- [ ] type is a valid Conventional Commits type
- [ ] Ticket id is present and matches the regex for the configured tracker (jira/linear `[A-Z][A-Z0-9]+-\d+`, github `#?\d+`, clickup opaque id) — unless no tracker is configured
- [ ] Ticket appears after `type(scope): ` and before the description
- [ ] Description is imperative, lowercase, no trailing period
- [ ] Body/footer (if present) is separated by a blank line

## Hard Rules

- **Never** add a `Co-Authored-By:` line to any commit message
- **Never** commit without a ticket id when a tracker is configured — ask the user if it is unknown. If no tracker config exists, omit the ticket and continue.
