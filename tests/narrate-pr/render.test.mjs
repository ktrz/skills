// render.test.mjs — black-box tests for render.mjs via the CLI.
// Zero deps: node:test + node:assert/strict. Run: node --test "tests/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RENDER = join(HERE, "..", "..", "skills", "review", "narrate-pr", "render.mjs");
const FIXTURE = join(HERE, "..", "..", "skills", "review", "narrate-pr", "fixtures", "sample-mini.json");

const tmp = mkdtempSync(join(tmpdir(), "narrate-pr-render-"));
process.on("exit", () => rmSync(tmp, { recursive: true, force: true }));

let seq = 0;
function writeJson(value) {
  const file = join(tmp, `input-${seq++}.json`);
  writeFileSync(file, JSON.stringify(value));
  return file;
}

function run(args) {
  return spawnSync(process.execPath, [RENDER, ...args], { encoding: "utf8" });
}

// Render a doc, asserting success; returns stdout HTML.
function render(doc, flags = []) {
  const res = run([...flags, writeJson(doc)]);
  assert.equal(res.status, 0, `render.mjs exited ${res.status}: ${res.stderr}`);
  return res.stdout;
}

function makeDoc(overrides = {}) {
  return {
    pr: { repo: "acme/widgets", number: 7, title: "Test PR", base: "main", branch: "feat/x" },
    sha: "0123456789abcdef0123456789abcdef01234567",
    packages: [],
    thesis: { id: "thesis.main", text: "Thesis." },
    ...overrides,
  };
}

const thesisWith = (text, receipts) => ({ id: "thesis.main", text, ...(receipts ? { receipts } : {}) });

// ---------------------------------------------------------------------------
// Fix 1 — scheme allowlist on every emitted href
// ---------------------------------------------------------------------------

test("inlineMd: javascript: markdown link renders as plain text, no href", () => {
  const out = render(makeDoc({ thesis: thesisWith("See [x](javascript:alert%281%29) now.") }));
  assert.ok(!out.includes("javascript:"), "javascript: URL must not appear in output");
  assert.ok(out.includes("See x now."), "link text must survive as plain text");
});

test("inlineMd: javascript: link with raw parens still emits no scheme", () => {
  const out = render(makeDoc({ thesis: thesisWith("See [x](javascript:alert(1)) now.") }));
  assert.ok(!out.includes("javascript:"), "javascript: URL must not appear in output");
});

test("inlineMd: https markdown link renders as anchor", () => {
  const out = render(makeDoc({ thesis: thesisWith("See [x](https://example.com) now.") }));
  assert.ok(out.includes('<a href="https://example.com">x</a>'));
});

test("inlineMd: url with _ and * is not mangled by emphasis pass", () => {
  const url = "https://host/my_page_here/a*b";
  const out = render(makeDoc({ thesis: thesisWith(`See [x](${url}) now.`) }));
  assert.ok(out.includes(`<a href="${url}">x</a>`), "href must survive _ and * untouched");
  assert.ok(!out.includes("<em>"), "no <em> injected into the URL");
});

test("inlineMd: inline code inside link text is restored, not dropped", () => {
  const out = render(makeDoc({ thesis: thesisWith("See [the `cfg` flag](https://example.com) now.") }));
  assert.ok(out.includes('<a href="https://example.com">the <code>cfg</code> flag</a>'), "code inside link text must survive");
  assert.ok(!out.includes("\uE000"), "no leftover placeholder sentinel in output");
});

test("inlineMd: user text carrying a sentinel char cannot forge a placeholder", () => {
  const out = render(makeDoc({ thesis: thesisWith("Weird \uE000C0\uE000 and \uE000L0\uE000 text.") }));
  assert.ok(!out.includes("undefined"), "forged sentinels must not resolve to undefined/markup");
  assert.ok(!out.includes("<code>"), "no <code> conjured from user-supplied sentinel");
  assert.ok(out.includes("&#xE000;"), "raw sentinel char is entity-encoded, not passed through");
});

