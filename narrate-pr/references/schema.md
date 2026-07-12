# walkthrough.json schema (v1)

Normative schema for `walkthrough.json`, the doc-as-data artifact `narrate-pr`
synthesizes from a pull request. This file is the single source of truth for
the document shape: the synthesizing model, `render.mjs`, and `validate.mjs`
all follow it. Where this doc and any other narrate-pr file disagree, this
doc wins.

The document is **doc-as-data**: every claim-bearing node carries a stable,
human-readable `id` and at least one receipt pointing back to evidence. The
renderer never invents content and never reflows a `depmap`'s `layout`
block — see "Design notes" at the end.

All examples on this page use invented, generic content: a toy PR adding a
"notifications" feature to a generic web app with packages `core`, `api`,
and `web`. Any resemblance to a real repo or PR is coincidental.

## Top-level fields

| Field            | Type    | Required | Meaning                                                                                                                                           |
| ---------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`        | integer | yes      | Schema version. `1` for this spec.                                                                                                                |
| `pr`             | object  | yes      | PR identity — see below.                                                                                                                          |
| `sha`            | string  | yes      | 40-hex commit SHA of the PR head at build time. All code receipts resolve against this SHA.                                                       |
| `generatedAt`    | string  | yes      | ISO 8601 timestamp of the build.                                                                                                                  |
| `packages`       | array   | yes      | Palette source for color-coding. May be empty for a single-package repo.                                                                          |
| `thesis`         | object  | yes      | One-paragraph statement of what the PR does and why.                                                                                              |
| `stats`          | object  | yes      | Diff stats — files/additions/deletions/commits.                                                                                                   |
| `architecture`   | object  | yes      | Prose, diagrams, channels, and boundaries describing the system shape.                                                                            |
| `components`     | array   | yes      | The units of code the PR touches or introduces.                                                                                                   |
| `reviewOrder`    | array   | yes      | Suggested dependency-ordered review path.                                                                                                         |
| `attentionSpots` | array   | yes      | Bounded set of "look closely here" locations.                                                                                                     |
| `tests`          | array   | yes      | Test coverage summary per area.                                                                                                                   |
| `qa`             | array   | yes      | Q&A entries. Empty at build; fills via the edit → re-render path.                                                                                 |
| `prComments`     | array   | yes      | PR review comments, rendered inline. Empty at build — the build never generates these; a future consumer (e.g. review-pr) may populate this slot. |

```json
{
  "version": 1,
  "pr": {
    "repo": "acme/webapp",
    "number": 482,
    "title": "Add in-app notifications",
    "branch": "feat/notifications",
    "base": "main"
  },
  "sha": "3f2a9c1d4e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c",
  "generatedAt": "2026-07-12T09:00:00Z",
  "packages": [
    { "id": "core", "label": "@acme/core" },
    { "id": "api", "label": "@acme/api" },
    { "id": "web", "label": "@acme/web" }
  ]
}
```

### `pr`

| Field    | Type    | Required | Meaning                         |
| -------- | ------- | -------- | ------------------------------- |
| `repo`   | string  | yes      | `owner/name`.                   |
| `number` | integer | yes      | PR number.                      |
| `title`  | string  | yes      | PR title.                       |
| `branch` | string  | yes      | Head branch name.               |
| `base`   | string  | yes      | Base branch name (e.g. `main`). |

### `stats`

| Field       | Type    | Required | Meaning                 |
| ----------- | ------- | -------- | ----------------------- |
| `files`     | integer | yes      | Count of files changed. |
| `additions` | integer | yes      | Lines added.            |
| `deletions` | integer | yes      | Lines deleted.          |
| `commits`   | integer | yes      | Commit count on the PR. |

### `packages`

| Field   | Type   | Required | Meaning                                                  |
| ------- | ------ | -------- | -------------------------------------------------------- |
| `id`    | string | yes      | Short identifier, referenced by `pkg` fields elsewhere.  |
| `label` | string | yes      | Display name (e.g. an npm package name or module label). |

Every `pkg` reference elsewhere in the document (on components, diagram
nodes/actors, boxes) MUST resolve to a `packages[].id`. `packages` is purely
a palette source — the renderer assigns one color per entry and reuses it
wherever that `id` appears as a `pkg` reference.

`packages[].id` values are palette keys, a separate namespace from node
ids: a plain lowercase token (e.g. `api`), unique within `packages[]`,
not required to match the `type.slug` node-id pattern — validation
rules 1 and 2 do not apply to them.

## thesis

A single claim node: what the PR does, in one paragraph.

| Field      | Type   | Required | Meaning                                                |
| ---------- | ------ | -------- | ------------------------------------------------------ |
| `id`       | string | yes      | MUST be `thesis.main`.                                 |
| `text`     | string | yes      | One-paragraph statement, plain text or short markdown. |
| `receipts` | array  | yes      | ≥1 receipt (claim-bearing node).                       |

```json
{
  "id": "thesis.main",
  "text": "Adds an in-app notifications feed: the API persists events and streams them to connected clients, and the web app renders a bell icon with an unread-count badge.",
  "receipts": [{ "kind": "code", "ref": "packages/api/src/notifications/service.ts:1-40" }]
}
```

## architecture

Free-form narrative and diagrams describing the system shape the PR
introduces or changes. All four sub-arrays are required but may be empty.

| Field        | Type  | Required | Meaning                                                                       |
| ------------ | ----- | -------- | ----------------------------------------------------------------------------- |
| `prose`      | array | yes      | Freeform markdown blocks, e.g. one per architectural theme.                   |
| `diagrams`   | array | yes      | Diagrams — see the Diagram union section.                                     |
| `channels`   | array | yes      | Named communication paths (e.g. "the persistence path", "the realtime path"). |
| `boundaries` | array | yes      | Trust or ownership boundaries worth calling out.                              |

### `architecture.prose[]`

| Field      | Type   | Required | Meaning                                                  |
| ---------- | ------ | -------- | -------------------------------------------------------- |
| `id`       | string | yes      | `prose.<slug>`.                                          |
| `md`       | string | yes      | Markdown body.                                           |
| `receipts` | array  | no       | Prose is not claim-bearing by itself; receipts optional. |

```json
{
  "id": "prose.delivery-path",
  "md": "Notifications are written once by the API and fanned out over two channels: a WebSocket push for connected clients, and a poll-on-mount fallback for cold loads.",
  "receipts": []
}
```

### `architecture.channels[]`

| Field      | Type   | Required | Meaning                                                  |
| ---------- | ------ | -------- | -------------------------------------------------------- |
| `id`       | string | yes      | `channel.<slug>`.                                        |
| `tag`      | string | yes      | Short badge text, e.g. `"Strong · realtime path"`.       |
| `title`    | string | yes      | Channel name.                                            |
| `points`   | array  | yes      | List of short strings describing the channel's behavior. |
| `receipts` | array  | yes      | ≥1 receipt (claim-bearing node).                         |

```json
{
  "id": "channel.realtime-push",
  "tag": "Strong · realtime path",
  "title": "WebSocket push",
  "points": [
    "Server pushes a notification event within one tick of persistence",
    "Client reconciles unread count from the event payload, not a refetch"
  ],
  "receipts": [{ "kind": "code", "ref": "packages/api/src/notifications/socket.ts:12-30" }]
}
```

### `architecture.boundaries[]`

| Field      | Type   | Required | Meaning                          |
| ---------- | ------ | -------- | -------------------------------- |
| `id`       | string | yes      | `boundary.<slug>`.               |
| `text`     | string | yes      | Statement of the boundary.       |
| `receipts` | array  | yes      | ≥1 receipt (claim-bearing node). |

```json
{
  "id": "boundary.tenant-isolation",
  "text": "Notification queries are always scoped by tenant id at the repository layer; no handler queries the notifications table directly.",
  "receipts": [{ "kind": "code", "ref": "packages/api/src/notifications/repo.ts:8-22" }]
}
```

## components

Units of code the PR touches or introduces (a module, a service, a UI
surface). One entry per component.

| Field        | Type   | Required | Meaning                                                           |
| ------------ | ------ | -------- | ----------------------------------------------------------------- |
| `id`         | string | yes      | `comp.<slug>`.                                                    |
| `pkg`        | string | yes      | Must resolve to a `packages[].id`.                                |
| `title`      | string | yes      | Display name.                                                     |
| `runtime`    | string | yes      | Free-form short string, e.g. `browser`, `server`, `shared`.       |
| `files`      | array  | yes      | `{ path, role }` entries — the files that make up this component. |
| `summary`    | string | yes      | Markdown description of what the component does.                  |
| `invariants` | array  | no       | Properties the component must maintain — see below.               |
| `receipts`   | array  | yes      | ≥1 receipt (claim-bearing node).                                  |

```json
{
  "id": "comp.notification-service",
  "pkg": "api",
  "title": "Notification service",
  "runtime": "server",
  "files": [
    { "path": "packages/api/src/notifications/service.ts", "role": "write path" },
    { "path": "packages/api/src/notifications/socket.ts", "role": "push path" }
  ],
  "summary": "Persists notification events and fans them out to connected clients over a WebSocket channel.",
  "invariants": [
    {
      "id": "inv.persist-before-push",
      "text": "An event is always durably persisted before it is pushed, so a reconnecting client can never miss one.",
      "receipts": [{ "kind": "code", "ref": "packages/api/src/notifications/service.ts:22-27" }]
    }
  ],
  "receipts": [{ "kind": "code", "ref": "packages/api/src/notifications/service.ts:1-40" }]
}
```

### `components[].invariants[]`

| Field      | Type   | Required | Meaning                           |
| ---------- | ------ | -------- | --------------------------------- |
| `id`       | string | yes      | `inv.<slug>`.                     |
| `text`     | string | yes      | The invariant, stated as a claim. |
| `receipts` | array  | yes      | ≥1 receipt (claim-bearing node).  |

## reviewOrder

A suggested, dependency-ordered path through the PR for a reviewer.

| Field        | Type    | Required | Meaning                                                |
| ------------ | ------- | -------- | ------------------------------------------------------ |
| `id`         | string  | yes      | `order.<slug>`.                                        |
| `step`       | integer | yes      | 1-based position in the suggested order.               |
| `scope`      | string  | yes      | What to look at in this step (files, component, area). |
| `timeboxMin` | integer | yes      | Suggested minutes to spend on this step.               |
| `rationale`  | string  | yes      | Why this step comes here in the order.                 |
| `receipts`   | array   | yes      | ≥1 receipt (claim-bearing node).                       |

```json
{
  "id": "order.contracts",
  "step": 1,
  "scope": "packages/api/src/notifications/types.ts",
  "timeboxMin": 10,
  "rationale": "The event shape is the contract every other component depends on; reading it first makes the service and UI diffs legible.",
  "receipts": [{ "kind": "code", "ref": "packages/api/src/notifications/types.ts:1-18" }]
}
```

## attentionSpots

A bounded set of "look closely here" locations — places where a reviewer's
attention pays off disproportionately.

| Field      | Type   | Required | Meaning                                                                                    |
| ---------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| `id`       | string | yes      | `spot.<slug>`.                                                                             |
| `loc`      | string | yes      | `path:line` — the location being flagged.                                                  |
| `why`      | string | yes      | Why this location deserves attention.                                                      |
| `group`    | string | yes      | Free-form grouping label (e.g. a scope or theme name), for clustering spots in the render. |
| `receipts` | array  | yes      | ≥1 receipt (claim-bearing node).                                                           |

```json
{
  "id": "spot.unread-count-race",
  "loc": "packages/web/src/notifications/useUnreadCount.ts:34",
  "why": "The unread count is derived from local socket state, not refetched; a dropped socket message during reconnect could leave the badge stale until the next event.",
  "group": "realtime path",
  "receipts": [{ "kind": "code", "ref": "packages/web/src/notifications/useUnreadCount.ts:28-40" }]
}
```

## tests

Per-area test coverage summary.

| Field      | Type   | Required | Meaning                                        |
| ---------- | ------ | -------- | ---------------------------------------------- |
| `id`       | string | yes      | `test.<slug>`.                                 |
| `area`     | string | yes      | Name of the area covered (component or theme). |
| `coverage` | string | yes      | Markdown summary of what is tested.            |
| `gaps`     | string | no       | Markdown summary of what is not tested.        |
| `receipts` | array  | yes      | ≥1 receipt (claim-bearing node).               |

```json
{
  "id": "test.notification-service",
  "area": "Notification service",
  "coverage": "Unit tests cover persist-then-push ordering and tenant-scoped queries.",
  "gaps": "No test exercises a dropped-socket reconnect scenario.",
  "receipts": [{ "kind": "code", "ref": "packages/api/src/notifications/service.test.ts:1-60" }]
}
```

## qa

Question/answer entries produced by the edit → re-render path. Empty
(`[]`) at build time; a build MUST NOT populate this array.

| Field       | Type   | Required | Meaning                                                                  |
| ----------- | ------ | -------- | ------------------------------------------------------------------------ |
| `id`        | string | yes      | `qa.<slug>`.                                                             |
| `q`         | string | yes      | The question.                                                            |
| `a`         | string | yes      | The answer.                                                              |
| `receipts`  | array  | yes      | ≥1 receipt (claim-bearing node).                                         |
| `revisedAt` | string | no       | ISO 8601 timestamp, set if the entry was edited after first being added. |

```json
{
  "id": "qa.reconnect-behavior",
  "q": "What happens to the unread badge if the WebSocket drops mid-session?",
  "a": "It goes stale until the next push or a manual refresh; there is no automatic reconciliation on reconnect.",
  "receipts": [{ "kind": "code", "ref": "packages/web/src/notifications/useUnreadCount.ts:28-40" }]
}
```

## prComments

Optional slot for PR review comments rendered inline alongside the
walkthrough. A narrate-pr build MUST leave this `[]`; a future consumer
(e.g. a review-pipeline integration) may populate it.

| Field      | Type   | Required | Meaning                                     |
| ---------- | ------ | -------- | ------------------------------------------- |
| `id`       | string | yes      | `comment.<slug>`.                           |
| `author`   | string | yes      | Commenter's display name or handle.         |
| `loc`      | string | no       | `path:line` the comment anchors to, if any. |
| `text`     | string | yes      | Comment body (markdown).                    |
| `receipts` | array  | yes      | ≥1 receipt (claim-bearing node).            |

```json
{
  "id": "comment.reconnect-followup",
  "author": "reviewer-1",
  "loc": "packages/web/src/notifications/useUnreadCount.ts:34",
  "text": "Should we reconcile the unread count on reconnect instead of waiting for the next push?",
  "receipts": [{ "kind": "url", "ref": "https://github.com/acme/webapp/pull/482#discussion_r1" }]
}
```

## Receipts

A receipt grounds a claim in evidence. Every claim-bearing node (see
"Validation rules" below) MUST carry at least one.

```json
{ "kind": "code", "ref": "packages/api/src/notifications/service.ts:22-27", "note": "persist-before-push ordering" }
```

| Field  | Type   | Required | Meaning                                     |
| ------ | ------ | -------- | ------------------------------------------- |
| `kind` | string | yes      | One of `code`, `doc`, `url`, `report`.      |
| `ref`  | string | yes      | Reference; shape depends on `kind` (below). |
| `note` | string | no       | Short human-readable annotation.            |

`ref` shape by `kind`:

- **`code`** — `path:line` or `path:line-line`, relative to repo root, valid at the document's `sha`.
- **`doc`** — `path:line` into an in-repo doc (README, ADR, etc.), relative to repo root.
- **`url`** — an absolute URL.
- **`report`** — `reports/<scope>.md#anchor`, pointing into a persisted research report.

