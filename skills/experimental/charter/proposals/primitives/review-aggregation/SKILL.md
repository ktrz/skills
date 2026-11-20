---
name: review-aggregation
version: 0.1.0
disable-model-invocation: true
description: The protocol that turns raw review-child output into the final finding list — normalise, dedup, overlap handling, threshold, overlap-skim, ordering.
---

# Primitive: review aggregation

**Primitive.** The protocol that turns raw review-child output into the final finding list — normalise, dedup, overlap handling, threshold, overlap-skim, ordering.

**Consumer.** LLM: the agent that aggregates; the stable ordering makes a re-run on an unchanged PR byte-identical.

**Artifact.** See `artifact.md` beside this file: exact-duplicate dedup (normalisation and hash), `finding_overlap: group | merge`, severity-threshold filter, overlap-skim procedure and its log line, output ordering, then the Step 7 normalise and Step 8 aggregate lists. It is a protocol, not a recipe for tools: only the outcomes are binding.

Source: skills/review/review-pr/references/aggregation.md:47-179; skills/review/review-pr/SKILL.md:298-328

**Slots.** `severity_threshold` (default `suggestion`), `finding_overlap` (default `group`), the cap of 50 merge collisions, the log line `overlap-skim: dropped <severity> on <file>:<line> (@<login> already flagged)`.

**Check.** Show counts before and after each stage, every dropped finding with its reason (nothing is dropped silently), and that the output order is severity desc, then `(file, line)` asc, then `reported_by[0]` asc. Overlap-skim runs only where posting happens, never on the file write.

**Version.** 0.1.0. Changing an ordering key, the hash normalisation or a stage order is a major bump. Producers: `pr-reviewed`. Consumers: `review-handover` writers, posting step.
