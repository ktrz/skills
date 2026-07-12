# Research brief (template)

Fan-out brief template used by `SKILL.md` step 3 (Fan-out research). One
copy is dispatched per scoped research subagent; only the bracketed
slots change between subagents — the shape and the report contract stay
identical so the reports are comparable side by side.

```
You are researching part of a PR for a code-walkthrough document.
Repo: {repo path + branch/base}.

{one-paragraph repo context}

Your scope:
{scope: bulleted file/dir list}

Read the actual code (not just the diff). Report, as structured markdown:
1. Component inventory: each file, its responsibility, key exported symbols.
2. Key flows: {scope-specific flow questions}
3. Seam contracts: what each seam requires from its implementers, what stays above/below the seam.
4. Lifecycle guarantees: setup/teardown re-entrancy, cleanup on failure, state reporting.
5. 3-6 "reviewer should look closely here" spots with file:line references and one-line why (subtle invariant, race, edge case).
Keep it factual and grounded in code you actually read. Your final message is the deliverable — return the full markdown report.
```