## Diagram union

Every diagram, regardless of `type`, carries:

| Field     | Type   | Required | Meaning                                   |
| --------- | ------ | -------- | ----------------------------------------- |
| `id`      | string | yes      | `diagram.<slug>`.                         |
| `type`    | string | yes      | One of `lane`, `sequence`, `depmap`.      |
| `title`   | string | yes      | Display title.                            |
| `caption` | string | no       | Short caption rendered under the diagram. |

Diagrams themselves are not claim-bearing (no `receipts` field) — they
visualize structure already asserted (with receipts) elsewhere in the
document, typically by components, channels, or prose.

### `lane`

Rows of boxes and arrows within labeled lanes. The renderer auto-lays-out
lane rows with flexbox; there is no positional data to author.

```json
{
  "id": "diagram.write-path",
  "type": "lane",
  "title": "Write path",
  "caption": "A notification event moves from API to persisted state to client.",
  "lanes": [
    {
      "id": "lane.api",
      "label": "api",
      "rows": [
        [
          { "id": "box.handler", "label": "createNotification()", "pkg": "api" },
          { "arrow": "→" },
          { "id": "box.repo", "label": "NotificationRepo.insert()", "sub": "tenant-scoped", "pkg": "api" }
        ]
      ]
    }
  ]
}
```

