#!/usr/bin/env node
// Eval harness runner.
//
// Usage:
//   node evals/run.mjs [--target <name>] [--variant stable|wip] [--reps N]
//                      [--scenario-dir <dir>] [--json] [--write-baseline]
//
//   --target          run one target (plan-my-day | create-pr | plan-feature);
//                     default: all scenario files in evals/scenarios/
//   --variant         which copy of the skill to check (default: stable).
//                     stable -> skills/<group>/<skill>; wip -> skills/wip/<skill>.
//                     Phase 5 runs the SAME scenarios A/B by flipping this flag.
//   --reps N          repeat the deterministic run N times (default 1). The
//                     checks are pure functions of on-disk text, so variance is
//                     structurally 0 on this layer; reps + the variance column
//                     are a scaffold for the live (model-in-the-loop) layer and
//                     for manual stress runs, not a deterministic-layer signal.
//   --scenario-dir    read scenario files from another directory (default:
//                     evals/scenarios). Used by the harness's own tests to
//                     drive main()'s exit gate against fixture scenario sets,
//                     and handy for scratch scenario experiments.
//   --json            emit machine-readable JSON instead of the text report.
//   --write-baseline  write evals/baselines/<target>-baseline.json for each
//                     target run (records measured results + pending live specs).
//
// The runner ONLY executes the deterministic `checks` on each scenario — those
// need no model and gate CI. Scenarios also carry a `live` block (prompt +
// expectations) describing the model-in-the-loop A/B run a human executes; the
// runner reports those as PENDING and never fakes a result.
//
// Exit code: non-zero if any deterministic check fails (drift / broken variant).

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { REPO_ROOT, resolveVariantDir, loadSkill } from "./lib/skill.mjs";
import { runCheck } from "./lib/checks.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const SCENARIO_DIR = path.join(here, "scenarios");
const BASELINE_DIR = path.join(here, "baselines");

export function parseArgs(argv) {
  const args = {
    variant: "stable",
    reps: 1,
    target: null,
    json: false,
    writeBaseline: false,
    scenarioDir: SCENARIO_DIR,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--variant") args.variant = argv[++i];
    else if (a === "--reps") {
      // A missing/zero/NaN reps would run zero iterations and (before the
      // fail-closed fold below) report a vacuous 100% green — reject it loudly.
      const raw = argv[++i];
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error(`--reps must be a positive integer, got: ${raw}`);
      }
      args.reps = n;
    } else if (a === "--target") args.target = argv[++i];
    else if (a === "--scenario-dir") {
      const v = argv[++i];
      if (!v) throw new Error("--scenario-dir requires a directory path");
      args.scenarioDir = path.resolve(v);
    } else if (a === "--json") args.json = true;
    else if (a === "--write-baseline") args.writeBaseline = true;
    else throw new Error(`unknown arg: ${a}`);
  }
  return args;
}

// Validate a loaded scenario spec. Returns { errors, warnings }.
//
// Errors fail the run (exit 2): a spec whose scenarios vanished, or a scenario
// with no deterministic checks (e.g. a "cheks" typo or checks emptied while
// loosening a wip variant), would otherwise be vacuously green — the exact
// silent-gate-disable this harness exists to prevent. A scenario may opt out
// of deterministic checks only by declaring `"live_only": true`.
//
// Warnings surface data that silently degrades the live layer (a live block
// whose should_trigger is missing/non-boolean is excluded from the emitted
// trigger eval-set); --write-baseline refuses to record while any exist.
export function validateSpec(spec, file) {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(spec.scenarios) || spec.scenarios.length === 0) {
    errors.push(`${file}: "scenarios" must be a non-empty array — a spec that asserts nothing must not pass`);
    return { errors, warnings };
  }
  for (const sc of spec.scenarios) {
    const id = sc.id || "<missing id>";
    const hasChecks = Array.isArray(sc.checks) && sc.checks.length > 0;
    if (!hasChecks && sc.live_only !== true) {
      errors.push(
        `${file}: scenario "${id}" has no deterministic checks — add checks or mark it explicitly "live_only": true`
      );
    }
    if (sc.live && typeof sc.live.should_trigger !== "boolean") {
      warnings.push(
        `${file}: scenario "${id}" live block has a missing/non-boolean should_trigger — ` +
          `it would be silently excluded from the trigger eval-set`
      );
    }
  }
  return { errors, warnings };
}

