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

import { spawnSync } from "node:child_process";

import {
  parseArgs,
  validateSpec,
  runTarget,
  loadScenarioFiles,
  triggerEvalSet,
  buildBaseline,
} from "../../evals/run.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const scenarioPath = (f) => path.join(here, "..", "..", "evals", "scenarios", f);
const loadSpec = (f) => JSON.parse(readFileSync(scenarioPath(f), "utf8"));
const RUN_MJS = path.join(here, "..", "..", "evals", "run.mjs");
const fixtureSet = (name) => path.join(here, "fixtures", "scenario-sets", name);
const runCli = (args) => spawnSync(process.execPath, [RUN_MJS, ...args], { encoding: "utf8" });

// ---- parseArgs: the documented CLI contract ---------------------------------

test("parseArgs defaults", () => {
  const a = parseArgs([]);
  assert.equal(a.variant, "stable");
  assert.equal(a.target, null);
  assert.equal(a.json, false);
  assert.equal(a.writeBaseline, false);
  // Deterministic checks are pure — variance is structurally 0 — so repeated
  // reps are redundant work; the default is a single reproducible rep.
  assert.equal(a.reps, 1);
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

// ---- scenario discovery -----------------------------------------------------

test("loadScenarioFiles excludes *.trigger.json (bare arrays would crash the scenario path)", () => {
  const all = loadScenarioFiles(null);
  assert.ok(all.length >= 3, "expected the three real targets");
  assert.ok(all.every(({ file }) => !file.endsWith(".trigger.json")));
  for (const { spec } of all) assert.ok(Array.isArray(spec.scenarios), `${spec.target} must be a spec, not a trigger set`);
});

test("loadScenarioFiles filters to one target when asked", () => {
  const files = loadScenarioFiles("create-pr").map(({ file }) => file);
  assert.deepEqual(files, ["create-pr.json"]);
});

// ---- trigger eval-set (the skill-creator plugin compatibility contract) -----

test("triggerEvalSet emits the plugin-compatible [{query, should_trigger}] shape", () => {
  const spec = {
    scenarios: [
      { id: "a", live: { prompt: "p1", should_trigger: true, expectations: ["x"] } },
      { id: "b", live: { prompt: "p2", should_trigger: false } },
      { id: "c" },
      { id: "d", live: { prompt: "p3", should_trigger: "true" } },
    ],
  };
  assert.deepEqual(triggerEvalSet(spec), [
    { query: "p1", should_trigger: true },
    { query: "p2", should_trigger: false },
  ]);
});

// ---- committed artifacts must match a fresh run ------------------------------
// The runner never reads baselines back, so without these guards a committed
// baseline (or hand-edited trigger file) could silently go stale while the
// run stays green — including the check-set-shrink case where a scenario's
// checks were weakened after recording.

const baselinePath = (f) => path.join(here, "..", "..", "evals", "baselines", f);

test("committed baselines match a fresh run (staleness / check-set-shrink guard)", () => {
  for (const { spec } of loadScenarioFiles(null)) {
    const fresh = buildBaseline(spec, runTarget(spec, "stable", 1));
    const committed = JSON.parse(readFileSync(baselinePath(`${spec.target}-baseline.json`), "utf8"));
    fresh.recorded_at = null;
    committed.recorded_at = null;
    assert.deepEqual(
      fresh,
      committed,
      `${spec.target} baseline is stale — re-record with: node evals/run.mjs --write-baseline`
    );
  }
});

test("committed trigger eval-sets are exactly what the scenario live blocks derive", () => {
  for (const { spec } of loadScenarioFiles(null)) {
    const committed = JSON.parse(readFileSync(scenarioPath(`${spec.target}.trigger.json`), "utf8"));
    assert.deepEqual(
      committed,
      triggerEvalSet(spec),
      `${spec.target}.trigger.json drifted from the scenario live blocks — re-run --write-baseline`
    );
  }
});

// ---- main(): the actual CI gate, exercised end-to-end via the CLI -----------

test("main exits 1 when a deterministic check fails — the drift gate itself", () => {
  const r = runCli(["--scenario-dir", fixtureSet("drifted")]);
  assert.equal(r.status, 1, `stdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.match(r.stdout, /FAIL/);
});

test("main exits 0 on a fully green scenario set (and skips the bare *.trigger.json beside it)", () => {
  const r = runCli(["--scenario-dir", fixtureSet("green")]);
  assert.equal(r.status, 0, `stdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.match(r.stdout, /PASS/);
});

test("main exits non-zero with a clear message on an invalid --reps", () => {
  const r = runCli(["--scenario-dir", fixtureSet("green"), "--reps", "0"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--reps must be a positive integer/);
});

test("main exits non-zero when a spec's scenarios array is empty", () => {
  const r = runCli(["--scenario-dir", fixtureSet("invalid")]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /non-empty array/);
});

test("main exits non-zero with the distinct not-found message for a missing wip variant", () => {
  const r = runCli(["--scenario-dir", fixtureSet("green"), "--variant", "wip"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /variant directory not found/);
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
