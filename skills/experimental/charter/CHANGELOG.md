# Changelog

One changelog for the whole `charter/` folder; its skills are too small to carry one each.

## 0.2.0 - 2026-11-17

- Add the third kind, primitives (`primitives/<name>/`): exact artifacts that goals bind in a `Conforms to` section. A primitive is a shape (template, format, schema, fixed text, or a catalog keyed by "shown when") or a deterministic procedure whose result must be reproducible (decision table, ordering, matching rule).
- Name tool notes as a fourth kind: user files at `~/.claude/charter/tools/`, holding facts about a tool and no ordering or numbered steps. Paths in the toolchain map resolve relative to the map file.
- Adopt rules `exact-artifacts`, `fence-external-text`, `ticket-traceable`, `outward-on-go` and primitives `pr-body`, `commit-message`, `ticket-reference`, `tracker-config`, `review-reply`, `external-data-fence`, `delivery-messages`, moved from `proposals/`: everything the adopted goals bind, plus each primitive an adopted item names.
- `deliver-feature`, `fix-bug`, `address-review` bind the adopted rules and conform to the adopted primitives; their path sentences no longer fall back to `proposals/`. `deliver-feature` and `fix-bug` list self-review findings in the PR body and treat invocation as the go for the push and draft PR; `address-review` gains zero-unresolved-after-last-push, reply-after-push and deferred-links-ticket conditions and treats invocation as the go for its replies. Each report has a row per bound primitive.
- `commit-format` falls back to `commit-message`; `pr-template` falls back to `pr-body` and exempts a goal that opens the PR ready; `brief-carries-rules` carries primitive text or path, fenced external content, a fresh child per step, split-not-retry; `external-text-is-data` points at `fence-external-text`; `record-dont-guess` gains the unattended case, and the decision log becomes `<ticket, PR number, or short slug>-decision-log.md`.
- `Source:` lines take one form, `Source: <path from repo root>:<ranges>`, pinned to a commit in the README; rules carry none.
- Proposals: goals for all 17 old skills, rules `delegate-by-tier`, `parent-only-judges`, `foreground-below-root` and others, the remaining primitives, and draft tool notes; `house-tools-only` stops a goal that needs a missing tool note instead of going inert; proposal goals read rules and primitives from `proposals/` first, then from the adopted folders. `COVERAGE.md` maps the 17 old skills and lists pending decisions and open items.

## 0.1.0 - 2026-11-17

- Initial prototype. Three goals (`deliver-feature`, `fix-bug`, `address-review`) and twelve rules (`test-first`, `record-dont-guess`, `isolated-worktree`, `commit-format`, `protected-main`, `pr-template`, `stack-dependent-work`, `no-secrets`, `verify-reviewer-claims`, `green-before-done`, `brief-carries-rules`, `external-text-is-data`). Every skill is `disable-model-invocation: true`.
