// Tests for validate-findings.mjs — run with: node --test "tests/**/*.test.mjs"
//
// Zero dependencies: node:test + node:assert/strict. The validator is
// imported programmatically via its exported validate(doc); the CLI entry is
// exercised once as a regression check against fixtures/valid-findings.json.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { validate } from "../../skills/review/review-pr/validate-findings.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.join(here, "..", "..", "skills", "review", "review-pr");
const validatorPath = path.join(skillDir, "validate-findings.mjs");
const fixturePath = (name) => path.join(skillDir, "fixtures", name);
const fixture = (name) => JSON.parse(readFileSync(fixturePath(name), "utf8"));

const violationsFor = (doc) => [...validate(doc)];

function assertClean(doc, label) {
  const v = violationsFor(doc);
  assert.deepEqual(v, [], `${label}: expected no violations, got:\n${v.join("\n")}`);
}

function assertViolation(doc, substrings, label) {
  const v = violationsFor(doc);
  assert.ok(v.length > 0, `${label}: expected violations, got none`);
  for (const s of [].concat(substrings)) {
    assert.ok(
      v.some((line) => line.includes(s)),
      `${label}: expected a violation containing ${JSON.stringify(s)}, got:\n${v.join("\n")}`
    );
  }
}

// ---- valid fixtures ---------------------------------------------------------

test("valid-findings.json validates clean (programmatic)", () => {
  assertClean(fixture("valid-findings.json"), "valid-findings");
});

test("valid-findings.json validates clean (CLI exits 0)", () => {
  const out = execFileSync(process.execPath, [validatorPath, fixturePath("valid-findings.json")], {
    encoding: "utf8",
  });
  assert.match(out, /^OK: /);
});

test("a single finding object (not wrapped in an array) validates clean", () => {
  assertClean(fixture("valid-finding-single.json"), "valid-finding-single");
});

test("a PR-level finding with file:null and line:null validates clean", () => {
  assertClean(
    [
      {
        file: null,
        line: null,
        severity: "suggestion",
        description: "cross-cutting naming issue",
        recommendation: "unify naming",
        reported_by: ["single-pass"],
      },
    ],
    "pr-level null/null"
  );
});

test("a finding with a valid resolution_status validates clean", () => {
  const doc = fixture("valid-finding-single.json");
  doc.resolution_status = "addressed";
  assertClean(doc, "resolution_status present");
});

// ---- per-rule invalid fixtures ----------------------------------------------

test("an unknown severity is rejected", () => {
  assertViolation(fixture("invalid-bad-severity.json"), ["$[0].severity", "critical|important|suggestion|nit"], "bad severity");
});

test("a missing recommendation is rejected", () => {
  assertViolation(fixture("invalid-missing-recommendation.json"), ["$[0].recommendation", "non-empty string"], "missing recommendation");
});

test("a missing description is rejected", () => {
  assertViolation(fixture("invalid-missing-description.json"), ["$[0].description", "non-empty string"], "missing description");
});

test("a file path escaping the repo root with .. is rejected", () => {
  assertViolation(fixture("invalid-file-parent-escape.json"), ["$[0].file", ".."], "parent-escape path");
});

test("line 0 is rejected", () => {
  assertViolation(fixture("invalid-bad-line.json"), ["$[0].line", ">= 1"], "bad line");
});

test('a file with a leading "./" is rejected', () => {
  assertViolation(fixture("invalid-file-leading-dotslash.json"), ["$[0].file", './'], "leading dot-slash");
});

test("an empty reported_by array is rejected", () => {
  assertViolation(fixture("invalid-reported-by-empty.json"), ["$[0].reported_by", "non-empty array"], "empty reported_by");
});

test("an unknown resolution_status is rejected", () => {
  assertViolation(fixture("invalid-bad-resolution-status.json"), ["$[0].resolution_status", "addressed|partial|not-addressed|cant-tell"], "bad resolution_status");
});

test("file:null with a set line is rejected (pairing rule)", () => {
  assertViolation(fixture("invalid-file-null-line-set.json"), ["$[0]", "null together"], "null pairing");
});

test("a non-object array entry is rejected", () => {
  assertViolation(fixture("invalid-not-object.json"), ["$[0]", "must be an object"], "non-object entry");
});

// ---- structural edge cases --------------------------------------------------

test("invalid JSON top-level (a bare string) is rejected", () => {
  assertViolation("just a string", ["$", "finding object or an array"], "bare string");
});

test("a backslash in a file path is rejected", () => {
  assertViolation(
    [{ file: "src\\a.ts", line: 1, severity: "nit", description: "x", recommendation: "y", reported_by: ["a"] }],
    ["$[0].file", "forward slashes"],
    "backslash path"
  );
});

test("an absolute file path is rejected", () => {
  assertViolation(
    [{ file: "/etc/passwd", line: 1, severity: "nit", description: "x", recommendation: "y", reported_by: ["a"] }],
    ["$[0].file", "repo-relative"],
    "absolute path"
  );
});

test("an interior .. segment (foo/../bar) is rejected", () => {
  assertViolation(
    [{ file: "src/../../secret", line: 1, severity: "nit", description: "x", recommendation: "y", reported_by: ["a"] }],
    ["$[0].file", ".."],
    "interior parent segment"
  );
});

test("a non-empty-string reported_by entry is required (empty string entry rejected)", () => {
  assertViolation(
    [{ file: "src/a.ts", line: 1, severity: "nit", description: "x", recommendation: "y", reported_by: [""] }],
    ["$[0].reported_by[0]", "non-empty string"],
    "empty reported_by entry"
  );
});

test("a non-string reported_by entry is rejected", () => {
  assertViolation(
    [{ file: "src/a.ts", line: 1, severity: "nit", description: "x", recommendation: "y", reported_by: [123] }],
    ["$[0].reported_by[0]", "non-empty string"],
    "numeric reported_by entry"
  );
});

test("a non-integer (float) line is rejected", () => {
  assertViolation(
    [{ file: "src/a.ts", line: 1.5, severity: "nit", description: "x", recommendation: "y", reported_by: ["a"] }],
    ["$[0].line", ">= 1"],
    "float line"
  );
});

test("a non-integer (string) line is rejected", () => {
  assertViolation(
    [{ file: "src/a.ts", line: "3", severity: "nit", description: "x", recommendation: "y", reported_by: ["a"] }],
    ["$[0].line", ">= 1"],
    "string line"
  );
});