test("url receipt with data: ref gets no href", () => {
  const out = render(makeDoc({
    thesis: thesisWith("T.", [{ kind: "url", ref: "data:text/html,hi", note: "sneaky" }]),
  }));
  assert.ok(!out.includes('href="data:'), "data: URL must not become an href");
  assert.match(out, /<span class="receipt receipt-url"/, "unsafe url receipt renders as span");
});

test("url receipt with https ref renders as anchor", () => {
  const out = render(makeDoc({
    thesis: thesisWith("T.", [{ kind: "url", ref: "https://example.com/docs", note: "docs" }]),
  }));
  assert.match(out, /<a class="receipt receipt-url" href="https:\/\/example\.com\/docs"/);
});

test("report receipt with traversal-shaped ref gets no href", () => {
  const out = render(makeDoc({
    thesis: thesisWith("T.", [{ kind: "report", ref: "reports/../../etc/passwd.md" }]),
  }), ["--standalone"]);
  assert.ok(!out.includes('href="reports/../'), "invalid report ref must not link");
  assert.match(out, /<span class="receipt receipt-report"/);
});

// ---------------------------------------------------------------------------
// Fix 2 — report receipts per mode + --report-map
// ---------------------------------------------------------------------------

const reportDoc = () => makeDoc({
  thesis: thesisWith("T.", [{ kind: "report", ref: "reports/api.md#overview" }]),
});

test("fragment mode without map: report receipt is a badge with local-path tooltip", () => {
  const out = render(reportDoc());
  assert.ok(!out.includes('href="reports/'), "fragment mode must not emit a dead relative link");
  assert.match(
    out,
    /<span class="receipt receipt-report"[^>]*title="[^"]*local: reports\/api\.md#overview/,
    "badge must carry the local path in its title tooltip",
  );
});

test("fragment mode with map: report receipt links to mapped https URL, anchor dropped", () => {
  const map = writeJson({ "reports/api.md": "https://claude.ai/artifacts/abc123" });
  const out = render(reportDoc(), ["--report-map", map]);
  assert.ok(out.includes('<a class="receipt receipt-report" href="https://claude.ai/artifacts/abc123"'));
  assert.ok(!out.includes("abc123#"), "the #anchor fragment must be dropped from the mapped URL");
});

test("map entry with javascript: URL falls back to badge", () => {
  const map = writeJson({ "reports/api.md": "javascript:alert(1)" });
  const out = render(reportDoc(), ["--report-map", map]);
  assert.ok(!out.includes("javascript:"), "unsafe map URL must not become an href");
  assert.match(out, /<span class="receipt receipt-report"/);
});

test("standalone without map: report receipt keeps working relative href", () => {
  const out = render(reportDoc(), ["--standalone"]);
  assert.ok(out.includes('href="reports/api.md#overview"'));
});

test("standalone with map: relative href still wins (behavior unchanged)", () => {
  const map = writeJson({ "reports/api.md": "https://claude.ai/artifacts/abc123" });
  const out = render(reportDoc(), ["--standalone", "--report-map", map]);
  assert.ok(out.includes('href="reports/api.md#overview"'));
});

test("--report-map with unreadable/unparsable file fails with a clear error", () => {
  const bad = join(tmp, "bad-map.json");
  writeFileSync(bad, "{nope");
  const res = run(["--report-map", bad, writeJson(makeDoc())]);
  assert.notEqual(res.status, 0, "unparsable map must be a hard error");
  assert.match(res.stderr, /report map/i);
});

// ---------------------------------------------------------------------------
// Fix — depmap-only architecture must not emit an empty Architecture section
// ---------------------------------------------------------------------------

const depmapOnly = () => makeDoc({
  architecture: {
    diagrams: [{
      id: "dg.dep", type: "depmap", title: "Deps",
      zones: [{ id: "z.a", label: "A" }],
      nodes: [{ id: "node.x", label: "X", zone: "z.a" }],
      edges: [],
      layout: { cols: 1, nodes: { "node.x": { col: 1, row: 1 } } },
    }],
  },
});

