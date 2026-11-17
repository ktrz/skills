# Changelog

## 0.2.0

- Subagents treat `BRIEF.md`, `READINGS.md` and any plan file the run writes as read-only. A subagent that disagrees records a decision, implements its call only where the brief permits it, and flags it in its report. Only the root session amends a plan, with a marked note, for changes the user approved or the report lists, and updates every place in the run's files, other than `BRIEF.md`, that states or summarizes the amended rule. `BRIEF.md` is never amended, and a departure from it is named in `REPORT.md`.

## 0.1.0

- Initial release — short intake with proposed answers and one go, then an unattended run judged by readings: 2–3 readings of the task, a thin prototype and an observed return test per reading, and a report whose first line gives each reading's result.
