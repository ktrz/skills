#!/usr/bin/env node
// render.mjs — deterministic HTML renderer for walkthrough.json v1.
//
// Usage: node render.mjs [--standalone] [--report-map <map.json>] <walkthrough.json>
//
// Turns a (pre-validated) walkthrough.json into a self-contained HTML
// walkthrough page. Default output is a FRAGMENT (`<style>…</style>` +
// `<main>…</main>`) suitable for wrapping by the Claude Artifact tool.
// `--standalone` prepends a minimal `<!doctype html>` skeleton so the
// file opens directly in a browser.
//
// Deterministic: same JSON in → byte-identical HTML out. Zero deps.
// The renderer is the ONLY producer of HTML — it escapes every string
// from the document and generates the package palette dynamically from
// `packages[]`. See references/schema.md for the input contract.
//
// Every emitted href is scheme-allowlisted: only http(s) URLs (and, in
// --standalone mode, well-formed `reports/<file>.md#anchor` relative refs)
// become live links; anything else keeps its visible text but gets no href.
// Report receipts link relatively in --standalone mode (reports/ sits next
// to the saved page); in fragment mode they render as unlinked badges unless
// `--report-map` supplies a published https URL for the report path.

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// ---------------------------------------------------------------------------
// Ordered, brand-neutral package palette (light/dark pair per hue). The cycle
// wraps if a document declares more packages than entries.
// ---------------------------------------------------------------------------
const PAL = [
  { light: "#2f6fb5", dark: "#6ea3d8" }, // blue
  { light: "#0e7c74", dark: "#3db8ac" }, // teal
  { light: "#6d55c0", dark: "#a390e8" }, // violet
  { light: "#b04a63", dark: "#d87f95" }, // rose
  { light: "#6d7d35", dark: "#a3b464" }, // olive
  { light: "#b3701a", dark: "#d9a24a" }, // amber
  { light: "#3a7d8c", dark: "#6fb3c4" }, // cyan
  { light: "#8a5a2b", dark: "#c79363" }, // brown
];