| Field           | Type   | Required | Meaning                                       |
| --------------- | ------ | -------- | --------------------------------------------- |
| `lanes[].id`    | string | yes      | `lane.<slug>`.                                |
| `lanes[].label` | string | yes      | Lane display label.                           |
| `lanes[].rows`  | array  | yes      | Array of rows; each row is an array of cells. |
| cell (box)      | object | —        | `{ id, label, sub?, pkg? }`.                  |
| cell (arrow)    | object | —        | `{ arrow: "→" \| "⇄" \| "↓", label? }`.       |

### `sequence`

Actors and ordered steps. The renderer auto-lays-out steps in a grid; there
is no positional data to author.

```json
{
  "id": "diagram.socket-push",
  "type": "sequence",
  "title": "Realtime push on new notification",
  "actors": [
    { "id": "actor.api", "label": "Notification service", "pkg": "api" },
    { "id": "actor.socket", "label": "Socket gateway", "pkg": "api" },
    { "id": "actor.web", "label": "Web client", "pkg": "web" }
  ],
  "steps": [
    { "kind": "phase", "label": "Event persisted" },
    { "kind": "msg", "from": "actor.api", "to": "actor.socket", "label": "publish(event)" },
    { "kind": "msg", "from": "actor.socket", "to": "actor.web", "label": "notification:new" },
    { "kind": "self", "actor": "actor.web", "label": "reconcile unread count" }
  ]
}
```

