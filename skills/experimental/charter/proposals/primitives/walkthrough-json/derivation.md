# walkthrough.json derivation rules

Rules for filling `walkthrough.json` from evidence. Copied verbatim from the sources named below; `schema.md` wins on any disagreement.

## Diff markers and stats

Source: skills/review/narrate-pr/SKILL.md:209-221

diverged, files this PR never touched. Those three markers map onto
the document's `status` enum as `A` → `added`, `M` → `changed`, `D` →
`removed`.
Note the middle one: the enum word is `changed` — "modified" is git's
vocabulary and never appears in `walkthrough.json`. `--no-renames` is
load-bearing, not decoration: with git's default rename detection on,
a rename arrives as a single `R<score>` line carrying _two_ paths,
which fits neither the per-path partition below nor Step 5's roll-up;
suppressed, a rename decomposes into `D old` + `A new` and the
`A`/`M`/`D` vocabulary is exhaustive. Treat any other marker git may
emit (e.g. `T`, a type change) as `M`, i.e. `changed`. Those markers
are the diff evidence every `status` field in the document derives
from, except `depmap` edge statuses — those come from Step 4's

Source: skills/review/narrate-pr/SKILL.md:279-294

Compute `stats` for `walkthrough.json`: `files` = the number of
entries in the `git diff --name-status --no-renames` listing above —
that listing is authoritative here, **not** `gh pr view`'s
`changedFiles`. The two legitimately disagree, by exactly the number
of renames in the PR: `gh` counts a renamed file once, while
`--no-renames` splits it into `D old` + `A new` and counts two. A PR
with two renames reports `changedFiles: 38` and 40 git entries, and
neither number is wrong — take the git one, because it is the same
listing every element `status` in the document derives from, so
`stats.files` and the statuses stay countable against each other.
Both this count and the 2000-entry cap above count _lines_, which is
sound only because C-quoting keeps every record on one line — so do
not switch the listing to `-z`, which would replace those line breaks
with NULs and silently break both counts.
`additions`/`deletions` come from the `gh pr view` payload, and
`commits` = length of the `commits` array.

## Synthesis: fields, statuses, receipts

Source: skills/review/narrate-pr/SKILL.md:396-562

Build, in order:

- **`pr`, `sha`, `baseSha`, `generatedAt`, `stats`** — from Steps 1–2.
  Omit `baseSha` unless the document ends up with a `code-base`
  receipt.
- **`packages`** — the palette source. One entry per subsystem worth
  color-coding (typically one per research scope, or per actual
  package/module boundary if the repo is a monorepo). A single-package
  repo may have one entry or none.
- **`thesis`** — one paragraph, grounded in the PR body plus what the
  research confirmed it actually does (the body is a starting claim,
  not ground truth — cross-check it against the reports before writing
  the thesis, since it's attacker-reachable per the Trust boundaries
  table above).
