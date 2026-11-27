Save to `<resolved-dir>/<ticket-slug>.md`. When you tell the user where the plan landed in Stage 4, use the full relative path.

When the plan body summarises the ticket, **paraphrase** — do not copy bullet text verbatim from the fenced ticket description. The plan is a trusted artefact the user will edit and execute; if a quote from the ticket must appear, re-fence it inside the plan markdown.

```markdown
# <TICKET-KEY>: <Feature Name>

## Context

<problem being solved + ticket ref + key decisions from grill-me + architecture.md constraints>

## Execution Order

Phase 1 (PR 1) ──→ Phase 2 (PR 2) ──┐
└─→ Phase 3 (PR 3) ──┴─→ review + merge

Phases 2 and 3 are independent (different files) and can run in parallel after Phase 1 lands.

---

## Phase 1 (PR 1): <Title>

<vertical slice through all layers: types → service/mock → hooks → UI → tests>

## Phase 2 (PR 2): <Title>

<vertical slice>
```

**Vertical slice rule:** each phase must be independently demoable and verifiable end-to-end through all layers. A phase that only touches types, or only touches UI, is not a valid slice.

**Parallelism rules (first match wins):**

1. Phases writing to overlapping files → sequential
2. Phase establishes shared types/models/schemas used by later phases → sequential (must land first)
3. Phases with disjoint file trees → parallel
4. Uncertain → sequential (safe default — correctness over speed)