| Field               | Type   | Required | Meaning                                                                 |
| ------------------- | ------ | -------- | ----------------------------------------------------------------------- |
| `actors[].id`       | string | yes      | `actor.<slug>`.                                                         |
| `actors[].label`    | string | yes      | Actor display label.                                                    |
| `actors[].sub`      | string | no       | Secondary label line.                                                   |
| `actors[].pkg`      | string | no       | Must resolve to a `packages[].id` if present.                           |
| `steps[].kind`      | string | yes      | One of `msg`, `self`, `phase`.                                          |
| `steps[]` (`msg`)   | object | —        | `{ kind: "msg", from, to, label, muted? }` — `from`/`to` are actor ids. |
| `steps[]` (`self`)  | object | —        | `{ kind: "self", actor, label }`.                                       |
| `steps[]` (`phase`) | object | —        | `{ kind: "phase", label }` — a section divider, no actors involved.     |

### `depmap`

A zoned dependency map: topology (`zones`, `nodes`, `edges`) plus a
separate, strippable `layout` block.

```json
{
  "id": "diagram.notification-depmap",
  "type": "depmap",
  "title": "Notification component dependencies",
  "zones": [
    { "id": "zone.api", "label": "api" },
    { "id": "zone.web", "label": "web" }
  ],
  "nodes": [
    {
      "id": "node.service",
      "zone": "zone.api",
      "label": "NotificationService",
      "sub": [],
      "chips": ["write path"],
      "pkg": "api"
    },
    {
      "id": "node.socket",
      "zone": "zone.api",
      "label": "SocketGateway",
      "sub": [],
      "chips": ["push path"],
      "pkg": "api"
    },
    { "id": "node.badge", "zone": "zone.web", "label": "UnreadBadge", "sub": [], "chips": [], "pkg": "web" }
  ],
  "edges": [
    { "from": "node.service", "to": "node.socket", "label": "publish", "kind": "call" },
    { "from": "node.socket", "to": "node.badge", "label": "notification:new", "kind": "net" }
  ],
  "layout": {
    "cols": 2,
    "nodes": {
      "node.service": { "col": 1, "row": 1 },
      "node.socket": { "col": 1, "row": 2 },
      "node.badge": { "col": 2, "row": 2 }
    }
  }
}
```

