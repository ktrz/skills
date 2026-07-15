#!/usr/bin/env node
// validate-plan.mjs — plan-file contract validator.
//
// Usage: node validate-plan.mjs <path-to-plan.md>
//
// Validates the phased plan-file format that `plan-feature` produces and
// `implement-feature` / `execute-phase` consume. Enforces every rule in
// references/plan-file-format.md §"Validation rules". Collects ALL
// violations, prints them one per line, exits 1 on any violation and 0 on a
// clean document. Zero dependencies; plain node. Operates on the markdown
// source text (headings only — prose inside sections is free-form).

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const violations = [];

function fail(rule, msg) {
  violations.push(`[${rule}] ${msg}`);
}

// Split the document into logical lines, tracking fenced code blocks so that
// headings inside ``` fences (e.g. a bash `# comment`, or an embedded template)
// are never mistaken for structure. Markdown only recognises ATX headings
// outside fenced code.
function structuralLines(text) {
  const out = [];
  let inFence = false;
  let fenceMarker = "";
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const fenceOpen = raw.match(/^(\s*)(`{3,}|~{3,})/);
    if (fenceOpen) {
      const marker = fenceOpen[2][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
        return;
      }
      if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = "";
        return;
      }
    }
    if (!inFence) out.push({ text: raw, n: i + 1 });
  });
  return out;
}

const H1_RE = /^#(?!#)\s+\S/;
const H2_RE = /^##(?!#)\s+(.*\S)\s*$/;
const PHASE_RE = /^##(?!#)\s+Phase\s+(\d+)\b/;
const CONTEXT_RE = /^##(?!#)\s+Context\b/;
const EXEC_ORDER_RE = /^##(?!#)\s+Execution Order\b/;

export function validate(text) {
  violations.length = 0;

  const lines = structuralLines(text);

  // ---- rule 1: exactly one H1 title -----------------------------------------
  const h1s = lines.filter((l) => H1_RE.test(l.text));
  if (h1s.length === 0) {
    fail("rule-1-title", "document must have an H1 title line (`# <TICKET-KEY>: <name>`)");
  } else if (h1s.length > 1) {
    fail(
      "rule-1-title",
      `document must have exactly one H1 title, found ${h1s.length} (first at line ${h1s[0].n})`
    );
  }

  // ---- collect phase headings -----------------------------------------------
  const phases = [];
  lines.forEach((l, idx) => {
    const m = l.text.match(PHASE_RE);
    if (m) phases.push({ num: Number(m[1]), line: l.n, idx });
  });

  // ---- rule 2: Context section present --------------------------------------
  if (!lines.some((l) => CONTEXT_RE.test(l.text))) {
    fail("rule-2-context", "document must have a `## Context` section");
  }

  // ---- rule 3: Execution Order present when >= 2 phases ----------------------
  const hasExecOrder = lines.some((l) => EXEC_ORDER_RE.test(l.text));
  if (phases.length >= 2 && !hasExecOrder) {
    fail(
      "rule-3-execution-order",
      "a multi-phase plan (>= 2 phases) must have an `## Execution Order` section"
    );
  }

  // ---- rule 4: at least one phase -------------------------------------------
  if (phases.length === 0) {
    fail("rule-4-phases", "document must have at least one `## Phase <N>` section");
    return violations;
  }

  // ---- rule 5: unique phase numbers -----------------------------------------
  const seen = new Map();
  for (const p of phases) {
    if (seen.has(p.num)) {
      fail(
        "rule-5-phase-unique",
        `duplicate phase number ${p.num} at line ${p.line} (first seen at line ${seen.get(p.num)})`
      );
    } else {
      seen.set(p.num, p.line);
    }
  }

  // ---- rule 6: contiguous phase run from 0 or 1 -----------------------------
  const nums = [...seen.keys()].sort((a, b) => a - b);
  const min = nums[0];
  const max = nums[nums.length - 1];
  if (min !== 0 && min !== 1) {
    fail(
      "rule-6-phase-contiguous",
      `phase run must start at 0 or 1, lowest phase number is ${min}`
    );
  } else {
    for (let v = min; v <= max; v++) {
      if (!seen.has(v)) {
        fail(
          "rule-6-phase-contiguous",
          `no Phase ${v} heading — phase numbers must form a contiguous run ${min}..${max}`
        );
      }
    }
  }

  // ---- rule 7: every phase section has a non-empty body ---------------------
  // A phase body is the lines between its heading and the next H2 heading (or
  // EOF). It must contain at least one line that is neither blank nor a bare
  // horizontal rule (`---`).
  const h2Idxs = lines.map((l, i) => (H2_RE.test(l.text) ? i : -1)).filter((i) => i >= 0);
  for (const p of phases) {
    const next = h2Idxs.find((i) => i > p.idx);
    const end = next === undefined ? lines.length : next;
    let hasBody = false;
    for (let i = p.idx + 1; i < end; i++) {
      const t = lines[i].text.trim();
      if (t.length > 0 && t !== "---") {
        hasBody = true;
        break;
      }
    }
    if (!hasBody) {
      fail(
        "rule-7-phase-body",
        `Phase ${p.num} (line ${p.line}) has an empty body — a phase must describe work to execute`
      );
    }
  }

  return violations;
}

// ---- entry ------------------------------------------------------------------

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-plan.mjs <path-to-plan.md>");
    process.exit(2);
  }

  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (err) {
    console.error(`Cannot read ${file}: ${err.message}`);
    process.exit(2);
  }

  validate(raw);

  if (violations.length > 0) {
    for (const v of violations) console.error(v);
    console.error(`${violations.length} violation${violations.length === 1 ? "" : "s"}.`);
    process.exit(1);
  }

  console.log(`OK: ${file} is a valid plan file`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