export function loadScenarioFiles(target, dir = SCENARIO_DIR) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.endsWith(".trigger.json"))
    .filter((f) => !target || f === `${target}.json`);
  return files.map((f) => ({
    file: f,
    spec: JSON.parse(readFileSync(path.join(dir, f), "utf8")),
  }));
}

// Run every deterministic check for one target's scenarios against one variant,
// `reps` times, and fold the reps into a per-scenario pass-rate + variance.
export function runTarget(spec, variant, reps) {
  const dir = resolveVariantDir(spec, variant);
  if (!existsSync(dir)) {
    // Distinct, explicit not-found error: without it a missing wip directory
    // renders as an all-FAIL drift report, indistinguishable from a rewrite
    // that dropped every invariant.
    throw new Error(
      `variant directory not found: ${path.relative(REPO_ROOT, dir)} ` +
        `(variant "${variant}" of target "${spec.target}")` +
        (variant === "wip" ? " — did you create the wip variant yet?" : "")
    );
  }
  const scenarioResults = spec.scenarios.map((sc) => {
    const perRep = [];
    for (let r = 0; r < reps; r++) {
      // Reloaded each rep. Note the checks are pure over stable bytes, so
      // per-rep results are identical on this layer (variance stays 0 by
      // construction); reps exist for the live layer and manual stress runs.
      const skill = loadSkill(dir);
      const checks = (sc.checks || []).map((c) => ({ ...c, ...runCheck(skill, c) }));
      const passed = checks.every((c) => c.pass);
      perRep.push({ passed, checks });
    }
    const passCount = perRep.filter((r) => r.passed).length;
    // Fail closed: zero executed reps means zero evidence, never a pass.
    const passRate = perRep.length ? passCount / perRep.length : 0;
    return {
      id: sc.id,
      kind: sc.kind,
      passRate,
      variance: passRate === 0 || passRate === 1 ? 0 : passRate * (1 - passRate),
      deterministicChecks: sc.checks ? sc.checks.length : 0,
      firstRepChecks: perRep[0]?.checks ?? [],
      live: sc.live
        ? { status: "pending", prompt: sc.live.prompt, should_trigger: sc.live.should_trigger }
        : null,
    };
  });
  return {
    target: spec.target,
    variant,
    variantDir: path.relative(REPO_ROOT, dir),
    reps,
    scenarios: scenarioResults,
    summary: summarize(scenarioResults),
  };
}

function summarize(scenarios) {
  const withChecks = scenarios.filter((s) => s.deterministicChecks > 0);
  const passed = withChecks.filter((s) => s.passRate === 1).length;
  const live = scenarios.filter((s) => s.live).length;
  const maxVariance = withChecks.reduce((m, s) => Math.max(m, s.variance), 0);
  return {
    scenarios: scenarios.length,
    deterministic: withChecks.length,
    deterministicPassed: passed,
    deterministicFailed: withChecks.length - passed,
    livePending: live,
    maxVariance,
  };
}

function textReport(results) {
  const lines = [];
  for (const r of results) {
    lines.push(`\n${r.target}  (variant=${r.variant}, ${r.variantDir}, reps=${r.reps})`);
    for (const sc of r.scenarios) {
      const det = sc.deterministicChecks > 0 ? `${(sc.passRate * 100).toFixed(0)}%` : "  — ";
      const flag = sc.deterministicChecks === 0 ? "" : sc.passRate === 1 ? " PASS" : " FAIL";
      lines.push(`  [${det}]${flag}  ${sc.id}  (${sc.kind}, ${sc.deterministicChecks} checks)`);
      if (sc.passRate < 1) {
        for (const c of sc.firstRepChecks.filter((c) => !c.pass)) {
          lines.push(`         ✗ ${c.reason}`);
        }
      }
      if (sc.live) lines.push(`         ⧗ live: PENDING (needs model run) — "${sc.live.prompt}"`);
    }
    const s = r.summary;
    lines.push(
      `  → ${s.deterministicPassed}/${s.deterministic} deterministic passed, ` +
        `${s.livePending} live pending, maxVariance=${s.maxVariance}`
    );
  }
  return lines.join("\n");
}

