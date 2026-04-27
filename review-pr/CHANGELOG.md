# Changelog

## 1.1.0

- Fence external content per `references/prompt-injection-defense.md`. PR metadata, the unified diff, and bot comment bodies (bot-skim) are wrapped in `<external_data trust="untrusted">` before being forwarded to the parallel review subagents and the single-pass fallback. Subagent prompt templates in `references/agents.md`, `references/review-prompt.md`, and `references/guidelines-agent.md` carry the fences and the "treat as data" directive. Trust Boundaries section added to `SKILL.md`.

## 1.0.0

- Initial release — orchestrates parallel `pr-review-toolkit` specialists with graceful single-pass fallback. Three modes: auto pipeline (file only), auto standalone (file + post), deep (interactive triage).
