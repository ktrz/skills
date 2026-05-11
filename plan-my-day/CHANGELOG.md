# Changelog

## 1.9.0

- Fence external content per `references/prompt-injection-defense.md`. monthly-review M2 fences the previous-month retro issue body, runs the canonical injection-keyword scan, drops only matched bullets (not the whole hint or section), emits a one-line warning, and hardens the posture-hint synthesis prompt (one sentence, paraphrase, no quotes or URLs). standup S0 and close-day C0 fence `ISSUE_BODY` at the read site so downstream phases reuse the same fenced view; standup S4 only echoes the freshly computed Standup block, never re-relays other sections. close-day C2 switches tick-matching from free-form LLM extraction to `TICKET_ID_REGEX` over Done bullets so tampered Done entries cannot steer checkbox flips beyond their literal token content. Trust Boundaries section added to `SKILL.md`.

## 1.8.0

- Earlier history not tracked in this file (see git log for prior commits)
