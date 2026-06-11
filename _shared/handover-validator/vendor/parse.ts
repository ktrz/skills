import { z } from 'zod';
import {
  DocumentHeaderSchema,
  FindingItemBaseSchema,
  SeveritySchema,
  type ChatMessage,
  type HandoverDocument,
  type FindingItem,
  type StatusMarker,
  type Source,
  type Location,
} from './types';

// Parser state transitions (valid arcs):
//   IN_HEADER       → BETWEEN_ITEMS  (on first ---)
//   BETWEEN_ITEMS   → IN_ITEM_FIELDS (on ## [...])
//   IN_ITEM_FIELDS  → BETWEEN_ITEMS  (on ---)
//   IN_ITEM_FIELDS  → IN_ITEM_FIELDS (on ## [...] without preceding ---)
//   IN_ITEM_FIELDS  → IN_OPTIONS     (on **Options:** field)
//   IN_ITEM_FIELDS  → IN_RESOLUTION  (on **Resolution:** field)
//   IN_OPTIONS      → BETWEEN_ITEMS  (on ---)
//   IN_OPTIONS      → IN_ITEM_FIELDS (on ## [...])
//   IN_OPTIONS      → IN_RESOLUTION  (on **Resolution:** field)
//   IN_RESOLUTION   → BETWEEN_ITEMS  (on ---)
//   IN_RESOLUTION   → IN_ITEM_FIELDS (on ## [...])

type ActiveItem = {
  id: string;
  status: StatusMarker;
  source: Source;
  location: Location;
  reportedBy: string[];
  comment: string;
  analysis: string;
  recommendation: string;
  options: string[];
  resolution: string;
  chat: ChatMessage[] | undefined;
  severitySeen: boolean;   // tracks whether **Severity:** field was seen for reviewer items
  startOffset: number;
};

type ParserStateValue =
  | { state: 'IN_HEADER' }
  | { state: 'BETWEEN_ITEMS' }
  | { state: 'IN_ITEM_FIELDS'; item: ActiveItem }
  | { state: 'IN_COMMENT'; item: ActiveItem; fenceOpen: boolean; bodyLines: string[] }
  | { state: 'IN_OPTIONS'; item: ActiveItem }
  | { state: 'IN_CHAT'; item: ActiveItem }
  | { state: 'IN_RESOLUTION'; item: ActiveItem };

// Exported so callers can reference parser state names without importing the internal union type.
export type ParserState = ParserStateValue['state'];

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly offset: number,
    public readonly state: ParserState,
    public readonly lineNumber: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'ParseError';
  }
}

// Matches item heading: ## [STATUS] SOURCE_TAG — FILE:LINE  or  — review body
// STATUS: one of ?, x, ~, d, -
// SOURCE_TAG: auto:SEVERITY  or  reviewer:@LOGIN
const ITEM_HEADING_RE =
  /^## \[([?x~d\-])\] (auto:([a-z]+)|reviewer:@([^\s@]+)) — (review body|([^\s:]+):(\d+))$/;

// Matches **Key:** value — colon sits before the closing **, not after it
const FIELD_RE = /^\*\*([^*]+):\*\*\s*(.*)/;

const OPTION_BULLET_RE = /^\s*[-*]\s+(.+)/;

type SourceCounts = {
  autoReviewFindings: number;
  humanReviewerComments: number;
  totalItems: number;
  totalCritical: number;
  totalImportant: number;
  totalSuggestionOrNit: number;
};

function parseSourceCounts(line: string): SourceCounts | null {
  const m = line.match(
    /(\d+) auto-review findings,\s*(\d+) human reviewer comments,\s*(\d+) total\s*\((\d+) critical,\s*(\d+) important,\s*(\d+) suggestion\/nit\)/,
  );
  if (!m) { return null; }
  const [, auto, human, total, crit, imp, sug] = m;
  return {
    autoReviewFindings: Number(auto),
    humanReviewerComments: Number(human),
    totalItems: Number(total),
    totalCritical: Number(crit),
    totalImportant: Number(imp),
    totalSuggestionOrNit: Number(sug),
  };
}

// Maps on-disk status char to named-semantic StatusMarker
const STATUS_CHAR_MAP: Record<string, StatusMarker> = {
  '?': 'unresolved',
  'x': 'resolved',
  '~': 'custom',
  'd': 'deferred',
  '-': 'skipped',
};

