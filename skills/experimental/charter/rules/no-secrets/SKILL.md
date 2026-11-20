---
name: no-secrets
version: 0.1.0
disable-model-invocation: true
description: No credential, token, or personal data enters a commit, PR, comment, log, or request to an outside service.
---

# Rule: no secrets

**Rule.** No credential, token, or personal data enters a commit, PR, comment, log, or request to an outside service.

**Why.** Anything published or sent out may be cached, indexed, or forked, and cannot be reliably taken back. Rotating a leaked credential is the only real remedy.

**Applies.** Every commit, PR title and body, review comment, tracker comment, log file, and call to a web service or MCP tool. Personal data means the user's or third parties' private details beyond what the destination already holds. Exempt: git author metadata, handles of people already on the PR/ticket, project details sent to the project's own repo and tracker, gitignored files that stay local.

**Check.** You can show that the staged diff, PR text, and outgoing request payloads contain no keys, tokens, passwords, or private personal details, and that `.env`-style files are not tracked.

**If it blocks you.** If a secret is already in a commit or sent out, stop, tell the user which one and where, and do not rewrite shared history yourself. If a task needs a secret to proceed, ask the user for a safe way to supply it.
