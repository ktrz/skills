# hc (herdr) notes

Verified facts about `hc` from practice. Referenced by the toolchain map; read before first use.

## Showing terminals in herdr-app

- The app shows a terminal only if it carries BOTH labels `herdr.space=<id>` and `herdr.tab=<id>`. The `where` label is output-only; setting it does nothing.
- An unknown id creates a new space or tab, named after the terminal's cwd (rename in the GUI).
- Adopting via labels enables core `keep`. `hc keep <t> --off` reverts.
- Example: `hc run --bg --label herdr.space=<id> --label herdr.tab=<id> --name <n> --cwd <dir> -- claude ...`
- Source: `~/.config/herdr-app/AGENTS.md`.
- Terminals an agent starts with `hc run` record it as parent and join the parent's tab automatically (the agents mod lists them). `--no-parent` loses that; such a terminal needs the herdr labels to appear.

## Lifecycle

- An exited terminal's pane closes; the app shows live terminals only. `claude -p` children vanish from the app when done. Output stays readable: `hc ls --all`, `hc read <t>`.
- To keep a finished child visible: `zsh -ic 'claude -p ... "<brief>"; exec zsh'`.
- The user wants finished terminals kept: no `hc kill`, `hc rm`, or `--rm` unless they name the target.

## Starting children

- Interactive `claude "<prompt>"` launched via hc occasionally leaves the prompt unsubmitted in the input box (status idle, no work). Confirm start with `hc wait <t> --output "esc to interrupt" --timeout 45`. `claude -p` avoids it.
- A cwd Claude Code has never trusted shows a workspace-trust dialog that blocks the child. Start children in an already-trusted dir and use absolute paths. Never accept a trust prompt on the user's behalf.
- Terminal names: 1-32 chars of `a-z 0-9 - _ .`, starting with letter/digit, not shaped like an id (`t7`). Uppercase is rejected.

## Waiting and talking

- Wait with `hc wait <t> --timeout <s>`, never sleep. On an interactive child it returns when the child goes idle; on a `-p` child, when it exits.
- Prefer report files written by children over scraping screens.
- Typing into another agent's terminal (`hc keys`/`hc send`) may be refused by Claude Code auto mode as undermining oversight. Spawn a fresh child instead of poking a stuck one, and say the stuck one must not be submitted later.