// Known header keys (allow-list)
const KNOWN_HEADER_KEYS = new Set([
  'PR', 'Branch', 'Head SHA', 'Base SHA', 'Generated', 'Status', 'Source counts',
]);

// Known item field keys (allow-list); 'Note' is ignored but not an error
const KNOWN_ITEM_FIELDS = new Set([
  'Severity', 'Source', 'Reported by', 'Id', 'Comment', 'Analysis',
  'Recommendation', 'Resolution', 'Note', 'Options', 'Chat',
]);

const CHAT_BULLET_RE = /^- ([a-zA-Z]+): (.*)$/;
const CHAT_CONTINUATION_RE = /^  (.*)$/;

const EXTERNAL_DATA_OPEN_RE = /^<external_data\s+(?:[^>]*\s)?trust="untrusted"(?:\s[^>]*)?>$/;
const EXTERNAL_DATA_ANY_OPEN_RE = /^<external_data(?:\s[^>]*)?>$/;
const EXTERNAL_DATA_CLOSE_RE = /^<\/external_data>$/;

function handleItemBoundary(line: string): 'separator' | 'new-heading' | null {
  if (line.trim() === '---') { return 'separator'; }
  if (line.startsWith('## [')) { return 'new-heading'; }
  return null;
}

function flushCommentBody(bodyLines: string[], offset: number, lineNum: number): string {
  let start = 0;
  while (start < bodyLines.length && bodyLines[start].trim() === '') { start++; }
  let end = bodyLines.length;
  while (end > start && bodyLines[end - 1].trim() === '') { end--; }
  const body = bodyLines.slice(start, end).join('\n');
  if (!body) {
    throw new ParseError('Comment block is empty', offset, 'IN_COMMENT', lineNum);
  }
  return body;
}

function finalizeItem(
  item: ActiveItem,
  raw: string,
  endOffset: number,
  out: FindingItem[],
): void {
  if (item.source.kind === 'reviewer' && !item.severitySeen) {
    // Reviewer items must declare severity via **Severity:** field
    throw new ParseError(
      `Reviewer item missing **Severity:** field`,
      item.startOffset,
      'IN_ITEM_FIELDS',
      0,
    );
  }

  if (item.reportedBy.length === 0) {
    throw new ParseError(
      'Item missing required field: Reported by',
      item.startOffset,
      'IN_ITEM_FIELDS',
      0,
    );
  }

  // Trim only \r and \n (preserve trailing horizontal whitespace per byte-preservation guarantee)
  const rawSource = raw.slice(item.startOffset, endOffset).replace(/[\r\n]+$/, '');

  // item.reportedBy is validated non-empty above (length === 0 throws ParseError)
  const reportedBy = item.reportedBy as [string, ...string[]];
  const finalized: FindingItem = {
    id: item.id,
    status: item.status,
    source: item.source,
    location: item.location,
    reportedBy,
    comment: item.comment,
    analysis: item.analysis,
    recommendation: item.recommendation,
    options: item.options,
    resolution: item.resolution,
    rawSource,
    dirty: false,
    ...(item.chat !== undefined && item.chat.length > 0 ? { chat: item.chat } : {}),
  };
  out.push(finalized);
}

function applyField(
  item: ActiveItem,
  key: string,
  value: string,
  offset: number,
  lineNum: number,
  state: ParserState,
): void {
  if (!KNOWN_ITEM_FIELDS.has(key)) {
    throw new ParseError(`Unknown field in item: **${key}:**`, offset, state, lineNum);
  }
  switch (key) {
    case 'Severity': {
      const result = SeveritySchema.safeParse(value);
      if (!result.success) {
        throw new ParseError(
          `Invalid severity value: "${value}"`,
          offset, state, lineNum,
          { cause: result.error },
        );
      }
      if (item.source.kind === 'reviewer') {
        item.source = { ...item.source, severity: result.data };
      }
      item.severitySeen = true;
      break;
    }
    case 'Source':
      // Source tag in heading is authoritative; field is informational; skip
      break;
    case 'Reported by':
      item.reportedBy = value.split(',').map((s) => s.trim()).filter(Boolean);
      break;
    case 'Id':
      item.id = value;
      break;
    case 'Comment':
      item.comment = value;
      break;
    case 'Analysis':
      item.analysis = value;
      break;
    case 'Recommendation':
      item.recommendation = value;
      break;
    case 'Resolution':
      item.resolution = value;
      break;
    case 'Note':
      // Intentionally ignored; rides in rawSource
      break;
    case 'Options':
      // Handled by state transition; skip here
      break;
  }
}

