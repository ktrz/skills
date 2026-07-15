// Tests for the eval harness — run with: node --test "tests/**/*.test.mjs"
//
// Zero dependencies: node:test + node:assert/strict. Two concerns:
//   1. The check evaluators + SKILL.md parser behave correctly.
//   2. DRIFT DETECTION — the harness's reason for existing. A good fixture
//      passes its contract checks; a deliberately drifted copy of the same
//      skill fails them. This is the Phase-5 gate in miniature: if a wip
//      rewrite drops a load-bearing invariant, the harness goes red.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseSkillMd, loadSkill, resolveVariantDir, REPO_ROOT } from "../../evals/lib/skill.mjs";
import { runCheck } from "../../evals/lib/checks.mjs";
import { runTarget } from "../../evals/run.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => path.join(here, "fixtures", name);

// The contract a demo-skill variant must satisfy — mirrors the real
// create-pr scenarios (trigger phrase, artifact section, push invariant).
const DEMO_CONTRACT = [
  { type: "description_contains", value: "open a pull request" },
  { type: "section_present", value: "Create the PR" },
  { type: "body_contains", value: "Do NOT push the branch yourself" },
];

// ---- SKILL.md parsing -------------------------------------------------------

test("parseSkillMd reads a folded (>) description into one line", () => {
  const text = readFileSync(path.join(fixture("good-skill"), "SKILL.md"), "utf8");
  const parsed = parseSkillMd(text);
  assert.equal(parsed.name, "demo-skill");
  assert.equal(parsed.version, "1.0.0");
  assert.match(parsed.description, /open a pull request or submit a branch for review/);
  assert.ok(!parsed.description.includes("\n"), "folded description must be single-line");
});

test("parseSkillMd handles an inline quoted description", () => {
  const parsed = parseSkillMd('---\nname: x\ndescription: "hello world"\n---\nbody\n');
  assert.equal(parsed.description, "hello world");
  assert.equal(parsed.body.trim(), "body");
});

test("loadSkill flags a missing SKILL.md rather than throwing", () => {
  const skill = loadSkill(fixture("does-not-exist"));
  assert.equal(skill.exists, false);
});

test("parseSkillMd tolerates a BOM and CRLF line endings", () => {
  const text = "\uFEFF---\r\nname: x\r\ndescription: hello crlf\r\n---\r\nbody line\r\n";
  const parsed = parseSkillMd(text);
  assert.equal(parsed.hasFrontmatter, true);
  assert.equal(parsed.description, "hello crlf");
  assert.match(parsed.body, /body line/);
});

test("parseSkillMd reads a literal (|) description block", () => {
  const parsed = parseSkillMd("---\nname: x\ndescription: |\n  line one\n  line two\n---\nbody\n");
  assert.equal(parsed.description, "line one line two");
});

test("parseSkillMd reads a single-quoted description", () => {
  const parsed = parseSkillMd("---\nname: x\ndescription: 'quoted here'\n---\nbody\n");
  assert.equal(parsed.description, "quoted here");
});

test("parseSkillMd flags missing frontmatter instead of masquerading as an empty description", () => {
  const parsed = parseSkillMd("# Just markdown\n\nno frontmatter here\n");
  assert.equal(parsed.hasFrontmatter, false);
  assert.equal(parsed.description, "");
});

test("checks against a SKILL.md without parseable frontmatter fail closed with a parse reason", () => {
  const skill = loadSkill(fixture("no-frontmatter-skill"));
  assert.equal(skill.exists, true);
  const res = runCheck(skill, { type: "body_contains", value: "gh pr create" });
  assert.equal(res.pass, false);
  assert.match(res.reason, /no parseable frontmatter/);
});

test("loadSkill returns the same key set whether or not the skill exists", () => {
  const good = loadSkill(fixture("good-skill"));
  const missing = loadSkill(fixture("does-not-exist"));
  assert.deepEqual(Object.keys(missing).sort(), Object.keys(good).sort());
});

// ---- check evaluators -------------------------------------------------------

test("each check type evaluates against a loaded skill", () => {
  const skill = loadSkill(fixture("good-skill"));
  assert.ok(runCheck(skill, { type: "description_contains", value: "pull request" }).pass);
  assert.ok(runCheck(skill, { type: "description_matches", pattern: "submit a branch" }).pass);
  assert.ok(runCheck(skill, { type: "body_contains", value: "gh pr create" }).pass);
  assert.ok(runCheck(skill, { type: "body_absent", value: "force push" }).pass);
  assert.ok(runCheck(skill, { type: "body_matches", pattern: "TICKET_LINK" }).pass);
  assert.ok(runCheck(skill, { type: "section_present", value: "Create the PR" }).pass);
});

test("an unknown check type fails closed with a reason", () => {
  const skill = loadSkill(fixture("good-skill"));
  const res = runCheck(skill, { type: "not_a_real_check" });
  assert.equal(res.pass, false);
  assert.match(res.reason, /unknown check type/);
});

test("a *_matches check missing its pattern fails closed instead of always passing", () => {
  const skill = loadSkill(fixture("good-skill"));
  // Payload field misnamed: `value` given where `pattern` is required. Before
  // validation this compiled RegExp(undefined) — an always-match false green.
  const res = runCheck(skill, { type: "body_matches", value: "stacked" });
  assert.equal(res.pass, false);
  assert.match(res.reason, /missing required "pattern"/);
});

