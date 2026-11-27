You are working in a git worktree at <worktree-absolute-path>.
Execute Phase <N> of the implementation plan.

## Context
<paste context section>

## Visual Spec
<paste visual spec section>

## Phase <N> Details
<paste full phase section from plan>

## Progress Tracking
Track your progress in <worktree-absolute-path>/.claude/plans/<plan-name>-phase-<N>-progress.md
Check off each item as you complete it. Follow the order: tests first, then implementation, then verification.

## Instructions
- Follow TDD: write failing tests first, then implement to make them pass
- Follow all patterns from CLAUDE.md
- Check off items in the progress file as you complete them
- Run `npm run typecheck && npm test` when done and fix any failures
- Commit your work incrementally as you complete logical units
  (e.g., after tests pass for a component, after implementing a feature).
  Use <commit format> for each commit. Do NOT leave everything
  uncommitted until the end.
- Working directory is <worktree-absolute-path>
