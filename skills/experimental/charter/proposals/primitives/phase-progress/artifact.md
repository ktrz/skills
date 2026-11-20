```markdown
# Phase 1 Progress

## Tests (write first)

- [ ] Service tests: filter by status, sort order, unread count, state transitions
- [ ] Hook tests: useNotifications — loading state, data shape, query key
- [ ] Hook tests: useUnreadCount — returns number, query key
- [ ] Hook tests: useMarkNotificationRead — mutation, invalidation
- [ ] Hook tests: useMarkNotificationArchived — mutation, invalidation, toast
- [ ] Hook tests: useMarkAllRead — mutation, invalidation, toast

## Implementation

- [ ] notification-types.ts — discriminated union types
- [ ] notification-query-keys.ts — query key factory
- [ ] notification-mock-data.ts — fixtures
- [ ] notification-service.ts — mock service with async functions
- [ ] use-notifications.ts — useQuery hook
- [ ] use-unread-count.ts — useQuery hook (staleTime 30s)
- [ ] use-mark-notification-read.ts — useMutation hook
- [ ] use-mark-notification-archived.ts — useMutation hook
- [ ] use-mark-all-read.ts — useMutation hook

## Verification

- [ ] npm run typecheck passes
- [ ] npm test passes (all new tests green, no regressions)
```

The agent must update this file as it works — checking off items as they are completed.

Progress tracking is a sibling artifact, not part of the plan file: a phase is
complete when `<plan-dir>/<plan-name>-phase-<N>-progress.md` exists with every
checkbox checked (see `implement-feature` Step 2).
