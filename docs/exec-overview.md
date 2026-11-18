# pi-controlroom — how it works, and how work continues when the laptop closes

*Executive overview · 2026-11-17 · Lance Riedel*

## The one-paragraph version

pi-controlroom turns a folder of Markdown files into a durable, multi-agent project office. One AI agent — the
**controller** — talks to the human, writes work orders (**briefs**), launches **worker** agents in their own terminal
panes, watches them, and integrates what they produce. Everything that matters is a file in the project's git repo:
the board, the briefs, the results, the decisions and lessons learned, the schedule. Agents are disposable; the files
are the memory. Because the files live in git and the workers can run on a remote VM, closing the laptop pauses the
*person*, not the *project*.

## What it is made of

| Piece | What it is | Why it matters |
|---|---|---|
| **Controller** | A `pi` coding agent in a Herdr terminal pane, given a role prompt. One per room. | The single point of contact. It never does long work itself; it delegates and integrates. |
| **Workers** | More `pi` agents, one per brief, each in its own pane (laptop or VM). | Parallel, isolated, cheap to kill and restart. |
| **Briefs → results** | `docs/briefs/NNN-slug.md` (objective, inputs, constraints, deliverable) → `docs/briefs/results/NNN-slug.md`. | Work is specified and reported in files, not chat. Anyone — human or agent — can read the whole history. |
| **Board** | `docs/briefs/STATUS.md`: who's working on what, what's landed, what's waiting on the human. | The shared source of truth across people, agents and machines. |
| **Memory** | `docs/briefs/memory/DECISIONS.md` + `LESSONS.md` — one-line, numbered, every line cites a source file. A "dream" step proposes consolidations; the controller accepts or rejects. | Institutional knowledge survives any single agent's context window. |
| **Tick** | A 60-second reconciler (launchd on macOS, a loop on Linux). Re-arms watchers, detects stuck workers, fires scheduled wakes, verifies prompts were received, republishes the status page. | The heartbeat. Nothing depends on a human noticing. |
| **Automations** | A ledger (`AUTOMATIONS.md`) of watch rows (worker finished/blocked), wakes (timed prompts to the controller — e.g. "every 2 h: integrate, land, update the board"), path watches, flush/compaction guards. | The controller schedules its own follow-ups; "A29 wakes me at 18:12" is behaviour, not a promise. |
| **Status strip & page** | A live terminal panel per room; a published HTML page (`docs/status/latest.html`, GitHub Pages / lancedocs) regenerated after every launch and land. | Humans glance; nobody polls agents. |
| **Herdr** | The terminal multiplexer that owns the panes — locally and on remote machines (`herdr --machine dev002 …`). | One client, many hosts, same commands. |

Footprint: ~1,500 lines of bash + Python (stdlib only), one 90-line pi extension, two prompt templates. No server, no
database, no new daemons. Installed in one line; a room is created by typing `/controller` in a pane.

## How a day runs

1. Human states a goal (or just says "ok"). Controller writes a brief, launches a worker, records the watch row.
2. Worker works for minutes to hours, saving partial results early, ending with a `DONE` sentinel.
3. The tick sees `DONE`, toasts, and the controller — on its next wake — reads the result, updates the board, "lands"
   the row, records any decision/lesson with its source, republishes the status page, and launches the next brief.
4. If a worker goes silent 20 minutes (`stuck?`), crashes, or needs the human (`blocked`), the strip turns red and
   the board says so. Only `blocked` ever needs a person.
5. Every ~2 h a standing wake prompts the controller to do a round even if nobody is typing.

## What happens when the laptop closes

**Short answer: hand the room to the VM first and nothing stops.** One command (or one sentence to the laptop controller) —
`controlroom mode remote dev002` / *"controller mode: remote"* — commits the board, marks `MODE: remote`, and stops local launching; the VM's controller
pulls and becomes primary: it runs the rounds, launches and lands briefs, keeps the status page current, and queues
anything that needs your identity under *Pending publish (local)*. In the morning, `controlroom mode local` hands it
back with a written `HANDOFF` block. You can see who is primary at a glance: the Herdr workspace label ends in `★`, the
controller tab reads `★ CONTROLLER` (standby rooms: `CONTROLLER · standby`), and the strip's ROOMS line shows `‹PRIMARY›`. Below is why that works — there are two kinds of state.

