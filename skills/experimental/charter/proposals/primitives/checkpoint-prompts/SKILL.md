---
name: checkpoint-prompts
version: 0.1.0
disable-model-invocation: true
description: The checkpoint recommendation and the two paste-ready prompts, compact and handoff, shown to the user at a session checkpoint.
---

# Primitive: checkpoint prompts

**Primitive.** The checkpoint recommendation and the two paste-ready prompts, compact and handoff, shown to the user at a session checkpoint.

**Consumer.** Human: the user, who pastes one prompt into a command. No parser, so no validator.

**Artifact.** The recommendation line, then the compact prompt, then the handoff prompt. Literal outside `<slots>`. The behaviour around it (when to recommend which, stopping for the user's choice, writing the handoff file only on confirmation) is in goal `compact-or-handoff`. Source: skills/workflow/checkpoint/SKILL.md:17-31

````markdown
**<compact | handoff>** — <single-line reason>

compact<marker>

```
/compact <goal, current state (done and verified), immediate next steps>
```

handoff<marker>

```
/handoff <focus>
```
````

**Slots.**

| Slot                  | Filled with                                                           | Required |
| --------------------- | --------------------------------------------------------------------- | -------- |
| compact prompt body   | goal, current state (done and verified), immediate next steps         | yes      |
| `<focus>`             | what the next session is for                                          | yes      |
| artifact references   | paths or URLs of files, PRs, plans, tickets; never their contents     | as needed |
| recommendation line, `<marker>` | the pick and its reason; `<marker>` is ` ← recommended` on the pick, empty on the other | yes, unless an argument named one path; then only that prompt is shown |

**Check.** Show the output: with both prompts, the recommended one carries `← recommended`; the compact prompt is one code block starting `/compact ` with nothing else in it, the handoff prompt is the `/handoff <focus>` line. Artifacts appear as references only.

**Version.** 0.1.0. Changing a literal (`← recommended`, `/compact `, `/handoff <focus>`) is a major bump. Producer: goal `compact-or-handoff`.
