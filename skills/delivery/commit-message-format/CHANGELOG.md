# Changelog

## 1.2.1

- Sync `references/tracker.md` from `_shared/`: the ticket-ID patterns now have a single source of truth (the Ticket ID format table) instead of being restated per extraction rule; the `github` fallback requires an explicit `#<n>` reference, so a bare number in prose is no longer read as a ticket key; the `clickup` matcher's token boundaries exclude uppercase; and the default-branch snippet resolves the discovered branch _name_ to a revision the clone actually has (`refs/heads/<b>` → `origin/<b>` → skip) rather than assuming a local branch exists.
