---
name: daily-plan-messages
version: 0.1.0
disable-model-invocation: true
description: "The fixed texts the daily-plan goals show the user: stops, warnings, prompts and one-line reports."
---

# Primitive: daily-plan messages

**Primitive.** The fixed texts the daily-plan goals show the user: stops, warnings, prompts and one-line reports.

**Consumer.** Human: the user reading the conversation. No parser.

**Artifact.** See `artifact.md` beside this file: a catalog keyed by when each text is shown. Source: skills/workflow/plan-my-day/SKILL.md:105-110, 232-233, 697-713; skills/workflow/plan-my-day/references/standup.md:43-44, 52-54, 160-161; skills/workflow/plan-my-day/references/close-day.md:48-50, 68-70, 75-76, 162-168, 204-205; skills/workflow/plan-my-day/references/monthly-review.md:72-74, 159-160, 211; skills/workflow/plan-my-day-setup/SKILL.md:56-60, 67, 126-131, 136-148, 167-174, 189-190, 223, 232-233

**Slots.** `<...>` inside an entry: the value named there (date, issue number, repo, count, tracker type, URL). The command slots (`<plan command>`, `<standup command>`, `<close command>`, `<setup command>`) and `<config example path>` are filled from the old→new table at the top of `artifact.md`. Everything else is literal.

**Check.** Each text shown is compared with its catalog entry: literals identical, every slot filled, nothing prepended or appended. Report the entry id and the shown text.

**Version.** 0.1.0. Changing a literal is a major bump; adding an entry is minor. Producers: goals `daily-plan`, `standup-snapshot`, `day-closed`, `daily-plan-configured`. Two entries (`setup.existing`, `setup.prefix`) are quoted prompts in the source, copied without the quote marks.
