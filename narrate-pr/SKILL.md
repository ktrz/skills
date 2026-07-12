---
name: narrate-pr
version: 0.1.0
description: >
  Narrate a pull request as a multi-level HTML walkthrough — thesis,
  architecture diagrams, components, review order, and attention spots —
  published as a Claude artifact. Triggers on "narrate PR", "narrate this
  PR", "walk me through this PR", "PR walkthrough", "walkthrough for PR
  [N]", or "/narrate-pr [PR]". Scouts the PR, fans out scoped research
  subagents, verifies component edges, synthesizes a doc-as-data
  walkthrough.json with stable node ids and file:line receipts, renders it
  to a self-contained HTML page with a deterministic zero-dependency
  renderer, persists everything under the target repo's
  plans.local/<repo>/pr-<N>/walkthrough/, and publishes the rendered page
  as a Claude artifact.
---

# Narrate PR

Turns a pull request into a self-contained, multi-level HTML walkthrough:
the PR's thesis, its architecture (diagrams, seams, boundaries), the
components involved, a dependency-ordered review path, and a bounded set
of file:line "look closely here" attention spots. The walkthrough is
built as structured data first (`walkthrough.json`, stable node ids,
every claim carrying a receipt) and rendered second, so later work can
mutate and re-render it instead of hand-editing HTML. Everything the flow
produces — research reports, the JSON, the rendered HTML — is persisted
into the target repo's `plans.local/` tree, and the rendered page is
published as a Claude artifact for the user to read and share.

<!--
P0 SCAFFOLD ONLY. This body is a skeleton — headings and one-line
placeholders — so the skill directory has a valid, loadable SKILL.md.
The full step-by-step body (preflight checks, scout commands, fan-out
brief wiring, edge-verification wiring, synthesis rules, validation and
render invocation, publish mechanics, report format) is written in P3.
Do not treat any placeholder line below as authoritative behavior.
-->

## 1. Preflight

Placeholder: resolve the target PR, repo root, and branch/base; confirm required tools (`gh`, `node`) are available before doing any work.

## 2. Scout

Placeholder: pull just enough PR metadata (title, body, diff stat, changed file list) to brief the fan-out agents cheaply.

## 3. Fan-out research

Placeholder: dispatch parallel scoped research subagents, one per subsystem/scope, using the brief template in `references/research-brief.md`.

## 4. Edge verification

Placeholder: dispatch a verification subagent (or agents) to confirm exact import/interaction edges between components, using the brief template in `references/edge-verification-brief.md`.

## 5. Synthesize walkthrough.json

Placeholder: merge research and edge-verification reports into a single doc-as-data `walkthrough.json` — stable node ids, receipts on every claim, the five-level structure (thesis, architecture, components, review order, attention spots).

## 6. Validate + render

Placeholder: validate `walkthrough.json` against its schema, then render it to a self-contained HTML page with the deterministic zero-dependency renderer.

## 7. Publish

Placeholder: persist all artifacts under `plans.local/<repo>/pr-<N>/walkthrough/` in the target repo, and publish the rendered HTML as a Claude artifact.

## 8. Report

Placeholder: summarize what was produced and where, with links to the persisted files and the published artifact.
