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