// A skill-creator-plugin-compatible trigger eval-set: [{query, should_trigger}].
// The plugin's scripts/run_eval.py consumes exactly this shape for the live
// trigger layer, so we emit it alongside the baseline for the human to run.
export function triggerEvalSet(spec) {
  return spec.scenarios
    .filter((sc) => sc.live && typeof sc.live.should_trigger === "boolean")
    .map((sc) => ({ query: sc.live.prompt, should_trigger: sc.live.should_trigger }));
}

// The serialized baseline for one target: the measured deterministic results
// plus the pending live-layer spec (including the plugin-consumable trigger
// eval-set derived from the scenario live blocks).
export function buildBaseline(spec, result) {
  return {
    recorded_at: new Date().toISOString().slice(0, 10),
    ...result,
    live_layer: {
      status: "pending",
      note:
        "Live trigger/behavior runs require a model and are not executed by this runner. " +
        "Run evals/scenarios/<target>.trigger.json through the skill-creator plugin " +
        "(scripts/run_eval.py) or drive the prompts manually. See evals/README.md.",
      trigger_eval_set: triggerEvalSet(spec),
    },
  };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }
  const specs = loadScenarioFiles(args.target, args.scenarioDir);
  if (specs.length === 0) {
    console.error(`no scenario files found${args.target ? ` for target ${args.target}` : ""}`);
    process.exit(2);
  }

  // Fail closed on malformed specs before running anything — a target whose
  // scenarios or checks silently vanished must be an error, not a green run.
  const validations = specs.map(({ file, spec }) => validateSpec(spec, file));
  const specErrors = validations.flatMap((v) => v.errors);
  const specWarnings = validations.flatMap((v) => v.warnings);
  for (const w of specWarnings) console.error(`WARN: ${w}`);
  for (const e of specErrors) console.error(`ERROR: ${e}`);
  if (specErrors.length > 0) process.exit(2);
  if (args.writeBaseline && specWarnings.length > 0) {
    console.error("refusing --write-baseline while warnings exist — the recorded trigger eval-set would silently shrink");
    process.exit(2);
  }

  let results;
  try {
    results = specs.map(({ spec }) => runTarget(spec, args.variant, args.reps));
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }

  if (args.writeBaseline) {
    if (!existsSync(BASELINE_DIR)) mkdirSync(BASELINE_DIR, { recursive: true });
    for (let i = 0; i < results.length; i++) {
      const spec = specs[i].spec;
      const file = path.join(BASELINE_DIR, `${spec.target}-baseline.json`);
      writeFileSync(file, JSON.stringify(buildBaseline(spec, results[i]), null, 2) + "\n");
      console.error(`wrote ${path.relative(REPO_ROOT, file)}`);
      // The standalone plugin-consumable trigger file is derived from the
      // scenario live blocks (the single source of truth), never hand-edited —
      // a test asserts the committed copies stay in sync.
      const trig = path.join(args.scenarioDir, `${spec.target}.trigger.json`);
      writeFileSync(trig, JSON.stringify(triggerEvalSet(spec), null, 2) + "\n");
      console.error(`wrote ${path.relative(REPO_ROOT, trig)}`);
    }
  }

  if (args.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(textReport(results));
  }

  const anyFail = results.some((r) => r.summary.deterministicFailed > 0);
  process.exit(anyFail ? 1 : 0);
}

// Only run main when invoked as a script, not when imported by tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