function parseItemHeading(
  line: string,
  offset: number,
  lineNumber: number,
  state: ParserState,
  startOffset: number,
): ActiveItem {
  const m = ITEM_HEADING_RE.exec(line);
  if (!m) {
    throw new ParseError(`Invalid item heading: ${line}`, offset, state, lineNumber);
  }

  const [, statusChar, , autoSev, reviewerLogin, locationStr, file, lineStr] = m;

  const status = STATUS_CHAR_MAP[statusChar];
  // statusChar is guaranteed valid by regex [?x~d\-]; status always defined

  let source: Source;
  if (autoSev !== undefined) {
    // Validate severity at parse time so heading tag becomes typed
    const sevResult = SeveritySchema.safeParse(autoSev);
    if (!sevResult.success) {
      throw new ParseError(
        `Invalid auto-review severity: "${autoSev}"`,
        offset, state, lineNumber,
        { cause: sevResult.error },
      );
    }
    source = { kind: 'auto-review', severity: sevResult.data };
  } else {
    // reviewer:@LOGIN — severity comes from **Severity:** field later
    // Store bare handle; serializer prepends @
    source = { kind: 'reviewer', login: reviewerLogin, severity: 'nit' }; // 'nit' placeholder; finalize checks severitySeen
  }

  const location: Location =
    locationStr === 'review body'
      ? { kind: 'review-body' }
      : { kind: 'file', file: unescapeMarkdown(file!), line: parseInt(lineStr!, 10) };

  return {
    id: '',
    status,
    source,
    location,
    reportedBy: [],
    comment: '',
    analysis: '',
    recommendation: '',
    options: [],
    resolution: '',
    chat: undefined,
    severitySeen: source.kind === 'auto-review', // auto-review: severity seen; reviewer: wait for field
    startOffset,
  };
}

