#!/usr/bin/env node
// validate.mjs — walkthrough.json v1 validator.
//
// Usage: node validate.mjs <path-to-walkthrough.json>
//
// Implements every rule in references/schema.md §"Validation rules"
// plus structural basics (required fields, types, enums). Collects ALL
// violations, prints them one per line, exits 1 on any violation and
// 0 on a clean document. Zero dependencies; plain node.

import { readFileSync } from "node:fs";

const RECEIPT_KINDS = new Set(["code", "doc", "url", "report"]);
const DIAGRAM_TYPES = new Set(["lane", "sequence", "depmap"]);
const EDGE_KINDS = new Set(["call", "net", "type-only"]);
const STEP_KINDS = new Set(["msg", "self", "phase"]);
const ARROWS = new Set(["→", "⇄", "↓"]);
const ID_RE = /^[a-z]+\.[a-z0-9-]+$/;
const CODE_REF_RE = /^(.+):(\d+)(?:-(\d+))?$/;
const SHA_RE = /^[0-9a-f]{40}$/;

const violations = [];
let receiptCount = 0;
let idCount = 0;

function fail(rule, path, msg) {
  violations.push(`[${rule}] at ${path}: ${msg}`);
}

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const isArr = Array.isArray;
const isStr = (x) => typeof x === "string";
const isNonEmptyStr = (x) => isStr(x) && x.length > 0;
const isInt = (x) => Number.isInteger(x);

function requireField(obj, path, name, pred, expected) {
  if (!isObj(obj)) return false;
  const val = obj[name];
  if (!pred(val)) {
    fail("structure", `${path}.${name}`, `expected ${expected}, got ${JSON.stringify(val)}`);
    return false;
  }
  return true;
}

// ---- id collection (rules 1 + 2) -------------------------------------------
// Walks the whole document and collects every string-valued `id` property.
// depmap layout.nodes is a map keyed by node id (no `id` property), so it is
// naturally excluded — its keys are checked by rule 6, not rules 1/2.
// packages[].id values are palette keys (e.g. "api"), a separate namespace
// referenced by `pkg` fields — per the schema's normative examples they are
// NOT node ids, so they are excluded from rules 1/2 and checked separately.

function collectIds(node, path, out) {
  if (isArr(node)) {
    node.forEach((item, i) => collectIds(item, `${path}[${i}]`, out));
  } else if (isObj(node)) {
    if (isStr(node.id)) out.push({ id: node.id, path: `${path}.id` });
    for (const [key, val] of Object.entries(node)) {
      if (key === "id") continue;
      collectIds(val, `${path}.${key}`, out);
    }
  }
}

function checkIds(doc) {
  const ids = [];
  for (const [key, val] of Object.entries(doc)) {
    if (key === "packages") continue;
    collectIds(val, `$.${key}`, ids);
  }
  idCount = ids.length;
  const seen = new Map();
  for (const { id, path } of ids) {
    if (!ID_RE.test(id)) {
      fail("rule-2-id-pattern", path, `id "${id}" does not match ^[a-z]+\\.[a-z0-9-]+$`);
    }
    if (seen.has(id)) {
      fail("rule-1-id-unique", path, `duplicate id "${id}" (first seen at ${seen.get(id)})`);
    } else {
      seen.set(id, path);
    }
  }
}

// ---- receipts (rules 3 + 8, structural kind/ref) ---------------------------

