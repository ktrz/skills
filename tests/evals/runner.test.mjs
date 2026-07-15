// Tests for the runner's CLI contract, spec validation, and aggregation
// fail-closed behaviour — run with: node --test "tests/**/*.test.mjs"
//
// The eval harness gates CI, so every path that could turn "checked nothing"
// into "green" is treated as a defect and pinned here: invalid --reps, empty
// scenario arrays, scenarios with no checks, and empty per-rep folds.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseArgs, validateSpec, runTarget } from "../../evals/run.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const scenarioPath = (f) => path.join(here, "..", "..", "evals", "scenarios", f);
const loadSpec = (f) => JSON.parse(readFileSync(scenarioPath(f), "utf8"));

// ---- parseArgs: the documented CLI contract ---------------------------------

test("parseArgs defaults", () => {
  const a = parseArgs([]);
  assert.equal(a.variant, "stable");
  assert.equal(a.target, null);
  assert.equal(a.json, false);
  assert.equal(a.writeBaseline, false);
  assert.ok(Number.isInteger(a.reps) && a.reps >= 1);
});

test("parseArgs reads every documented flag", () => {
  const a = parseArgs(["--variant", "wip", "--target", "create-pr", "--reps", "3", "--json", "--write-baseline"]);
  assert.equal(a.variant, "wip");
  assert.equal(a.target, "create-pr");
  assert.equal(a.reps, 3);
  assert.equal(a.json, true);
  assert.equal(a.writeBaseline, true);
});

test("parseArgs rejects a non-positive --reps instead of silently green-running zero iterations", () => {
  assert.throws(() => parseArgs(["--reps", "0"]), /--reps must be a positive integer/);
  assert.throws(() => parseArgs(["--reps", "-2"]), /--reps must be a positive integer/);
});

test("parseArgs rejects a non-numeric or missing --reps value", () => {
  assert.throws(() => parseArgs(["--reps", "abc"]), /--reps must be a positive integer/);
  assert.throws(() => parseArgs(["--reps"]), /--reps must be a positive integer/);
  assert.throws(() => parseArgs(["--reps", "2.5"]), /--reps must be a positive integer/);
});

test("parseArgs throws on an unknown argument", () => {
  assert.throws(() => parseArgs(["--nope"]), /unknown arg/);
});

// ---- validateSpec: a spec that asserts nothing must not pass ---------------

test("validateSpec accepts every committed scenario spec cleanly", () => {
  for (const f of ["create-pr.json", "plan-feature.json", "plan-my-day.json"]) {
    const { errors, warnings } = validateSpec(loadSpec(f), f);
    assert.deepEqual(errors, [], `${f} should have no errors`);
    assert.deepEqual(warnings, [], `${f} should have no warnings`);
  }
});

test("validateSpec fails closed on a missing/empty/non-array scenarios field", () => {
  for (const scenarios of [undefined, [], "not-an-array"]) {
    const { errors } = validateSpec({ target: "demo", scenarios }, "demo.json");
    assert.equal(errors.length, 1, `scenarios=${JSON.stringify(scenarios)} must be an error`);
    assert.match(errors[0], /scenarios.*non-empty array/i);
  }
});

test("validateSpec fails closed on a scenario with no deterministic checks", () => {
  const spec = {
    target: "demo",
    scenarios: [{ id: "typo-victim", kind: "invariant", cheks: [{ type: "body_contains", value: "x" }] }],
  };
  const { errors } = validateSpec(spec, "demo.json");
  assert.equal(errors.length, 1);
  assert.match(errors[0], /typo-victim/);
  assert.match(errors[0], /no deterministic checks/);
});

test("validateSpec allows a zero-check scenario only when explicitly marked live_only", () => {
  const spec = {
    target: "demo",
    scenarios: [{ id: "live-only-sc", kind: "trigger", live_only: true, live: { prompt: "p", should_trigger: true } }],
  };
  const { errors } = validateSpec(spec, "demo.json");
  assert.deepEqual(errors, []);
});

test("validateSpec warns when a live block's should_trigger is missing or non-boolean", () => {
  const spec = {
    target: "demo",
    scenarios: [
      {
        id: "stringly-trigger",
        kind: "trigger",
        checks: [{ type: "body_contains", value: "x" }],
        live: { prompt: "p", should_trigger: "true" },
      },
    ],
  };
  const { warnings } = validateSpec(spec, "demo.json");
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /stringly-trigger/);
  assert.match(warnings[0], /should_trigger/);
});

// ---- aggregation: an empty per-rep fold must fail, never pass --------------

test("zero effective reps folds to failure, never a vacuous 100% pass", () => {
  const spec = loadSpec("create-pr.json");
  const result = runTarget(spec, "stable", 0);
  assert.equal(
    result.summary.deterministicFailed,
    result.summary.deterministic,
    "with no reps executed every deterministic scenario must count as failed"
  );
});
