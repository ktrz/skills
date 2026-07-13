// Tests for validate.mjs — run with: node --test tests/
//
// Zero dependencies: node:test + node:assert/strict. The validator is
// imported programmatically via its exported validate(doc); the CLI entry
// is exercised once as a regression check against fixtures/sample-mini.json.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { validate } from "../../narrate-pr/validate.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const validatorPath = path.join(here, "..", "..", "narrate-pr", "validate.mjs");
const samplePath = path.join(here, "..", "..", "narrate-pr", "fixtures", "sample-mini.json");

const sample = () => JSON.parse(readFileSync(samplePath, "utf8"));

// validate() reuses one module-level array; copy so results survive reruns.
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

// ---- regression: the shipped fixture stays valid ---------------------------

test("sample-mini fixture validates clean (programmatic)", () => {
  assertClean(sample(), "sample-mini");
});

test("sample-mini fixture validates clean (CLI exits 0)", () => {
  const out = execFileSync(process.execPath, [validatorPath, samplePath], {
    encoding: "utf8",
  });
  assert.match(out, /^OK: /);
});

// ---- fix 1: code/doc receipt refs must be repo-relative path:line ----------

const BAD_PATH_REFS = [
  ["../outside.js:0", "parent segment + line 0"],
  ["/absolute.js:1", "absolute path"],
  ["https://host/file:1", "URL scheme"],
  ["a/../b.js:3", "embedded .. segment"],
];

for (const kind of ["code", "doc"]) {
  for (const [ref, why] of BAD_PATH_REFS) {
    test(`${kind} receipt ref "${ref}" (${why}) is rejected`, () => {
      const doc = sample();
      doc.thesis.receipts = [{ kind, ref }];
      assertViolation(doc, "$.thesis.receipts[0].ref", `${kind} ${ref}`);
    });
  }

  test(`${kind} receipt refs path:line and path:start-end pass`, () => {
    const doc = sample();
    doc.thesis.receipts = [
      { kind, ref: "src/a.ts:1" },
      { kind, ref: "src/a.ts:3-9" },
    ];
    assertClean(doc, `${kind} good refs`);
  });
}

test("code receipt ref with end line before start line is still rejected", () => {
  const doc = sample();
  doc.thesis.receipts = [{ kind: "code", ref: "src/a.ts:9-3" }];
  assertViolation(doc, ["$.thesis.receipts[0].ref", "end line"], "reversed range");
});

// ---- fix 2: url / report receipt ref shapes --------------------------------

const BAD_URL_REFS = [
  "javascript:alert(1)",
  "data:text/html,hi",
  "//evil.example/x",
  "/absolute/path",
  "ftp://host/file",
];

for (const ref of BAD_URL_REFS) {
  test(`url receipt ref "${ref}" is rejected`, () => {
    const doc = sample();
    doc.thesis.receipts = [{ kind: "url", ref }];
    assertViolation(doc, "$.thesis.receipts[0].ref", `url ${ref}`);
  });
}

test("http(s) url receipt refs pass", () => {
  const doc = sample();
  doc.thesis.receipts = [
    { kind: "url", ref: "https://example.com/docs" },
    { kind: "url", ref: "http://example.com" },
  ];
  assertClean(doc, "good url refs");
});

const BAD_REPORT_REFS = [
  "javascript:alert(1)",
  "/reports/api.md",
  "../reports/api.md",
  "reports/../secrets.md",
  "reports/api.md#frag ment",
  "notes/api.md#overview",
  "reports/api.txt",
];

for (const ref of BAD_REPORT_REFS) {
  test(`report receipt ref "${ref}" is rejected`, () => {
    const doc = sample();
    doc.thesis.receipts = [{ kind: "report", ref }];
    assertViolation(doc, "$.thesis.receipts[0].ref", `report ${ref}`);
  });
}

test("report receipt refs with and without fragment pass", () => {
  const doc = sample();
  doc.thesis.receipts = [
    { kind: "report", ref: "reports/api.md" },
    { kind: "report", ref: "reports/api.md#overview" },
  ];
  assertClean(doc, "good report refs");
});

// ---- fix 3: non-object entries fail loudly, once ---------------------------

test("packages: [null] fails with exactly one structure violation for that path", () => {
  const doc = sample();
  doc.packages = [null];
  const v = violationsFor(doc);
  const forEntry = v.filter((line) => line.includes("$.packages[0]"));
  assert.equal(
    forEntry.length,
    1,
    `expected exactly one violation for $.packages[0], got:\n${v.join("\n")}`
  );
  assert.match(forEntry[0], /expected an object, got null/);
});

test("a primitive component entry fails validation", () => {
  const doc = sample();
  doc.components[0] = "not-an-object";
  assertViolation(doc, ["$.components[0]", "expected an object"], "primitive component");
});

// ---- fix 4: depmap layout bounds --------------------------------------------

const depmapLayout = (doc) => doc.architecture.diagrams[2].layout;
const LAYOUT_PATH = '$.architecture.diagrams[2].layout';

test("depmap layout negative row is rejected", () => {
  const doc = sample();
  depmapLayout(doc).nodes["node.service"].row = -1;
  assertViolation(doc, `${LAYOUT_PATH}.nodes["node.service"]`, "negative row");
});

test("depmap layout col 0 is rejected", () => {
  const doc = sample();
  depmapLayout(doc).nodes["node.service"].col = 0;
  assertViolation(doc, `${LAYOUT_PATH}.nodes["node.service"]`, "col 0");
});

