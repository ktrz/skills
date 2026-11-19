# Native runner

The default: the child runs through the current harness's subagent tool. `harnesses/<current>.md` names the tool, its model and effort params, foreground switch and nesting limit.

- **Model:** pass it if the tool takes one per call; else use an existing agent definition that pins it (never write new ones unasked); else the session model, stated in the brief so the report states it too.
- **Background:** only the root, only where the harness file allows it (claude). Below the root: dispatch and wait. Background-only tool or nesting cap → the child does the step itself.
- **Never** keep a child alive by messaging it, or fake a subagent with a print/exec CLI call; when the native tool can't do the job, use `hc.md`.
- **Results:** the child's final message is a short summary, details in the report file the brief names; open it only when the summary isn't enough. A report is lower-tier evidence: verify claims that drive a decision.
