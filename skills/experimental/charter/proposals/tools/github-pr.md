# github-pr (gh pr create) notes

Facts about opening a PR with `gh`. Referenced by the toolchain map; read before first use. Copied from the old `create-pr` skill, unchanged.

## Stacked-branch detection

```bash
# Detect base branch (stacked PR detection)
git log --oneline --decorate | head -20
```

**Detecting a stacked branch:** If the branch diverged from another feature branch (not main/master), that feature branch is the base. Check with:

```bash
git log --oneline $(git merge-base HEAD main)..HEAD
# If commits are few and tightly scoped, confirm base branch by checking what the branch was created from
```

A reliable way to detect stacking:

```bash
# List branches that contain the fork point commit (other than main)
FORK=$(git merge-base HEAD main)
git branch --contains $FORK | grep -v "main\|master\|\*"
```

If the fork point is reachable from a feature branch (not just main), the PR is stacked on that branch. Use `--base <feature-branch>` when creating.

Source: skills/delivery/create-pr/SKILL.md:42-64

## Create command

Base command (no draft, not stacked):

```bash
gh pr create \
  --title "<title>" \
  --body "$(cat <<'EOF'
### Ticket

<TICKET_LINK> — Summary

### Description

- Bullet 1
- Bullet 2

### Test scenario

- [ ] Step 1
- [ ] Step 2
EOF
)"
```

- `--draft` is added for a draft PR.
- `--base <feature-branch>` is added when the PR is stacked.
- The `### Ticket` heading and `<TICKET_LINK>` line are removed from the body when no ticket was determined.

Source: skills/delivery/create-pr/SKILL.md:113-142

## Notes

- Do NOT push the branch yourself before running `gh pr create` — `gh` handles it or will prompt.
- If `gh pr create` fails because the branch isn't pushed, push it first: `git push -u origin <branch>`, then retry.
- Keep the test scenario steps short and imperative ("Open the system page", "Click the zip file", "Verify artifacts appear below").
- `~/.claude/create-pr.yaml` carries no keys; tracker settings live in `tracker.yaml`.
- The default branch is derived (`origin/HEAD`, then the remote, then local `main`/`master`), never hard-coded as `main`; the derivation snippet is in `tools/nwt.md`.

Source: skills/delivery/create-pr/SKILL.md:23-25, 152-156