test("depmap-only architecture emits no Architecture section or TOC entry", () => {
  const out = render(depmapOnly());
  assert.ok(!out.includes('href="#architecture"'), "no TOC entry for empty Architecture section");
  assert.ok(!out.includes('id="architecture"'), "no empty Architecture section shell");
});

test("depmap-only architecture still renders the depmap under Components", () => {
  const out = render(depmapOnly());
  assert.ok(out.includes('href="#components"'), "Components section present for the depmap");
});

// ---------------------------------------------------------------------------
// Fix — GitHub blob URLs percent-encode path segments
// ---------------------------------------------------------------------------

test("code receipt with a space in the path is percent-encoded in the blob URL", () => {
  const out = render(makeDoc({
    thesis: thesisWith("T.", [{ kind: "code", ref: "src/my file.js:10" }]),
  }));
  assert.ok(out.includes("blob/0123456789abcdef0123456789abcdef01234567/src/my%20file.js#L10"),
    "space in path must be encoded, separators and #L anchor preserved");
  assert.ok(!/href="[^"]*src\/my file\.js/.test(out), "raw unencoded path must not appear in an href");
});

// ---------------------------------------------------------------------------
// Router — a direct edge must not cut through an intermediate node
// ---------------------------------------------------------------------------

function polylinePoints(html) {
  const out = [];
  const re = /<polyline[^>]*points="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1].trim().split(/\s+/));
  return out;
}

// Node rects in declaration order (rendered via `nodes.map(...)`, same order
// as the fixture's `nodes` array), so the Nth match corresponds to the Nth
// declared node.
function nodeRects(html) {
  const out = [];
  const re = /<rect class="node" x="([\d.-]+)" y="([\d.-]+)" width="([\d.-]+)" height="([\d.-]+)"/g;
  let m;
  while ((m = re.exec(html))) out.push({ x: Number(m[1]), y: Number(m[2]), w: Number(m[3]), h: Number(m[4]) });
  return out;
}

const rowDepmap = (withBlocker) => makeDoc({
  architecture: {
    diagrams: [{
      id: "diagram.row", type: "depmap", title: "Row",
      zones: [{ id: "zone.a", label: "A" }],
      nodes: [
        { id: "node.a", label: "Aye", zone: "zone.a" },
        ...(withBlocker ? [{ id: "node.b", label: "Bee", zone: "zone.a" }] : []),
        { id: "node.c", label: "Cee", zone: "zone.a" },
      ],
      edges: [{ from: "node.a", to: "node.c", label: "x", kind: "call" }],
      layout: {
        cols: 3,
        nodes: {
          "node.a": { col: 1, row: 1 },
          ...(withBlocker ? { "node.b": { col: 2, row: 1 } } : {}),
          "node.c": { col: 3, row: 1 },
        },
      },
    }],
  },
});

test("depmap edge detours around an intermediate node instead of crossing it", () => {
  const polys = polylinePoints(render(rowDepmap(true)));
  assert.equal(polys.length, 1, "one edge → one polyline");
  assert.equal(polys[0].length, 4, "blocked direct route must become a 4-point orthogonal detour");
});

test("depmap edge over a clear span stays a straight 2-point leg", () => {
  const polys = polylinePoints(render(rowDepmap(false)));
  assert.equal(polys.length, 1, "one edge → one polyline");
  assert.equal(polys[0].length, 2, "unobstructed horizontal route stays direct");
});

const colDepmap = (withBlocker) => makeDoc({
  architecture: {
    diagrams: [{
      id: "diagram.col", type: "depmap", title: "Column",
      zones: [{ id: "zone.a", label: "A" }],
      nodes: [
        { id: "node.a", label: "Aye", zone: "zone.a" },
        ...(withBlocker ? [{ id: "node.b", label: "Bee", zone: "zone.a" }] : []),
        { id: "node.c", label: "Cee", zone: "zone.a" },
      ],
      edges: [{ from: "node.a", to: "node.c", label: "y", kind: "call" }],
      layout: {
        cols: 1,
        nodes: {
          "node.a": { col: 1, row: 1 },
          ...(withBlocker ? { "node.b": { col: 1, row: 2 } } : {}),
          "node.c": { col: 1, row: withBlocker ? 3 : 2 },
        },
      },
    }],
  },
});

