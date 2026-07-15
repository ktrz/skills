# SKL-9: Restructure with a Phase 0

## Context

Some plans open with a mechanical Phase 0 (a whole-repo restructure) before feature phases.
The contract allows the phase run to start at 0 as well as 1.

## Execution Order

```
Phase 0 (PR 0) ──→ Phase 1 (PR 1) ──→ Phase 2 (PR 2)
```

Strictly sequential — each phase depends on the prior one landing.

---

## Phase 0 (PR 0): Mechanical restructure

Move-only PR, no content changes.

**Deliverable:** directories relocated; CI green.

## Phase 1 (PR 1): First feature slice

Depends on the Phase 0 layout.

**Deliverable:** first slice demoable.

## Phase 2 (PR 2): Second feature slice

Builds on Phase 1.

**Deliverable:** second slice demoable.
</content>
