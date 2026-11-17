# hc (herdr) notes

Verified facts about `hc` from practice. Referenced by the toolchain map; read before first use.

## Showing terminals in herdr-app

- The app shows a terminal only if it carries BOTH labels `herdr.space=<id>` and `herdr.tab=<id>`. The `where` label is output-only; setting it does nothing.
- An unknown id creates a new space or tab, named after the terminal's cwd (rename in the GUI).
- Adopting via labels enables core `keep`. `hc keep <t> --off` reverts.
- Example: `hc run --bg --label herdr.space=<id> --label herdr.tab=<id> --name <n> --cwd <dir> -- claude ...`
- Source: ~/.config/herdr-app/AGENTS.md
- Terminals an agent starts with `hc run` record it as parent and join the parent's tab automatically (the agents mod lists them). `--no-parent` loses that; such a terminal needs the herdr labels to appear.
- Never `claude -p` for orchestration children: print mode reports no status in herdr-app, so the user cannot see or attach to the child while it runs.
- Start children with `--label herdr.space=<id> --label herdr.tab=<id>`; an unknown tab id creates a new tab.

## Lifecycle

- An exited terminal's pane closes; the app shows live terminals only. Output stays readable: `hc ls --all`, `hc read <t>`.
- The user wants finished terminals kept: no `hc kill`, `hc rm`, or `--rm` unless they name the target.

## Starting children

- Start a child as interactive claude with the brief as positional prompt: `hc run --name <lowercase-name> --label herdr.space=<space> --label herdr.tab=<tab> --bg -- claude --model <tier> --effort <effort> --permission-mode auto "Read <brief-file> and do it"`.
- The prompt occasionally stays unsubmitted in the input box (status idle, no work). Confirm with `hc wait <t> --output "esc to interrupt" --timeout 45`. If it was not submitted, start a fresh child; do not type into it.
- A cwd Claude Code has never trusted shows a workspace-trust dialog that blocks the child. Start children in an already-trusted dir and use absolute paths. Never accept a trust prompt on the user's behalf.
- Terminal names: 1-32 chars of `a-z 0-9 - _ .`, starting with letter/digit, not shaped like an id (`t7`). Uppercase is rejected.

## Waiting and talking

- Wait with `hc wait <t> --timeout <s>`, never sleep. It returns when the child goes idle. Read results from the report file the brief named. Never kill or rm finished children.
- Prefer report files written by children over scraping screens.
- Auto mode judges each call in context. Observed: an unprompted `hc keys <agent> enter` into another agent's stuck terminal was refused as undermining oversight; an `hc send <agent> "<message>"` the user explicitly asked for was allowed. For a stuck child, prefer spawning a fresh one, and say the stuck one must not be submitted later. To relay a message the user asked for, `hc send` works.
- A message sent with `hc send` while the target agent is working is queued and shows in its screen as `<hc from="<sender>">...`.
