# Changelog

## 1.1.0

- Fence external content per `references/prompt-injection-defense.md`. The handover doc's `**Comment:**` blocks are read as untrusted (fence preserved); bot comment bodies for bot-skim are wrapped in `<external_data trust="untrusted">` before the LLM judge runs. The Step 3 read→act gate is documented per the defense doc's two-phase rule. Trust Boundaries section added to `SKILL.md`.

## 1.0.0

- Initial release — reads marked-up handover doc, implements `[x]`/`[~]` items, batch-posts replies, resolves threads. Sole GitHub-write step in the auto loop.
