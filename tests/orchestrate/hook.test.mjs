// Tests for orchestrate/scripts/orchestrate-reminder.sh — run with:
//   node --test "tests/orchestrate/*.test.mjs"
//
// Zero dependencies: node:test + node:assert/strict. The hook is exercised
// as a black box: JSON payload on stdin, reminder line (or nothing) on
// stdout, session-keyed flag file under ORCHESTRATE_STATE_DIR.
//
// Contract under test:
//   - "/orchestrate ..." or "orchestrate: ..." prompts set the flag and emit
//     the ACTIVE line; while the flag exists every prompt re-emits it.
//   - "/orchestrate off" and "stop orchestrat..." clear the flag silently.
//   - The hook NEVER blocks the prompt: every failure path (malformed JSON,
//     missing session_id) exits 0 with empty stdout — never exit 2.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, "..", "..", "orchestrate", "scripts", "orchestrate-reminder.sh");

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

test("orchestrate: <task> prefix also activates", () => {
  const dir = freshStateDir();
  const out = prompt(dir, "orchestrate: refactor the parser");
  assert.match(out, ACTIVE);
  assert.ok(existsSync(flagPath(dir, "s1")), "flag file should exist");
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
  const offOut = prompt(dir, "/orchestrate off");
  assert.equal(offOut, "");
  assert.ok(!existsSync(flagPath(dir, "s1")), "flag should be removed");
  assert.equal(prompt(dir, "anything else"), "");
});

test("stop orchestrating removes the flag silently, same as off", () => {
  const dir = freshStateDir();
  prompt(dir, "/orchestrate build X");
  const out = prompt(dir, "stop orchestrating");
  assert.equal(out, "");
  assert.ok(!existsSync(flagPath(dir, "s1")), "flag should be removed");
  assert.equal(prompt(dir, "anything else"), "");
});

// ---- session isolation -------------------------------------------------------

test("two session_ids keep independent flags", () => {
  const dir = freshStateDir();
  prompt(dir, "/orchestrate build X", "session-a");
  assert.equal(prompt(dir, "plain prompt", "session-b"), "", "session-b should stay inactive");
  assert.match(prompt(dir, "plain prompt", "session-a"), ACTIVE);

  prompt(dir, "/orchestrate off", "session-a");
  prompt(dir, "/orchestrate go", "session-b");
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

test("session_id with path separators is rejected: exit 0, silent, no flag", () => {
  const dir = freshStateDir();
  const out = prompt(dir, "/orchestrate build X", "../escape");
  assert.equal(out, "");
  assert.deepEqual(readdirSync(dir), [], "no flag files should be created");
});
