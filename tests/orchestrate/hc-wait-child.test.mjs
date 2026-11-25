// Tests for skills/workflow/orchestrate/scripts/hc-wait-child.sh — run with:
//   node --test "tests/orchestrate/*.test.mjs"
//
// A fake `hc` on PATH replays a scripted sequence of `hc get --json` answers,
// one per call (the last repeats). An answer carrying "_report": true makes the
// fake write the report (ending in END) at that moment, like a child finishing.
//
// Contract under test: the waiter ends only on a report whose last line is END,
// child exit, blocked/error status, or max-seconds. Status idle/done/null alone
// never ends it (pre-turn idle, done-with-backgrounded-work, opencode null).

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, "..", "..", "skills", "workflow", "orchestrate", "scripts", "hc-wait-child.sh");

const FAKE_HC = `#!/usr/bin/env bash
d="$FAKE_HC_DIR"
case "$1" in
  get)
    n=$(cat "$d/n" 2>/dev/null || echo 0)
    total=$(wc -l < "$d/seq" | tr -d ' ')
    i=$(( n < total ? n + 1 : total ))
    echo $(( n + 1 )) > "$d/n"
    line=$(sed -n "\${i}p" "$d/seq")
    [[ "$line" == FAIL ]] && exit 1
    if [[ "$line" == *'"_report":true'* ]]; then printf 'did it\\nEND\\n' > "$d/report.md"; fi
    echo "$line"
    ;;
  wait) echo wait >> "$d/waits" ;;
  *) exit 1 ;;
esac
`;

function run(seq, { max = "20", prewrite } = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "hc-wait-child-test-"));
  writeFileSync(path.join(dir, "hc"), FAKE_HC);
  chmodSync(path.join(dir, "hc"), 0o755);
  writeFileSync(path.join(dir, "seq"), seq.map((s) => (typeof s === "string" ? s : JSON.stringify(s))).join("\n") + "\n");
  if (prewrite !== undefined) writeFileSync(path.join(dir, "report.md"), prewrite);
  const r = spawnSync("bash", [script, "kid", path.join(dir, "report.md"), max], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, FAKE_HC_DIR: dir, HC_WAIT_POLL: "0" },
    timeout: 15000,
  });
  return { code: r.status, out: r.stdout, err: r.stderr, dir };
}

const live = (status, turn, extra = {}) => ({
  state: "live",
  status: status === null ? null : { state: status },
  turn,
  records: { r1: { state: "done" } }, // nested decoy: grepping "state" would misread
  ...extra,
});

test("pre-turn idle (turn 0) does not end the wait; report END does", () => {
  const r = run([live("idle", 0), live("idle", 0), live("working", 0), live("done", 1, { _report: true })]);
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(r.out, /kid done/);
});

test("done with no report (child backgrounded work) keeps waiting", () => {
  const r = run([live("done", 1), live("done", 1), live("done", 1), live("done", 2, { _report: true })]);
  assert.equal(r.code, 0, r.out + r.err);
});

test("status null (no OSC status, e.g. opencode) keeps waiting until report", () => {
  const r = run([live(null, 0), live(null, 0), live(null, 0, { _report: true })]);
  assert.equal(r.code, 0, r.out + r.err);
});

test("nested records.*.state = done is not mistaken for completion", () => {
  const r = run([live("working", 0)], { max: "1" });
  assert.equal(r.code, 124, r.out + r.err);
});

test("report present without END is not done", () => {
  const r = run([live("idle", 1)], { max: "1", prewrite: "partial\n" });
  assert.equal(r.code, 124, r.out + r.err);
});

test("report ending END without trailing newline counts as done", () => {
  const r = run([live("idle", 1)], { prewrite: "x\nEND" });
  assert.equal(r.code, 0, r.out + r.err);
});

test("child exited without END → exit 2", () => {
  const r = run([live("working", 1), { state: "exited", status: null, turn: 1 }]);
  assert.equal(r.code, 2, r.out + r.err);
  assert.match(r.out, /exited without END/);
});

test("blocked → exit 4 with attach hint", () => {
  const r = run([live("blocked", 0)]);
  assert.equal(r.code, 4);
  assert.match(r.out, /hc attach kid/);
});

test("error status → exit 5", () => {
  assert.equal(run([live("error", 1)]).code, 5);
});

test("unknown child → exit 3", () => {
  assert.equal(run(["FAIL"]).code, 3);
});

test("working uses hc wait, not polling", () => {
  const r = run([live("working", 0), live("done", 1, { _report: true })]);
  assert.equal(r.code, 0);
  assert.ok(require_waits(r.dir) >= 1);
});

test("missing args → exit 64", () => {
  const r = spawnSync("bash", [script, "kid"], { encoding: "utf8" });
  assert.equal(r.status, 64);
});

import { readFileSync, existsSync } from "node:fs";
function require_waits(dir) {
  const p = path.join(dir, "waits");
  return existsSync(p) ? readFileSync(p, "utf8").trim().split("\n").length : 0;
}
