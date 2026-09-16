# pi-controlroom

A control room for [pi](https://pi.dev) + [Herdr](https://herdr.dev).

One pi becomes the **controller**: it talks to you, writes work packets (**briefs**), launches **worker** pis in their own Herdr tabs, watches them, and integrates what they produce. Workers never talk to each other or to the controller — they communicate through **files in the repo**, so nothing is lost when a session drops, and you can always see where everything stands on a **live status strip**.

It was built while running ~15 agents over a week on a data project. Everything in here is a convention plus ~400 lines of shell and Python — Herdr and pi supply the primitives (panes, agent states, a CLI); this package supplies the operating model.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ CONTROLLER tab                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ controller pi  ← you talk here; it briefs, launches, integrates    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ status strip   ← agents · pipelines · events · decisions waiting   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│ worker: baselines │ worker: critic │ pipeline: extract │ worker: …       │  ← one tab each
└──────────────────────────────────────────────────────────────────────────┘

        docs/briefs/NNN-slug.md  ──▶  worker  ──▶  docs/briefs/results/NNN-slug.md
                                                    ▲
        docs/briefs/STATUS.md (the board)  ◀── controller integrates ──┘
```

---

## Install

```bash
pi install git:github.com/lanceriedel/pi-controlroom
mkdir -p ~/.local/bin && cp ~/.pi/agent/git/github.com/lanceriedel/pi-controlroom/bin/* ~/.local/bin/
```

Then, in **any pi running inside a Herdr pane**:

```
/reload
/controller <one-line objective for this project>
```

That pi runs `controlroom init`, becomes the controller, and follows the rules below. Requirements: Herdr ≥ 0.8, pi ≥ 0.85, bash, python3 (stdlib only). macOS tested; Linux should work minus `caffeinate`.

Optional Herdr config (`~/.config/herdr/config.toml`) — in-window toasts and a hotkey for the status strip's detail view:

```toml
[ui.toast]
delivery = "herdr"

[[keys.command]]
key = "prefix+d"          # Ctrl+B then D
type = "shell"
command = "controlroom detail"
```

---

## The vocabulary

### Controller
The one pi you talk to. It **does not do long work itself** — anything over ~5 minutes, or anything that produces a file, becomes a brief and goes to a worker. Its job is deciding, briefing, launching, watching, and integrating. It keeps the board current and ends every check-in with a one-line reminder of where it is and how to use the agents.

### Worker
A fresh pi in its own Herdr tab, started with one brief. It has **no memory of your conversation** — the brief is everything it knows, plus whatever it reads in the repo. It writes its result file, prints a sentinel line (`DONE <name>`), and goes idle. Idle workers stay **warm**: their context is intact, so the controller can hand them a follow-up (`herdr agent prompt <name> "…"`) instead of starting cold.

### Brief
A work packet: one Markdown file, `docs/briefs/NNN-slug.md` (zero-padded, chronological). Always five parts:

| Part | What goes in it |
|---|---|
| **Objective** | one paragraph: what and why |
| **Inputs** | file paths, tables, URLs the worker should read first |
| **Constraints** | read-only? cost caps? no pushes? label uncertain claims? |
| **Deliverable** | exactly what to produce |
| **Where to write** | `docs/briefs/results/NNN-slug.md` — and the sentinel `DONE NNN` |

`docs/briefs/README.md` lists every brief with a one-line purpose and what external resources it needs.

### Result
The worker's answer: `docs/briefs/results/<same-name>.md`. Workers are told to save partial results early and append — so if a worker dies (network, laptop sleep, timeout) the work so far is on disk.

### Board — `docs/briefs/STATUS.md`
The durable, written view of the whole project:

- **Workers table** — pane · agent · brief · state · result file (with a one-line summary once integrated)
- **Decisions waiting on you** — the short list only the human can move; struck through when decided
- **Cheat-sheet** — the four `herdr agent …` commands

A fresh session (or a colleague) reads this file and can take over the control room.

### Pipeline
A **long, deterministic, non-LLM job**: a shell script that runs SQL / tests / loads in order and writes a log. No agent judgement once it starts. Agents *design and write* pipelines; pipelines do the heavy lifting; agents read the results. Rules:

- runs in its own Herdr tab (survives your session) and on macOS under `caffeinate -i` (survives laptop sleep — we lost a step to this once)
- logs to `logs/<name>.log` with marker lines the board can read: `[time] START <step>` … `[time] END <step> rc=<n>`
- per-query / scratch output goes to `logs/scratch/` so it doesn't clutter the board

### Event
A line in `logs/agents.log` written by a **watcher** when something happens: a worker finished, a worker is *blocked* (asking a question), a pipeline ended. Watchers are armed automatically by `controlroom launch`; a toast fires too (if enabled) but the log is the reliable record.

---

## The status strip

`controlroom init` splits a small pane under the controller and runs `controlroom statusbar` in it — a purpose-built pager that refreshes every 15 s **but pauses while you're reading** (any scroll resets a 15 s idle timer) and **keeps your scroll position** across refreshes.

```
 CONTROL ROOM  Tue 10:42  my-project   (say "ok" in CONTROLLER to integrate · blocked = needs you)
 AGENTS  (detail on — Ctrl+B D to toggle)
   working  controller         w9:p1
   working  concepts           w9:pV   013 — collections → concepts (L4), shared-concept edges …
            → $ python3 scripts/concepts/validate.py --window 365d
   done     baselines          w9:p9   C3 — fashion v2 baselines
   idle     plan-critic        w9:pA   D-plan-critique
   blocked  ui-integration     w9:pH   H2 — demo UI branch                     ← needs you
 PIPELINES  (last 10 by time · running=yellow · no-marker=no START/END lines in the log)
   running   scenes                 1.9h ago  START 014_communities 2026-09-16T14:18:40Z
   done      platform_edges         2.8h ago  [07:23:29] RESULTS written docs/briefs/results/012-…
   FAILED    curation_edges         1.4d ago  QUERY FAILED
 EVENTS (logs/agents.log)
   [09-16 07:23] worker platform-edges: done — results in docs/briefs/results/ — say ok in CONTROLLER
   [09-16 07:29] worker edge-service: done — results in docs/briefs/results/ — say ok in CONTROLLER
 WAITING ON YOU
   4. Label policy for the internal demo: show names for entities above the k-floor, or keep hashed?
 BRIEFS   010-load-curation-layer 011-purchase-mode-no-crawl 012-platform-wide-edges 013-… 014-…
```

**AGENTS** — every agent in this Herdr workspace with its state:

| colour | state | meaning |
|---|---|---|
| yellow | `working` | busy |
| green | `idle` / `done` | finished or waiting for input — results are probably on disk |
| **red** | `blocked` | asking a question or waiting on approval — **the only state that needs a human** |
| grey | `unknown` | Herdr can't classify it |

With **detail on** (`d` in the strip, or `Ctrl+B D`), each agent also shows its **task** (from the board) and, for working agents, a cyan `→` line with **what it is doing this second** (its last tool command).

**PIPELINES** — the last 10 `logs/*.log` by modification time, freshest first, each with a status derived from its marker lines: `running` (last marker is START and the file changed in the last 3 h), `done` (END / DONE / `rc=0`), `FAILED` (`rc≠0`, FAIL, Traceback), `stale?` (START but quiet for 3 h — probably died), `no-marker` (a log with no START/END lines, so status is unknown).

**EVENTS** — the last five watcher events. **WAITING ON YOU** — open items from the board's decisions list (set `CONTROLROOM_HUMAN=<name>` to personalise the heading). **BRIEFS** — everything in `docs/briefs/`.

Keys inside the strip: wheel / arrows / `j` `k` / PgUp PgDn / space · `g` top · `G` bottom · `r` refresh now · `d` toggle detail · `q` quit (`controlroom statusbar` brings it back).

---

## The `controlroom` CLI

| command | does |
|---|---|
| `controlroom init [--rows N]` | rename this agent → `controller`, tab → `CONTROLLER`, split the status strip below, scaffold `docs/briefs/{README,STATUS}.md` + `results/` |
| `controlroom launch <name> <brief.md> ["tab label"]` | new tab → start pi → prompt it with the brief → watcher armed |
| `controlroom watch <agent>…` | log + toast when agents finish or block (90 s grace after launch) |
| `controlroom watch-log <logfile> <label>` | log + toast when a pipeline log shows END / DONE / `rc=` |
| `controlroom status` | one-shot text of the board (what the strip shows) |
| `controlroom statusbar` | the live strip (pager) |
| `controlroom detail` / `detail-on` / `detail-off` | toggle the detail view (flag in `~/.config/controlroom/`) |
| `controlroom retire <agent> [reason]` | close a worker's tab; its pi session stays on disk and the board records `pi --resume <session>` |
| `controlroom gc [--hours 24] [--apply] [--keep a,b]` | list (dry run) or retire workers idle longer than N hours; never touches the controller or working/blocked agents |

Useful Herdr commands from any pane: `herdr agent list` · `herdr agent read <name> --source recent-unwrapped --lines 60` (peek) · `herdr agent prompt <name> "…"` (redirect a warm worker) · `herdr agent focus <name>` (jump to its tab) · `Ctrl+B Z` zoom/unzoom a pane.

---

## Operating rules (the part that makes it work)

1. **The controller never does >5-minute work.** Brief it, launch it.
2. **Files are the protocol.** Brief in, result out, board updated. Chat is ephemeral.
3. **Decisions are serial, execution is parallel.** One question to the human at a time; as many workers as the shared resources allow.
4. **State shared resources in the brief** (API budgets, database scan caps, "dry-run first", "never push"). Two workers writing the same table or the same branch will collide — give them separate outputs or worktrees.
5. **Reuse warm workers** for follow-ups; start cold only for new areas.
6. **Pipelines log markers and run under `caffeinate`.** No marker, no status.
7. **Only `blocked` needs you.** Everything else the controller integrates when you say "ok".
8. **Retire idle workers after ~24 h** (`controlroom gc --apply`). Idle pis cost no tokens but do cost memory and attention; a retired worker's session is resumable, so nothing is lost.
9. **The human still closes the loop.** Pi cannot start a turn on its own; the strip and the toasts get *your* attention, then you poke the controller.

## Gotchas we hit (so you don't)

- Hidden pi subagents are killed after ~3 minutes without output — use Herdr panes for read-heavy tasks.
- `herdr pane split --ratio` applies to the *original* pane (0.14 gave the new pane 86 %). Fix with `herdr pane resize`.
- `herdr agent list` puts the agent's name in `name`, not `agent_name`.
- Piping JSON into `python3 - <<'EOF'` loses stdin to the heredoc — pass data via an environment variable.
- A prompt-template frontmatter value containing `: ` breaks YAML parsing and pi **silently skips** the template. Quote it. `/reload` picks up new templates in a running pi.
- Herdr toasts default to *off* (`[ui.toast] delivery`), and even when on they're transient. The strip and `logs/agents.log` are the reliable signals.
- Laptop sleep kills long jobs and the API calls of workers mid-write. `caffeinate -i` for pipelines; tell workers to save partial results early.

## Layout

```
prompts/controller.md        the /controller template (frontmatter + operating rules)
skills/controlroom/SKILL.md  the protocol as a skill, so a fresh agent operates it correctly
skills/controlroom/bin -> ../../bin
bin/controlroom              the CLI (bash)
bin/controlroom-pager        the status strip (python3, curses)
```

MIT © Lance Riedel