function checkReceipts(node, path, { required }) {
  const receipts = isObj(node) ? node.receipts : undefined;
  if (!isArr(receipts)) {
    fail("structure", `${path}.receipts`, "expected an array of receipts");
    return;
  }
  if (required && receipts.length === 0) {
    fail("rule-3-receipts", `${path}.receipts`, "claim-bearing node requires at least one receipt");
  }
  receipts.forEach((r, i) => {
    const rPath = `${path}.receipts[${i}]`;
    if (!isObj(r)) {
      fail("structure", rPath, "receipt must be an object");
      return;
    }
    receiptCount++;
    if (!RECEIPT_KINDS.has(r.kind)) {
      fail("structure", `${rPath}.kind`, `invalid receipt kind ${JSON.stringify(r.kind)} (expected code|doc|url|report)`);
    }
    if (!isNonEmptyStr(r.ref)) {
      fail("structure", `${rPath}.ref`, "receipt ref must be a non-empty string");
      return;
    }
    if (r.kind === "code") {
      const m = CODE_REF_RE.exec(r.ref);
      if (!m) {
        fail("rule-8-code-ref", `${rPath}.ref`, `code receipt ref "${r.ref}" must match path:line or path:line-line`);
      } else if (m[3] !== undefined && Number(m[3]) < Number(m[2])) {
        fail("rule-8-code-ref", `${rPath}.ref`, `code receipt ref "${r.ref}" has end line smaller than start line`);
      }
    }
  });
}

// ---- pkg references (rule 7) ------------------------------------------------

function checkPkg(node, path, pkgIds) {
  if (!isObj(node) || node.pkg === undefined) return;
  if (!pkgIds.has(node.pkg)) {
    fail("rule-7-pkg-ref", `${path}.pkg`, `pkg "${node.pkg}" does not resolve to any packages[].id`);
  }
}

// ---- diagrams ---------------------------------------------------------------

function checkLane(d, path, pkgIds) {
  if (!requireField(d, path, "lanes", isArr, "an array")) return;
  d.lanes.forEach((lane, i) => {
    const lPath = `${path}.lanes[${i}]`;
    requireField(lane, lPath, "id", isNonEmptyStr, "a non-empty string");
    requireField(lane, lPath, "label", isStr, "a string");
    if (!requireField(lane, lPath, "rows", isArr, "an array")) return;
    lane.rows.forEach((row, j) => {
      const rowPath = `${lPath}.rows[${j}]`;
      if (!isArr(row)) {
        fail("structure", rowPath, "each row must be an array of cells");
        return;
      }
      row.forEach((cell, k) => {
        const cPath = `${rowPath}[${k}]`;
        if (!isObj(cell)) {
          fail("structure", cPath, "cell must be an object");
          return;
        }
        if (cell.arrow !== undefined) {
          if (!ARROWS.has(cell.arrow)) {
            fail("structure", `${cPath}.arrow`, `invalid arrow ${JSON.stringify(cell.arrow)} (expected →, ⇄, or ↓)`);
          }
        } else {
          requireField(cell, cPath, "id", isNonEmptyStr, "a non-empty string");
          requireField(cell, cPath, "label", isStr, "a string");
          checkPkg(cell, cPath, pkgIds);
        }
      });
    });
  });
}

function checkSequence(d, path, pkgIds) {
  const actorIds = new Set();
  if (requireField(d, path, "actors", isArr, "an array")) {
    d.actors.forEach((actor, i) => {
      const aPath = `${path}.actors[${i}]`;
      if (requireField(actor, aPath, "id", isNonEmptyStr, "a non-empty string")) actorIds.add(actor.id);
      requireField(actor, aPath, "label", isStr, "a string");
      checkPkg(actor, aPath, pkgIds);
    });
  }
  if (!requireField(d, path, "steps", isArr, "an array")) return;
  d.steps.forEach((step, i) => {
    const sPath = `${path}.steps[${i}]`;
    if (!isObj(step) || !STEP_KINDS.has(step.kind)) {
      fail("structure", sPath, `step kind must be one of msg|self|phase, got ${JSON.stringify(isObj(step) ? step.kind : step)}`);
      return;
    }
    requireField(step, sPath, "label", isStr, "a string");
    if (step.kind === "msg") {
      for (const end of ["from", "to"]) {
        if (!actorIds.has(step[end])) {
          fail("rule-10-seq-actor-ref", `${sPath}.${end}`, `msg step references unknown actor ${JSON.stringify(step[end])}`);
        }
      }
    } else if (step.kind === "self") {
      if (!actorIds.has(step.actor)) {
        fail("rule-10-seq-actor-ref", `${sPath}.actor`, `self step references unknown actor ${JSON.stringify(step.actor)}`);
      }
    }
  });
}

