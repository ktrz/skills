# Changelog

## 1.1.0

- Investigate each comment before asking — read the relevant code, understand the reviewer's intent, and present concrete options with specific descriptions of what the fix would look like
- Defer all GitHub replies and thread resolution to the end of the session — show a summary, let the user confirm, then post everything in one batch
- Track progress with a running summary line after each comment

## 1.0.0

- Initial version
- Auto-detect PR from current branch or accept PR number as argument
- Fetch unresolved threads via GitHub GraphQL API
- Present comments one at a time, ask user for direction
- Implement fixes, auto-commit, reply, and resolve threads