test("a substring check missing its value fails closed instead of crashing", () => {
  const skill = loadSkill(fixture("good-skill"));
  const res = runCheck(skill, { type: "body_contains", desc: "value forgotten" });
  assert.equal(res.pass, false);
  assert.match(res.reason, /missing required "value"/);
});

test("an empty-string payload is rejected like a missing one", () => {
  const skill = loadSkill(fixture("good-skill"));
  const res = runCheck(skill, { type: "description_contains", value: "" });
  assert.equal(res.pass, false);
  assert.match(res.reason, /missing required "value"/);
});

test("an invalid regex is reported as a failed check with attribution, not an uncaught throw", () => {
  const skill = loadSkill(fixture("good-skill"));
  const res = runCheck(skill, { type: "body_matches", pattern: "([unclosed", desc: "bad regex demo" });
  assert.equal(res.pass, false);
  assert.match(res.reason, /body_matches threw/);
  assert.match(res.reason, /bad regex demo/);
});

test("a check against a missing skill fails closed", () => {
  const skill = loadSkill(fixture("does-not-exist"));
  const res = runCheck(skill, { type: "body_contains", value: "anything" });
  assert.equal(res.pass, false);
  assert.match(res.reason, /no SKILL.md/);
});

// ---- DRIFT DETECTION (the harness sanity check) -----------------------------

test("the good fixture satisfies the whole demo contract", () => {
  const skill = loadSkill(fixture("good-skill"));
  const results = DEMO_CONTRACT.map((c) => runCheck(skill, c));
  assert.ok(
    results.every((r) => r.pass),
    `expected all checks to pass, got:\n${results.filter((r) => !r.pass).map((r) => r.reason).join("\n")}`
  );
});

test("the deliberately-drifted fixture is caught on every drifted invariant", () => {
  const skill = loadSkill(fixture("broken-skill"));
  const results = DEMO_CONTRACT.map((c) => runCheck(skill, c));
  const failed = results.filter((r) => !r.pass);
  // All three contract points were drifted in the broken fixture: the softened
  // trigger phrase, the renamed section, and the removed push invariant.
  assert.equal(failed.length, 3, `expected 3 drift failures, got ${failed.length}`);
});

// ---- references/ are part of the checkable surface --------------------------

test("loadSkill includes references/*.md in the checkable body", () => {
  // A progressive-disclosure rewrite that relocates spec text into
  // references/ must not read as drift, so body-level checks see it.
  const skill = loadSkill(fixture("good-skill"));
  assert.ok(runCheck(skill, { type: "body_contains", value: "TEMPLATE_MARKER_IN_REFERENCE" }).pass);
  assert.ok(runCheck(skill, { type: "section_present", value: "Relocated spec section" }).pass);
});

// ---- variant resolution (the wip half of the A/B loop) ----------------------

const relFixture = (name) => path.relative(REPO_ROOT, fixture(name));

test("resolveVariantDir resolves an explicit wip_path", () => {
  const sc = { target: "demo", stable_path: "skills/x/demo", wip_path: "custom/wip/demo" };
  assert.equal(resolveVariantDir(sc, "wip"), path.join(REPO_ROOT, "custom/wip/demo"));
});

test("resolveVariantDir defaults a missing wip_path to skills/wip/<target>", () => {
  const sc = { target: "demo", stable_path: "skills/x/demo" };
  assert.equal(resolveVariantDir(sc, "wip"), path.join(REPO_ROOT, "skills", "wip", "demo"));
});

test("resolveVariantDir throws on an unknown variant", () => {
  const sc = { target: "demo", stable_path: "skills/x/demo" };
  assert.throws(() => resolveVariantDir(sc, "staging"), /unknown variant: staging/);
});

test("runTarget A/B: the drifted stable variant fails the contract a good wip variant passes", () => {
  const spec = {
    target: "demo",
    stable_path: relFixture("broken-skill"),
    wip_path: relFixture("good-skill"),
    scenarios: [{ id: "demo-contract", kind: "invariant", checks: DEMO_CONTRACT }],
  };
  const drifted = runTarget(spec, "stable", 1);
  assert.ok(drifted.summary.deterministicFailed > 0, "drifted variant must fail the gate");
  assert.equal(drifted.scenarios[0].passRate, 0, "drifted scenario must have passRate 0");
  const wip = runTarget(spec, "wip", 1);
  assert.equal(wip.summary.deterministicFailed, 0, "good wip variant must pass the same contract");
});

test("runTarget raises a distinct not-found error for a missing variant directory", () => {
  const spec = {
    target: "demo",
    stable_path: relFixture("broken-skill"),
    scenarios: [{ id: "demo-contract", kind: "invariant", checks: DEMO_CONTRACT }],
  };
  // No wip_path and no skills/wip/demo on disk: the wip run must say "not
  // created yet" loudly instead of rendering as all-checks-failed drift.
  assert.throws(() => runTarget(spec, "wip", 1), /variant directory not found.*did you create the wip variant/s);
});

// ---- runner aggregation against the real stable scenarios -------------------

test("runTarget aggregates the real create-pr scenarios with zero variance", () => {
  const spec = JSON.parse(
    readFileSync(path.join(here, "..", "..", "evals", "scenarios", "create-pr.json"), "utf8")
  );
  const result = runTarget(spec, "stable", 5);
  assert.equal(result.summary.deterministicFailed, 0, "stable create-pr must pass all checks");
  assert.equal(result.summary.maxVariance, 0, "deterministic checks must have zero variance");
  assert.ok(result.summary.livePending > 0, "live scenarios should be reported as pending");
});
