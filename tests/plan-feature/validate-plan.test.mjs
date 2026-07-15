// Tests for validate-plan.mjs — run with: node --test "tests/**/*.test.mjs"
//
// Zero dependencies: node:test + node:assert/strict. The validator is
// imported programmatically via its exported validate(text); the CLI entry
// is exercised once as a regression check against fixtures/valid-plan.md.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { validate } from "../../skills/delivery/plan-feature/validate-plan.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.join(here, "..", "..", "skills", "delivery", "plan-feature");
const validatorPath = path.join(skillDir, "validate-plan.mjs");
const fixture = (name) => readFileSync(path.join(skillDir, "fixtures", name), "utf8");

const violationsFor = (text) => [...validate(text)];

function assertClean(text, label) {
  const v = violationsFor(text);
  assert.deepEqual(v, [], `${label}: expected no violations, got:\n${v.join("\n")}`);
}

function assertViolation(text, substrings, label) {
  const v = violationsFor(text);
  assert.ok(v.length > 0, `${label}: expected violations, got none`);
  for (const s of [].concat(substrings)) {
    assert.ok(
      v.some((line) => line.includes(s)),
      `${label}: expected a violation containing ${JSON.stringify(s)}, got:\n${v.join("\n")}`
    );
  }
}

// ---- valid fixtures ---------------------------------------------------------

test("valid-plan.md validates clean (programmatic)", () => {
  assertClean(fixture("valid-plan.md"), "valid-plan");
});

test("valid-plan.md validates clean (CLI exits 0)", () => {
  const out = execFileSync(process.execPath, [validatorPath, path.join(skillDir, "fixtures", "valid-plan.md")], {
    encoding: "utf8",
  });
  assert.match(out, /^OK: /);
});

test("valid-plan-phase-zero.md (phase run starting at 0) validates clean", () => {
  assertClean(fixture("valid-plan-phase-zero.md"), "valid-plan-phase-zero");
});

test("valid-plan-single-phase.md (no Execution Order needed) validates clean", () => {
  assertClean(fixture("valid-plan-single-phase.md"), "valid-plan-single-phase");
});

// ---- rule 1: exactly one H1 title -------------------------------------------

test("plan with no H1 title is rejected", () => {
  assertViolation(fixture("invalid-no-title.md"), "rule-1-title", "no title");
});

test("plan with two H1 titles is rejected", () => {
  const text = "# First title\n\n## Context\n\nx\n\n## Phase 1\n\nbody\n\n# Second title\n";
  assertViolation(text, ["rule-1-title", "exactly one"], "two titles");
});

// ---- rule 2: Context section ------------------------------------------------

test("plan missing a Context section is rejected", () => {
  assertViolation(fixture("invalid-no-context.md"), "rule-2-context", "no context");
});

// ---- rule 3: Execution Order when multi-phase -------------------------------

test("multi-phase plan without Execution Order is rejected", () => {
  assertViolation(fixture("invalid-no-execution-order.md"), "rule-3-execution-order", "no exec order");
});

test("single-phase plan does not require Execution Order", () => {
  // valid-plan-single-phase has one phase and no Execution Order — clean.
  const v = violationsFor(fixture("valid-plan-single-phase.md"));
  assert.ok(!v.some((l) => l.includes("rule-3-execution-order")), `unexpected exec-order violation:\n${v.join("\n")}`);
});

// ---- rule 4: at least one phase ---------------------------------------------

test("plan with no phases is rejected", () => {
  assertViolation(fixture("invalid-no-phases.md"), "rule-4-phases", "no phases");
});

// ---- rule 5: unique phase numbers -------------------------------------------

test("duplicate phase numbers are rejected", () => {
  assertViolation(fixture("invalid-duplicate.md"), ["rule-5-phase-unique", "duplicate phase number 1"], "dup phases");
});

// ---- rule 6: contiguous phase run -------------------------------------------

test("a gap in phase numbers is rejected", () => {
  assertViolation(fixture("invalid-gap.md"), ["rule-6-phase-contiguous", "Phase 2"], "gap");
});

test("a phase run starting at 2 is rejected", () => {
  assertViolation(fixture("invalid-bad-start.md"), ["rule-6-phase-contiguous", "start at 0 or 1"], "bad start");
});

// ---- rule 7: non-empty phase body -------------------------------------------

test("an empty phase body is rejected", () => {
  assertViolation(fixture("invalid-empty-phase.md"), ["rule-7-phase-body", "Phase 2"], "empty phase");
});

// ---- robustness: fenced code blocks are not parsed as structure -------------

test("a `## Phase` heading inside a code fence is ignored", () => {
  const text = [
    "# PROJ-9: Fence test",
    "",
    "## Context",
    "",
    "The fence below shows an example that must not be counted as a real phase.",
    "",
    "## Execution Order",
    "",
    "Phase 1 then Phase 2.",
    "",
    "```markdown",
    "## Phase 99 (PR 99): not a real phase",
    "```",
    "",
    "## Phase 1 (PR 1): First",
    "",
    "body",
    "",
    "## Phase 2 (PR 2): Second",
    "",
    "body",
    "",
  ].join("\n");
  assertClean(text, "fenced phase ignored");
});

test("an H1 inside a code fence is not counted as a second title", () => {
  const text = [
    "# PROJ-10: Real title",
    "",
    "## Context",
    "",
    "x",
    "",
    "```bash",
    "# this is a shell comment, not a title",
    "```",
    "",
    "## Phase 1 (PR 1): Only phase",
    "",
    "body",
    "",
  ].join("\n");
  assertClean(text, "fenced h1 ignored");
});
