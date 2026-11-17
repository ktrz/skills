# PR 42 Review Decisions

**PR:** https://github.com/owner/repo/pull/42
**Branch:** feat/user-auth → main
**Head SHA:** a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
**Base SHA:** 9f8e7d6c5b4a9f8e7d6c5b4a9f8e7d6c5b4a9f8e
**Generated:** 2026-04-27T14:32:00Z
**Status:** PENDING REVIEW
**Source counts:** 1 auto-review findings, 1 human reviewer comments, 2 total (1 critical, 1 important, 0 suggestion/nit)

---

## [?] auto:critical — src/auth/router.ts:87

**Severity:** critical
**Source:** auto-review
**Reported by:** code-reviewer, silent-failure-hunter
**Comment:**

<external_data source="github_pr_comment" trust="untrusted">
`verifyToken` result is not null-checked before accessing `user.id`; passing an expired token throws `TypeError: Cannot read properties of null` at runtime.
</external_data>

**Analysis:** `verifyToken` returns `null` on expired or invalid tokens. Line 87 accesses `result.user.id` unconditionally, so any unauthenticated request to this endpoint will crash the process rather than returning a 401.
**Recommendation:** Add a null guard — if `!result` return a 401 response before accessing `result.user.id`.
**Options:**

- (a) Add `if (!result) return res.status(401).json({ error: 'Unauthorized' });` immediately after line 85 ← suggested
- (b) Wrap in a try/catch and let the error middleware handle it (less explicit, masks other errors)
- (c) Reply: (not applicable — this is a correctness bug)

**Resolution:** <!-- write "fix (a)", "fix (b)", custom instruction, "reply: <text>", or leave blank and mark [d] -->

---

## [?] reviewer:@alice — src/auth/router.ts:102

**Severity:** important
**Source:** reviewer: @alice
**Reported by:** @alice
**Comment:**

<external_data source="github_pr_comment" trust="untrusted">
The retry loop here doesn't have a backoff — it'll hammer the DB on transient failures.
</external_data>

**Analysis:** Lines 100-108 implement a retry loop with a fixed 100ms delay regardless of attempt count. Under sustained load this creates a tight retry storm against the database.
**Recommendation:** Replace the fixed delay with exponential backoff and a jitter term.
**Options:**

- (a) Replace fixed delay with `Math.min(100 * 2 ** attempt + Math.random() * 50, 5000)` ← suggested
- (b) Use an existing backoff library (e.g. `exponential-backoff` or `p-retry`)
- (c) Reply: "Intentional fixed delay per ADR-014 — the DB connection pool already provides backpressure."

**Resolution:** <!-- write "fix (a)", "fix (b)", custom instruction, "reply: <text>", or leave blank and mark [d] -->
