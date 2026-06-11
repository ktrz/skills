// Smoke test for the vendored handover validator. Asserts the committed bundle
// (dist/validate.mjs) accepts the synthetic fixtures the skills are expected to
// produce: a populated handover doc and the fresh-PR empty doc (zero items).
// A malformed doc must be rejected with a non-zero exit. Run: npm test.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const bundle = join(here, 'dist', 'validate.mjs');

function run(docPath) {
  try {
    const stdout = execFileSync('node', [bundle, 'validate', docPath], { encoding: 'utf8' });
    return { code: 0, stdout };
  } catch (err) {
    return { code: err.status ?? 1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
}

let failures = 0;
function expect(label, cond) {
  if (cond) {
    process.stdout.write(`ok   - ${label}\n`);
  } else {
    process.stdout.write(`FAIL - ${label}\n`);
    failures++;
  }
}

// Valid populated doc → exit 0.
const populated = run(join(here, 'fixtures', 'valid-handover.md'));
expect('populated fixture exits 0', populated.code === 0);
expect('populated fixture reports 2 items', populated.stdout.includes('2 item'));

// Fresh-PR empty doc (zero items) → exit 0. This is the doc Fix 1 guarantees
// is always written even with no human comments and no auto-review findings.
const empty = run(join(here, 'fixtures', 'empty-handover.md'));
expect('empty fixture exits 0', empty.code === 0);
expect('empty fixture reports 0 items', empty.stdout.includes('0 item'));

// Malformed doc (Source counts disagree with the single item) → non-zero exit.
const tmp = mkdtempSync(join(tmpdir(), 'handover-validator-'));
const badPath = join(tmp, 'bad.md');
writeFileSync(
  badPath,
  `# PR 9 Review Decisions

**PR:** https://github.com/owner/repo/pull/9
**Branch:** feat/x → main
**Generated:** 2026-06-10T09:00:00Z
**Status:** PENDING REVIEW
**Source counts:** 5 auto-review findings, 0 human reviewer comments, 5 total (5 critical, 0 important, 0 suggestion/nit)

---
`,
);
const bad = run(badPath);
expect('source-count mismatch is rejected (non-zero exit)', bad.code !== 0);

if (failures > 0) {
  process.stderr.write(`\n${failures} assertion(s) failed.\n`);
  process.exit(1);
}
process.stdout.write('\nAll handover-validator assertions passed.\n');