function checkDepmap(d, path, pkgIds) {
  const zoneIds = new Set();
  const nodeIds = new Set();
  if (requireField(d, path, "zones", isArr, "an array")) {
    d.zones.forEach((zone, i) => {
      const zPath = `${path}.zones[${i}]`;
      if (requireField(zone, zPath, "id", isNonEmptyStr, "a non-empty string")) zoneIds.add(zone.id);
      requireField(zone, zPath, "label", isStr, "a string");
    });
  }
  if (requireField(d, path, "nodes", isArr, "an array")) {
    d.nodes.forEach((node, i) => {
      const nPath = `${path}.nodes[${i}]`;
      if (requireField(node, nPath, "id", isNonEmptyStr, "a non-empty string")) nodeIds.add(node.id);
      requireField(node, nPath, "label", isStr, "a string");
      if (requireField(node, nPath, "zone", isNonEmptyStr, "a non-empty string") && !zoneIds.has(node.zone)) {
        fail("rule-9-depmap-zone-ref", `${nPath}.zone`, `node references unknown zone "${node.zone}"`);
      }
      checkPkg(node, nPath, pkgIds);
    });
  }
  if (requireField(d, path, "edges", isArr, "an array")) {
    d.edges.forEach((edge, i) => {
      const ePath = `${path}.edges[${i}]`;
      if (!isObj(edge)) {
        fail("structure", ePath, "edge must be an object");
        return;
      }
      for (const end of ["from", "to"]) {
        if (!nodeIds.has(edge[end])) {
          fail("rule-5-depmap-edge-ref", `${ePath}.${end}`, `edge references unknown node ${JSON.stringify(edge[end])}`);
        }
      }
      if (!EDGE_KINDS.has(edge.kind)) {
        fail("structure", `${ePath}.kind`, `invalid edge kind ${JSON.stringify(edge.kind)} (expected call|net|type-only)`);
      }
    });
  }
  if (requireField(d, path, "layout", isObj, "an object")) {
    const lPath = `${path}.layout`;
    requireField(d.layout, lPath, "cols", isInt, "an integer");
    if (requireField(d.layout, lPath, "nodes", isObj, "an object")) {
      for (const [key, place] of Object.entries(d.layout.nodes)) {
        const pPath = `${lPath}.nodes["${key}"]`;
        if (!nodeIds.has(key)) {
          fail("rule-6-layout-keys", pPath, `layout key "${key}" is not a node id in this depmap`);
        }
        if (!isObj(place) || !isInt(place.col) || !isInt(place.row)) {
          fail("structure", pPath, "layout entry must be an object with integer col and row");
        }
      }
    }
  }
}

function checkDiagram(d, path, pkgIds) {
  if (!isObj(d)) {
    fail("structure", path, "diagram must be an object");
    return;
  }
  requireField(d, path, "id", isNonEmptyStr, "a non-empty string");
  requireField(d, path, "title", isStr, "a string");
  if (!DIAGRAM_TYPES.has(d.type)) {
    fail("structure", `${path}.type`, `invalid diagram type ${JSON.stringify(d.type)} (expected lane|sequence|depmap)`);
    return;
  }
  if (d.type === "lane") checkLane(d, path, pkgIds);
  else if (d.type === "sequence") checkSequence(d, path, pkgIds);
  else checkDepmap(d, path, pkgIds);
}

// ---- top-level --------------------------------------------------------------

