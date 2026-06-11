# Changelog

## 1.10.0

- Suppress already-actioned review asks. Phase 3 gains a "Resolve review state for referenced PRs" sub-step: after Slack dedup, fenced message bodies are scanned for PR references (`github.com/<owner>/<repo>/pull/<N>` URLs, plus `#N` only with repo context), mapped to `(repo, N, message_ts)`, and review state for those PRs plus all `reviewRequested` PRs is fetched in one `gh api graphql` batch (`state`, `reviews(last: 20) { author { login }, submittedAt }`, `viewer { login }` → `ME_LOGIN`) — no new `allowedTools` entry needed. Phase 4 gains a suppression rule: a "Review PR #N" bullet is dropped when the PR is merged/closed, moved to a quiet "Already handled" sub-note when `ME_LOGIN` reviewed at/after the Slack ask (`submittedAt >= message_ts`) or, for `reviewRequested` entries, has any submitted review; anything uncertain (no review, lookup error) stays in "Do first". Trust boundaries table gains a row for review author logins + timestamps (structured, compared not quoted, LOW).

## 1.9.0

- Fence external content per `references/prompt-injection-defense.md`. monthly-review M2 fences the previous-month retro issue body, runs the canonical injection-keyword scan, drops only matched bullets (not the whole hint or section), emits a one-line warning, and hardens the posture-hint synthesis prompt (one sentence, paraphrase, no quotes or URLs). standup S0 and close-day C0 fence `ISSUE_BODY` at the read site so downstream phases reuse the same fenced view; standup S4 only echoes the freshly computed Standup block, never re-relays other sections. close-day C2 switches tick-matching from free-form LLM extraction to `TICKET_ID_REGEX` over Done bullets so tampered Done entries cannot steer checkbox flips beyond their literal token content. Trust Boundaries section added to `SKILL.md`.

## 1.8.0

- Earlier history not tracked in this file (see git log for prior commits)