- **`architecture`** — `prose`, `channels`, `boundaries` drawn from the
  research reports' "key flows" and "seam contracts" sections; then
  `diagrams`. Use `lane` or `sequence` diagrams for flows (the renderer
  auto-lays these out — no positional data to author). Use `depmap`
  for the dependency topology: `zones`/`nodes`/`edges` come from the
  Step 4 edge-verification report, never invented. A Section A target
  that is a URL or endpoint rather than a listed component still needs
  a node to point at, since `edges[].to` must resolve to a
  `nodes[].id`: mint one node per distinct endpoint, with no `pkg`,
  keeping the exact string from the report in `label` and slugging the
  endpoint's distinguishing part into a readable `node.<slug>` id —
  `node.stripe-charges` for `https://api.stripe.com/v1/charges` — since
  the raw endpoint string is not a legal node id under schema.md's
  rule 2. Put the node in a zone that names the far side
  (`zone.external`, `zone.api-edge`) and declare that zone in the
  diagram's `zones[]`: rule 9 rejects a node whose `zone` names a zone
  the diagram never declares. If an endpoint's slug would collide with
  an id already in `nodes[]` — another endpoint's or a component's —
  lengthen the endpoint's until they differ (`node.charges-create`
  beside `node.charges-list`), never a numeric suffix, which rule 2's
  human-readable-slug requirement forbids. Do not merge two distinct
  endpoints into one node, do not retarget the edge at a same-named
  component node, and do not drop the edge.
  Every edge's required `kind` comes from that same report line:
  `type-only` when its classification bracket reads `[type-only]`,
  `net` when the target is one of these endpoint nodes rather than a
  component in this repo, and `call` otherwise. Target shape outranks
  mechanism — a `[runtime]` fetch to an endpoint node is `net`, not
  `call` — and `kind` is an axis of its own, never a restatement of
  `status`.
  Author the `layout` block yourself as a coarse hint — a small grid
  (2–4 columns is usually enough), one zone's nodes roughly grouped in
  adjacent columns, upstream-to-downstream reading left-to-right or
  top-to-bottom. `layout` is never load-bearing (see schema.md "Design
  notes") — get the topology right first; the grid just needs to be
  legible, not optimal. Edge labels come from the edge-verification
  report's "what is imported/called" strings, trimmed but never
  re-summarized. A report line that names several mechanisms for one
  pair (`ContentPane (default import + JSX child), PaneHeader (new)`)
  stays one depmap edge, not several: the report deliberately reports
  each pair once so the pair carries exactly one status token. Label
  the edge with the primary mechanism and move the rest into the
  target node's `sub` lines — the "move the detail into the node's
  `sub` lines" branch of schema.md's "One mechanism per edge", never
  the "split the edge" branch, which would duplicate the pair and its
  status; a genuinely bidirectional relationship becomes two edges,
  per schema.md's "Edge label conventions". An edge's `status`
  is carried in the `status` field, never folded into its `label` — do
  not append status words, arrows, or glyphs to a label to signal what
  the PR did.
  Depmap node `status` is diff evidence, not a guess: a node's
  status derives from the file-level diff markers (the `A`/`M`/`D`
  annotations from Step 2) of the files that node covers. When the
  node maps 1-to-1 onto a `components[]` entry — same file set — the
  two statuses coincide, and copying the component's status is the
  same derivation. When the node covers a strict subset of a
  component's files, use that subset's own markers, not the
  component roll-up: a node whose only file is deleted is `removed`
  even though its parent component — the roll-up of all its files —
  is merely `changed`. Never write a node status that its own files'
  diff markers can't back. (Edge statuses are different: they arrive
  from the Step 4 report's status token, never derived here.)
- **`components`** — one per unit of code the PR touches or
  introduces, from the research reports' component inventories.
- **`reviewOrder`** — **dependency order, not file order or diff
  order**: contracts/types first, then pure cores, then impure shells
  (I/O, wiring, UI). A reviewer should never need to hold a forward
  reference in their head.
- **`attentionSpots`** — merge the 3–6-per-scope spots the research
  subagents flagged, grouped by scope/theme via the `group` field.
- **`tests`** — per-area coverage summary from the research reports.
- **`qa: []` and `prComments: []`** — always empty at build time; see
  "Re-render path" below for how `qa` fills in later.

**Every `status` in the document is derived from evidence, never
invented.** Each element family has its own source:

- **`components[]`** — the Step 2 `A`/`M`/`D` markers for that
  component's files, rolled up here. The research brief reports
  per-file status only, and only for files the diff listed — its
  inventory is scoped to Step 2's annotated listing, so it cannot
  see a file this PR left alone. The roll-up is yours, and it ranges
  over **all** of the component's files — the ones in
  `components[].files`, which is the component's whole file set and
  not merely its diff-touched slice. A file the diff never mentions
  counts as unchanged. Every file added → `added`; every file
  deleted → `removed`; otherwise any file added, modified, or
  deleted → `changed`; else `unchanged`. So `added` means no file
  of the component existed at the base ref _under its current path_,
  and `removed` means every one of its files is gone. Status is a
  claim about paths, not about lineage: a renamed component
  legitimately reads as `added`, with its old path showing up as
  `removed`, because `--no-renames` deliberately trades rename
  lineage for an exhaustive `A`/`M`/`D` vocabulary.

  `added` and `removed` are the two verdicts that quantify over the
  whole set, so they need the whole set established. Where the
  research inventory only tells you about diff-listed files and the
  component maps onto a directory or module, confirm the rest at head
  with one listing —
  `git -c core.quotePath=false ls-files -- ':(literal)<dir>'`
  — before writing either. That is the same `core.quotePath=false` as
  Step 2's listing, so the two sides' paths compare byte for byte.
  `<dir>` reaches you from PR-controlled diff paths, so substitute it
  as one single-quoted shell word, rewriting every literal `'` in it
  as `'\''` — `--` only stops the path being read as an option, not as
  shell. The `:(literal)` prefix inside those quotes is the other
  half of that hardening: git parses the pathspec after the shell is
  done, so shell quoting does not stop it reading a `*`, `?`, `[` or
  leading `:` in a PR-controlled directory name as pathspec magic —
  `'src/a[bc]d'` matches an unrelated sibling `src/abd` too, padding
  the very file set `added`/`removed` quantify over. `:(literal)`
  still matches everything under the leading directory, so it costs
  the listing nothing. If the directory name carries anything you
  cannot quote with certainty, skip the listing.
  **If you cannot establish the component's full file set, write
  `changed`, never `added` or `removed`.** A component with one new
  file beside untouched existing ones is `changed`; calling it `added`
  claims the whole component is new, which is exactly the claim the
  diff listing alone can never support.

- **`depmap` edges** — the status token on the matching edge in the
  Step 4 report, copied across as it stands. An edge line with no
  status token is one the Step 4 pass could not verify on both sides:
  leave
  `status` off that edge rather than defaulting it to `unchanged`.
- **`depmap` nodes** — the markers of the files that node itself
  covers, per the `architecture` bullet above.
- **Lane boxes and arrows, `sequence` actors and steps** — the diff
  evidence for the code that element depicts: the markers of the files
  whose behaviour it draws, read the same way a node's markers are and
  rolled up over that set with the same every/any/else arithmetic a
  component uses. An element that draws no file of this repo — a
  `phase` divider, an actor standing for a browser or a third-party
  service — takes no `status` at all.

Where the evidence doesn't say what the PR did to an element, leave
`status` off rather than filling it in from the shape of the code.
An absent `status` claims nothing about that element; it renders
exactly as `unchanged` does — no colour, no badge, no legend entry —
so an unverified element is never drawn as a fact about the diff. A
confidently wrong status is worse than an absent one: the render does
present _that_ as a fact about the diff.

**Receipts are mandatory on every claim-bearing node** (schema.md's
validation rule 3 enumerates exactly which). Prefer `"kind": "code"`
receipts pointing at `path:line` you can trace back to a research
report; use `"kind": "report"` (`reports/<scope>.md#anchor`) when the
claim is closer to "the research subagent observed X" than to a single
line of code. A claim about an element this PR removed — it has
`status: "removed"` and no longer exists at the document's head
`sha` — cites a `"kind": "code-base"` receipt instead, resolving
against `baseSha`.