**State that is already safe (any room, any host):** the board, briefs, results, memory, automations ledger — all
files, all in git. A controller or worker killed mid-sentence loses only its chat; a fresh agent re-reads the files
("Boot") and continues. This has been exercised repeatedly: controller sessions have been restarted, compacted, and
handed off between models by writing a `handoff.md` and starting fresh. Nothing in the project depends on an agent's
memory of the conversation.

**Work that keeps running (only if it isn't on the laptop):** a `pi` worker on the laptop stops when the lid closes
(the process sleeps; API calls in flight time out). So long jobs run on a **remote VM** (`dev002`, `c4d`) that has its
own Herdr server, its own clone of the repo, and its own `tick --loop`. The laptop just talks to it over SSH. The split
used on graph-search and taste-id-research:

| | Laptop room (`local`) | VM room (`dev002` / `c4d`) |
|---|---|---|
| Controller | `<project>-controller` — **primary**; owns the board's `MODE:` line | `<project>-remote` — secondary; pulls before every round |
| Runs | anything needing the human's identity: browser/SSO tools, publishing, Drive, chat | long jobs, pipelines (as the VM's service account), files-only research, evals |
| Survives lid-close? | No — it pauses | **Yes** — workers, tick, strip, and the remote controller keep going |
| Hand-off | **git**: results and board commits flow both ways; `host:` in each brief header says who owns it | same |

What this means in practice: close the laptop at 6 pm with three VM workers running; at 8 am the VM room has landed
their results, updated the board, committed and pushed; the laptop room pulls, the strip shows what's new, and the
status page is already current. The only things waiting are the ones that genuinely needed you.

**Known limits, stated plainly**
- The laptop controller itself does not run while closed; the remote controller or the morning Boot covers it. A fully
  hosted controller (e.g. on pi.shopify.io's durable sessions) is the next step once that service exposes an API.
- A wake scheduled while the laptop sleeps fires late, not never; the tick verifies the controller actually processed
  it and re-prompts on connection errors.
- Agents' context windows fill; the extension flushes decisions to memory at 75 % and compacts. If compaction cannot
  shrink a session (seen once at 167 %), the fix is a fresh session booted from files — which is the design working,
  not failing.
- Remote hosts need the same relative repo path as the laptop and a `~/.local/bin` on PATH for non-login shells;
  `docs/remote-host.md` is the checklist.

## Why this shape

- **Files first.** Chat is ephemeral and private to one agent; files are durable, shared, diffable, and reviewable by
  people.
- **Human closes the loop by default.** Automations toast and log; only wakes prompt the controller; only `blocked`
  interrupts a person. The room moves without you but never commits you to something you didn't choose.
- **Verifiable, not vibes.** Every memory line cites a source. Every durability claim was tested (ten scenarios, a
  code review, fixes, re-tests) before 0.2.0 shipped; failures found in use are recorded as lessons and fixed in the
  tool, so every room inherits the fix within a minute.
- **Cheap to run, cheap to leave.** No infrastructure to maintain; a room is a folder. Delete the panes and the project
  is still all there.

## Numbers so far (Nov 2026)

Seven rooms (pi-controlroom, lookbook-research, personalized-search-demo, graph-search, kumo-research, upi-clustering-
research, taste-id-research) across a laptop and two VMs; graph-search alone: ~40 briefs, 37 worker sessions, three
hosts, ~\$1,050 of model spend, from feasibility map to a working engine-native operator with a judged eval in ten days.
pi-controlroom itself: 16 briefs, verified 0.2.x, 30 decisions / 30 lessons in memory.

## Where to look

- Repo: `github.com/lanceriedel/pi-controlroom` — README (install, vocabulary, gotchas), `docs/design/durable-controlroom.md`,
  `docs/two-controller-protocol.md`, `docs/remote-host.md`.
- A room: `docs/briefs/STATUS.md` (the board), `docs/status/latest.html` (the page), `docs/briefs/memory/` (what it has learned).
- Comparison to the internal "ULTIMATE" harness: `docs/briefs/results/013-tobi-comparison.md`.