test("depmap edge in a single column detours around an intermediate node instead of crossing it", () => {
  const html = render(colDepmap(true));
  const polys = polylinePoints(html);
  assert.equal(polys.length, 1, "one edge → one polyline");
  assert.equal(polys[0].length, 4, "blocked vertical route must become a 4-point orthogonal detour");

  // Single column ⇒ the detour gutter sits outside the column, to its right,
  // so the final leg must approach and enter target node C (3rd declared
  // node: a, b, c) through its RIGHT border — not cut through C's body by
  // entering on the far (left) side.
  const rects = nodeRects(html);
  assert.equal(rects.length, 3, "fixture declares three nodes");
  const c = rects[2];
  const [finalX] = polys[0][3].split(",").map(Number);
  assert.equal(finalX, Math.round(c.x + c.w), "final polyline point must land on C's facing (right) border, not its far border");
});

test("depmap edge in a single column over a clear span stays a straight 2-point leg", () => {
  const polys = polylinePoints(render(colDepmap(false)));
  assert.equal(polys.length, 1, "one edge → one polyline");
  assert.equal(polys[0].length, 2, "unobstructed vertical route stays direct");
});

// ---------------------------------------------------------------------------
// Accessibility — diagrams must describe their edges/relationships, not just nodes
// ---------------------------------------------------------------------------