const CODE_REF_RE = /^(.+):(\d+)(?:-(\d+))?$/;
const REPORT_REF_RE = /^reports\/[A-Za-z0-9._-]+\.md(?:#[A-Za-z0-9._-]+)?$/;

// ---- href safety ------------------------------------------------------------
// Scheme allowlist for every href built from document-derived strings: only
// http(s) URLs pass; `javascript:`, `data:`, etc. return null (render the
// visible text, drop the link). validate.mjs enforces the same shapes
// upstream, but the renderer must stay safe on its own.
function safeHref(url) {
  return /^https?:\/\//.test(String(url == null ? "" : url)) ? String(url) : null;
}

// Percent-encode each path segment for a GitHub blob URL, preserving "/"
// separators and the trailing #L anchor. NOTE: the doc-receipt diff digest is
// computed from the RAW path — GitHub derives that anchor from the unencoded
// repo-relative path, so encoding it there would break the link.
const ghPath = (p) => String(p).split("/").map(encodeURIComponent).join("/");

// ---- escaping -------------------------------------------------------------
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Deterministic number formatting for CSS percentages.
function fmt(n) {
  let s = n.toFixed(4);
  if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

const cssId = (id) => String(id == null ? "" : id).toLowerCase().replace(/[^a-z0-9-]/g, "-");

// ---- minimal inline markdown ----------------------------------------------
// Escape FIRST, then transform a safe subset. No raw-HTML passthrough.
function inlineMd(raw) {
  // Neutralize any literal sentinel char in user input so it cannot collide
  // with the code/link placeholders below (which use U+E000 as a delimiter).
  const text = esc(raw).replace(/\uE000/g, "&#xE000;");
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\uE000C${codes.length - 1}\uE000`;
  });
  const links = [];
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, url) => {
    if (!safeHref(url)) return t;
    links.push(`<a href="${url}">${t}</a>`);
    return `\uE000L${links.length - 1}\uE000`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/_([^_]+)_/g, "<em>$1</em>");
  s = s.replace(/\uE000L(\d+)\uE000/g, (_, i) => links[Number(i)]);
  s = s.replace(/\uE000C(\d+)\uE000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
  return s;
}

// Block markdown: split on blank lines into paragraphs.
function mdBlocks(raw) {
  const str = String(raw == null ? "" : raw);
  const paras = str.split(/\n[ \t]*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  if (paras.length === 0) return "";
  return paras.map((p) => `<p>${inlineMd(p)}</p>`).join("\n");
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  let standalone = false;
  let reportMapPath = null;
  let path = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--standalone") standalone = true;
    else if (a === "--report-map") {
      reportMapPath = args[++i];
      if (reportMapPath == null) { usage(); process.exit(2); }
    }
    else if (a === "--help" || a === "-h") { usage(); process.exit(0); }
    else if (path == null) path = a;
    else { usage(); process.exit(2); }
  }
  if (!path) { usage(); process.exit(2); }

  let doc;
  try {
    doc = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    process.stderr.write(`render.mjs: cannot read/parse ${path}: ${err.message}\n`);
    process.exit(1);
  }

  // Optional report map: { "reports/<file>.md": "https://…published URL" }.
  let reportMap = null;
  if (reportMapPath) {
    try {
      reportMap = JSON.parse(readFileSync(reportMapPath, "utf8"));
    } catch (err) {
      process.stderr.write(`render.mjs: cannot read/parse report map ${reportMapPath}: ${err.message}\n`);
      process.exit(1);
    }
    if (!reportMap || typeof reportMap !== "object" || Array.isArray(reportMap)) {
      process.stderr.write(`render.mjs: report map ${reportMapPath} must be a JSON object of {"reports/<file>.md": "https://…"}\n`);
      process.exit(1);
    }
  }

  // <title> is emitted in BOTH modes: the Artifact tool reads it from the
  // fragment it wraps; standalone additionally gets a doctype + charset.
  const fragment = renderDocument(doc, { standalone, reportMap });
  let out = fragment;
  if (standalone) {
    out = `<!doctype html>\n<meta charset="utf-8">\n${fragment}`;
  }
  process.stdout.write(out + "\n");
}

function usage() {
  process.stderr.write("Usage: node render.mjs [--standalone] [--report-map <map.json>] <walkthrough.json>\n");
}

// ---------------------------------------------------------------------------
// Document renderer — nested helpers close over palette + pr context.
// ---------------------------------------------------------------------------
function renderDocument(doc, opts) {
  doc = doc || {};
  const { standalone = false, reportMap = null } = opts || {};
  const pr = doc.pr || {};
  const repo = String(pr.repo || "");
  const sha = String(doc.sha || "");
  const packages = Array.isArray(doc.packages) ? doc.packages : [];
  const pkgSet = new Set(packages.map((p) => p && p.id).filter(Boolean));

  const pkgVar = (id) => (id && pkgSet.has(id) ? `var(--pkg-${cssId(id)})` : "var(--ink-faint)");
  const pkgClass = (id) => (id && pkgSet.has(id) ? `pkg-${cssId(id)}` : "");

  // ---- receipts ----
  // Returns an allowlisted href, or null → render as an unlinked badge.
  function receiptHref(r) {
    const ref = String(r && r.ref || "");
    const kind = r && r.kind;
    if (kind === "url") return safeHref(ref);
    if (kind === "report") {
      if (!REPORT_REF_RE.test(ref)) return null;
      // Standalone pages live next to reports/, so the relative link works
      // and wins even when a map is supplied. The published fragment has no
      // reports/ beside it: link only via the map (anchor dropped — it won't
      // resolve on the artifact host), else fall back to the badge.
      if (standalone) return ref;
      return reportMap ? safeHref(reportMap[ref.split("#")[0]]) : null;
    }
    const m = CODE_REF_RE.exec(ref);
    if (kind === "code" && m) {
      const p = m[1], s = m[2], e = m[3];
      return `https://github.com/${repo}/blob/${sha}/${ghPath(p)}#L${s}${e ? `-L${e}` : ""}`;
    }
    if (kind === "doc" && m) {
      // GitHub renders .md blobs as rich markdown and ignores #L anchors, so
      // doc receipts link into the PR files-changed diff instead: the anchor
      // is sha256(path), R<line> targets the right (new) side at the start
      // line. If the file isn't in the diff, the anchor degrades to the top
      // of the files page — acceptable, doc receipts overwhelmingly cite
      // files the PR touches.
      if (pr.number != null) {
        const digest = createHash("sha256").update(m[1]).digest("hex");
        return `https://github.com/${repo}/pull/${pr.number}/files#diff-${digest}R${m[2]}`;
      }
      return `https://github.com/${repo}/blob/${sha}/${ghPath(m[1])}#L${m[2]}${m[3] ? `-L${m[3]}` : ""}`;
    }
    return safeHref(ref);
  }
  function receiptLabel(r) {
    const ref = String(r && r.ref || "");
    const kind = r && r.kind;
    if (kind === "code" || kind === "doc") {
      const m = CODE_REF_RE.exec(ref);
      if (m) return `${m[1].split("/").pop()}:${m[2]}${m[3] ? "-" + m[3] : ""}`;
      return ref;
    }
    if (kind === "url") {
      try { return new URL(ref).hostname.replace(/^www\./, ""); } catch { return "link"; }
    }
    if (kind === "report") {
      const parts = ref.split("#");
      const file = (parts[0] || "").split("/").pop() || ref;
      return parts[1] ? `${file}#${parts[1]}` : file;
    }
    return ref;
  }
  function receipts(list) {
    if (!Array.isArray(list) || list.length === 0) return "";
    const items = list.map((r) => {
      const ref = String(r && r.ref || "");
      const href = receiptHref(r);
      const tag = href ? "a" : "span";
      // Unlinked badge titles: valid report refs point the reader at the
      // on-disk copy next to the standalone page; other refs failed the
      // scheme allowlist.
      let title = (r && r.note) ? r.note : ref;
      if (!href && r && r.kind === "report" && REPORT_REF_RE.test(ref)) {
        title = `${r.note ? r.note + " — " : ""}local: ${ref}`;
      }
      return `<${tag} class="receipt receipt-${esc(cssId(r && r.kind))}"${href ? ` href="${esc(href)}"` : ""} title="${esc(title)}">⧉ ${esc(receiptLabel(r))}</${tag}>`;
    }).join("");
    return `<div class="receipts">${items}</div>`;
  }

  // ---- diagrams ----
  function renderDiagram(d) {
    if (!d || typeof d !== "object") return "";
    switch (d.type) {
      case "lane": return renderLane(d);
      case "sequence": return renderSequence(d);
      case "depmap": return renderDepmap(d);
      default: return `<!-- unknown diagram type: ${esc(d.type)} (id ${esc(d.id)}) -->`;
    }
  }

  function caption(d, cls) {
    return d.caption ? `<p class="${cls}">${inlineMd(d.caption)}</p>` : "";
  }

  function renderLane(d) {
    const lanes = Array.isArray(d.lanes) ? d.lanes : [];
    const boxLabels = [];
    const lanesHtml = lanes.map((lane) => {
      const rows = Array.isArray(lane.rows) ? lane.rows : [];
      const rowsHtml = rows.map((row) => {
        const cells = Array.isArray(row) ? row : [];
        const cellsHtml = cells.map((cell) => {
          if (cell && typeof cell.arrow === "string") {
            const lbl = cell.label ? `<span>${inlineMd(cell.label)}</span>` : "";
            return `<div class="d-arrow"><span class="glyph">${esc(cell.arrow)}</span>${lbl}</div>`;
          }
          if (cell && typeof cell === "object") {
            boxLabels.push(cell.label || "");
            const sub = cell.sub ? `<div class="d-sub">${inlineMd(cell.sub)}</div>` : "";
            return `<div class="d-box" style="--bc: ${pkgVar(cell.pkg)}"><div class="d-name">${inlineMd(cell.label)}</div>${sub}</div>`;
          }
          return "";
        }).join("");
        return `<div class="d-row">${cellsHtml}</div>`;
      }).join("");
      return `<div class="d-lane"><div class="d-lane-label">${esc(lane.label)}</div>${rowsHtml}</div>`;
    }).join("");
    // Relationships: within each row, an arrow cell links its flanking boxes.
    // Surfacing "<from> <arrow> <to>: <label>" makes the flow legible to AT,
    // which otherwise sees only the box list.
    const flows = [];
    for (const lane of lanes) {
      for (const row of Array.isArray(lane.rows) ? lane.rows : []) {
        const cells = Array.isArray(row) ? row : [];
        cells.forEach((cell, i) => {
          if (!cell || typeof cell.arrow !== "string") return;
          const prev = cells[i - 1], next = cells[i + 1];
          if (prev && prev.label && next && next.label) {
            flows.push(`${prev.label} ${cell.arrow} ${next.label}${cell.label ? `: ${cell.label}` : ""}`);
          }
        });
      }
    }
    const aria = `Lane diagram: ${d.title || ""}. Boxes: ${boxLabels.filter(Boolean).join(", ")}.` +
      (flows.length ? ` Flows: ${flows.join("; ")}.` : "");
    return `<div class="diagram" role="img" aria-label="${esc(aria)}"><div class="diagram-inner">${lanesHtml}</div></div>${caption(d, "dgm-caption")}`;
  }

  function renderSequence(d) {
    const actors = Array.isArray(d.actors) ? d.actors : [];
    const steps = Array.isArray(d.steps) ? d.steps : [];
    const N = Math.max(1, actors.length);
    const idx = new Map(actors.map((a, i) => [a.id, i]));

    const head = actors.map((a) => {
      const sub = a.sub ? `<span class="sub">${esc(a.sub)}</span>` : "";
      return `<div class="seq-actor" style="--bc: ${pkgVar(a.pkg)}">${esc(a.label)}${sub}</div>`;
    }).join("");

    // Vertical lifelines at (i+0.5)/N for each actor column.
    const grad = actors.map((_, i) => {
      const p = fmt(((i + 0.5) / N) * 100);
      return `linear-gradient(to right, transparent calc(${p}% - 1px), var(--line) calc(${p}% - 1px), var(--line) calc(${p}% + 1px), transparent calc(${p}% + 1px))`;
    }).join(", ");

    const body = steps.map((s, i) => {
      const gr = i + 1;
      if (s.kind === "phase") {
        return `<div class="phase" style="grid-row:${gr}">${inlineMd(s.label)}</div>`;
      }
      if (s.kind === "self") {
        const a = idx.has(s.actor) ? idx.get(s.actor) : 0;
        return `<div class="self" style="grid-column:${a + 1};grid-row:${gr}">${inlineMd(s.label)}</div>`;
      }
      if (s.kind === "msg") {
        const a = idx.has(s.from) ? idx.get(s.from) : 0;
        const b = idx.has(s.to) ? idx.get(s.to) : 0;
        const lo = Math.min(a, b), hi = Math.max(a, b);
        const k = hi - lo + 1;
        const inset = fmt((0.5 / k) * 100);
        const rtl = b < a ? " rtl" : "";
        const muted = s.muted ? " muted" : "";
        return `<div class="msg${rtl}${muted}" style="grid-column:${lo + 1} / ${hi + 2};grid-row:${gr}">` +
          `<div class="msg-label" style="padding:0 ${inset}%">${inlineMd(s.label)}</div>` +
          `<div class="msg-line" style="margin:0 ${inset}%"></div></div>`;
      }
      return "";
    }).join("");

    const minW = Math.max(N * 150, 480);
    const cols = `repeat(${N}, 1fr)`;
    // Relationships: describe each step (msg/self/phase) so AT hears the actual
    // interaction sequence, not just the actor list.
    const actorLabel = (id) => { const a = actors[idx.get(id)]; return (a && a.label) || id; };
    const relSeq = steps.map((s) => {
      if (s.kind === "msg") return `${actorLabel(s.from)} → ${actorLabel(s.to)}${s.label ? `: ${s.label}` : ""}`;
      if (s.kind === "self") return `${actorLabel(s.actor)} self${s.label ? `: ${s.label}` : ""}`;
      if (s.kind === "phase") return `phase${s.label ? `: ${s.label}` : ""}`;
      return "";
    }).filter(Boolean);
    const aria = `Sequence diagram: ${d.title || ""}. Actors: ${actors.map((a) => a.label).filter(Boolean).join(", ")}.` +
      (relSeq.length ? ` Steps: ${relSeq.join("; ")}.` : "");
    return `<div class="seqwrap" role="img" aria-label="${esc(aria)}"><div class="seq" style="min-width:${minW}px">` +
      `<div class="seq-head" style="grid-template-columns:${cols}">${head}</div>` +
      `<div class="seq-body" style="grid-template-columns:${cols};background-image:${grad}">${body}</div>` +
      `</div></div>${caption(d, "seq-caption")}`;
  }

  function renderDepmap(d) {
    const zones = Array.isArray(d.zones) ? d.zones : [];
    const nodes = Array.isArray(d.nodes) ? d.nodes : [];
    const edges = Array.isArray(d.edges) ? d.edges : [];
    const layout = d.layout && typeof d.layout === "object" ? d.layout : {};
    const L = layout.nodes && typeof layout.nodes === "object" ? layout.nodes : {};
    const cols = Math.max(1, Number(layout.cols) || 1);

    if (nodes.length === 0) {
      return `<!-- depmap ${esc(d.id)} has no nodes -->${caption(d, "dgm-caption")}`;
    }

    const CELL_W = 200, COL_GUT0 = 34, ROW_GUT0 = 56, MIN_ROW = 64;
    const ZP = 14, ZLAB = 22;
    const R = Math.round;
    // Label typography: deterministic char-width heuristic (~5.8px/char at the
    // 10px label font; no DOM measurement available). LH = line height,
    // HALF_CAP = cap-height above the text baseline.
    const CHAR = 5.8, LH = 13, HALF_CAP = 8;
    // Anchors sit >=12px from a node's corners; routing stubs travel through
    // gutter centerlines only, so no leg crosses an unrelated cell interior.
    const CLR = 12;
    const clamp = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));

    // Chips flow left-to-right inside the node and wrap to a new row when the
    // next chip would exceed the node's inner width; node height grows to fit
    // every chip row (see chipInfo below — computed before first metricH call).
    const CHIP_H = 18, CHIP_GAP = 8, CHIP_ROW_GAP = 6, CHIP_PAD = 12;
    const chipW = (chip) => 12 + String(chip).length * 6.2;
    const metricH = (n) => {
      const subs = Array.isArray(n.sub) ? n.sub.length : 0;
      const rows = chipInfo[n.id].rows.length;
      const chipBlock = rows ? 2 + rows * CHIP_H + (rows - 1) * CHIP_ROW_GAP + 6 : 0;
      const h = 22 + 18 + subs * 15 + chipBlock + 12;
      return Math.max(h, 60);
    };

    // Positions: trust layout verbatim; append any node missing from layout.
    let fallbackRow = 0;
    for (const n of nodes) {
      const p = L[n.id];
      if (p) fallbackRow = Math.max(fallbackRow, (Number(p.row) || 1) + ((Number(p.rowSpan) || 1) - 1));
    }
    const pos = {};
    for (const n of nodes) {
      const p = L[n.id];
      if (p) {
        pos[n.id] = {
          col: Number(p.col) || 1, row: Number(p.row) || 1,
          colSpan: Number(p.colSpan) || 1, rowSpan: Number(p.rowSpan) || 1,
        };
      } else {
        fallbackRow += 1;
        pos[n.id] = { col: 1, row: fallbackRow, colSpan: cols, rowSpan: 1 };
      }
    }

    // Chip layout per node: wrap against the node's MINIMUM guaranteed width
    // (default gutters). Pass-2 gutter growth only ever widens a node, so a
    // layout computed here stays contained in the final rect — and using the
    // same layout in both passes keeps the render deterministic.
    // chipInfo[id].rows = [[{ chip, w, dx }...]...]; dx is the x offset from
    // the node's inner-left edge.
    const chipInfo = {};
    for (const n of nodes) {
      const chips = Array.isArray(n.chips) ? n.chips : [];
      const p = pos[n.id];
      const span = Math.min(cols, p.col + p.colSpan - 1) - p.col + 1;
      const innerW = span * CELL_W + (span - 1) * COL_GUT0 - 2 * CHIP_PAD;
      const rows = [];
      let cur = [], used = 0;
      for (const chip of chips) {
        const w = chipW(chip);
        if (cur.length && used + CHIP_GAP + w > innerW) {
          rows.push(cur);
          cur = [{ chip, w, dx: 0 }];
          used = w;
        } else {
          cur.push({ chip, w, dx: cur.length ? used + CHIP_GAP : 0 });
          used += cur.length > 1 ? CHIP_GAP + w : w;
        }
      }
      if (cur.length) rows.push(cur);
      chipInfo[n.id] = { rows };
    }

    const maxRow = Math.max(1, ...nodes.map((n) => pos[n.id].row + pos[n.id].rowSpan - 1));
    const rowH = new Array(maxRow + 1).fill(0);
    for (const n of nodes) {
      const p = pos[n.id];
      if (p.rowSpan === 1) rowH[p.row] = Math.max(rowH[p.row], metricH(n));
    }
    for (let r = 1; r <= maxRow; r++) if (rowH[r] === 0) rowH[r] = MIN_ROW;
    for (const n of nodes) {
      const p = pos[n.id];
      if (p.rowSpan > 1) {
        let span = 0;
        for (let r = p.row; r < p.row + p.rowSpan; r++) span += rowH[r] + (r > p.row ? ROW_GUT0 : 0);
        const need = metricH(n);
        if (span < need) rowH[p.row + p.rowSpan - 1] += need - span;
      }
    }

    // ========================================================================
    // COMBO B+A+E — label-aware two-pass geometry, exemplar label grammar,
    // pair/anchor de-duplication + gutter-centerline routing + corridor lanes.
    // All deterministic: fixed pass count, edge-order iteration, fixed
    // tie-breaks; measurement is char-count only (no DOM, no Date/random).
    // ========================================================================
    const zoneOf = {}; for (const n of nodes) zoneOf[n.id] = n.zone;

    // ---- label typography helpers ----
    const labelW = (s) => String(s).length * CHAR;
    // Wrap a label into <=2 lines at the space nearest the char-midpoint.
    function wrapLabel(s) {
      s = String(s);
      if (s.length <= 8) return [s];
      const mid = s.length / 2;
      let best = -1, bestD = Infinity;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === " ") { const dd = Math.abs(i - mid); if (dd < bestD) { bestD = dd; best = i; } }
      }
      if (best < 0) return [s];
      return [s.slice(0, best), s.slice(best + 1)];
    }
    const wrapMaxW = (s) => Math.max(...wrapLabel(s).map(labelW));

    // ---- geometry builder for a given gutter choice (B: per-gutter widths) ----
    // colGut[g] = gutter between column g and g+1 (1..cols-1).
    // rowGut[r] = gutter between row r and r+1 (1..maxRow-1).
    function buildGeom(colGut, rowGut) {
      const colX = new Array(cols + 1).fill(0);
      for (let c = 2; c <= cols; c++) colX[c] = colX[c - 1] + CELL_W + colGut[c - 1];
      const rY = new Array(maxRow + 1).fill(0);
      for (let r = 2; r <= maxRow; r++) rY[r] = rY[r - 1] + rowH[r - 1] + rowGut[r - 1];
      const rect = {};
      for (const n of nodes) {
        const p = pos[n.id];
        const lastCol = Math.min(cols, p.col + p.colSpan - 1);
        const x = colX[p.col];
        const w = (colX[lastCol] + CELL_W) - colX[p.col];
        const y = rY[p.row];
        let h;
        if (p.rowSpan === 1) h = metricH(n);
        else { const lastRow = p.row + p.rowSpan - 1; h = (rY[lastRow] + rowH[lastRow]) - rY[p.row]; }
        rect[n.id] = { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
      }
      const zoneFrames = [];
      for (const z of zones) {
        const members = nodes.filter((n) => n.zone === z.id).map((n) => rect[n.id]).filter(Boolean);
        if (members.length === 0) continue;
        const minx = Math.min(...members.map((m) => m.x));
        const miny = Math.min(...members.map((m) => m.y));
        const maxx = Math.max(...members.map((m) => m.x + m.w));
        const maxy = Math.max(...members.map((m) => m.y + m.h));
        zoneFrames.push({
          label: z.label,
          x: minx - ZP, y: miny - ZP - ZLAB,
          w: maxx - minx + 2 * ZP, h: maxy - miny + 2 * ZP + ZLAB,
        });
      }
      return { colX, rowY: rY, rect, zoneFrames };
    }

    // ---- gutter centerlines from a geometry (fix 2: legs travel these only) ----
    function makeRouter(G) {
      const { colX, rowY: rY, rect } = G;
      const colGutCenter = (c) =>
        (c >= 1 && c < cols) ? (colX[c] + CELL_W + colX[c + 1]) / 2
          : (c < 1 ? colX[1] - COL_GUT0 / 2 : colX[cols] + CELL_W + COL_GUT0 / 2);
      const rowGutCenter = (r) =>
        (r >= 1 && r < maxRow) ? (rY[r] + rowH[r] + rY[r + 1]) / 2
          : (r < 1 ? rY[1] - ROW_GUT0 / 2 : rY[maxRow] + rowH[maxRow] + ROW_GUT0 / 2);

      // Orthogonal route between facing borders. Every polyline: first point on
      // the source border with a perpendicular first segment; last point on the
      // target border with a perpendicular last segment (fix 1). Bend legs run
      // along gutter centerlines, never through unrelated cells (fix 2).
      // A straight leg between two node borders is only safe if no OTHER
      // node's rect straddles it. Endpoints A/B are excluded by reference
      // identity (route is always called with the shared rect[] objects).
      function horizClear(A, B, y, x0, x1) {
        const xlo = Math.min(x0, x1) + CLR, xhi = Math.max(x0, x1) - CLR;
        for (const n of nodes) {
          const r = rect[n.id];
          if (!r || r === A || r === B) continue;
          if (y > r.y - CLR && y < r.y + r.h + CLR && r.x < xhi && r.x + r.w > xlo) return false;
        }
        return true;
      }

      function route(A, B, pa, pb) {
        const vertSep = B.y >= A.y + A.h || B.y + B.h <= A.y;
        const horizSep = B.x >= A.x + A.w || B.x + B.w <= A.x;
        if (vertSep && !horizSep) {
          // x-spans overlap: single vertical leg at the shared-span midpoint,
          // exiting/entering the facing horizontal borders.
          const lo = Math.max(A.x, B.x), hi = Math.min(A.x + A.w, B.x + B.w);
          const x = clamp((lo + hi) / 2, A.x + CLR, A.x + A.w - CLR);
          const down = B.cy >= A.cy;
          return [[x, down ? A.y + A.h : A.y], [x, down ? B.y : B.y + B.h]];
        }
        if (horizSep && !vertSep) {
          // y-spans overlap: single horizontal leg at the shared-span midpoint,
          // exiting/entering the facing vertical borders.
          const lo = Math.max(A.y, B.y), hi = Math.min(A.y + A.h, B.y + B.h);
          const y = clamp((lo + hi) / 2, A.y + CLR, A.y + A.h - CLR);
          const right = B.cx >= A.cx;
          const sx = right ? A.x + A.w : A.x;
          const ex = right ? B.x : B.x + B.w;
          if (horizClear(A, B, y, sx, ex)) return [[sx, y], [ex, y]];
          // An intermediate node straddles the direct line — detour through a
          // row-gutter centerline instead (same orthogonal Z as the diagonal
          // branch: exit/enter the facing HORIZONTAL borders, join in a gutter
          // that no node occupies).
          const down = B.cy >= A.cy;
          const ax = clamp(B.cx, A.x + CLR, A.x + A.w - CLR);
          const bx = clamp(A.cx, B.x + CLR, B.x + B.w - CLR);
          const gr = down ? (pa.row + pa.rowSpan - 1) : (pa.row - 1);
          const gy = rowGutCenter(gr);
          const sy = down ? A.y + A.h : A.y;
          const ey = down ? B.y : B.y + B.h;
          return [[ax, sy], [ax, gy], [bx, gy], [bx, ey]];
        }
        if (horizSep && vertSep) {
          // Diagonal: exit/enter the facing horizontal borders, join with a
          // horizontal leg riding a row-gutter centerline (never a cell).
          const down = B.cy >= A.cy;
          const ax = clamp(B.cx, A.x + CLR, A.x + A.w - CLR);
          const bx = clamp(A.cx, B.x + CLR, B.x + B.w - CLR);
          const gr = down ? (pa.row + pa.rowSpan - 1) : (pa.row - 1);
          const gy = rowGutCenter(gr);
          const sy = down ? A.y + A.h : A.y;
          const ey = down ? B.y : B.y + B.h;
          return [[ax, sy], [ax, gy], [bx, gy], [bx, ey]];
        }
        // Overlapping rects (degenerate layout): straight center-to-center.
        return [[A.cx, A.cy], [B.cx, B.cy]];
      }
      return { route, colGutCenter, rowGutCenter };
    }

    function segments(pts) {
      const s = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        if (len > 0.5) s.push({ a, b, len, vert: Math.abs(b[0] - a[0]) < 0.5 });
      }
      return s;
    }
    function dominant(pts) {
      const s = segments(pts);
      if (!s.length) return null;
      s.sort((p, q) => q.len - p.len);
      return s[0];
    }

    // ---- E: detect {A->B, B->A} pairs; deterministic sign by first-seen ----
    const eKey = (e) => e.from + "|" + e.to;
    const present = new Set(edges.map(eKey));
    const isPair = (e) => present.has(e.to + "|" + e.from);
    const pairSign = {};
    { const cnt = {}; for (const e of edges) { const k = [e.from, e.to].sort().join("~"); cnt[k] = (cnt[k] || 0) + 1; pairSign[eKey(e)] = cnt[k] === 1 ? -1 : 1; } }

    // ---- B, pass 1: route with default gutters, size gutters to labels ----
    const colGut = new Array(cols + 1).fill(COL_GUT0);
    const rowGut = new Array(maxRow + 1).fill(ROW_GUT0);
    {
      const g1 = buildGeom(colGut.slice(), rowGut.slice());
      const r1 = makeRouter(g1);
      for (const e of edges) {
        if (!e.label) continue;
        const A = g1.rect[e.from], B = g1.rect[e.to];
        if (!A || !B) continue;
        const dom = dominant(r1.route(A, B, pos[e.from], pos[e.to]));
        if (!dom) continue;
        const pf = pos[e.from], pt = pos[e.to];
        if (!dom.vert) {
          // horizontal-route label lives in a column gutter — widen it so the
          // wrapped label clears both facing node bodies (case 2).
          const g = (B.cx >= A.cx) ? (pf.col + pf.colSpan - 1) : (pt.col + pt.colSpan - 1);
          if (g >= 1 && g < cols) colGut[g] = Math.max(colGut[g], Math.round(wrapMaxW(e.label) + 14));
        } else if (zoneOf[e.from] !== zoneOf[e.to]) {
          // zone-crossing vertical: grow the crossed row gutter so a clear band
          // exists above the next zone's frame chrome (case 3).
          const r = (B.cy >= A.cy) ? (pf.row + pf.rowSpan - 1) : (pt.row + pt.rowSpan - 1);
          if (r >= 1 && r < maxRow) {
            const lines = wrapLabel(e.label).length;
            rowGut[r] = Math.max(rowGut[r], ZP + ZLAB + lines * LH + 24);
          }
        }
      }
    }

    // ---- B, pass 2: rebuild geometry with grown gutters ----
    const G = buildGeom(colGut, rowGut);
    const rect = G.rect, zoneFrames = G.zoneFrames, rowY = G.rowY;
    const router = makeRouter(G);

    const edgeDraws = [];
    for (const e of edges) {
      const A = rect[e.from], B = rect[e.to];
      if (!A || !B) continue;
      let pts = router.route(A, B, pos[e.from], pos[e.to]);
      if (isPair(e)) {
        // E: reciprocal pairs run ±5px parallel. Offset the traveling legs
        // only; the perpendicular border stubs slide along their own borders
        // so both anchors stay on the source/target rect.
        const off = pairSign[eKey(e)] * 5;
        pts = offsetLegs(pts, off, e);
      }
      edgeDraws.push({ e, pts });
    }

    // ---- fix 3: corridor lane assignment (deterministic channel routing) ----
    // Group every leg by corridor (shared centerline coord + overlapping span);
    // within an overlapping group, fan legs out by lane index so collinear legs
    // from different edges never fuse. Border stubs re-clamp onto their rect.
    assignLanes(edgeDraws);

    // offsetLegs / assignLanes operate on point arrays in place-safe form.
    function borderClampPoint(p, r) {
      // Snap an anchor back onto rect r's border after a perpendicular shift.
      if (Math.abs(p[0] - r.x) < 0.6 || Math.abs(p[0] - (r.x + r.w)) < 0.6) {
        p[1] = clamp(p[1], r.y + CLR, r.y + r.h - CLR);
      } else if (Math.abs(p[1] - r.y) < 0.6 || Math.abs(p[1] - (r.y + r.h)) < 0.6) {
        p[0] = clamp(p[0], r.x + CLR, r.x + r.w - CLR);
      }
    }
    function offsetLeg(pts, i, delta, orient, e) {
      // Shift leg (i,i+1) perpendicular by delta; neighbour stubs absorb it by
      // changing length (they stay perpendicular). Anchors re-clamp to borders.
      const axis = orient === "V" ? 0 : 1;
      pts[i][axis] += delta;
      pts[i + 1][axis] += delta;
      if (i === 0) borderClampPoint(pts[0], rect[e.from]);
      if (i + 1 === pts.length - 1) borderClampPoint(pts[pts.length - 1], rect[e.to]);
    }
    function offsetLegs(pts, delta, e) {
      // Pair offset: shift only interior/traveling legs so both anchors persist.
      pts = pts.map((p) => p.slice());
      const dom = dominant(pts);
      const orient = dom && dom.vert ? "V" : "H";
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const vert = Math.abs(a[0] - b[0]) < 0.5;
        if ((orient === "V") === vert) offsetLeg(pts, i, delta, orient, e);
      }
      return pts;
    }
    function assignLanes(draws) {
      const legs = [];
      draws.forEach((ed, ei) => {
        for (let i = 0; i < ed.pts.length - 1; i++) {
          const a = ed.pts[i], b = ed.pts[i + 1];
          const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
          if (len <= 0.5) continue;
          const vert = Math.abs(a[0] - b[0]) < 0.5;
          legs.push({
            ei, i, orient: vert ? "V" : "H",
            coord: vert ? a[0] : a[1],
            lo: vert ? Math.min(a[1], b[1]) : Math.min(a[0], b[0]),
            hi: vert ? Math.max(a[1], b[1]) : Math.max(a[0], b[0]),
            e: ed.e, pts: ed.pts,
          });
        }
      });
      // Bucket by (orient, rounded coord), then union overlapping spans.
      const buckets = new Map();
      for (const lg of legs) {
        const key = lg.orient + ":" + R(lg.coord);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(lg);
      }
      for (const group of buckets.values()) {
        if (group.length < 2) continue;
        group.sort((p, q) => (p.ei - q.ei) || (p.i - q.i));
        const used = new Array(group.length).fill(false);
        for (let s = 0; s < group.length; s++) {
          if (used[s]) continue;
          const comp = [s]; used[s] = true;
          // transitive overlap component (fixed order)
          for (let k = 0; k < comp.length; k++) {
            for (let t = 0; t < group.length; t++) {
              if (used[t]) continue;
              const a = group[comp[k]], b = group[t];
              if (a.lo < b.hi && b.lo < a.hi) { comp.push(t); used[t] = true; }
            }
          }
          if (comp.length < 2) continue;
          const n = comp.length, step = n === 2 ? 8 : 6;
          comp.forEach((gi, idx) => {
            const lg = group[gi];
            const delta = (idx - (n - 1) / 2) * step;
            if (Math.abs(delta) < 0.01) return;
            offsetLeg(lg.pts, lg.i, delta, lg.orient, lg.e);
          });
        }
      }
    }

    // ---- A + E: exemplar label grammar with overlap avoidance ----
    // Obstacles labels must avoid: node bodies and zone-label text bands.
    const obstacles = [];
    for (const n of nodes) { const r = rect[n.id]; obstacles.push({ x: r.x, y: r.y, w: r.w, h: r.h }); }
    for (const z of zoneFrames) {
      const t = String(z.label).toUpperCase();
      obstacles.push({ x: z.x + 12, y: z.y + 18 - 11, w: t.length * 7.2, h: 15 });
    }
    const placed = [];
    const overlaps = (b, list) => list.some((o) =>
      b.x < o.x + o.w + 2 && b.x + b.w + 2 > o.x && b.y < o.y + o.h + 2 && b.y + b.h + 2 > o.y);
    const clear = (boxes) => !boxes.some((b) => overlaps(b, obstacles) || overlaps(b, placed));

    // candidate constructors -> { boxes:[...], emit:"<text.../>" }
    const mkHoriz = (cx, firstBaseline, lines, anchor, cls) => {
      const maxw = Math.max(...lines.map(labelW));
      let bx = anchor === "middle" ? cx - maxw / 2 : anchor === "end" ? cx - maxw : cx;
      const box = { x: bx, y: firstBaseline - HALF_CAP, w: maxw, h: LH * (lines.length - 1) + HALF_CAP + 3 };
      const emit = lines.map((ln, i) =>
        `<text class="${cls}" x="${R(cx)}" y="${R(firstBaseline + i * LH)}"` +
        (anchor !== "start" ? ` text-anchor="${anchor}"` : "") + `>${esc(ln)}</text>`).join("");
      return { boxes: [box], emit };
    };
    const mkRot = (x, cy, label, cls) => {
      const w = labelW(label);
      const box = { x: x - 3, y: cy - w / 2, w: 15, h: w };
      const emit = `<text class="${cls}" transform="rotate(-90 ${R(x)} ${R(cy)})" x="${R(x)}" y="${R(cy)}" text-anchor="middle">${esc(label)}</text>`;
      return { boxes: [box], emit };
    };

    const labelParts = [];
    for (const ed of edgeDraws) {
      const e = ed.e;
      if (!e.label) continue;
      const isNet = e.kind === "net";
      const cls = "elabel" + (isNet ? " elabel-net" : "");
      const A = rect[e.from], B = rect[e.to];
      const dom = dominant(ed.pts);
      if (!dom) continue;
      const zoneCross = zoneOf[e.from] !== zoneOf[e.to];
      const segs = segments(ed.pts).sort((p, q) => q.len - p.len);
      const wrapped = wrapLabel(e.label);
      const paired = isPair(e), sign = pairSign[eKey(e)];
      // Horizontal labels center on the full routed x-extent (the gutter span),
      // not on a single Z-bend half — keeps them out of the flanking nodes.
      const fullX0 = Math.min(...ed.pts.map((p) => p[0]));
      const fullX1 = Math.max(...ed.pts.map((p) => p[0]));
      const cands = [];

      // E — reserved band for a zone-crossing vertical that can't fit rotated:
      // horizontal, wrapped, sitting just above the target zone's frame chrome.
      if (dom.vert && zoneCross && dom.len < labelW(e.label) + 24) {
        const lower = A.cy <= B.cy ? B : A;
        const lastBaseline = (lower.y - ZP - ZLAB) - 6;
        cands.push(mkHoriz(dom.a[0], lastBaseline - (wrapped.length - 1) * LH, wrapped, "middle", cls));
      }

      // Segment candidates, dominant segment first (deterministic).
      for (const seg of segs) {
        if (seg.vert) {
          const x = seg.a[0];
          const y0 = Math.min(seg.a[1], seg.b[1]), y1 = Math.max(seg.a[1], seg.b[1]);
          const mid = (y0 + y1) / 2;
          const short = String(e.label).length <= 8;
          const fitsRot = labelW(e.label) <= (y1 - y0) - 24;
          const sideR = paired ? sign >= 0 : true; // E: pair -> opposite sides
          if (!short && fitsRot) {
            cands.push(mkRot(x + (sideR ? 12 : -12), mid, e.label, cls));
            cands.push(mkRot(x + (sideR ? -12 : 12), mid, e.label, cls));
          }
          // horizontal beside the line (exemplar "mint(input)" pattern)
          const ts = paired ? (sign < 0 ? [0.3, 0.7] : [0.7, 0.3]) : [0.5, 0.3, 0.7];
          for (const t of ts) {
            const yy = y0 + t * (y1 - y0) + 3.5;
            cands.push(mkHoriz(x + 7, yy, [e.label], "start", cls));
            cands.push(mkHoriz(x - 7, yy, [e.label], "end", cls));
          }
        } else {
          const y = seg.a[1];
          const cx = (fullX0 + fullX1) / 2;
          const first = y - 6 - (wrapped.length - 1) * LH;
          cands.push(mkHoriz(cx, first, wrapped, "middle", cls));           // above
          cands.push(mkHoriz(cx, y + HALF_CAP + 5, wrapped, "middle", cls)); // below
        }
      }

      const chosen = cands.find((c) => clear(c.boxes)) || cands[0];
      for (const b of chosen.boxes) placed.push(b);
      labelParts.push(chosen.emit);
    }
    const labelSvg = labelParts.join("\n");

    // Content extents (nodes, frames, routed points, placed labels).
    const xs = [], ys = [];
    for (const n of nodes) { const r = rect[n.id]; xs.push(r.x, r.x + r.w); ys.push(r.y, r.y + r.h); }
    for (const z of zoneFrames) { xs.push(z.x, z.x + z.w); ys.push(z.y, z.y + z.h); }
    for (const ed of edgeDraws) for (const p of ed.pts) { xs.push(p[0]); ys.push(p[1]); }
    for (const b of placed) { xs.push(b.x, b.x + b.w); ys.push(b.y, b.y + b.h); }
    let minX = Math.min(...xs), maxX = Math.max(...xs);
    let minY = Math.min(...ys), maxY = Math.max(...ys);

    // Legend below content.
    const legY = maxY + 40;
    const legItems = [
      { cls: "e", label: "in-process call" },
      { cls: "e e-net", label: "network hop" },
      { cls: "e e-type", label: "type-only" },
    ];
    const LEG_STEP = 150, LEG_LINE = 34;
    let legX = minX;
    const legendParts = legItems.map((it, i) => {
      const x = legX + i * LEG_STEP;
      return `<line class="${it.cls}" x1="${x}" y1="${legY}" x2="${x + LEG_LINE}" y2="${legY}"/>` +
        `<text class="lgd" x="${x + LEG_LINE + 8}" y="${legY + 4}">${esc(it.label)}</text>`;
    }).join("");
    const legRight = legX + (legItems.length - 1) * LEG_STEP + LEG_STEP;
    maxX = Math.max(maxX, legRight);
    maxY = Math.max(maxY, legY + 4);

    const M = 18;
    const vbX = Math.round(minX - M);
    const vbY = Math.round(minY - M);
    const vbW = Math.round(maxX - minX + 2 * M);
    const vbH = Math.round(maxY - minY + 2 * M);

    // zones
    const zoneSvg = zoneFrames.map((z) =>
      `<rect class="zone" x="${R(z.x)}" y="${R(z.y)}" width="${R(z.w)}" height="${R(z.h)}" rx="14"/>` +
      `<text class="zone-label" x="${R(z.x + 12)}" y="${R(z.y + 18)}">${esc(String(z.label).toUpperCase())}</text>`
    ).join("\n");

    // nodes
    const nodeSvg = nodes.map((n) => {
      const r = rect[n.id];
      const stroke = pkgVar(n.pkg);
      const subs = Array.isArray(n.sub) ? n.sub : [];
      const chips = Array.isArray(n.chips) ? n.chips : [];
      let parts = `<rect class="node" x="${R(r.x)}" y="${R(r.y)}" width="${R(r.w)}" height="${R(r.h)}" rx="9" style="stroke:${stroke}"/>`;
      parts += `<text class="name" x="${R(r.x + 12)}" y="${R(r.y + 22)}">${esc(n.label)}</text>`;
      subs.forEach((sub, i) => {
        parts += `<text class="sub" x="${R(r.x + 12)}" y="${R(r.y + 40 + i * 15)}">${esc(sub)}</text>`;
      });
      if (chips.length) {
        const chipTop = r.y + 40 + subs.length * 15 + 2;
        chipInfo[n.id].rows.forEach((row, ri) => {
          const cy = chipTop + ri * (CHIP_H + CHIP_ROW_GAP);
          for (const c of row) {
            const cx = r.x + CHIP_PAD + c.dx;
            parts += `<rect class="chip" x="${R(cx)}" y="${R(cy)}" width="${R(c.w)}" height="${CHIP_H}" rx="4"/>`;
            parts += `<text class="chip-label" x="${R(cx + 6)}" y="${R(cy + 13)}">${esc(c.chip)}</text>`;
          }
        });
      }
      return parts;
    }).join("\n");

    // edges (polylines only; labels drawn as a plain-text layer on top — A)
    const edgeSvg = edgeDraws.map((ed) => {
      const isNet = ed.e.kind === "net";
      const isType = ed.e.kind === "type-only";
      const cls = "e" + (isNet ? " e-net" : "") + (isType ? " e-type" : "");
      const marker = isNet ? "url(#dep-arr-net)" : "url(#dep-arr)";
      const points = ed.pts.map((p) => `${R(p[0])},${R(p[1])}`).join(" ");
      return `<polyline class="${cls}" points="${points}" marker-end="${marker}"/>`;
    }).join("\n");

    // Relationships: the edges carry the topology. Without them AT hears only
    // the node list and loses every dependency the diagram exists to show.
    const nodeLabel = {}; for (const n of nodes) nodeLabel[n.id] = n.label;
    const kindWord = { call: "calls", net: "network", "type-only": "type-only" };
    const relEdges = edges.map((e) => {
      const k = kindWord[e.kind] ? ` (${kindWord[e.kind]})` : "";
      return `${nodeLabel[e.from] ?? e.from} → ${nodeLabel[e.to] ?? e.to}${e.label ? `: ${e.label}` : ""}${k}`;
    });
    const aria = `Dependency diagram: ${d.title || ""}. Zones: ${zones.map((z) => z.label).filter(Boolean).join(", ")}. Nodes: ${nodes.map((n) => n.label).filter(Boolean).join(", ")}.` +
      (relEdges.length ? ` Edges: ${relEdges.join("; ")}.` : "");
    const descSvg = relEdges.length ? `<desc>Relationships: ${esc(relEdges.join("; "))}.</desc>` : "";
    const minWidth = Math.min(Math.max(vbW, 560), 1200);

    const svg =
      `<svg viewBox="${vbX} ${vbY} ${vbW} ${vbH}" role="img" aria-label="${esc(aria)}" style="min-width:${minWidth}px">` +
      descSvg +
      `<defs>` +
      `<marker id="dep-arr" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto-start-reverse"><path class="arr" d="M0,0 L10,5 L0,10 z"/></marker>` +
      `<marker id="dep-arr-net" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto-start-reverse"><path class="arr-net" d="M0,0 L10,5 L0,10 z"/></marker>` +
      `</defs>\n${zoneSvg}\n${nodeSvg}\n${edgeSvg}\n${legendParts}\n${labelSvg}</svg>`;

    return `<div class="dep">${svg}</div>${caption(d, "dgm-caption")}`;
  }

  // ---- sections ----
  function sectionShell(id, level, title, inner) {
    return `<section id="${esc(id)}">\n<div class="eyebrow">Level ${level}</div>\n<h2>${esc(title)}</h2>\n${inner}\n</section>`;
  }

  function renderArchitecture(arch) {
    const prose = Array.isArray(arch.prose) ? arch.prose : [];
    const diagrams = Array.isArray(arch.diagrams) ? arch.diagrams : [];
    const channels = Array.isArray(arch.channels) ? arch.channels : [];
    const boundaries = Array.isArray(arch.boundaries) ? arch.boundaries : [];
    // depmaps are rendered inside Components; architecture shows lane/sequence.
    const flowDiagrams = diagrams.filter((d) => d && d.type !== "depmap");

    let inner = "";
    for (const p of prose) {
      inner += `<div class="prose-block" id="${esc(p.id)}">${mdBlocks(p.md)}${receipts(p.receipts)}</div>\n`;
    }
    for (const d of flowDiagrams) inner += renderDiagram(d) + "\n";

    if (channels.length) {
      inner += `<h3 class="sub-head">Channels</h3>\n<div class="channels">`;
      inner += channels.map((c) => {
        const points = Array.isArray(c.points) ? c.points : [];
        const pts = points.map((pt) => `<li>${inlineMd(pt)}</li>`).join("");
        return `<div class="channel" id="${esc(c.id)}"><span class="tag">${esc(c.tag)}</span>` +
          `<h3>${esc(c.title)}</h3><ul>${pts}</ul>${receipts(c.receipts)}</div>`;
      }).join("");
      inner += `</div>\n`;
    }

    if (boundaries.length) {
      inner += `<h3 class="sub-head">Boundaries</h3>\n<ul class="boundaries">`;
      inner += boundaries.map((b) =>
        `<li id="${esc(b.id)}">${inlineMd(b.text)}${receipts(b.receipts)}</li>`
      ).join("");
      inner += `</ul>\n`;
    }
    return inner;
  }

  function renderComponents(components, depmaps) {
    let inner = "";
    if (depmaps.length) {
      inner += `<h3 class="sub-head">Dependency map</h3>\n`;
      for (const d of depmaps) inner += renderDiagram(d) + "\n";
    }
    for (const c of components) {
      const files = Array.isArray(c.files) ? c.files : [];
      const invariants = Array.isArray(c.invariants) ? c.invariants : [];
      const filesHtml = files.length
        ? `<div class="files">` + files.map((f) => `<div>${esc(f.path)}${f.role ? ` <span class="role">— ${esc(f.role)}</span>` : ""}</div>`).join("") + `</div>`
        : "";
      const invHtml = invariants.length
        ? `<ul class="inv">` + invariants.map((iv) => `<li id="${esc(iv.id)}">${inlineMd(iv.text)}${receipts(iv.receipts)}</li>`).join("") + `</ul>`
        : "";
      inner += `<div class="component" id="${esc(c.id)}">` +
        `<div class="comp-head"><span class="pkg ${pkgClass(c.pkg)}">${esc(c.pkg)}</span>` +
        `<h3>${esc(c.title)}</h3><span class="rt">${esc(c.runtime)}</span></div>` +
        filesHtml +
        `<div class="comp-summary">${mdBlocks(c.summary)}</div>` +
        invHtml +
        receipts(c.receipts) +
        `</div>\n`;
    }
    return inner;
  }

  function renderReviewOrder(order) {
    const sorted = order.slice().sort((a, b) => {
      const sa = Number(a.step) || 0, sb = Number(b.step) || 0;
      if (sa !== sb) return sa - sb;
      return String(a.id).localeCompare(String(b.id));
    });
    const items = sorted.map((o) =>
      `<li id="${esc(o.id)}"><div class="step-head"><span class="step-title">${esc(o.scope)}</span>` +
      `<span class="step-time">~${esc(o.timeboxMin)} min</span></div>` +
      `<p>${inlineMd(o.rationale)}</p>${receipts(o.receipts)}</li>`
    ).join("");
    return `<ol class="order">${items}</ol>`;
  }

  function renderAttention(spots) {
    // Group by `group`, preserving first-appearance order.
    const groups = [];
    const byGroup = new Map();
    for (const s of spots) {
      const g = s.group == null ? "" : String(s.group);
      if (!byGroup.has(g)) { byGroup.set(g, []); groups.push(g); }
      byGroup.get(g).push(s);
    }
    return groups.map((g) => {
      const label = g ? `<div class="flag-group-label">${esc(g)}</div>` : "";
      const cards = byGroup.get(g).map((s) =>
        `<div class="flag-item" id="${esc(s.id)}"><span class="loc">${esc(s.loc)}</span>` +
        `<p>${inlineMd(s.why)}</p>${receipts(s.receipts)}</div>`
      ).join("");
      return `${label}<div class="flags">${cards}</div>`;
    }).join("\n");
  }

  function renderPrComments(comments) {
    const cards = comments.map((c) => {
      const loc = c.loc ? `<span class="loc">${esc(c.loc)}</span>` : "";
      return `<div class="comment-item" id="${esc(c.id)}"><div class="comment-head"><span class="author">${esc(c.author)}</span>${loc}</div>` +
        `<div class="comment-body">${mdBlocks(c.text)}</div>${receipts(c.receipts)}</div>`;
    }).join("");
    return `<div class="comments">${cards}</div>`;
  }

  function renderTests(tests) {
    const rows = tests.map((t) => {
      const gaps = t.gaps ? mdBlocks(t.gaps) : `<span class="none">—</span>`;
      return `<tr id="${esc(t.id)}"><td><div class="area-name">${esc(t.area)}</div>${receipts(t.receipts)}</td>` +
        `<td>${mdBlocks(t.coverage)}</td><td>${gaps}</td></tr>`;
    }).join("");
    return `<div class="tablewrap"><table><thead><tr><th>Area</th><th>Coverage</th><th>Gaps</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderQa(qa) {
    const cards = qa.map((e) => {
      const revised = e.revisedAt ? `<span class="revised">revised</span>` : "";
      return `<div class="qa-item" id="${esc(e.id)}"><div class="q">${inlineMd(e.q)}${revised}</div>` +
        `<div class="a">${mdBlocks(e.a)}</div>${receipts(e.receipts)}</div>`;
    }).join("");
    return `<div class="qa">${cards}</div>`;
  }

  // ---- assemble ----
  const arch = doc.architecture || {};
  const diagrams = Array.isArray(arch.diagrams) ? arch.diagrams : [];
  const depmaps = diagrams.filter((d) => d && d.type === "depmap");
  const components = Array.isArray(doc.components) ? doc.components : [];
  const reviewOrder = Array.isArray(doc.reviewOrder) ? doc.reviewOrder : [];
  const attentionSpots = Array.isArray(doc.attentionSpots) ? doc.attentionSpots : [];
  const tests = Array.isArray(doc.tests) ? doc.tests : [];
  const qa = Array.isArray(doc.qa) ? doc.qa : [];
  const prComments = Array.isArray(doc.prComments) ? doc.prComments : [];

  // Depmaps render under Components, not Architecture — count only the
  // flow diagrams renderArchitecture actually displays, so a depmap-only
  // document produces neither an empty Architecture section nor a dead TOC link.
  const archHasContent =
    (Array.isArray(arch.prose) && arch.prose.length) ||
    (diagrams.length - depmaps.length) > 0 ||
    (Array.isArray(arch.channels) && arch.channels.length) ||
    (Array.isArray(arch.boundaries) && arch.boundaries.length);

  // Ordered section list; each present section gets the next Level number.
  const sectionDefs = [
    { id: "architecture", title: "Architecture", show: !!archHasContent, build: () => renderArchitecture(arch) },
    { id: "components", title: "Components", show: components.length > 0 || depmaps.length > 0, build: () => renderComponents(components, depmaps) },
    { id: "order", title: "Review order", show: reviewOrder.length > 0, build: () => renderReviewOrder(reviewOrder) },
    { id: "flags", title: "Attention spots", show: attentionSpots.length > 0, build: () => renderAttention(attentionSpots) },
    { id: "pr-comments", title: "PR comments", show: prComments.length > 0, build: () => renderPrComments(prComments) },
    { id: "tests", title: "Tests", show: tests.length > 0, build: () => renderTests(tests) },
    { id: "qa", title: "Q&A", show: qa.length > 0, build: () => renderQa(qa) },
  ];
  const present = sectionDefs.filter((s) => s.show);

  const toc = present.map((s, i) => `<a href="#${esc(s.id)}">${i + 1} · ${esc(s.title)}</a>`).join("\n    ");
  const sectionsHtml = present.map((s, i) => sectionShell(s.id, i + 1, s.title, s.build())).join("\n\n");

  // header
  const stats = doc.stats || {};
  const num = (v) => (v == null ? "0" : esc(v));
  const meta = [
    `<span>${num(stats.files)} files</span>`,
    `<span>+${num(stats.additions)} / −${num(stats.deletions)}</span>`,
    `<span>${num(stats.commits)} commits</span>`,
    `<span>base: ${esc(pr.base)}</span>`,
    `<span>branch: ${esc(pr.branch)}</span>`,
  ].join("\n    ");

  const thesis = doc.thesis || {};
  const eyebrowBits = ["Pull request walkthrough"];
  if (repo || pr.number != null) eyebrowBits.push(`${esc(repo)}${pr.number != null ? ` #${esc(pr.number)}` : ""}`);
  const header =
    `<header>\n  <div class="eyebrow">${eyebrowBits.join(" · ")}</div>\n` +
    `  <h1>${esc(pr.title)}</h1>\n` +
    `  <div class="pr-meta">\n    ${meta}\n  </div>\n` +
    `  <div class="thesis" id="${esc(thesis.id || "thesis.main")}">${mdBlocks(thesis.text)}${receipts(thesis.receipts)}</div>\n` +
    (present.length ? `  <nav class="toc" aria-label="Sections">\n    ${toc}\n  </nav>\n` : "") +
    `</header>`;

  const footerBits = ["Rendered from walkthrough.json"];
  if (repo) footerBits.push(`${esc(repo)}${pr.number != null ? ` #${esc(pr.number)}` : ""}`);
  if (sha) footerBits.push(esc(sha.slice(0, 12)));
  if (doc.generatedAt) footerBits.push(esc(doc.generatedAt));
  const footer = `<footer class="doc-footer"><p class="note">${footerBits.join(" · ")}</p></footer>`;

  const title = esc(pr.title || "PR walkthrough");
  const style = buildStyle(packages);
  return `<title>${title}</title>\n${style}\n<main>\n${header}\n\n${sectionsHtml}\n\n${footer}\n</main>`;
}

// ---------------------------------------------------------------------------
// Style block — static visual language + dynamically generated package palette.
// ---------------------------------------------------------------------------
function buildStyle(packages) {
  const lightVars = packages.map((p, i) => `--pkg-${cssId(p.id)}: ${PAL[i % PAL.length].light};`).join(" ");
  const darkVars = packages.map((p, i) => `--pkg-${cssId(p.id)}: ${PAL[i % PAL.length].dark};`).join(" ");
  const pkgClasses = packages.map((p) => `.pkg-${cssId(p.id)} { background: var(--pkg-${cssId(p.id)}); }`).join("\n  ");

  return `<style>
  :root {
    --paper: #f4f6f7; --card: #ffffff; --ink: #1b2228; --ink-soft: #4a565e;
    --ink-faint: #74828c; --line: #d8dfe3; --accent: #0e7c74; --accent-soft: #0e7c7418;
    --flag: #9a6511; --flag-bg: #9a651114; --code-bg: #e9edef;
    ${lightVars}
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --paper: #10161a; --card: #171f25; --ink: #e4eaed; --ink-soft: #a7b4bc;
      --ink-faint: #7c8b94; --line: #2b363d; --accent: #3db8ac; --accent-soft: #3db8ac1c;
      --flag: #d9a24a; --flag-bg: #d9a24a1a; --code-bg: #1f2930;
      ${darkVars}
    }
  }
  :root[data-theme="light"] {
    --paper: #f4f6f7; --card: #ffffff; --ink: #1b2228; --ink-soft: #4a565e;
    --ink-faint: #74828c; --line: #d8dfe3; --accent: #0e7c74; --accent-soft: #0e7c7418;
    --flag: #9a6511; --flag-bg: #9a651114; --code-bg: #e9edef;
    ${lightVars}
  }
  :root[data-theme="dark"] {
    --paper: #10161a; --card: #171f25; --ink: #e4eaed; --ink-soft: #a7b4bc;
    --ink-faint: #7c8b94; --line: #2b363d; --accent: #3db8ac; --accent-soft: #3db8ac1c;
    --flag: #d9a24a; --flag-bg: #d9a24a1a; --code-bg: #1f2930;
    ${darkVars}
  }

  * { box-sizing: border-box; }
  body {
    background: var(--paper); color: var(--ink);
    font-family: Charter, Georgia, 'Times New Roman', serif;
    font-size: 17px; line-height: 1.6; margin: 0; padding: 0 20px 96px;
  }
  main { max-width: 46rem; margin: 0 auto; }
  h1, h2, h3, h4 {
    font-family: 'Avenir Next', Avenir, 'Segoe UI', system-ui, sans-serif;
    line-height: 1.2; text-wrap: balance; margin: 0;
  }
  h1 { font-size: 1.9rem; font-weight: 700; letter-spacing: -0.015em; }
  h2 { font-size: 1.35rem; font-weight: 700; margin-top: 0; }
  h3 { font-size: 1.05rem; font-weight: 600; }
  h3.sub-head { margin-top: 2.5rem; }
  p { margin: 0.75rem 0; }
  a { color: var(--accent); }
  code, .path {
    font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
    font-size: 0.82em; background: var(--code-bg); border-radius: 4px; padding: 0.1em 0.35em;
  }
  section { margin-top: 4rem; }
  .eyebrow {
    font-family: 'Avenir Next', Avenir, 'Segoe UI', system-ui, sans-serif;
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 0.5rem;
  }

  header { padding: 64px 0 0; }
  .pr-meta {
    font-family: 'Avenir Next', Avenir, 'Segoe UI', system-ui, sans-serif;
    font-size: 0.82rem; color: var(--ink-faint); margin-top: 0.75rem;
    display: flex; flex-wrap: wrap; gap: 0.4rem 1.4rem; font-variant-numeric: tabular-nums;
  }
  .thesis {
    margin-top: 1.75rem; padding: 1.1rem 1.4rem;
    border-left: 3px solid var(--accent); background: var(--accent-soft);
    border-radius: 0 8px 8px 0; font-size: 1.06rem;
  }
  .thesis p:first-child { margin-top: 0; }
  .thesis p:last-of-type { margin-bottom: 0; }
  .thesis strong { font-style: normal; }

  nav.toc {
    margin-top: 2.5rem; font-family: 'Avenir Next', Avenir, 'Segoe UI', system-ui, sans-serif;
    font-size: 0.88rem; display: flex; flex-wrap: wrap; gap: 0.5rem;
  }
  nav.toc a {
    text-decoration: none; color: var(--ink-soft); border: 1px solid var(--line);
    border-radius: 999px; padding: 0.25rem 0.85rem; background: var(--card);
  }
  nav.toc a:hover, nav.toc a:focus-visible { color: var(--accent); border-color: var(--accent); }

  .pkg {
    font-family: 'SF Mono', ui-monospace, Menlo, monospace;
    font-size: 0.72rem; font-weight: 600; border-radius: 4px; padding: 0.12em 0.5em;
    white-space: nowrap; color: #ffffff;
  }
  ${pkgClasses}

  /* receipts */
  .receipts {
    display: flex; flex-wrap: wrap; gap: 0.3rem 0.7rem; margin-top: 0.45rem;
    font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 0.68rem;
  }
  .receipt {
    color: var(--ink-faint); text-decoration: none;
    border-bottom: 1px dotted var(--line); white-space: nowrap;
  }
  .receipt:hover, .receipt:focus-visible { color: var(--accent); border-color: var(--accent); }
  span.receipt { cursor: help; }

  /* lane diagram */
  .diagram {
    margin-top: 1.5rem; overflow-x: auto;
    font-family: 'Avenir Next', Avenir, 'Segoe UI', system-ui, sans-serif;
  }
  .diagram-inner { min-width: 620px; display: flex; flex-direction: column; gap: 0; }
  .d-row { display: flex; align-items: stretch; gap: 12px; }
  .d-row + .d-row { margin-top: 12px; }
  .d-box {
    flex: 1; background: var(--card); border: 1px solid var(--line);
    border-top: 3px solid var(--bc, var(--line)); border-radius: 8px;
    padding: 0.7rem 0.9rem; font-size: 0.82rem;
  }
  .d-box .d-name { font-weight: 700; font-size: 0.85rem; }
  .d-box .d-sub { color: var(--ink-faint); margin-top: 0.15rem; line-height: 1.45; }
  .d-arrow {
    display: flex; align-items: center; justify-content: center; flex-direction: column;
    color: var(--ink-faint); font-size: 0.72rem; text-align: center;
    padding: 0.35rem 0; letter-spacing: 0.02em;
  }
  .d-arrow .glyph { color: var(--accent); font-size: 1rem; }
  .d-lane { border: 1px dashed var(--line); border-radius: 12px; padding: 0.9rem; margin-top: 1rem; }
  .d-lane:first-child { margin-top: 0; }
  .d-lane-label {
    font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--ink-faint); margin-bottom: 0.6rem;
  }
  .dgm-caption, .seq-caption {
    font-size: 0.8rem; color: var(--ink-faint); margin-top: 0.5rem;
    font-family: 'Avenir Next', Avenir, system-ui, sans-serif;
  }

  /* dependency map */
  .dep { margin-top: 1.25rem; overflow-x: auto; }
  .dep svg {
    width: 100%; height: auto; display: block;
    font-family: 'Avenir Next', Avenir, 'Segoe UI', system-ui, sans-serif;
  }
  .dep .zone { fill: none; stroke: var(--line); stroke-dasharray: 7 5; }
  .dep .zone-label { font-size: 11px; font-weight: 700; letter-spacing: 0.13em; fill: var(--ink-faint); }
  .dep .node { fill: var(--card); stroke-width: 1.3; }
  .dep .name { font-size: 12.5px; font-weight: 700; fill: var(--ink); }
  .dep .sub { font-size: 10.5px; fill: var(--ink-faint); }
  .dep .chip { fill: var(--code-bg); }
  .dep .chip-label { font-size: 10px; fill: var(--ink-soft); font-family: 'SF Mono', ui-monospace, Menlo, monospace; }
  .dep .e { stroke: var(--ink-faint); stroke-width: 1.4; fill: none; }
  .dep .e-net { stroke: var(--accent); stroke-width: 1.6; }
  .dep .e-type { stroke: var(--ink-faint); stroke-dasharray: 4 4; }
  .dep .elabel { font-size: 10px; fill: var(--ink-soft); }
  .dep .elabel-net { fill: var(--accent); }
  .dep .arr { fill: var(--ink-faint); }
  .dep .arr-net { fill: var(--accent); }
  .dep .lgd { font-size: 10.5px; fill: var(--ink-faint); }

  /* runtime badge */
  .rt {
    font-family: 'Avenir Next', Avenir, 'Segoe UI', system-ui, sans-serif;
    font-size: 0.64rem; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--ink-faint); border: 1px solid var(--line); border-radius: 999px;
    padding: 0.18em 0.65em; white-space: nowrap;
  }

  /* channels */
  .channels { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.25rem; }
  @media (max-width: 620px) { .channels { grid-template-columns: 1fr; } }
  .channel {
    background: var(--card); border: 1px solid var(--line); border-radius: 10px;
    padding: 1rem 1.2rem; font-size: 0.95rem;
  }
  .channel h3 { margin-bottom: 0.4rem; margin-top: 0.2rem; }
  .channel .tag {
    font-family: 'Avenir Next', Avenir, system-ui, sans-serif;
    font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent);
  }
  .channel ul { margin: 0.5rem 0 0; padding-left: 1.1rem; }
  .channel li { margin: 0.3rem 0; }

  .boundaries { margin: 1.25rem 0 0; padding-left: 1.15rem; }
  .boundaries li { margin: 0.7rem 0; }

  .prose-block { margin-top: 0; }

  /* tables */
  .tablewrap { overflow-x: auto; margin-top: 1rem; }
  table {
    border-collapse: collapse; width: 100%; font-size: 0.88rem;
    font-family: 'Avenir Next', Avenir, 'Segoe UI', system-ui, sans-serif;
    background: var(--card); border: 1px solid var(--line); border-radius: 8px;
  }
  th, td { text-align: left; padding: 0.55rem 0.8rem; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint); }
  tr:last-child td { border-bottom: none; }
  td p:first-child { margin-top: 0; }
  td p:last-child { margin-bottom: 0; }
  .area-name { font-weight: 600; }
  td .none { color: var(--ink-faint); }

  /* components */
  .component {
    background: var(--card); border: 1px solid var(--line); border-radius: 12px;
    padding: 1.4rem 1.6rem; margin-top: 1.5rem;
  }
  .component > .comp-head { display: flex; align-items: baseline; gap: 0.7rem; flex-wrap: wrap; }
  .component .files {
    font-size: 0.78rem; color: var(--ink-faint); margin-top: 0.5rem;
    font-family: 'SF Mono', ui-monospace, Menlo, monospace; word-break: break-all;
  }
  .component .files .role { color: var(--ink-faint); }
  .comp-summary p:first-child { margin-top: 0.6rem; }
  .component ul.inv { padding-left: 1.15rem; margin: 0.6rem 0 0; }
  .component ul.inv li { margin: 0.45rem 0; }

  /* review order */
  ol.order { list-style: none; padding: 0; margin: 1.5rem 0 0; counter-reset: step; }
  ol.order > li {
    counter-increment: step;
    background: var(--card); border: 1px solid var(--line); border-radius: 10px;
    padding: 1rem 1.2rem 1rem 3.4rem; margin-top: 0.8rem; position: relative;
  }
  ol.order > li::before {
    content: counter(step); position: absolute; left: 1.1rem; top: 1.05rem;
    font-family: 'Avenir Next', Avenir, system-ui, sans-serif;
    font-weight: 700; font-size: 0.95rem; color: var(--accent); font-variant-numeric: tabular-nums;
  }
  ol.order .step-head { display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap; }
  ol.order .step-title { font-family: 'Avenir Next', Avenir, system-ui, sans-serif; font-weight: 600; font-size: 0.98rem; }
  ol.order .step-time {
    margin-left: auto; font-family: 'Avenir Next', Avenir, system-ui, sans-serif;
    font-size: 0.75rem; color: var(--ink-faint); font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  ol.order p { font-size: 0.92rem; margin: 0.4rem 0 0; color: var(--ink-soft); }

  /* attention flags */
  .flags { margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .flag-item {
    border: 1px solid var(--line); border-left: 3px solid var(--flag);
    background: var(--card); border-radius: 0 8px 8px 0; padding: 0.8rem 1.1rem; font-size: 0.93rem;
  }
  .flag-item .loc {
    font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 0.76rem;
    background: var(--flag-bg); color: var(--flag); border-radius: 4px; padding: 0.1em 0.45em; font-weight: 600;
  }
  .flag-item p { margin: 0.35rem 0 0; color: var(--ink-soft); }
  .flag-group-label {
    margin-top: 1.6rem; font-family: 'Avenir Next', Avenir, system-ui, sans-serif;
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint);
  }

  /* sequence diagram */
  .seqwrap { overflow-x: auto; margin-top: 1.25rem; }
  .seq { font-family: 'Avenir Next', Avenir, 'Segoe UI', system-ui, sans-serif; font-size: 0.76rem; }
  .seq-head { display: grid; }
  .seq-actor {
    text-align: center; font-weight: 700; font-size: 0.78rem; padding: 0.45rem 0.3rem; margin: 0 0.4rem;
    border: 1px solid var(--line); border-top: 3px solid var(--bc, var(--line));
    background: var(--card); border-radius: 6px;
  }
  .seq-actor .sub { display: block; font-weight: 400; color: var(--ink-faint); font-size: 0.68rem; }
  .seq-body { display: grid; padding: 0.6rem 0 0.9rem; }
  .msg { margin: 0.55rem 0 0; }
  .msg-label { text-align: center; margin: 0 auto 0.1rem; line-height: 1.35; }
  .msg-label code { font-size: 0.9em; }
  .msg-line { position: relative; border-bottom: 2px solid var(--accent); }
  .msg:not(.rtl) .msg-line::after {
    content: ''; position: absolute; right: -2px; bottom: -5px;
    border: 4px solid transparent; border-left: 7px solid var(--accent);
  }
  .msg.rtl .msg-line::after {
    content: ''; position: absolute; left: -2px; bottom: -5px;
    border: 4px solid transparent; border-right: 7px solid var(--accent);
  }
  .msg.muted .msg-line { border-color: var(--ink-faint); }
  .msg.muted .msg-label { color: var(--ink-faint); }
  .msg.muted:not(.rtl) .msg-line::after { border-left-color: var(--ink-faint); }
  .msg.muted.rtl .msg-line::after { border-right-color: var(--ink-faint); }
  .self {
    margin: 0.55rem 8% 0; border: 1px dashed var(--ink-faint); border-radius: 6px;
    background: var(--card); padding: 0.35rem 0.5rem; text-align: center; color: var(--ink-soft);
  }
  .phase {
    grid-column: 1 / -1; text-align: center; margin: 0.8rem 6% 0.2rem; padding: 0.3rem 0.6rem;
    background: var(--flag-bg); color: var(--flag); border-radius: 6px; font-size: 0.72rem; font-weight: 600;
  }

  /* pr comments */
  .comments { margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.8rem; }
  .comment-item {
    background: var(--card); border: 1px solid var(--line); border-radius: 10px;
    padding: 0.9rem 1.2rem; font-size: 0.95rem;
  }
  .comment-head { display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap; }
  .comment-head .author { font-family: 'Avenir Next', Avenir, system-ui, sans-serif; font-weight: 600; font-size: 0.9rem; }
  .comment-head .loc {
    font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 0.74rem; color: var(--ink-faint);
  }
  .comment-body p:first-child { margin-top: 0.35rem; }

  /* q&a */
  .qa { margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.8rem; }
  .qa-item {
    background: var(--card); border: 1px solid var(--line); border-radius: 10px;
    padding: 0.9rem 1.2rem; font-size: 0.95rem;
  }
  .qa-item .q { font-family: 'Avenir Next', Avenir, system-ui, sans-serif; font-weight: 600; font-size: 0.95rem; }
  .qa-item .q .revised {
    margin-left: 0.5rem; font-size: 0.64rem; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--ink-faint);
  }
  .qa-item .a p { margin: 0.4rem 0 0; color: var(--ink-soft); }

  /* footer */
  .doc-footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid var(--line); }
  .note { font-size: 0.9rem; color: var(--ink-faint); }
  @media (prefers-reduced-motion: no-preference) {
    a, summary, nav.toc a { transition: color 120ms ease, border-color 120ms ease; }
  }
</style>`;
}

main();
