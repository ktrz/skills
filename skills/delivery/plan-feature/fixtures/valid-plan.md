# PROJ-123: Example notifications feature

## Context

Users can't see notifications in-app. This plan adds a notifications panel end-to-end.
Ticket: PROJ-123. Key decisions from grill-me: mock service first, real API later.

## Execution Order

```
Phase 1 (PR 1) ──→ Phase 2 (PR 2) ──┐
                                     ├─→ review + merge
                   Phase 3 (PR 3) ──┘
```

Phases 2 and 3 are independent (different files) and can run in parallel after Phase 1 lands.

---

## Phase 1 (PR 1): Data layer

Vertical slice through types → service/mock → hooks → tests.

- `notification-types.ts` — discriminated union types
- `notification-service.ts` — mock service

**TDD note:** service + hook tests first, then implementation.

**Deliverable:** hooks return mock data; `npm test` green.

## Phase 2 (PR 2): Panel UI

Vertical slice: panel component + tests.

**TDD note:** render tests first.

**Deliverable:** panel renders unread count.

## Phase 3 (PR 3): Mark-all-read

Vertical slice: mutation hook + button + tests.

**TDD note:** mutation tests first.

**Deliverable:** button clears unread count.

## Open Questions

1. Real API endpoint shape — deferred to a follow-up ticket.
</content>