function validate(doc) {
  if (!isObj(doc)) {
    fail("structure", "$", "document root must be an object");
    return;
  }

  if (doc.version !== 1) {
    fail("structure", "$.version", `expected schema version 1, got ${JSON.stringify(doc.version)}`);
  }

  if (requireField(doc, "$", "pr", isObj, "an object")) {
    requireField(doc.pr, "$.pr", "repo", isNonEmptyStr, "a non-empty string");
    requireField(doc.pr, "$.pr", "number", isInt, "an integer");
    requireField(doc.pr, "$.pr", "title", isNonEmptyStr, "a non-empty string");
    requireField(doc.pr, "$.pr", "branch", isNonEmptyStr, "a non-empty string");
    requireField(doc.pr, "$.pr", "base", isNonEmptyStr, "a non-empty string");
  }

  if (requireField(doc, "$", "sha", isStr, "a string") && !SHA_RE.test(doc.sha)) {
    fail("rule-4-sha", "$.sha", `sha "${doc.sha}" is not exactly 40 lowercase hex characters`);
  }

  requireField(doc, "$", "generatedAt", isNonEmptyStr, "a non-empty string");

  const pkgIds = new Set();
  if (requireField(doc, "$", "packages", isArr, "an array")) {
    doc.packages.forEach((pkg, i) => {
      const pPath = `$.packages[${i}]`;
      if (requireField(pkg, pPath, "id", isNonEmptyStr, "a non-empty string")) {
        if (pkgIds.has(pkg.id)) {
          fail("structure", `${pPath}.id`, `duplicate package id "${pkg.id}"`);
        }
        pkgIds.add(pkg.id);
      }
      requireField(pkg, pPath, "label", isNonEmptyStr, "a non-empty string");
    });
  }

  if (requireField(doc, "$", "thesis", isObj, "an object")) {
    requireField(doc.thesis, "$.thesis", "text", isNonEmptyStr, "a non-empty string");
    if (doc.thesis.id !== "thesis.main") {
      fail("structure", "$.thesis.id", `thesis id must be "thesis.main", got ${JSON.stringify(doc.thesis.id)}`);
    }
    checkReceipts(doc.thesis, "$.thesis", { required: true });
  }

  if (requireField(doc, "$", "stats", isObj, "an object")) {
    for (const field of ["files", "additions", "deletions", "commits"]) {
      requireField(doc.stats, "$.stats", field, isInt, "an integer");
    }
  }

  if (requireField(doc, "$", "architecture", isObj, "an object")) {
    const arch = doc.architecture;
    if (requireField(arch, "$.architecture", "prose", isArr, "an array")) {
      arch.prose.forEach((p, i) => {
        const path = `$.architecture.prose[${i}]`;
        requireField(p, path, "md", isNonEmptyStr, "a non-empty string");
        if (isObj(p) && p.receipts !== undefined) checkReceipts(p, path, { required: false });
      });
    }
    if (requireField(arch, "$.architecture", "diagrams", isArr, "an array")) {
      arch.diagrams.forEach((d, i) => checkDiagram(d, `$.architecture.diagrams[${i}]`, pkgIds));
    }
    if (requireField(arch, "$.architecture", "channels", isArr, "an array")) {
      arch.channels.forEach((c, i) => {
        const path = `$.architecture.channels[${i}]`;
        requireField(c, path, "tag", isNonEmptyStr, "a non-empty string");
        requireField(c, path, "title", isNonEmptyStr, "a non-empty string");
        requireField(c, path, "points", isArr, "an array");
        checkReceipts(c, path, { required: true });
      });
    }
    if (requireField(arch, "$.architecture", "boundaries", isArr, "an array")) {
      arch.boundaries.forEach((b, i) => {
        const path = `$.architecture.boundaries[${i}]`;
        requireField(b, path, "text", isNonEmptyStr, "a non-empty string");
        checkReceipts(b, path, { required: true });
      });
    }
  }

  if (requireField(doc, "$", "components", isArr, "an array")) {
    doc.components.forEach((comp, i) => {
      const path = `$.components[${i}]`;
      requireField(comp, path, "title", isNonEmptyStr, "a non-empty string");
      requireField(comp, path, "runtime", isNonEmptyStr, "a non-empty string");
      requireField(comp, path, "summary", isNonEmptyStr, "a non-empty string");
      if (requireField(comp, path, "pkg", isNonEmptyStr, "a non-empty string")) checkPkg(comp, path, pkgIds);
      if (requireField(comp, path, "files", isArr, "an array")) {
        comp.files.forEach((f, j) => {
          const fPath = `${path}.files[${j}]`;
          requireField(f, fPath, "path", isNonEmptyStr, "a non-empty string");
          requireField(f, fPath, "role", isNonEmptyStr, "a non-empty string");
        });
      }
      if (isObj(comp) && comp.invariants !== undefined && requireField(comp, path, "invariants", isArr, "an array")) {
        comp.invariants.forEach((inv, j) => {
          const iPath = `${path}.invariants[${j}]`;
          requireField(inv, iPath, "text", isNonEmptyStr, "a non-empty string");
          checkReceipts(inv, iPath, { required: true });
        });
      }
      checkReceipts(comp, path, { required: true });
    });
  }

  if (requireField(doc, "$", "reviewOrder", isArr, "an array")) {
    doc.reviewOrder.forEach((step, i) => {
      const path = `$.reviewOrder[${i}]`;
      requireField(step, path, "step", isInt, "an integer");
      requireField(step, path, "scope", isNonEmptyStr, "a non-empty string");
      requireField(step, path, "timeboxMin", isInt, "an integer");
      requireField(step, path, "rationale", isNonEmptyStr, "a non-empty string");
      checkReceipts(step, path, { required: true });
    });
  }

  if (requireField(doc, "$", "attentionSpots", isArr, "an array")) {
    doc.attentionSpots.forEach((spot, i) => {
      const path = `$.attentionSpots[${i}]`;
      requireField(spot, path, "loc", isNonEmptyStr, "a non-empty string");
      requireField(spot, path, "why", isNonEmptyStr, "a non-empty string");
      requireField(spot, path, "group", isNonEmptyStr, "a non-empty string");
      checkReceipts(spot, path, { required: true });
    });
  }

  if (requireField(doc, "$", "tests", isArr, "an array")) {
    doc.tests.forEach((t, i) => {
      const path = `$.tests[${i}]`;
      requireField(t, path, "area", isNonEmptyStr, "a non-empty string");
      requireField(t, path, "coverage", isNonEmptyStr, "a non-empty string");
      checkReceipts(t, path, { required: true });
    });
  }

  if (requireField(doc, "$", "qa", isArr, "an array")) {
    doc.qa.forEach((entry, i) => {
      const path = `$.qa[${i}]`;
      requireField(entry, path, "q", isNonEmptyStr, "a non-empty string");
      requireField(entry, path, "a", isNonEmptyStr, "a non-empty string");
      checkReceipts(entry, path, { required: true });
    });
  }

  if (requireField(doc, "$", "prComments", isArr, "an array")) {
    doc.prComments.forEach((c, i) => {
      const path = `$.prComments[${i}]`;
      requireField(c, path, "author", isNonEmptyStr, "a non-empty string");
      requireField(c, path, "text", isNonEmptyStr, "a non-empty string");
      checkReceipts(c, path, { required: true });
    });
  }

  checkIds(doc);
}

// ---- entry ------------------------------------------------------------------

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate.mjs <path-to-walkthrough.json>");
    process.exit(2);
  }

  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (err) {
    console.error(`Cannot read ${file}: ${err.message}`);
    process.exit(2);
  }

  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (err) {
    console.error(`[structure] at $: not valid JSON — ${err.message}`);
    console.error("1 violation.");
    process.exit(1);
  }

  validate(doc);

  if (violations.length > 0) {
    for (const v of violations) console.error(v);
    console.error(`${violations.length} violation${violations.length === 1 ? "" : "s"}.`);
    process.exit(1);
  }

  console.log(`OK: ${file} is a valid walkthrough.json v1 (${idCount} ids, ${receiptCount} receipts checked)`);
}

main();