test("depmap layout cols < 1 is rejected", () => {
  const doc = sample();
  depmapLayout(doc).cols = 0;
  assertViolation(doc, `${LAYOUT_PATH}.cols`, "cols 0");
});

test("depmap layout colSpan overflowing cols is rejected", () => {
  const doc = sample();
  depmapLayout(doc).nodes["node.badge"].colSpan = 2; // col 3 + span 2 > cols 3
  assertViolation(doc, `${LAYOUT_PATH}.nodes["node.badge"]`, "colSpan overflow");
});

test("depmap layout huge rowSpan is rejected", () => {
  const doc = sample();
  depmapLayout(doc).nodes["node.service"].rowSpan = 10000;
  assertViolation(doc, `${LAYOUT_PATH}.nodes["node.service"]`, "rowSpan 10000");
});

test("depmap layout non-integer rowSpan is rejected", () => {
  const doc = sample();
  depmapLayout(doc).nodes["node.service"].rowSpan = 1.5;
  assertViolation(doc, `${LAYOUT_PATH}.nodes["node.service"]`, "rowSpan 1.5");
});

test("valid depmap layout with spans passes", () => {
  const doc = sample();
  // fixture already uses colSpan: 3 on node.types; add a legal rowSpan too
  depmapLayout(doc).nodes["node.gateway"].rowSpan = 2;
  assertClean(doc, "valid layout");
});

// ---- fix 5: required, prefix-namespaced ids on all node kinds ---------------

test("component without id fails", () => {
  const doc = sample();
  delete doc.components[0].id;
  assertViolation(doc, "$.components[0]", "component missing id");
});

test("reviewOrder entry with id in wrong namespace fails", () => {
  const doc = sample();
  doc.reviewOrder[0].id = "spot.x";
  assertViolation(doc, ["$.reviewOrder[0].id", "order."], "wrong id namespace");
});

const MISSING_ID_CASES = [
  ["architecture prose", (doc) => delete doc.architecture.prose[0].id, "$.architecture.prose[0]"],
  ["channel", (doc) => delete doc.architecture.channels[0].id, "$.architecture.channels[0]"],
  ["boundary", (doc) => delete doc.architecture.boundaries[0].id, "$.architecture.boundaries[0]"],
  ["invariant", (doc) => delete doc.components[0].invariants[0].id, "$.components[0].invariants[0]"],
  ["attention spot", (doc) => delete doc.attentionSpots[0].id, "$.attentionSpots[0]"],
  ["test entry", (doc) => delete doc.tests[0].id, "$.tests[0]"],
];

for (const [label, mutate, pathPrefix] of MISSING_ID_CASES) {
  test(`${label} without id fails`, () => {
    const doc = sample();
    mutate(doc);
    assertViolation(doc, pathPrefix, `${label} missing id`);
  });
}

test("qa and prComments entries require prefixed ids", () => {
  const doc = sample();
  doc.qa = [
    { q: "Q?", a: "A.", receipts: [{ kind: "code", ref: "src/a.ts:1" }] },
  ];
  doc.prComments = [
    {
      id: "qa.wrong-prefix",
      author: "alice",
      text: "hm",
      receipts: [{ kind: "code", ref: "src/a.ts:1" }],
    },
  ];
  assertViolation(doc, "$.qa[0]", "qa missing id");
  assertViolation(doc, ["$.prComments[0].id", "comment."], "prComment wrong prefix");
});

test("correctly prefixed qa and prComments ids pass", () => {
  const doc = sample();
  doc.qa = [
    {
      id: "qa.reconnect",
      q: "Q?",
      a: "A.",
      receipts: [{ kind: "code", ref: "src/a.ts:1" }],
    },
  ];
  doc.prComments = [
    {
      id: "comment.followup",
      author: "alice",
      text: "hm",
      receipts: [{ kind: "code", ref: "src/a.ts:1" }],
    },
  ];
  assertClean(doc, "prefixed qa/prComments");
});

// ---- fix 6: reviewOrder steps must form exactly {1..N} ----------------------

function setSteps(doc, steps) {
  assert.equal(doc.reviewOrder.length, steps.length, "test setup: step count");
  steps.forEach((s, i) => {
    doc.reviewOrder[i].step = s;
  });
}

test("reviewOrder steps [3, 3, 7] fail with duplicate and gap reports", () => {
  const doc = sample();
  setSteps(doc, [3, 3, 7]);
  const v = violationsFor(doc);
  assert.ok(
    v.some((line) => line.includes("$.reviewOrder") && /duplicate/.test(line)),
    `expected a duplicate-step violation, got:\n${v.join("\n")}`
  );
  assert.ok(
    v.some((line) => line.includes("$.reviewOrder") && line.includes("1")),
    `expected a violation about missing step 1, got:\n${v.join("\n")}`
  );
  assert.ok(
    v.some((line) => line.includes("$.reviewOrder") && line.includes("2")),
    `expected a violation about missing step 2, got:\n${v.join("\n")}`
  );
});

test("reviewOrder steps [0, 1, 2] fail", () => {
  const doc = sample();
  setSteps(doc, [0, 1, 2]);
  assertViolation(doc, "$.reviewOrder", "zero-based steps");
});

test("reviewOrder steps [2, 3, 1] pass (contiguous, any order)", () => {
  const doc = sample();
  setSteps(doc, [2, 3, 1]);
  assertClean(doc, "shuffled contiguous steps");
});

test("reviewOrder steps [1, 2, 3] pass", () => {
  const doc = sample();
  setSteps(doc, [1, 2, 3]);
  assertClean(doc, "in-order steps");
});
