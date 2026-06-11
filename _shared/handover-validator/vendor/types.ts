import { z } from 'zod';

export const SeveritySchema = z.enum(['critical', 'important', 'suggestion', 'nit']);
export type Severity = z.infer<typeof SeveritySchema>;

// On-disk markers: unresolved→[?], resolved→[x], custom→[~], deferred→[d], skipped→[-]
export const StatusMarkerSchema = z.enum(['unresolved', 'resolved', 'custom', 'deferred', 'skipped']);
export type StatusMarker = z.infer<typeof StatusMarkerSchema>;

export const LocationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('review-body') }),
  z.object({ kind: z.literal('file'), file: z.string(), line: z.number().int().positive() }),
]);
export type Location = z.infer<typeof LocationSchema>;

export const SourceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('auto-review'), severity: SeveritySchema }),
  z.object({
    kind: z.literal('reviewer'),
    // Bare handle; serializer prepends @
    login: z.string().min(1).regex(/^[^\s@]+$/),
    severity: SeveritySchema,
  }),
]);
export type Source = z.infer<typeof SourceSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
}).strict();
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const FindingItemBaseSchema = z.object({
  id: z.string().min(1),
  status: StatusMarkerSchema,
  source: SourceSchema,
  location: LocationSchema,
  reportedBy: z.array(z.string().min(1)).nonempty(),
  comment: z.string().min(1),
  analysis: z.string().min(1),
  recommendation: z.string().min(1),
  options: z.array(z.string().min(1)),
  resolution: z.string(),
  chat: z.array(ChatMessageSchema).optional(),
});

export const FindingItemSchema = z.discriminatedUnion('dirty', [
  FindingItemBaseSchema.extend({ dirty: z.literal(false), rawSource: z.string().min(1) }),
  FindingItemBaseSchema.extend({ dirty: z.literal(true), rawSource: z.string().optional() }),
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
export type FindingItem = z.infer<typeof FindingItemSchema>;

export const BranchRefSchema = z.object({
  ref: z.string().brand<'BranchRef'>(),
  sha: z.string().brand<'GitSha'>().optional(),
});
export type BranchRef = z.infer<typeof BranchRefSchema>;

export const DocumentHeaderSchema = z.object({
  prUrl: z.string().url().brand<'PrUrl'>(),
  prNumber: z.number().int().positive(),
  branch: z.object({
    head: BranchRefSchema,
    base: BranchRefSchema,
  }),
  generatedAt: z.string().datetime(),
  status: z.string(),
});
export type DocumentHeader = z.infer<typeof DocumentHeaderSchema>;

export const HandoverDocumentSchema = z.object({
  header: DocumentHeaderSchema,
  items: z.array(FindingItemSchema),
});
export type HandoverDocument = z.infer<typeof HandoverDocumentSchema>;
