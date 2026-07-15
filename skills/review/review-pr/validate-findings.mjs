#!/usr/bin/env node
// validate-findings.mjs — findings-file contract validator.
//
// Usage: node validate-findings.mjs <path-to-findings.json>
//
// Validates a findings file against references/findings-schema.md. A findings
// file is either a single finding object or a JSON array of findings — the
// normalised shape every sub-agent (or the single-pass fallback) must produce
// before aggregation. Collects ALL violations, prints them one per line, exits
// 1 on any violation and 0 on a clean document. Zero dependencies; plain node.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SEVERITIES = new Set(["critical", "important", "suggestion", "nit"]);
const RESOLUTION_STATUSES = new Set(["addressed", "partial", "not-addressed", "cant-tell"]);

const violations = [];

function fail(path, msg) {
  violations.push(`${path}: ${msg}`);
}

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const isStr = (x) => typeof x === "string";
const isNonEmptyStr = (x) => isStr(x) && x.trim().length > 0;
const isInt = (x) => Number.isInteger(x);

function checkFinding(f, path) {
  if (!isObj(f)) {
    fail(path, "finding must be an object");
    return;
  }

  // file / line — nullable, but null together (PR-level, no inline anchor).
  const fileNull = f.file === null;
  const lineNull = f.line === null;

  if (!fileNull) {
    if (!isNonEmptyStr(f.file)) {
      fail(`${path}.file`, `file must be a non-empty string or null, got ${JSON.stringify(f.file)}`);
    } else {
      if (f.file.startsWith("./")) fail(`${path}.file`, `file "${f.file}" must not have a leading "./"`);
      if (f.file.startsWith("/")) fail(`${path}.file`, `file "${f.file}" must be repo-relative, not absolute`);
      if (f.file.includes("\\")) fail(`${path}.file`, `file "${f.file}" must use forward slashes, not backslashes`);
    }
  }

  if (!lineNull) {
    if (!isInt(f.line) || f.line < 1) {
      fail(`${path}.line`, `line must be an integer >= 1 or null, got ${JSON.stringify(f.line)}`);
    }
  }

  // Pairing: a PR-level finding nulls both file and line together.
  if (fileNull !== lineNull) {
    fail(
      `${path}`,
      `file and line must both be null together (PR-level finding) or both set — got file=${JSON.stringify(
        f.file
      )}, line=${JSON.stringify(f.line)}`
    );
  }

  // severity — required enum.
  if (!SEVERITIES.has(f.severity)) {
    fail(`${path}.severity`, `severity must be one of critical|important|suggestion|nit, got ${JSON.stringify(f.severity)}`);
  }

  // description / recommendation — required non-empty strings.
  if (!isNonEmptyStr(f.description)) {
    fail(`${path}.description`, "description must be a non-empty string");
  }
  if (!isNonEmptyStr(f.recommendation)) {
    fail(`${path}.recommendation`, "recommendation must be a non-empty string");
  }

  // reported_by — required non-empty array of non-empty strings.
  if (!Array.isArray(f.reported_by) || f.reported_by.length === 0) {
    fail(`${path}.reported_by`, "reported_by must be a non-empty array of agent names");
  } else {
    f.reported_by.forEach((r, i) => {
      if (!isNonEmptyStr(r)) fail(`${path}.reported_by[${i}]`, `reported_by entry must be a non-empty string, got ${JSON.stringify(r)}`);
    });
  }

  // resolution_status — optional; if present, an enum value.
  if (f.resolution_status !== undefined && !RESOLUTION_STATUSES.has(f.resolution_status)) {
    fail(
      `${path}.resolution_status`,
      `resolution_status, when present, must be one of addressed|partial|not-addressed|cant-tell, got ${JSON.stringify(
        f.resolution_status
      )}`
    );
  }
}

export function validate(doc) {
  violations.length = 0;

  if (Array.isArray(doc)) {
    doc.forEach((f, i) => checkFinding(f, `$[${i}]`));
  } else if (isObj(doc)) {
    checkFinding(doc, "$");
  } else {
    fail("$", "findings document must be a finding object or an array of findings");
  }

  return violations;
}

// ---- entry ------------------------------------------------------------------

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate-findings.mjs <path-to-findings.json>");
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

  const count = Array.isArray(doc) ? doc.length : 1;
  console.log(`OK: ${file} is a valid findings file (${count} finding${count === 1 ? "" : "s"})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