test("fixture diagrams expose their relationships to assistive tech", () => {
  const res = run([FIXTURE]);
  assert.equal(res.status, 0, res.stderr);
  const out = res.stdout;
  assert.match(out, /Flows: [^"]*→/, "lane diagram aria lists box-to-box flows");
  assert.match(out, /Steps: [^"]*→/, "sequence diagram aria lists step relationships");
  assert.match(out, /Edges: [^"]*→/, "depmap aria lists edge relationships");
  assert.ok(out.includes("<desc>Relationships:"), "depmap SVG carries a <desc> relationship description");

  // D9 — status reaches assistive tech for every element type, including the
  // ones that already show a visible badge. Marker is a trailing " [<status>]"
  // on that element's own entry; `unchanged` (and absent) adds nothing.
  assert.ok(
    out.includes("Boxes: createNotification() [removed], NotificationService [added], NotificationRepo [added], SocketClient, SocketGateway [added]."),
    "lane box statuses annotate the Boxes list; the unchanged box (SocketClient) stays bare",
  );
  assert.ok(
    out.includes("Flows: createNotification() → NotificationService [removed]; NotificationService → NotificationRepo [added];"),
    "lane arrow statuses annotate their flow entries",
  );
  assert.ok(
    out.includes("SocketClient ⇄ SocketGateway: push / ack [added]."),
    "a labelled arrow keeps its label before the status marker",
  );
  assert.ok(
    out.includes("Actors: NotificationService [added], SocketGateway [added], SocketClient, NotificationStore [changed]."),
    "sequence actor statuses annotate the Actors list; the unchanged actor stays bare",
  );
  assert.ok(
    out.includes("NotificationService → SocketGateway: publish(event) [added];"),
    "sequence msg step status annotates its step entry",
  );
  assert.ok(
    out.includes("NotificationStore self: recompute unread count [changed]."),
    "sequence self step status annotates its step entry",
  );
  assert.ok(
    out.includes("Nodes: notification types [changed], NotificationService [added], NotificationRepo [added], SocketGateway [added], NotificationFeed [changed], UnreadBadge [changed]."),
    "depmap node statuses annotate the Nodes list — the only place a node's status is exposed at all",
  );
  assert.ok(
    out.includes("NotificationService → NotificationRepo: insert (calls) [added];"),
    "depmap edge status follows the kind word in the Edges list",
  );
  assert.ok(
    out.includes("NotificationFeed → UnreadBadge: unread count (calls);"),
    "an unchanged edge carries no status marker",
  );
  assert.ok(
    out.includes("<desc>Relationships: NotificationService → NotificationRepo: insert (calls) [added];"),
    "the depmap <desc> carries the same status markers as the aria-label",
  );
});

// ---------------------------------------------------------------------------
// Regression — the shipped fixture renders in both modes
// ---------------------------------------------------------------------------

test("fixture sample-mini.json renders in fragment mode", () => {
  const res = run([FIXTURE]);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.includes("<main>"));
});

test("fixture sample-mini.json renders in standalone mode", () => {
  const res = run(["--standalone", FIXTURE]);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.startsWith("<!doctype html>"));
});

// ---------------------------------------------------------------------------
// Status overlay — per-element styling, per-diagram legend, accessibility
//
// The renderer keys styling off the fixed `status` enum. `unchanged` and an
// absent status are visually identical (D5): neither styles an element nor
// appears in a legend, and a value outside the enum falls back to the same
// no-styling path rather than reaching a class name.
// ---------------------------------------------------------------------------

// Fixed enum order (validate.mjs STATUS_VALUES). Legends emit in this order,
// never Set-insertion order; `unchanged` is never listed.
const STATUS_ORDER = ["added", "removed", "changed"];

const withStatus = (s) => (s ? { status: s } : {});
const diagramsOf = (doc) => doc.architecture.diagrams;

// A lane diagram: box → arrow → box. Any cell can carry a status.
const laneDoc = ({ box, arrow, arrowLabel = "sends" } = {}) => makeDoc({
  architecture: {
    diagrams: [{
      id: "diagram.lane", type: "lane", title: "Lane",
      lanes: [{
        id: "lane.a", label: "Lane A",
        rows: [[
          { id: "box.a", label: "Alpha", ...withStatus(box) },
          { arrow: "→", ...(arrowLabel ? { label: arrowLabel } : {}), ...withStatus(arrow) },
          { id: "box.b", label: "Beta" },
        ]],
      }],
    }],
  },
});

// A sequence diagram carrying one step of every kind, so status can be placed
// on an actor, a msg, a self or a phase independently.
const seqDoc = ({ actor, msg, self, phase, muted } = {}) => makeDoc({
  architecture: {
    diagrams: [{
      id: "diagram.seq", type: "sequence", title: "Seq",
      actors: [
        { id: "actor.a", label: "Ay", ...withStatus(actor) },
        { id: "actor.b", label: "Bee" },
      ],
      steps: [
        { kind: "phase", label: "Setup", ...withStatus(phase) },
        {
          kind: "msg", from: "actor.a", to: "actor.b", label: "ping",
          ...(muted ? { muted: true } : {}), ...withStatus(msg),
        },
        { kind: "self", actor: "actor.b", label: "think", ...withStatus(self) },
      ],
    }],
  },
});

const depDoc = ({ node, edge, kind = "call" } = {}) => makeDoc({
  architecture: {
    diagrams: [{
      id: "diagram.dep", type: "depmap", title: "Dep",
      zones: [{ id: "zone.a", label: "A" }],
      nodes: [
        { id: "node.a", label: "Aye", zone: "zone.a", ...withStatus(node) },
        { id: "node.b", label: "Bee", zone: "zone.a" },
      ],
      edges: [{ from: "node.a", to: "node.b", label: "hop", kind, ...withStatus(edge) }],
      layout: { cols: 2, nodes: { "node.a": { col: 1, row: 1 }, "node.b": { col: 2, row: 1 } } },
    }],
  },
});

const componentDoc = (status) => makeDoc({
  packages: [{ id: "api", label: "api" }],
  components: [{
    id: "comp.a", pkg: "api", title: "Alpha", runtime: "server",
    files: [{ path: "src/a.ts", role: "entry" }],
    summary: "Does a thing.",
    receipts: [{ kind: "code", ref: "src/a.ts:1-5" }],
    ...withStatus(status),
  }],
});

// The visible text badge. Same markup at every self-sizing site (D7).
const badge = (status) => `<span class="status-badge status-${status}">${status}</span>`;

function assertBadge(html, status, where) {
  assert.ok(html.includes(badge(status)), `${where} must carry the text badge ${badge(status)}`);
}

// Legend blocks in document order; each entry is the list of status words that
// legend advertises, read off its item classes. `.status-legend` holds only
// item spans — no nested <div> — so the first closing tag ends the block.
function statusLegends(html) {
  const out = [];
  const block = /<div class="status-legend">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = block.exec(html))) {
    const items = [];
    const item = /<span class="status-legend-item status-([a-z]+)">/g;
    let i;
    while ((i = item.exec(m[1]))) items.push(i[1]);
    out.push(items);
  }
  return out;
}

// `.comp-head` and `.d-arrow` hold spans (and an <h3>) only, so the first
// closing tag after the opener ends the element.
function firstInner(html, opener) {
  const start = html.indexOf(opener);
  if (start < 0) return "";
  return html.slice(start + opener.length, html.indexOf("</div>", start));
}

const compHead = (html) => firstInner(html, '<div class="comp-head">');
const viewBoxOf = (html) => (html.match(/<svg viewBox="([^"]+)"/) || [])[1];

// [label, doc(status) -> input document, assert(html, status)]
const STATUS_SITES = [
  ["lane box cell", (s) => laneDoc({ box: s }), (html, s) => {
    assert.match(html, new RegExp(`<div class="d-box status-${s}"`),
      `lane box must carry the status-${s} class on its .d-box element`);
    assertBadge(html, s, "lane box");
  }],
  ["lane arrow cell", (s) => laneDoc({ arrow: s }), (html, s) => {
    assert.match(html, new RegExp(`<div class="d-arrow status-${s}"`),
      `lane arrow must carry the status-${s} class on its .d-arrow element`);
    const arrow = firstInner(html, `<div class="d-arrow status-${s}">`);
    assert.ok(arrow.includes(badge(s)), `lane arrow badge ${badge(s)} must sit inside the .d-arrow cell`);
  }],
  ["sequence actor", (s) => seqDoc({ actor: s }), (html, s) => {
    assert.match(html, new RegExp(`<div class="seq-actor status-${s}"`),
      `sequence actor must carry the status-${s} class on its .seq-actor element`);
    assertBadge(html, s, "sequence actor");
  }],
  ["sequence step (msg)", (s) => seqDoc({ msg: s }), (html, s) => {
    assert.match(html, new RegExp(`<div class="msg status-${s}"`),
      `msg step must carry the status-${s} class after the .msg modifiers`);
  }],
  ["sequence step (self)", (s) => seqDoc({ self: s }), (html, s) => {
    assert.match(html, new RegExp(`<div class="self status-${s}"`),
      `self step must carry the status-${s} class on its .self element`);
  }],
  ["sequence step (phase)", (s) => seqDoc({ phase: s }), (html, s) => {
    assert.match(html, new RegExp(`<div class="phase status-${s}"`),
      `phase step must carry the status-${s} class on its .phase element`);
  }],
  ["depmap node", (s) => depDoc({ node: s }), (html, s) => {
    assert.match(html, new RegExp(`<rect class="node status-${s}"`),
      `depmap node rect must carry the status-${s} class`);
    assert.match(html, new RegExp(`<rect class="node status-${s}"[^>]*style="stroke:var\\(--status-${s}\\)"`),
      `depmap node stroke must be var(--status-${s}), overriding the pkg colour`);
    assert.ok(!html.includes(badge(s)), "depmap nodes are colour-only (D7) — no text badge");
  }],
  ["depmap edge", (s) => depDoc({ edge: s }), (html, s) => {
    assert.match(html, new RegExp(`<polyline class="e status-${s}"`),
      `depmap edge polyline must carry the status-${s} class after its kind classes`);
    assert.match(html, new RegExp(`<polyline class="e status-${s}"[^>]*marker-end="url\\(#dep-arr-${s}\\)"`),
      `depmap edge must point at the status-coloured arrowhead url(#dep-arr-${s})`);
    assert.match(html, new RegExp(`<marker id="dep-arr-${s}"`),
      `<defs> must define the status-coloured arrowhead marker dep-arr-${s}`);
    assert.ok(!html.includes(badge(s)), "depmap edges are colour-only (D7) — no text badge");
  }],
  ["component", (s) => componentDoc(s), (html, s) => {
    assert.ok(compHead(html).includes(badge(s)),
      `component badge ${badge(s)} must sit in the .comp-head row beside the pkg badge`);
  }],
];

for (const [label, doc, check] of STATUS_SITES) {
  for (const status of STATUS_ORDER) {
    test(`${label} with status "${status}" renders its status treatment`, () => {
      check(render(doc(status)), status);
    });
  }

  test(`${label}: "unchanged" and an out-of-enum status render exactly as no status`, () => {
    const plain = render(doc(null));
    assert.equal(render(doc("unchanged")), plain,
      `"unchanged" must render byte-identically to an absent status (D5)`);
    const bogus = render(doc("bogus-status"));
    assert.equal(bogus, plain, "an out-of-enum status must fall back to the no-styling path");
    assert.ok(!bogus.includes("bogus-status"),
      "an out-of-enum status must never be interpolated into the output");
  });
}

test("lane arrow without a label still carries its status badge", () => {
  const out = render(laneDoc({ arrow: "added", arrowLabel: null }));
  const arrow = firstInner(out, '<div class="d-arrow status-added">');
  assert.ok(arrow.includes(badge("added")), "a label-less arrow cell must still show its status badge");
});

test("sequence step composes its status class alongside the muted modifier", () => {
  const out = render(seqDoc({ msg: "changed", muted: true }));
  assert.match(out, /<div class="msg muted status-changed"/,
    "status must compose with .muted, not replace it (class order: msg, rtl, muted, status)");
});

test("depmap edge keeps its net kind class alongside the status class", () => {
  const out = render(depDoc({ edge: "added", kind: "net" }));
  assert.match(out, /<polyline class="e e-net status-added"/,
    "kind keeps its own axis (dash + arrowhead); status only adds its class (D3)");
  assert.match(out, /<polyline class="e e-net status-added"[^>]*marker-end="url\(#dep-arr-added\)"/,
    "a net edge with a status uses the status-coloured arrowhead");
});

test("depmap edge keeps its type-only kind class alongside the status class", () => {
  const out = render(depDoc({ edge: "changed", kind: "type-only" }));
  assert.match(out, /<polyline class="e e-type status-changed"/,
    "kind keeps its own axis (dash + arrowhead); status only adds its class (D3)");
});

// ---------------------------------------------------------------------------
// Status legend — one HTML block below each diagram, only when warranted
// ---------------------------------------------------------------------------

test("legend lists only the statuses present in that diagram", () => {
  const out = render(laneDoc({ box: "added", arrow: "changed" }));
  const legends = statusLegends(out);
  assert.equal(legends.length, 1, "one diagram → one status legend");
  assert.deepEqual(legends[0], ["added", "changed"], "legend lists exactly the statuses present");
  assert.ok(out.includes(`<span class="status-legend-item status-added">added</span>`),
    "each legend item is a span classed status-legend-item + status-<value>, labelled with the value");
});

test("legend emits statuses in fixed enum order, not insertion order", () => {
  const scrambled = makeDoc({
    architecture: {
      diagrams: [{
        id: "diagram.lane", type: "lane", title: "Lane",
        lanes: [{
          id: "lane.a", label: "Lane A",
          rows: [[
            { id: "box.a", label: "Alpha", status: "changed" },
            { arrow: "→", label: "then", status: "removed" },
            { id: "box.b", label: "Beta", status: "added" },
            { arrow: "→", label: "also", status: "unchanged" },
            { id: "box.c", label: "Gamma" },
          ]],
        }],
      }],
    },
  });
  const legends = statusLegends(render(scrambled));
  assert.equal(legends.length, 1, "one diagram → one status legend");
  assert.deepEqual(legends[0], ["added", "removed", "changed"],
    "legend order is the enum order added, removed, changed — never the order encountered");
});

test("legend never lists unchanged", () => {
  const legends = statusLegends(render(laneDoc({ box: "removed", arrow: "unchanged" })));
  assert.deepEqual(legends[0], ["removed"], "unchanged is never a legend entry (D5/D8)");
});

test("legend is absent for a status-free document", () => {
  assert.deepEqual(statusLegends(render(laneDoc())), [], "no statuses → no legend");
});

test("legend is absent for an all-unchanged document", () => {
  const allUnchanged = makeDoc({
    packages: componentDoc("unchanged").packages,
    components: componentDoc("unchanged").components,
    architecture: {
      diagrams: [
        ...diagramsOf(laneDoc({ box: "unchanged", arrow: "unchanged" })),
        ...diagramsOf(seqDoc({ actor: "unchanged", msg: "unchanged", self: "unchanged", phase: "unchanged" })),
        ...diagramsOf(depDoc({ node: "unchanged", edge: "unchanged" })),
      ],
    },
  });
  assert.deepEqual(statusLegends(render(allUnchanged)), [],
    "an all-unchanged document renders exactly as today — no legend anywhere");
});

test("a component status alone emits no legend", () => {
  assert.deepEqual(statusLegends(render(componentDoc("added"))), [],
    "the legend belongs to diagrams (D2); components[] carries only its badge");
});

test("each diagram gets its own legend listing only its own statuses", () => {
  const mixed = makeDoc({
    architecture: {
      diagrams: [
        ...diagramsOf(laneDoc({ box: "added" })),
        ...diagramsOf(seqDoc({ msg: "removed" })),
        ...diagramsOf(depDoc({ node: "changed" })),
      ],
    },
  });
  assert.deepEqual(statusLegends(render(mixed)), [["added"], ["removed"], ["changed"]],
    "lane, sequence and depmap each get their own legend, in document order");
});

test("legend renders below the diagram it describes", () => {
  const out = render(laneDoc({ box: "added" }));
  assert.ok(out.indexOf('<div class="status-legend">') > out.indexOf('<div class="d-box status-added"'),
    "the legend block follows the diagram content, mirroring where caption() lands");
});

test("depmap legend sits outside the SVG, after the closing tag", () => {
  const out = render(depDoc({ node: "added" }));
  const svgEnd = out.indexOf("</svg>");
  assert.ok(svgEnd > -1, "depmap renders an SVG");
  assert.ok(out.indexOf('<div class="status-legend">') > svgEnd,
    "the depmap legend is HTML placed after </svg>, so the viewBox extents stay untouched (D2)");
});

test("depmap viewBox is unchanged by adding statuses", () => {
  const withStatuses = viewBoxOf(render(depDoc({ node: "added", edge: "removed" })));
  const without = viewBoxOf(render(depDoc()));
  assert.equal(withStatuses, without, "statuses must not move the depmap viewBox — the legend is outside the SVG");
});

// ---------------------------------------------------------------------------
// Status styling tokens — every theme block, plus the removed strikethrough
// ---------------------------------------------------------------------------

test("status colour tokens are declared in all four theme blocks", () => {
  const out = render(laneDoc({ box: "added" }), ["--standalone"]);
  for (const status of STATUS_ORDER) {
    const n = (out.match(new RegExp(`--status-${status}:`, "g")) || []).length;
    assert.ok(n >= 4,
      `--status-${status} must be declared in all four theme blocks (:root, prefers-color-scheme: dark, ` +
      `[data-theme="light"], [data-theme="dark"]); found ${n} declaration(s)`);
  }
});

test("removed elements are struck through by a .status-removed rule", () => {
  const out = render(laneDoc({ box: "removed" }));
  assert.match(out, /\.status-removed[^{}]*\{[^{}]*text-decoration:[^{}]*line-through/,
    "a .status-removed CSS rule must apply text-decoration: line-through");
});
