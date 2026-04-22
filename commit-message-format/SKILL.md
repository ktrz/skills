---
name: commit-message-format
description: This skill should be used whenever creating, writing, or validating a git commit message. Apply when the user asks to commit, when staged changes are present, or when reviewing a commit message draft.
version: 1.0.0
model: sonnet
---

# Commit Message Format

Apply this format for every git commit message on this machine.

## Required Format

```
type(scope): TICKET-123 short description

Optional body — explain the "why", not the "what".

Optional footer — BREAKING CHANGE: ..., Closes #n
```

### Rules

1. **type** — required, must be one of:
   `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`

2. **(scope)** — optional, lowercase noun in parentheses (e.g. `auth`, `api`, `ui`)

3. **TICKET-123** — required Jira ticket, placed immediately after `type(scope): ` and before the description.
   Format: uppercase project key + hyphen + number (e.g. `PROJ-123`, `ACME-42`).
   If the ticket cannot be determined from the branch name or conversation context, ask the user before committing.

4. **description** — imperative mood, lowercase, no trailing period, kept concise

5. **Body / footer** — separated from the subject by a blank line; use for breaking changes or issue references

### Valid Examples

```
feat(auth): PROJ-123 add OAuth2 login with Google
fix(api): PROJ-456 handle null response from payment gateway
chore: PROJ-789 upgrade dependencies to latest
docs(readme): PROJ-101 update setup instructions
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
3. Check the branch name for a Jira ticket (e.g. `feature/PROJ-123-...`); if not found, ask the user
4. Write a concise imperative description
5. Add a body only if the change is non-obvious or has a breaking change

## Validation Checklist

Before finalising any commit message, verify:

- [ ] type is a valid Conventional Commits type
- [ ] Jira ticket is present and correctly formatted (e.g. `PROJ-123`)
- [ ] Ticket appears after `type(scope): ` and before the description
- [ ] Description is imperative, lowercase, no trailing period
- [ ] Body/footer (if present) is separated by a blank line

## Hard Rules

- **Never** add a `Co-Authored-By:` line to any commit message
- **Never** commit without a Jira ticket — ask the user if it is unknown