| Field           | Type    | Required | Meaning                                                    |
| --------------- | ------- | -------- | ---------------------------------------------------------- |
| `zones[].id`    | string  | yes      | `zone.<slug>`.                                             |
| `zones[].label` | string  | yes      | Zone display label.                                        |
| `nodes[].id`    | string  | yes      | `node.<slug>`.                                             |
| `nodes[].zone`  | string  | yes      | Must reference a `zones[].id`.                             |
| `nodes[].label` | string  | yes      | Node display label.                                        |
| `nodes[].sub`   | array   | no       | Secondary label lines.                                     |
| `nodes[].chips` | array   | no       | Short badge strings.                                       |
| `nodes[].pkg`   | string  | no       | Must resolve to a `packages[].id` if present.              |
| `edges[].from`  | string  | yes      | Must reference an existing `nodes[].id`.                   |
| `edges[].to`    | string  | yes      | Must reference an existing `nodes[].id`.                   |
| `edges[].label` | string  | no       | Edge label.                                                |
| `edges[].kind`  | string  | yes      | One of `call`, `net`, `type-only`.                         |
| `layout.cols`   | integer | yes      | Grid column count.                                         |
| `layout.nodes`  | object  | yes      | Map keyed by node id → `{ col, row, colSpan?, rowSpan? }`. |

