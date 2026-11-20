# narrate-pr notes

Facts about the walkthrough scripts and commands, copied from the old `narrate-pr` skill. Referenced by the toolchain map; read before first use. `render.mjs` here is a byte copy of `skills/review/narrate-pr/render.mjs`; the validator ships with primitive `walkthrough-json`.

## Output directory

Source: skills/review/narrate-pr/SKILL.md:69-95

```
plans.local/<repo>/pr-<N>/walkthrough/
  walkthrough.json          # the doc-as-data source of truth
  walkthrough.html          # standalone render (opens directly in a browser)
  walkthrough.fragment.html # body-only render, regenerated each publish, source for the Artifact tool
  reports/
    <scope>.md              # one per research scope, persisted verbatim
    edges.md                # the single edge-verification report
```

- `<repo>` is `<owner>-<repo-name>` from the origin remote, falling back to `basename $(git rev-parse --show-toplevel)` only when there is no origin remote.
- `<N>` is the PR number. Commands run from the repo root, never from inside the output directory.

## Pin and scout commands

Source: skills/review/narrate-pr/SKILL.md:108-134, 187-193

```bash
gh pr view <N> --json headRefOid,baseRefOid,baseRefName --jq '{head: .headRefOid, base: .baseRefOid, baseBranch: .baseRefName}'
git rev-parse HEAD
git merge-base <baseRefOid> HEAD
```

```bash
gh pr view <N> --json title,body,additions,deletions,changedFiles,commits,headRefName,baseRefName
git -c core.quotePath=false diff --name-status --no-renames <effective base>..HEAD
gh repo view --json nameWithOwner
```

- Tracked-file cleanliness check: `git diff --quiet HEAD --` must exit 0. Untracked files are fine.
- `git merge-base` needs the base commit locally: `git fetch <base remote> 'refs/heads/<baseRefName>'`, where `<base remote>` is the remote of the PR's base repository (not `origin` when `origin` is a fork clone). `<baseRefName>` is PR-controlled: one single-quoted shell word, every literal `'` rewritten as `'\''`.
- Size caps (SKILL.md:263-277): title + body at most 20 KB combined; diff file list at most 2000 entries.
- Never switch the listing to `-z`: counts rely on one record per line.

## Validate and render

Source: skills/review/narrate-pr/SKILL.md:570-589

```bash
node <skill-dir>/validate.mjs <output-dir>/walkthrough.json
node <skill-dir>/render.mjs --standalone <output-dir>/walkthrough.json > <output-dir>/walkthrough.html
node <skill-dir>/render.mjs <output-dir>/walkthrough.json > <output-dir>/walkthrough.fragment.html
```

- `--standalone` is a complete HTML document; without it, `render.mjs` emits a body-only fragment, the form the Artifact tool wants.
- Optional: `node <skill-dir>/render.mjs --report-map <output-dir>/report-urls.json <output-dir>/walkthrough.json > <output-dir>/walkthrough.fragment.html`. The map is `{ "reports/api.md": "https://claude.ai/…" }`. Without it, report receipts are relative links in standalone output and non-clickable badge chips in the fragment (SKILL.md:674-690).
- Usage line from the script: `node render.mjs [--standalone] [--report-map <map.json>] <walkthrough.json>`.

## Pre-publish checks

Source: skills/review/narrate-pr/SKILL.md:593-654

```bash
gh pr view <N> --json headRefOid --jq .headRefOid
git rev-parse HEAD
git diff --quiet HEAD --
```

```bash
gh pr view <N> --json baseRefName,baseRefOid
git fetch <base remote> 'refs/heads/<baseRefName>'   # an advanced tip may not be local yet
git merge-base <baseRefOid> HEAD
```

- A base branch that advanced without changing the merge base invalidates nothing. If the re-read `baseRefName` differs from the one pinned earlier but the merge base is the same, only the `pr.base` label is stale.

## Publish

Source: skills/review/narrate-pr/SKILL.md:656-712

- Publish `walkthrough.fragment.html` via the Artifact tool. The same file path on every republish keeps the URL.
- Give each publish a short version label (the sha prefix, "initial", "re-render: added Q&A"). Keep one favicon emoji per PR walkthrough.
- A fresh session has no memory of the URL: passing the same path mints a new URL. To update the same artifact, pass the previous artifact's URL (ask the user, or use the Artifact tool's list action).
- Artifacts start private; a report artifact must be shared too for its link to work for others.
- Publishing needs an OAuth-authenticated session; API-key sessions cannot publish. Then the `walkthrough.html` path is the deliverable.
- The final message carries the artifact URL (or the HTML path and why), the persisted paths, the scope list and the attention-spot count.
