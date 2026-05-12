# Changelog

## 1.2.0

- Rename `bot-skim` → `overlap-skim` in lockstep with `review-pr` 1.2.0. Step 3b heading, prose, output lines, and the Trust Boundaries table all updated. The mechanism is unchanged; only the name reflects what it actually does (content overlap, not author class). **Breaking:** any external automation grepping log lines for `Bot-skim suppressed:` needs to switch to `Overlap-skim suppressed:`

## 1.1.0

- Fence external content per `references/prompt-injection-defense.md`. The handover doc's `**Comment:**` blocks are read as untrusted (fence preserved); bot comment bodies for bot-skim are wrapped in `<external_data trust="untrusted">` before the LLM judge runs. The Step 3 read→act gate is documented per the defense doc's two-phase rule. Trust Boundaries section added to `SKILL.md`.

## 1.0.0

- Initial release — reads marked-up handover doc, implements `[x]`/`[~]` items, batch-posts replies, resolves threads. Sole GitHub-write step in the auto loop.
