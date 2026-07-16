# Plan-file format

> **Contract doc.** This is the owned format specification for the phased
> plan file — the artifact `plan-feature` produces and `implement-feature` /
> `execute-phase` consume. Treat the rules below as the stable interface
> between those skills: process prose in a producer or consumer may change,
> but a plan file that conforms here must keep parsing.

|               |                                                                                |
| ------------- | ------------------------------------------------------------------------------ |
| **Owner**     | `skills/delivery/plan-feature` (writer)                                        |
| **Consumers** | `skills/delivery/implement-feature`, `skills/delivery/execute-phase` (readers) |
| **Status**    | contract                                                                       |

## Contents

- [Why this is a contract](#why-this-is-a-contract)
- [Document shape](#document-shape)
- [Sections](#sections)
  - [Title (H1)](#title-h1)
  - [Context](#context)
  - [Execution Order](#execution-order)
  - [Phase sections](#phase-sections)
  - [Optional sections](#optional-sections)
- [What each consumer reads](#what-each-consumer-reads)
- [Conformance rules](#conformance-rules)

## Why this is a contract

`plan-feature` writes a plan; `implement-feature` parses it to schedule phase
cohorts; `execute-phase` parses a single phase section to brief a worktree
agent. Three skills, one artifact — all of them models reading markdown, not
parsers. Encoding the load-bearing structure here lets the prose in any of the
three skills evolve without silently breaking the hand-off. The contract
captures only what a consumer actually reads; everything else in a plan is
free-form author judgment. Conformance is the producing skill's
responsibility (`plan-feature`, Stage 3 self-check); the consumers are models
that read this doc.

## Document shape

```markdown
# <TICKET-KEY>: <Feature Name>

## Context

<problem being solved + ticket ref + key decisions + architecture constraints>

## Execution Order

<DAG + a plain-English readout of which phases are parallel vs sequential>

---

## Phase 1 (PR 1): <Title>

<vertical slice: files to touch, TDD note, the concrete deliverable>

## Phase 2 (PR 2): <Title>

<vertical slice>
```

## Sections

### Title (H1)

Exactly one H1 line. Convention: `# <TICKET-KEY>: <Feature Name>` (the ticket
key also drives plan-file discovery by filename). Only the count-of-one is
enforced; the text is free-form.

### Context

A `## Context` section. `execute-phase` pastes it verbatim into every worktree
agent brief, so a phase agent inherits the problem statement, ticket reference,
and key decisions. Required.

### Execution Order

A `## Execution Order` section carrying the phase DAG and a plain-English
parallel-vs-sequential readout. `implement-feature` reads this to decide which
phases dispatch together. Required whenever the plan has **two or more** phases;
a single-phase plan may omit it (nothing to sequence).

Express dependencies in prose the reader can follow, e.g. _"Phases 2 and 3 are
independent (different files) and can run in parallel after Phase 1 lands."_

### Phase sections

One `## Phase <N>` heading per phase. `N` is a non-negative integer. The
heading may carry a trailing label — `## Phase 1 (PR 1): Data layer` — but the
`Phase <N>` prefix is what both consumers match on.

- Phase numbers must be **unique**.
- Phase numbers must form a **contiguous run** with no gaps. The run may start
  at `1` (the usual `plan-feature` output) or at `0` (plans that open with a
  mechanical Phase 0, e.g. a whole-repo restructure).
- Each phase must have a **non-empty body** — the files to touch, a TDD note,
  and the concrete deliverable a reviewer can verify. An empty phase gives a
  worktree agent nothing to execute.

### Optional sections

- `## Visual Spec` — if present, `execute-phase` pastes it into the agent brief
  alongside Context. Use it for UI phases.
- `## Open Questions` — carried for the human; consumers ignore it.

Any additional prose or sections are permitted and ignored by the validator.

## What each consumer reads

| Consumer            | Reads                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| `plan-feature`      | Writes the whole document (Stage 3).                                    |
| `implement-feature` | All `## Phase N` sections + `## Execution Order` (parallelism, deps).   |
| `execute-phase`     | The requested `## Phase <N>` section + `## Context` + `## Visual Spec`. |

Progress tracking is a sibling artifact, not part of the plan file: a phase is
complete when `<plan-dir>/<plan-name>-phase-<N>-progress.md` exists with every
checkbox checked (see `implement-feature` Step 2).

## Conformance rules

A conforming plan file satisfies **all** of the following:

1. **Title** — exactly one H1 (`# …`) line.
2. **Context** — a `## Context` section is present.
3. **Execution Order** — a plan with ≥ 2 phases has an `## Execution Order`
   section.
4. **Phases** — at least one `## Phase <N>` section.
5. **Phase numbers unique** — no duplicate phase numbers.
6. **Phase numbers contiguous** — phase numbers form a contiguous run starting
   at 0 or 1 (no gaps).
7. **Phase body** — every phase section has a non-empty body.

Headings inside fenced code blocks (` ` ```) do not count as structure, so an
embedded template or a shell comment never reads as a section.

`plan-feature` owns conformance: Stage 3 writes the file, then self-checks it
against this doc before presenting. The consumers (`implement-feature`,
`execute-phase`) are models that LLM-parse the markdown — there is no
non-model parser in the chain, so this doc is the contract, no validator gates
it. (Contrast the handover doc, which a real non-LLM parser consumes and which
therefore keeps a runtime validator — see `_shared/README.md`.)