`layout` is a hint/cache authored at synthesis time — **never load-bearing.**
It is a distinct block, strippable without loss of topology: a renderer
that ignores `layout` entirely must still be able to reconstruct full
topology from `zones` + `nodes` + `edges` alone. The reference renderer
draws SVG directly from `layout` (rects placed at each node's `col`/`row`,
orthogonal edges with arrowheads, zone frames, labels) and never
recomputes positions — a hand-authored or model-authored `layout` is
rendered exactly as given.

## Validation rules

`validate.mjs` implements these rules normatively; a document that
violates any of them is invalid.

1. **Id uniqueness.** Every node `id` in the document is unique
   document-wide. Applies to node ids only: `packages[].id` is a separate
   palette-key namespace (a plain lowercase token, unique within
   `packages[]`), and `layout.nodes` map keys are references checked by
   rule 6, not id declarations.
2. **Id pattern.** Every node `id` matches `^[a-z]+\.[a-z0-9-]+$` — a
   lowercase type prefix, a literal `.`, then a lowercase-kebab-case
   slug. Slugs MUST be human-readable (e.g. `comp.notification-service`),
   never positional/numeric (e.g. not `comp.001`). Applies to node ids
   only — `packages[].id` palette keys are not required to match this
   pattern.
3. **Receipts on claim-bearing nodes.** Each of the following node kinds
   requires at least one receipt: `thesis`, `architecture.channels[]`,
   `architecture.boundaries[]`, `components[]`, `components[].invariants[]`,
   `attentionSpots[]`, `tests[]`, `qa[]` entries, `prComments[]` entries.
4. **`sha` format.** `sha` is exactly 40 hex characters.
5. **Depmap edge references.** Every `depmap` edge's `from` and `to` value
   references an existing node id within that same diagram's `nodes[]`.
6. **Depmap layout key containment.** Every key in a `depmap`'s
   `layout.nodes` is a subset of that diagram's `nodes[].id` — no
   layout entry may reference a node that doesn't exist.
7. **Package references resolve.** Every `pkg` field anywhere in the
   document (components, diagram actors/nodes/boxes) resolves to a
   `packages[].id`.
8. **Code receipt ref shape.** Every receipt with `"kind": "code"` has a
   `ref` matching `path:line` or `path:line-line` (a repo-relative path,
   a colon, an integer line, optionally a hyphen and a second integer
   line no smaller than the first).
9. **Depmap zone references.** Every depmap node's `zone` value
   references an existing `zones[].id` within that same diagram.
10. **Sequence actor references.** Every sequence step of kind `msg` has
    `from`/`to` referencing existing `actors[].id` within that same
    diagram; every `self` step's `actor` likewise.

## Design notes

**Doc-as-data.** `walkthrough.json` is the source of truth; HTML is a
deterministic projection of it (`render.mjs`), never hand-edited. This
means the walkthrough can be revised (fold in a Q&A answer, fix a receipt,
add an attention spot) by editing JSON and re-rendering, without the model
re-deriving prose it already wrote correctly.

**Stable ids.** Every meaningful node has a human-readable, doc-unique id
(`comp.notification-service`, not `comp.3`). Stable ids let external
references (a Q&A answer citing an invariant, a future PR-comment linking
to an attention spot) survive re-renders and partial edits, and let a
diff between two versions of the same walkthrough be computed structurally
rather than by prose-matching.

**Strippable layout.** The `depmap.layout` block is deliberately
separated from `depmap` topology (`zones`/`nodes`/`edges`). Topology is
the fact of the document; `layout` is a rendering hint authored once at
synthesis time. Keeping it a separate, optional-in-spirit block means a
future renderer (or a different diagram engine entirely) can recompute
its own layout from topology alone if `layout` is stripped or ignored —
today's renderer simply chooses not to, and instead trusts the
synthesis-time placement verbatim.
