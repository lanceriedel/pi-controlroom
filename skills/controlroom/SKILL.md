---
name: controlroom
description: Set up and operate a pi + Herdr control room (controller pi, worker pis, briefs/results files, live status strip, watchers). Use when the user says control room, controller, /controller, launch a worker, brief, status board, or asks to parallelize agent work in Herdr.
---

# controlroom

Requires: Herdr (`HERDR_ENV=1` inside a Herdr pane), pi, python3, bash. macOS or Linux.

## Install the CLI once per machine
The scripts live in this skill's `bin/`. Put them on PATH (idempotent):

```bash
mkdir -p ~/.local/bin && cp "$(dirname "$SKILL_PATH")/bin/controlroom" "$(dirname "$SKILL_PATH")/bin/controlroom-pager" ~/.local/bin/ && chmod +x ~/.local/bin/controlroom ~/.local/bin/controlroom-pager
```
(If `$SKILL_PATH` is not set, resolve `bin/` relative to this SKILL.md.) Verify with `controlroom` (prints usage).

Optional Herdr config (`~/.config/herdr/config.toml`): `[ui.toast] delivery = "herdr"`, and a key for the detail toggle:
```toml
[[keys.command]]
key = "prefix+d"
type = "shell"
command = "controlroom detail"
```

## Commands
| command | does |
|---|---|
| `controlroom init [--rows N]` | rename this agent → `controller`, tab → `CONTROLLER`, add live status strip pane below, scaffold `docs/briefs/{README,STATUS}.md` + `results/` |
| `controlroom launch <name> <brief.md> ["tab label"]` | new tab → start pi → prompt it with the brief → watcher armed |
| `controlroom watch <agent…>` / `watch-log <log> <label>` | log to `logs/agents.log` + toast when agents finish/block or pipelines end |
| `controlroom status` / `statusbar` / `detail` | one-shot board / the pager strip (scroll-safe, refreshes after 15 s idle) / toggle detail |

## Protocol (the part that matters)
- **Controller never does >5-minute work.** It writes a brief (`docs/briefs/NNN-slug.md`: objective · inputs with paths · constraints · deliverable · where to write) and launches a worker.
- **Files are the protocol**: brief in, `docs/briefs/results/<same>.md` out. Chat is ephemeral; a fresh session can pick up from the files.
- **Board**: `docs/briefs/STATUS.md` — workers table, decisions waiting on the human. Update on every launch/integration.
- **Pipelines** (long deterministic jobs): own Herdr tab, `logs/<name>.log` with `START` / `END … rc=<n>` markers, wrapped in `caffeinate -i` on macOS; scratch logs in `logs/scratch/`.
- Decisions serial (one question to the human), execution parallel. Reuse warm idle workers via `herdr agent prompt <name>`. Only **blocked** needs a human.
- Hidden pi subagents die after ~3 min without output — use Herdr panes for read-heavy tasks.
- End each check-in with a one-line reminder of where the controller is and how to use agents.

## Gotchas learned
`herdr pane split --ratio` applies to the original pane · `herdr agent list` names are in `name` · piping JSON into `python3 - <<EOF` loses stdin (use an env var) · prompt-template frontmatter values containing `: ` must be quoted or pi skips the template silently · `/reload` picks up new templates in a running pi.
