// Tests for orchestrate/scripts/orchestrate-reminder.sh — run with:
//   node --test "tests/orchestrate/*.test.mjs"
//
// Zero dependencies: node:test + node:assert/strict. The hook is exercised
// as a black box: JSON payload on stdin, reminder line (or nothing) on
// stdout, session-keyed flag file under ORCHESTRATE_STATE_DIR.
//
// Contract under test:
//   - Only "/orchestrate ..." (case-SENSITIVE — slash commands are lowercase,
//     so "/Orchestrate" never loads the skill) arms: it sets the flag and emits
//     the ACTIVE line; while the flag exists every prompt re-emits it. A bare
//     "orchestrate:" prefix does NOT arm.
//   - Disarm (case-insensitive) is exact "/orchestrate off", "/orchestrate off
//     <anything>", or a prompt starting with "stop orchestrat" — cleared
//     silently. "/orchestrate offload ..." arms (it is not an off-form).
//   - The hook NEVER blocks the prompt: every failure path (malformed JSON,
//     missing session_id, missing jq) exits 0 with empty stdout — never exit 2.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

// Fail loudly if the tools the hook (and these tests) depend on are absent.
// Not skip-gating: a missing prerequisite is a broken environment, not a pass.
for (const cmd of ["bash", "jq"]) {
  try {
    execFileSync(cmd, ["--version"], { stdio: "ignore" });
  } catch {
    throw new Error(
      `${cmd} is required by orchestrate-reminder.sh and these tests — ` +
      `install it (macOS: brew install ${cmd}; Windows: Git Bash + winget install jqlang.jq)`
    );
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, "..", "..", "orchestrate", "scripts", "orchestrate-reminder.sh");

// Absolute path to bash so the missing-jq test can run with PATH stripped.
const bashAbs = execFileSync("bash", ["-c", "command -v bash"], { encoding: "utf8" }).trim();

const ACTIVE = /ORCHESTRATE ACTIVE/;

function freshStateDir() {
  return mkdtempSync(path.join(os.tmpdir(), "orchestrate-hook-test-"));
}

// Runs the hook with `input` on stdin. execFileSync throws on non-zero exit,
// so every call in these tests doubles as an "exits 0" assertion.
function runHook(stateDir, input) {
  return execFileSync("bash", [script], {
    input,
    encoding: "utf8",
    env: { ...process.env, ORCHESTRATE_STATE_DIR: stateDir },
  });
}

function prompt(stateDir, promptText, sessionId = "s1") {
  return runHook(stateDir, JSON.stringify({ prompt: promptText, session_id: sessionId }));
}

const flagPath = (stateDir, sessionId) => path.join(stateDir, `orchestrate-${sessionId}`);

// ---- activation --------------------------------------------------------------

test("/orchestrate <task> emits the ACTIVE line and creates the flag file", () => {
  const dir = freshStateDir();
  const out = prompt(dir, "/orchestrate build X");
  assert.match(out, ACTIVE);
  assert.ok(existsSync(flagPath(dir, "s1")), "flag file should exist");
});

test("lowercase orchestrate: prefix no longer arms (skill loads only via slash command)", () => {
  const dir = freshStateDir();
  const out = prompt(dir, "orchestrate: refactor the parser");
  assert.equal(out, "");
  assert.ok(!existsSync(flagPath(dir, "s1")), "orchestrate: prefix must not create a flag");
});

test("capitalized /Orchestrate does not arm (slash commands are lowercase; arm is case-sensitive)", () => {
  const dir = freshStateDir();
  const out = prompt(dir, "/Orchestrate fix X");
  assert.equal(out, "");
  assert.ok(!existsSync(flagPath(dir, "s1")), "/Orchestrate must not create a flag");
});

test("capitalized Orchestrate: prefix does not arm", () => {
  const dir = freshStateDir();
  const out = prompt(dir, "Orchestrate: fix X");
  assert.equal(out, "");
  assert.ok(!existsSync(flagPath(dir, "s1")), "Orchestrate: must not create a flag");
});

// ---- arm/disarm boundary (case-insensitive) ----------------------------------

test("/orchestrate off please (trailing text) disarms", () => {
  const dir = freshStateDir();
  prompt(dir, "/orchestrate build X");
  assert.ok(existsSync(flagPath(dir, "s1")), "flag should exist before disarm");
  const out = prompt(dir, "/orchestrate off please");
  assert.equal(out, "");
  assert.ok(!existsSync(flagPath(dir, "s1")), "flag should be removed");
});

test("/orchestrate offload X activates (off-branch must not match offload)", () => {
  const dir = freshStateDir();
  const out = prompt(dir, "/orchestrate offload the parser work");
  assert.match(out, ACTIVE);
  assert.ok(existsSync(flagPath(dir, "s1")), "offload must arm, not disarm");
});

// ---- stickiness --------------------------------------------------------------

test("plain follow-up prompt with flag present re-emits the ACTIVE line", () => {
  const dir = freshStateDir();
  prompt(dir, "/orchestrate build X");
  const out = prompt(dir, "now add tests please");
  assert.match(out, ACTIVE);
});

test("plain prompt with no flag emits nothing and exits 0", () => {
  const dir = freshStateDir();
  const out = prompt(dir, "hello there");
  assert.equal(out, "");
  assert.ok(!existsSync(flagPath(dir, "s1")), "no flag should be created");
});

// ---- deactivation ------------------------------------------------------------

test("/orchestrate off removes the flag silently; next plain prompt is silent", () => {
  const dir = freshStateDir();
  prompt(dir, "/orchestrate build X");
  assert.ok(existsSync(flagPath(dir, "s1")), "flag should exist before disarm");
  const offOut = prompt(dir, "/orchestrate off");
  assert.equal(offOut, "");
  assert.ok(!existsSync(flagPath(dir, "s1")), "flag should be removed");
  assert.equal(prompt(dir, "anything else"), "");
});

test("stop orchestrating removes the flag silently, same as off", () => {
  const dir = freshStateDir();
  prompt(dir, "/orchestrate build X");
  assert.ok(existsSync(flagPath(dir, "s1")), "flag should exist before disarm");
  const out = prompt(dir, "stop orchestrating");
  assert.equal(out, "");
  assert.ok(!existsSync(flagPath(dir, "s1")), "flag should be removed");
  assert.equal(prompt(dir, "anything else"), "");
});

test("capitalized Stop orchestrating clears the flag (case-insensitive disarm)", () => {
  const dir = freshStateDir();
  prompt(dir, "/orchestrate build X");
  assert.ok(existsSync(flagPath(dir, "s1")), "flag should exist before disarm");
  const out = prompt(dir, "Stop orchestrating");
  assert.equal(out, "");
  assert.ok(!existsSync(flagPath(dir, "s1")), "capitalized disarm should clear the flag");
});

test("disarm phrase not at start leaves the flag intact", () => {
  const dir = freshStateDir();
  prompt(dir, "/orchestrate build X");
  const out = prompt(dir, "please stop orchestrating");
  assert.match(out, ACTIVE);
  assert.ok(existsSync(flagPath(dir, "s1")), "mid-string disarm phrase must not clear the flag");
});

// ---- session isolation -------------------------------------------------------

test("two session_ids keep independent flags", () => {
  const dir = freshStateDir();
  prompt(dir, "/orchestrate build X", "session-a");
  assert.equal(prompt(dir, "plain prompt", "session-b"), "", "session-b should stay inactive");
  assert.match(prompt(dir, "plain prompt", "session-a"), ACTIVE);

  prompt(dir, "/orchestrate off", "session-a");
  prompt(dir, "/orchestrate go", "session-b");
  assert.ok(existsSync(flagPath(dir, "session-b")), "session-b flag should exist after re-arm");
  assert.equal(prompt(dir, "plain prompt", "session-a"), "", "session-a should be off");
  assert.match(prompt(dir, "plain prompt", "session-b"), ACTIVE);
});

// ---- failure paths: never block, never exit 2 --------------------------------

test("malformed stdin (not JSON) exits 0 with empty stdout", () => {
  const dir = freshStateDir();
  const out = runHook(dir, "this is not json {{{");
  assert.equal(out, "");
  assert.deepEqual(readdirSync(dir), [], "no flag files should be created");
});

test("empty stdin exits 0 with empty stdout", () => {
  const dir = freshStateDir();
  const out = runHook(dir, "");
  assert.equal(out, "");
});

test("missing session_id exits 0 with empty stdout and creates no flag", () => {
  const dir = freshStateDir();
  const out = runHook(dir, JSON.stringify({ prompt: "/orchestrate build X" }));
  assert.equal(out, "");
  assert.deepEqual(readdirSync(dir), [], "no flag files should be created");
});

test("session_id with path separators is rejected: exit 0, silent, no flag, no escape", () => {
  const dir = freshStateDir();
  const out = prompt(dir, "/orchestrate build X", "../escape");
  assert.equal(out, "");
  assert.deepEqual(readdirSync(dir), [], "no flag files should be created");
  assert.ok(!existsSync(path.join(dir, "..", "escape")), "must not write a sibling escape file");
  assert.ok(!existsSync(path.join(dir, "..", "orchestrate-escape")), "must not write a sibling flag");
});

test("traversal that would land a sibling flag absent the regex guard is blocked", () => {
  const dir = freshStateDir();
  // Absent the guard, session_id "sub/../victim" makes the flag path
  // "<dir>/orchestrate-sub/../victim" resolve to "<dir>/victim" (writable
  // because orchestrate-sub exists). The session_id regex must reject it.
  mkdirSync(path.join(dir, "orchestrate-sub"));
  const out = prompt(dir, "/orchestrate build X", "sub/../victim");
  assert.equal(out, "");
  assert.ok(!existsSync(path.join(dir, "victim")), "guard must prevent the traversal write");
  assert.ok(!existsSync(path.join(dir, "orchestrate-victim")), "no escaped flag anywhere");
});

// ---- missing-prompt payloads -------------------------------------------------

test("payload with no prompt and no flag emits nothing", () => {
  const dir = freshStateDir();
  const out = runHook(dir, JSON.stringify({ session_id: "s1" }));
  assert.equal(out, "");
  assert.deepEqual(readdirSync(dir), [], "no flag should be created");
});

test("payload with no prompt but flag pre-set still emits the ACTIVE line", () => {
  const dir = freshStateDir();
  prompt(dir, "/orchestrate build X");
  assert.ok(existsSync(flagPath(dir, "s1")), "flag should exist before the promptless payload");
  const out = runHook(dir, JSON.stringify({ session_id: "s1" }));
  assert.match(out, ACTIVE);
});

// ---- missing jq: degrade to no-op, never block -------------------------------

test("missing jq exits 0 with empty stdout and creates no flag", () => {
  const dir = freshStateDir();
  // PATH stripped so `command -v jq` finds nothing; bash invoked by abs path.
  const out = execFileSync(bashAbs, [script], {
    input: JSON.stringify({ prompt: "/orchestrate build X", session_id: "s1" }),
    encoding: "utf8",
    env: { PATH: "", ORCHESTRATE_STATE_DIR: dir },
  });
  assert.equal(out, "");
  assert.deepEqual(readdirSync(dir), [], "no flag should be created without jq");
});

// ---- state-dir resolution ----------------------------------------------------

test("ORCHESTRATE_STATE_DIR with a trailing slash lands the flag at the non-doubled path", () => {
  const dir = freshStateDir();
  runHook(dir + "/", JSON.stringify({ prompt: "/orchestrate build X", session_id: "s1" }));
  assert.ok(existsSync(flagPath(dir, "s1")), "flag should exist at the trimmed path");
  assert.deepEqual(readdirSync(dir), ["orchestrate-s1"], "exactly one flag, no doubled-slash artifacts");
});

test("without ORCHESTRATE_STATE_DIR the flag is created under TMPDIR", () => {
  const dir = freshStateDir();
  const env = { ...process.env, TMPDIR: dir };
  delete env.ORCHESTRATE_STATE_DIR;
  execFileSync("bash", [script], {
    input: JSON.stringify({ prompt: "/orchestrate build X", session_id: "s1" }),
    encoding: "utf8",
    env,
  });
  assert.ok(existsSync(flagPath(dir, "s1")), "flag should be created under TMPDIR");
});