// Markdown escapes a backslash before ASCII punctuation (prettier writes a
// leading `_` as `\_`). Heading file captures keep that literal backslash, so
// unescape it here — at parse time — so every consumer gets a real path.
function unescapeMarkdown(value: string): string {
  return value.replace(/\\([!-/:-@[-`{-~])/g, '$1');
}

function transitionOnBoundary(
  boundary: 'separator' | 'new-heading',
  item: ActiveItem,
  line: string,
  raw: string,
  lineOffset: number,
  lineNum: number,
  fromState: ParserState,
  items: FindingItem[],
): ParserStateValue {
  finalizeItem(item, raw, lineOffset, items);
  if (boundary === 'separator') {
    return { state: 'BETWEEN_ITEMS' };
  }
  const next = parseItemHeading(line, lineOffset, lineNum, fromState, lineOffset);
  return { state: 'IN_ITEM_FIELDS', item: next };
}

export function parseDocument(raw: string): Readonly<HandoverDocument> {
  // Normalize CRLF → LF
  raw = raw.replace(/\r\n/g, '\n');

  const lines = raw.split('\n');

  // Header fields
  let prUrl = '';
  let branchHeadRef = '';
  let branchHeadSha: string | undefined;
  let branchBaseRef = '';
  let branchBaseSha: string | undefined;
  let generatedAt = '';
  let status = '';
  let sourceCounts: SourceCounts | null = null;
  let prNumber = 0;

  const items: FindingItem[] = [];

  let sv: ParserStateValue = { state: 'IN_HEADER' };
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // lineOffset = byte offset of the current line's first char; used for ParseError positions and rawSource slicing
    const lineOffset = offset;
    const lineNum = i + 1;

    if (sv.state === 'IN_HEADER') {
      // IN_HEADER: collect header fields; transition to BETWEEN_ITEMS on first ---
      if (line.startsWith('## [')) {
        throw new ParseError(
          `Item heading encountered before first --- separator`,
          lineOffset, 'IN_HEADER', lineNum,
        );
      }
      const fieldMatch = FIELD_RE.exec(line);
      if (fieldMatch) {
        const key = fieldMatch[1].trim();
        const value = fieldMatch[2].trim();

        if (!KNOWN_HEADER_KEYS.has(key)) {
          throw new ParseError(`Unknown header field: **${key}:**`, lineOffset, 'IN_HEADER', lineNum);
        }

        switch (key) {
          case 'PR':
            prUrl = value;
            break;
          case 'Branch': {
            const arrowIdx = value.indexOf(' → ');
            if (arrowIdx === -1) {
              throw new ParseError(
                `Malformed Branch line (missing →): ${value}`,
                lineOffset, 'IN_HEADER', lineNum,
              );
            }
            branchHeadRef = value.slice(0, arrowIdx).trim();
            branchBaseRef = value.slice(arrowIdx + 3).trim();
            break;
          }
          case 'Head SHA':
            branchHeadSha = value;
            break;
          case 'Base SHA':
            branchBaseSha = value;
            break;
          case 'Generated':
            generatedAt = value;
            break;
          case 'Status':
            status = value;
            break;
          case 'Source counts': {
            const counts = parseSourceCounts(value);
            if (!counts) {
              throw new ParseError(`Malformed Source counts: ${value}`, lineOffset, 'IN_HEADER', lineNum);
            }
            sourceCounts = counts;
            break;
          }
        }
      } else if (line.trim() === '---') {
        // Validate required header fields before transitioning
        if (!prUrl) {
          throw new ParseError('Missing required header field: PR', lineOffset, 'IN_HEADER', lineNum);
        }
        if (!branchHeadRef || !branchBaseRef) {
          throw new ParseError('Missing required header field: Branch', lineOffset, 'IN_HEADER', lineNum);
        }
        if (!generatedAt) {
          throw new ParseError('Missing required header field: Generated', lineOffset, 'IN_HEADER', lineNum);
        }
        if (!status) {
          throw new ParseError('Missing required header field: Status', lineOffset, 'IN_HEADER', lineNum);
        }
        if (!sourceCounts) {
          throw new ParseError('Missing required header field: Source counts', lineOffset, 'IN_HEADER', lineNum);
        }
        const prMatch = prUrl.match(/\/pull\/(\d+)$/);
        if (!prMatch) {
          throw new ParseError(
            `prUrl does not end in /pull/<n>: ${prUrl}`,
            lineOffset, 'IN_HEADER', lineNum,
          );
        }
        prNumber = parseInt(prMatch[1], 10);
        sv = { state: 'BETWEEN_ITEMS' };
      }
      // else: blank lines, h1 title — skip
    }

    else if (sv.state === 'BETWEEN_ITEMS') {
      if (line.startsWith('## [')) {
        const item = parseItemHeading(line, lineOffset, lineNum, 'BETWEEN_ITEMS', lineOffset);
        sv = { state: 'IN_ITEM_FIELDS', item };
      }
      // blank lines and --- are ignored
    }

    else if (sv.state === 'IN_ITEM_FIELDS') {
      const boundary = handleItemBoundary(line);
      if (boundary !== null) {
        sv = transitionOnBoundary(boundary, sv.item, line, raw, lineOffset, lineNum, 'IN_ITEM_FIELDS', items);
      } else {
        const fieldMatch = FIELD_RE.exec(line);
        if (fieldMatch) {
          const key = fieldMatch[1].trim();
          const value = fieldMatch[2].trim();
          if (key === 'Options') {
            sv = { state: 'IN_OPTIONS', item: sv.item };
          } else if (key === 'Chat') {
            sv.item.chat = [];
            sv = { state: 'IN_CHAT', item: sv.item };
          } else if (key === 'Resolution') {
            sv.item.resolution = value;
            sv = { state: 'IN_RESOLUTION', item: sv.item };
          } else if (key === 'Comment' && value === '') {
            sv = { state: 'IN_COMMENT', item: sv.item, fenceOpen: false, bodyLines: [] };
          } else {
            applyField(sv.item, key, value, lineOffset, lineNum, 'IN_ITEM_FIELDS');
          }
        } else if (line.trim() !== '') {
          // Non-blank, non-field line in IN_ITEM_FIELDS: only blank lines are allowed
          throw new ParseError(
            `Unexpected content in item fields: ${line}`,
            lineOffset, 'IN_ITEM_FIELDS', lineNum,
          );
        }
        // Blank lines are allowed (skip)
      }
    }

    else if (sv.state === 'IN_COMMENT') {
      const trimmed = line.trimEnd();
      // Destructure after narrowing; CFA can't track the union through the loop so annotate explicitly
      const commentItem: ActiveItem = sv.item;
      const fenceOpen: boolean = sv.fenceOpen;
      const bodyLines: string[] = sv.bodyLines;
      if (EXTERNAL_DATA_OPEN_RE.test(trimmed)) {
        sv = { state: 'IN_COMMENT', item: commentItem, fenceOpen: true, bodyLines };
      } else if (EXTERNAL_DATA_ANY_OPEN_RE.test(trimmed)) {
        throw new ParseError(
          'Malformed external_data fence: missing trust="untrusted"',
          lineOffset, 'IN_COMMENT', lineNum,
        );
      } else if (EXTERNAL_DATA_CLOSE_RE.test(trimmed)) {
        sv = { state: 'IN_COMMENT', item: commentItem, fenceOpen: false, bodyLines };
      } else if (!fenceOpen) {
        const boundary = handleItemBoundary(line);
        if (boundary !== null) {
          commentItem.comment = flushCommentBody(bodyLines, lineOffset, lineNum);
          sv = transitionOnBoundary(boundary, commentItem, line, raw, lineOffset, lineNum, 'IN_COMMENT', items);
        } else {
          const fieldMatch = FIELD_RE.exec(line);
          if (fieldMatch) {
            const key = fieldMatch[1].trim();
            const value = fieldMatch[2].trim();
            commentItem.comment = flushCommentBody(bodyLines, lineOffset, lineNum);
            if (key === 'Options') {
              sv = { state: 'IN_OPTIONS', item: commentItem };
            } else if (key === 'Chat') {
              commentItem.chat = [];
              sv = { state: 'IN_CHAT', item: commentItem };
            } else if (key === 'Resolution') {
              commentItem.resolution = value;
              sv = { state: 'IN_RESOLUTION', item: commentItem };
            } else {
              applyField(commentItem, key, value, lineOffset, lineNum, 'IN_COMMENT');
              sv = { state: 'IN_ITEM_FIELDS', item: commentItem };
            }
          } else {
            bodyLines.push(line);
          }
        }
      } else {
        bodyLines.push(line);
      }
    }

    else if (sv.state === 'IN_OPTIONS') {
      const boundary = handleItemBoundary(line);
      if (boundary !== null) {
        sv = transitionOnBoundary(boundary, sv.item, line, raw, lineOffset, lineNum, 'IN_OPTIONS', items);
      } else {
        const fieldMatch = FIELD_RE.exec(line);
        if (fieldMatch) {
          const key = fieldMatch[1].trim();
          const value = fieldMatch[2].trim();
          if (key === 'Chat') {
            sv.item.chat = [];
            sv = { state: 'IN_CHAT', item: sv.item };
          } else if (key === 'Resolution') {
            sv.item.resolution = value;
            sv = { state: 'IN_RESOLUTION', item: sv.item };
          } else if (key === 'Note') {
            // Note is allowed in options block; intentionally ignored; rides in rawSource
          } else {
            throw new ParseError(
              `Unexpected field in options block: **${key}:**`,
              lineOffset, 'IN_OPTIONS', lineNum,
            );
          }
        } else {
          const bulletMatch = OPTION_BULLET_RE.exec(line);
          if (bulletMatch) {
            sv.item.options.push(bulletMatch[1].trim());
          }
        }
        // blank lines in options block are skipped
      }
    }

    else if (sv.state === 'IN_CHAT') {
      const boundary = handleItemBoundary(line);
      if (boundary !== null) {
        sv = transitionOnBoundary(boundary, sv.item, line, raw, lineOffset, lineNum, 'IN_CHAT', items);
      } else {
        const fieldMatch = FIELD_RE.exec(line);
        if (fieldMatch) {
          const key = fieldMatch[1].trim();
          const value = fieldMatch[2].trim();
          if (key === 'Resolution') {
            sv.item.resolution = value;
            sv = { state: 'IN_RESOLUTION', item: sv.item };
          } else {
            throw new ParseError(
              `Unexpected field in chat block: **${key}:**`,
              lineOffset, 'IN_CHAT', lineNum,
            );
          }
        } else {
          const bulletMatch = CHAT_BULLET_RE.exec(line);
          if (bulletMatch) {
            const role = bulletMatch[1];
            const content = bulletMatch[2];
            if (role !== 'user' && role !== 'assistant') {
              throw new ParseError(
                `Invalid chat role: "${role}"`,
                lineOffset, 'IN_CHAT', lineNum,
              );
            }
            if (sv.item.chat === undefined) {
              sv.item.chat = [];
            }
            sv.item.chat.push({ role, content });
          } else {
            const contMatch = CHAT_CONTINUATION_RE.exec(line);
            if (contMatch && sv.item.chat !== undefined && sv.item.chat.length > 0) {
              const last = sv.item.chat[sv.item.chat.length - 1];
              last.content = `${last.content}\n${contMatch[1]}`;
            }
          }
          // blank lines and unrelated lines inside IN_CHAT are skipped
        }
      }
    }

    else if (sv.state === 'IN_RESOLUTION') {
      const boundary = handleItemBoundary(line);
      if (boundary !== null) {
        sv = transitionOnBoundary(boundary, sv.item, line, raw, lineOffset, lineNum, 'IN_RESOLUTION', items);
      } else if (line.trim() !== '') {
        // Append non-separator, non-heading, non-blank lines to resolution
        sv.item.resolution = sv.item.resolution
          ? `${sv.item.resolution}\n${line}`
          : line;
      }
    }

    offset += line.length + 1; // +1 for the \n
  }

  // Finalize the last item if still open
  if (sv.state === 'IN_COMMENT') {
    sv.item.comment = flushCommentBody(sv.bodyLines, offset, lines.length);
    finalizeItem(sv.item, raw, offset, items);
  } else if (sv.state === 'IN_ITEM_FIELDS' || sv.state === 'IN_OPTIONS' || sv.state === 'IN_CHAT' || sv.state === 'IN_RESOLUTION') {
    finalizeItem(sv.item, raw, offset, items);
  }

  // If we never left IN_HEADER, the document is malformed (no --- separator found)
  if (sv.state === 'IN_HEADER') {
    throw new ParseError(
      'Unexpected end of input: missing --- separator (document header never closed)',
      offset, 'IN_HEADER', lines.length,
    );
  }

  // Cross-check source counts against parsed items
  if (sourceCounts !== null) {
    const autoCount = items.filter(it => it.source.kind === 'auto-review').length;
    const humanCount = items.filter(it => it.source.kind === 'reviewer').length;
    const critCount = items.filter(it => it.source.severity === 'critical').length;
    const impCount = items.filter(it => it.source.severity === 'important').length;
    const sugNitCount = items.filter(it =>
      it.source.severity === 'suggestion' || it.source.severity === 'nit'
    ).length;
    const totalCount = items.length;

    if (
      sourceCounts.totalItems !== totalCount ||
      sourceCounts.autoReviewFindings !== autoCount ||
      sourceCounts.humanReviewerComments !== humanCount ||
      sourceCounts.totalCritical !== critCount ||
      sourceCounts.totalImportant !== impCount ||
      sourceCounts.totalSuggestionOrNit !== sugNitCount
    ) {
      throw new ParseError(
        `Source counts mismatch: header says ${JSON.stringify(sourceCounts)} but items yield ${JSON.stringify({ totalItems: totalCount, autoReviewFindings: autoCount, humanReviewerComments: humanCount, totalCritical: critCount, totalImportant: impCount, totalSuggestionOrNit: sugNitCount })}`,
        0, 'IN_HEADER', 0,
      );
    }
  }

  // Parse-time schema: `id` may be empty here; loader stamps after parse
  // before exposing the doc. Other invariants (severity, resolution-required,
  // url, datetime, etc.) stay strict.
  const ParseTimeFindingItemSchema = z.discriminatedUnion('dirty', [
    FindingItemBaseSchema.extend({
      id: z.string(),
      dirty: z.literal(false),
      rawSource: z.string().min(1),
    }),
    FindingItemBaseSchema.extend({
      id: z.string(),
      dirty: z.literal(true),
      rawSource: z.string().optional(),
    }),
  ]).superRefine((data, ctx) => {
    if (data.status === 'resolved' || data.status === 'custom') {
      if (!data.resolution.length) {
        ctx.addIssue({
          path: ['resolution'],
          code: z.ZodIssueCode.custom,
          message: 'Resolution required when status is resolved or custom',
        });
      }
    }
  });
  const ParseTimeDocSchema = z.object({
    header: DocumentHeaderSchema,
    items: z.array(ParseTimeFindingItemSchema),
  });
  // Wrap ZodError → ParseError so callers see single error type
  try {
    const document = ParseTimeDocSchema.parse({
      header: {
        prUrl,
        prNumber,
        branch: {
          head: { ref: branchHeadRef, sha: branchHeadSha },
          base: { ref: branchBaseRef, sha: branchBaseSha },
        },
        generatedAt,
        status,
      },
      items,
    });
    return document;
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new ParseError(
        `Schema validation failed: ${e.message}`,
        0, 'IN_HEADER', 0,
        { cause: e },
      );
    }
    throw e;
  }
}
