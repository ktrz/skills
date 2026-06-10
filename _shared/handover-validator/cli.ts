#!/usr/bin/env node
// Thin CLI around the VENDORED plugin parser (vendor/parse.ts). Exit 0 when the
// handover doc parses exactly as the review-plugin-mvp extension would load it;
// exit non-zero with the violation list otherwise. This is the gate both
// `investigate-pr-comments` and `review-pr` run before emitting a doc — if the
// plugin can't load it, we never ship it.
//
// Usage:
//   node cli.ts validate <doc-path>
//   node cli.ts <doc-path>          (the `validate` subcommand is optional)
//
// Do NOT edit vendor/*.ts by hand — they are synced from the plugin repo (see
// SOURCE.md). Edit this CLI only.

import { readFileSync } from 'node:fs';
import { ZodError } from 'zod';
import { parseDocument, ParseError } from './vendor/parse.ts';

type Violation = { message: string; where?: string };

function resolveDocPath(argv: string[]): string | null {
  const args = argv[0] === 'validate' ? argv.slice(1) : argv;
  return args[0] ?? null;
}

function collectViolations(err: unknown): Violation[] {
  if (err instanceof ParseError) {
    const where = `line ${err.lineNumber}, offset ${err.offset}, state ${err.state}`;
    const violations: Violation[] = [{ message: err.message, where }];
    // ParseError wraps ZodError schema failures via `cause`; expand each issue
    // so the user sees every field that failed, not just the umbrella message.
    if (err.cause instanceof ZodError) {
      for (const issue of err.cause.issues) {
        const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        violations.push({ message: `${path}: ${issue.message}`, where: 'schema' });
      }
    }
    return violations;
  }
  if (err instanceof Error) {
    return [{ message: `${err.name}: ${err.message}` }];
  }
  return [{ message: String(err) }];
}

function main(): number {
  const docPath = resolveDocPath(process.argv.slice(2));
  if (docPath === null) {
    process.stderr.write('usage: validate <doc-path>\n');
    return 2;
  }

  let raw: string;
  try {
    raw = readFileSync(docPath, 'utf8');
  } catch (err) {
    process.stderr.write(`cannot read ${docPath}: ${err instanceof Error ? err.message : String(err)}\n`);
    return 2;
  }

  try {
    const doc = parseDocument(raw);
    process.stdout.write(
      `OK: ${docPath} parses as a valid handover doc (${doc.items.length} item(s)).\n`,
    );
    return 0;
  } catch (err) {
    const violations = collectViolations(err);
    process.stderr.write(`INVALID: ${docPath} would not load in the review plugin.\n`);
    for (const v of violations) {
      process.stderr.write(`  - ${v.message}${v.where ? ` [${v.where}]` : ''}\n`);
    }
    return 1;
  }
}

process.exit(main());
