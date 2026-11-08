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

**0. Herdr** (the terminal agent multiplexer the control room lives in) — skip if `herdr --version` ≥ 0.9:

```bash
brew install herdr                       # macOS / Linux with Homebrew
# or: curl -fsSL https://releases.herdr.dev/app/install.sh | sh
herdr integration install pi && herdr integration status      # pi must show as integrated, or agents read as `unknown`
```

**1. The package + CLI** (pi ≥ 1.4):

```bash
pi install git:github.com/lanceriedel/pi-controlroom
P=~/.pi/agent/git/github.com/lanceriedel/pi-controlroom
mkdir -p ~/.local/bin && ln -sf "$P/bin/controlroom" "$P/bin/controlroom-pager" "$P/bin/controlroom-md2html" "$P/bin/controlroom-pages" ~/.local/bin/
case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc; echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc;; esac
controlroom 2>&1 | head -3     # prints usage → installed
```

Symlinks (not copies) so `pi update` updates the CLI too. Herdr panes are non-login shells, hence the `~/.bashrc`/`~/.zshrc` PATH line.

**2. First use** — in **any pi running inside a Herdr pane** (`herdr` → create a workspace with your project as cwd → `pi` in that pane):

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
A line in `logs/agents.log` written when something happens: a worker finished, a worker is *blocked* (asking a question), a worker looks **stuck**, a pipeline ended. `controlroom launch` arms a **watch row** (see Automation) that the tick checks every minute; a toast fires too (if enabled) but the log is the reliable record.

### Automation: watch · wake · watch-path · play
 A row in `docs/briefs/AUTOMATIONS.md` (`A###`), the ledger `controlroom tick` reads and rewrites every minute. `watch <agent>` rows are what used to be `nohup` watcher loops: the tick runs `verify`, toasts/logs when the worker is `done` / `crashed` / `stalled` / `blocked`, and marks the row `fired`. Because the state is a file, **watchers survive Herdr/laptop restarts**: a tick after a restart re-arms a row for every worker the board says is `working`. **`wake`** rows fire at a time (`controlroom wake 15m|18:12|"daily 06:00" "…"`) — the controller schedules its own future rounds with them; **`watch-path`** rows fire when a newer file (≥ 120 s old) appears under a glob; `play` rows end a pause. **Automations prompt the controller only when a row says so** (`prompt controller? = yes`): `wake` rows do by default, `watch`/`watch-path` rows don't (`--prompt` opts in; on `watch` rows it is deferred and toasts). The prompt is literal — `[A002 · wake · fired 1/once · 18:12] <instruction>` plus a rules line — and goes to the controller **by pane id** (`logs/.controller`, written by `init`). Guards: ≤ 6 prompts/hour (excess waits, `automation backlog` toast), a `blocked` controller is retried each tick (one toast after 30 min), `CONTROLROOM_AUTOPROMPT=0` in the tick's env makes everything toast-only, and while paused due rows go `held` and fire on `play` collapsed into one `[play] N automations fired while paused: …` prompt. `controlroom automations [--all]` prints the table and `next: A### in 25m`; `cancel A###` removes a row. The tick is run by **launchd** (`io.controlroom.tick.<hash>`, installed by `init`/`tick-install`; herdr's CLI works from launchd with just `HOME` + `PATH` — verified) and on Linux by `controlroom tick --loop` beside the strip.

### Pause
 `controlroom pause [--resume-after 2h] [reason]` writes `logs/PAUSED`. While it exists nothing new launches (`launch` exits 3 unless `--force`), in-flight workers **drain** untouched, watch rows still toast, and the strip header shows `PAUSED since … · N draining · play at …` in yellow. `controlroom play` (or the tick, when `--resume-after` passes) removes it.

### Health (`stuck?` · `spinning?`)
 `controlroom health [--json] [<agent>…]` reads each agent's pi session jsonl: **last write** (newest `write`/`edit`/`bash` tool call, or a results/log file carrying the worker's name), `$` / tokens / turns, `ctx %`. The tick runs it every minute for working agents: **`stuck?`** (red) = `working` ∧ no write > 20 min ∧ session file quiet ≥ 10 min ∧ pane tail unchanged since the last tick → one `request` toast per hour. This is the alarm the 26-hour spinning worker needed. **`spinning?`** (yellow) = working, session growing, but nothing written for > 30 min. `$` shows only in the strip's detail view (`COST` line). Thresholds: `CONTROLROOM_STUCK_MIN` / `SPIN_MIN` / `IDLE_MIN`.

### Memory (decision · lesson · landed)
`docs/briefs/memory/DECISIONS.md` + `LESSONS.md`: two append-only, bounded files that a fresh or resumed controller **boots from** (`controlroom memory`) and that every new brief's Constraints section quotes. Every line is `- D007 2026-10-27 **slug** — one-liner ← source` — **no source, no line**; the CLI refuses otherwise.

- **Decision** `D###` — something chosen, with date and source (`controlroom decide "…" --from <file[#anchor|:"phrase"]>`). Superseded (`controlroom supersede D002 D005` strikes it and copies it to `memory/archive/`), never deleted.
- **Lesson** `L###` — something that bit us and the rule we adopted (`controlroom lesson …`). `controlroom init` seeds LESSONS from the gotchas below (`--no-seed` to skip).
- **Landed** — the `## Landed` table in `STATUS.md`: `controlroom land` moves `done` workers there (date · brief · worker · result) and clears struck-through decisions from the board.
- **Dream** — propose-only consolidation, **on demand**. `controlroom dream` renders `prompts/dream.md` into `memory/.dream-brief.md` and launches a `dreamer-N` worker that reads *files only* (memory, board, results, logs) and appends `P###` candidates to `memory/proposed.md` plus a report in `memory/dreams/<stamp>.md`. `controlroom dream --check` (no LLM) verifies every `← source` resolves, the count matches, nothing guarded moved. Then the human/controller **promotes** (`controlroom promote P012` → a real `D`/`L` line via `decide`/`lesson`, chosen by the `[D]`/`[L]` tag) or **rejects** (`controlroom reject P012 why`). Nothing is auto-promoted; nothing is scheduled until three reports have been read and judged useful.

Budget: 40 active decisions / 30 lessons; `memory` and the strip's `MEMORY` line say `⚠ over budget` beyond that. The design behind it: `docs/design/durable-controlroom.md` §1.

### Durability: memory · tick · automations · dream · compaction flush
Five pieces that let the control room survive sleep, Herdr restarts and context compaction — all file-based, designed in [`docs/design/durable-controlroom.md`](docs/design/durable-controlroom.md): **memory** (above), the **tick** (launchd, every 60 s), **automations** (rows the tick fires), **dream** (propose-only), and the **compaction flush** — the only pi extension in this package (`extensions/controlroom.ts`, loaded via `package.json` `pi.extensions`; `/reload` picks it up in a running pi). In the controller's pane only (`HERDR_ENV=1`, `docs/briefs/memory/` present, `HERDR_PANE_ID` = `logs/.controller`): when context crosses **75 %** it queues one follow-up — *“[controlroom · flush] … record every decision/lesson not yet in memory, update STATUS.md, note your next wake. Then reply `/compact`”* — and when the controller answers with a `/compact` line it runs pi's **default** compaction (the summary is never replaced, nothing is injected into the system prompt). Every compaction is logged (`logs/agents.log`, `logs/.compactions`), **`/flush`** asks for the same flush on demand, and the extension writes `logs/.ext-alive` so the tick knows it is there. **Without the extension** the tick does the same from the session jsonl: a one-shot `flush` row at ≥ 75 % ctx and a `post-compaction` row (*“Re-run Boot …”*) when the compaction count rises — both ordinary `AUTOMATIONS.md` rows (`prompt? yes`, `source: tick`), never twice for one crossing (`logs/.flush-requested` is the shared guard). Detail view shows `CTX  controller ctx 18% · compactions 0 · flushed 14:22 · extension alive`.

---

## Status page

`controlroom status-page` turns the room's own files into a human-readable project page — `docs/status/latest.md` and `latest.html` (dark theme, vendored `bin/controlroom-md2html`, python3 stdlib). The page is: your hand-written **preamble** (`docs/status/preamble.md` — goal/thesis, next, open questions; created once from a template, **never overwritten**) → a `Generated by controlroom status-page · <stamp>` line with links to the board/briefs/results → the `MODE:` line → **Workers** · **Decisions waiting on the human** · **Live** (from `controlroom health`: status · last write · `stuck?`/`spinning?`, no `$`/tokens unless `--cost`) · **Recent notes** · **Landed** · **Retired** (resume commands dropped). Every `NNN` / `NNN-slug` in a table cell becomes `[NNN](…/docs/briefs/NNN-*.md) · [result](…) · [design](…)`; relative links from `STATUS.md` are made absolute (`https://github.com/<org>/<repo>/blob/<branch>/…`, from `git remote get-url origin` or `CONTROLROOM_REPO_URL`). `--snapshot` also writes `docs/status/YYYY-MM-DD-latest.md`.

`--publish` commits **only** `docs/status/**`, `docs/.nojekyll`, `docs/index.html` (a redirect to `status/latest.html`) — other dirty or staged files are left alone — then `pull --rebase --autostash`, `push`, and if `gh api repos/<org>/<repo>/pages` is 404 it enables GitHub Pages (source = current branch, path `/docs`) and prints the `html_url`. One line per run in `logs/publish.log`: `[stamp] status-page ghpages=pushed|unchanged|failed:<why> publishers=<n> url=<url> (Pages: …)`.

**It is event-driven, never on a clock:** `controlroom launch` and `controlroom land` call `status-page --publish --quiet` in the background (60 s alarm; never blocks or fails the launch). Opt out per room with a decision line whose slug is `status-page-off` (`controlroom decide "no public status page for this room" --from … --slug status-page-off`) or per shell with `CONTROLROOM_STATUS_PAGE=0`.

**Extra publishers:** `docs/status/publishers.sh` (created with a commented lancedocs example; `chmod +x` to enable) runs after the push with `STATUS_MD STATUS_HTML STATUS_URL ROOT` in the environment; each publisher prints `published <name>` on success and the count lands in `publish.log`.

Gotcha: a committed **symlink anywhere under `docs/`** makes the Pages artifact `tar` fail and the page never builds (`gh api …/pages/builds/latest` stays `building`) — `--publish` warns `⚠ symlink under docs/ …`; `git rm` it.

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
| **red** | `stuck?` | `working` but nothing written for 20 min, session file quiet, pane tail unchanged — look at it / `controlroom resume` |
| yellow | `spinning?` | working and burning tokens, but nothing landed in 30 min |
| grey | `unknown` | Herdr can't classify it |

With **detail on** (`d` in the strip, or `Ctrl+B D`), each agent also shows its **task** (from the board), `last write Xm · ctx NN%`, and, for working agents, a cyan `→` line with **what it is doing this second** (its last tool command). A `COST  controller $… · workers $… · today $…` line (from the pi session files) appears in detail only.

**TICK** — `TICK  last 12:48:29 · ok` is the reconciler's heartbeat; red `TICK  not running` when it has been silent for 5 min (`controlroom tick-install`). The header turns yellow with `PAUSED since … · N draining · play at …` while `logs/PAUSED` exists, and shows `next A002 18:12` when a wake is armed.

**AUTOMATIONS** — `AUTOMATIONS  3 armed · next A002 18:12 (in 25m) · 1 held · fired today 4` (after MEMORY; omitted when only watch/play rows exist; `autoprompt off` when `CONTROLROOM_AUTOPROMPT=0`).

**PIPELINES** — the last 10 `logs/*.log` by modification time, freshest first, each with a status derived from its marker lines: `running` (last marker is START and the file changed in the last 3 h), `done` (END / DONE / `rc=0`), `FAILED` (`rc≠0`, FAIL, Traceback), `stale?` (START but quiet for 3 h — probably died), `no-marker` (a log with no START/END lines, so status is unknown).

**EVENTS** — the last five watcher events. **MEMORY** — `N decisions · M lessons · newest Xh ago · P proposed · last dream …` (only when `docs/briefs/memory/` exists). **WAITING ON YOU** — open items from the board's decisions list (set `CONTROLROOM_HUMAN=<name>` to personalise the heading). **BRIEFS** — everything in `docs/briefs/`.

Keys inside the strip: wheel / arrows / `j` `k` / PgUp PgDn / space · `g` top · `G` bottom · `r` refresh now · `d` toggle detail · `q` quit (`controlroom statusbar` brings it back).

---

## Status page (where it is published)

`controlroom status-page` (015) renders `docs/status/latest.md` + `.html` from the room's files. **Where the HTML goes is a
separate concern**, and the default is a blob-like store, not the source branch:

- **`controlroom-pages push <files>`** (016) copies the files to an **orphan `gh-pages` branch** that is force-pushed as **one
  commit** every time (`status/<file>` + `.nojekyll` + `index.html` redirect), then points GitHub Pages at that branch
  (`gh api … /pages`, POST if off, PUT if it serves another source) and prints the URL. `master` never carries rendered
  HTML; history never grows; the laptop and a remote host can both publish with the `gh` token they already have.
  `controlroom-pages url` / `status` show where it is. One line per publish in `logs/publish.log`.
- Extra publishers (lancedocs, GDocs mirror) stay in `docs/status/publishers.sh` and run after the push.
- Private repos get an Enterprise Pages URL (`https://<random>.pages.github.io/`), public ones `https://<org>.github.io/<repo>/`; the
  path is the same: `/status/<index>.html`.

```bash
controlroom-pages push docs/status/latest.html docs/status/latest.md        # from any room; prints the URL
controlroom-pages push --prefix status --index where-we-stand-latest.html docs/status/where-we-stand-latest.{html,md}
```

## Multiple machines

Workers on a second machine survive your laptop sleeping; the **controller does not**, unless it also runs remotely
(see [Two controllers](#two-controllers)). Herdr does the plumbing: save the host once with
`herdr machine add <ssh-target> --label <label>`, and every CLI call takes `herdr --machine <label> …`. The strip then
shows **one picture** — local and remote agents side by side:

```
 CONTROL ROOM  Sat 09:11  my-project   (say "ok" in CONTROLLER to integrate · blocked = needs you)
 ROOMS  local ▶controller ‹PRIMARY› ⇄ <label> ▶<project>-remote · MODE: local · sync: HEAD a1ee2c8 · ahead 0 · behind 0 (origin, last fetch)
 AGENTS  (Ctrl+B D for detail)  ▶ = controller
▌ LOCAL · laptop · 14 agents ──────────────────────────────────────   ← ▌ + host name in the accent (blue), dim rule to the width
  ▶  idle     controller         wB:p1 ‹PRIMARY›                        ← ▶ bright accent · ‹PRIMARY› bold accent, no fill
  │  working  cr-upstream        wB:pF                                  ← │ dim accent gutter shows the group's extent
  │  done     foundation         wB:p3
  │  done     tpuf-eval          wB:p4
  │  done     vantage-crawl      wB:p5
  │  … +9 done  (doc-editor, advisor-brief, nvidia-sanitize, …)

▌ <LABEL> · reachable · 2 agents ──────────────────────────────────    ← green accent; red + "unreachable since …" when down
  ▶  idle     <project>-remote   w1:p7
  │  working  long-job           w1:pA

 TICK  last 09:11:12 · ok
```

- **ROOMS** (only when `herdr machine list` has rows): each room's controller (`▶`), which one is **PRIMARY** (from the
  `MODE:` line in `STATUS.md`), local git `HEAD · ahead/behind origin` (no fetch — as of the last one) and the last
  `## HANDOFF` time from the board. Nothing shells out to remote git. When the line doesn't fit, `sync:` drops to a
  second dim line.
- **AGENTS** is grouped by host: a header per group — `▌ LOCAL · <hostname> · N agents ───` / `▌ <LABEL> · reachable ···` /
  `▌ <LABEL> · unreachable since 18:02 · timeout · last known:` with greyed agents — where only `▌` and the host name take
  the group's **foreground** accent (blue local · green remote · red unreachable) and the rule is dim; everything else is
  the terminal's default colour, so it reads on any theme (no background or inverse fills anywhere). Rows carry a dim `│`
  gutter (`▶` bright for controllers), a blank line separates groups, pane ids are as on that machine. Within a group:
  controllers, then anything not `done`, then at most 3 `done` agents followed by a dim `… +K done` (`CR_STRIP_DONE_MAX`) —
  so a remote group is always visible on an 18-row strip. Controllers are exempt from the `stalled` remap (idle after
  talking to you ≠ a stopped worker). `NO_COLOR=1` drops the escapes. The pager passes its width down as `COLUMNS`; from
  a plain terminal `COLUMNS=100 controlroom status` does the same.
- **EVENTS** merges remote transitions: `[<label>] worker x: finished (done)`, `[<label>] worker x NEEDS YOU`,
  `[<label>] reachable again — down 12m` — the tick diffs `herdr --machine <label> agent list` against
  `logs/.machines-cache.json` every pass. Controllers are excluded (they go idle after every prompt).
- **Budget**: all remote queries run in parallel with a **3 s total** budget (`CONTROLROOM_MACHINES_BUDGET`) and are
  cached for 60 s (`CONTROLROOM_MACHINES_TTL`); the strip only re-queries when no tick has refreshed the cache.
  `controlroom machines [--refresh]` prints the cache.
- **Remote targets**: `controlroom verify|lastline|resume <label>/<agent>` and `controlroom watch <label>/<agent>`
  translate to `herdr --machine <label>`; a `watch <label>/<agent>` row in `AUTOMATIONS.md` is resolved from the cache.
  `controlroom launch` still targets the *local* Herdr — launch remotely with the one-liner below, or ask the remote
  controller to run `controlroom launch` itself.
- Controllers are recognised by a `controller: <name>` / `controller (<label>): <name>` line in `STATUS.md`, or by
  name (`controller`, `controller-*`, `*-controller`, `*-remote`).

Launch a remote worker from the laptop:
```bash
M="herdr --machine <label>"; REPO=<repo path on the remote>
P=$($M tab create --workspace <ws> --cwd "$REPO" --label <name> --no-focus | python3 -c 'import sys,json;print(json.load(sys.stdin)["result"]["root_pane"]["pane_id"])')
$M agent start <name> --kind pi --pane "$P" --timeout 60000 && $M agent prompt <name> "Read docs/briefs/NNN-slug.md and execute it end to end …" --wait --timeout 120000
```

**What to keep local**: anything that needs the human's identity or browser (SSO'd chat/gateway tools, publishing to
internal doc sites, Drive mirrors, OAuth popups). Tag those briefs `host: local`.
**Linux hosts**: `tick-install` is launchd-only — run `controlroom tick --loop` in a pane beside the strip (the strip
starts one itself when no heartbeat is seen). **Worker-host checklist**: [docs/remote-host.md](docs/remote-host.md)
(Node, pi — incl. the "pi may be a private build — mirror the package root" case —, config sync without secrets, the
`~/.bashrc` PATH gotcha for Herdr's non-login panes, `herdr integration install pi`, both `controlroom` symlinks).
`controlroom host-setup <ssh-target>` is still **TODO** — the checklist is the recipe for now.

## Two controllers

One room on the laptop, one on the remote, **one repo**. Git is the hand-off, `STATUS.md` is the shared board, and
**one controller is primary at a time** — full protocol in [docs/two-controller-protocol.md](docs/two-controller-protocol.md):

1. **Host tag** — every brief header carries `host: local | <label>`; the controller on that host launches, watches
   and integrates it (long jobs, pipelines, files-only research → remote; anything needing you → local).
2. **Modes** — you say *"controller mode: remote"* / *"controller mode: local"*; the outgoing primary commits + pushes,
   writes `MODE: <mode> since <time>` (and, when handing back, a `## HANDOFF <time>` block), and stops launching.
3. **Board** — only the primary edits `STATUS.md`; a `host` column in the workers table; remote results that need a
   local-only step go under `## Pending publish (local)`; `logs/` and `AUTOMATIONS.md` are per host, never merged.
4. **Conflict rule** — never edit `STATUS.md` on both hosts between a push and a pull; if it happens, local wins.
5. **Sync** — a remote with no stored git credential pulls/pushes with a short-lived token over stdin
   (`gh auth token | ssh <target> 'read -r T; git -c http.….extraheader=… pull --ff-only'`) — nothing persisted.

In one project the full loop — brief pushed → remote controller launches → worker DONE → result committed and pushed
back → verified on the laptop — took about **65 s**.

---

## The `controlroom` CLI

| command | does |
|---|---|
| `controlroom init [--rows N]` | rename this agent → `controller`, tab → `CONTROLLER`, split the status strip below, scaffold `docs/briefs/{README,STATUS}.md` + `results/` |
| `controlroom launch <name> <brief.md> ["tab label"] [--force]` | new tab → start pi → prompt it with the brief → `watch <name>` row armed in `AUTOMATIONS.md`; refuses (exit 3) while paused unless `--force` |
| `controlroom tick [--once] [--dry-run] [--loop] [--root R]` | the one-minute reconciler launchd runs: fire due watch rows (verify → toast/log), re-arm rows for `working` board workers, health for working agents, auto-`play`; `--dry-run` prints what it would do; `--loop` = 60 s loop under `caffeinate -i` (Linux fallback). Silent no-op outside a control room |
| `controlroom health [--json] [<agent>…]` | per agent: last write · session quiet · `$` · tokens · turns · ctx % · `stuck?`/`spinning?`; `--jsonl <file> --name N --status S` to inspect any session file |
| `controlroom automations [--all]` | the `AUTOMATIONS.md` table (id · kind · state · next · fired · prompt? · instruction · source) + `next: A### HH:MM (in Nm)`; `--all` includes cancelled rows |
| `controlroom wake <when> "<instruction>" [--prompt\|--no-prompt] [--repeat "every 30m"\|"daily 06:00"\|"weekdays 06:00"]` | arm a `wake` row (`<when>`: `15m` · `2h` · `18:12` · `2026-10-28T06:00` · `"every 30m"` · `"daily 06:00"` · `"weekdays 06:00"`); prompts the controller when due (default) or toasts (`--no-prompt`); prints the sentence the controller should say to the human. `controlroom dream …` as the instruction makes a `dream` row |
| `controlroom watch-path "<glob>" "<instruction>" [--prompt]` | arm a `watch-path` row: toast (or prompt) when a file under the glob is newer than last seen and ≥ 120 s old; baseline is the current newest file |
| `controlroom cancel A###` | cancel an armed/held row (never fires again); `cancel <agent>` cancels its watch row; `cancel --prune-fired` drops fired/cancelled one-shot rows from the table (ids are never reused — `next_id` lives in `.tick-state.json`). **Never delete rows by hand**: cancel them. |
| `controlroom resume <agent> [note]` / `resume-stalled [note]` | re-prompt a stopped worker and re-arm its watch row / do that for every crashed or stalled worker |
| `controlroom verify <agent>` / `lastline <agent>` | `working \| blocked \| done \| crashed \| stalled` from the pane / its last meaningful line. `<agent>` may be `<machine>/<agent>` (also for `resume`, `watch`) → `herdr --machine <machine>` |
| `controlroom strip-restart [--pane P]` | restart the pager in **this workspace's** `status` pane (two rooms on one server both label their strip `status`), or an explicit pane |
| `controlroom strip-check [--force]` | relaunch the pager when the `status` pane shows a bare shell (after a Herdr server restart); the tick and `init` call it; `--force` also replaces whatever else is running there |
| `controlroom machines [--refresh]` | the remote-machine cache (`logs/.machines-cache.json`) behind ROOMS, the per-machine AGENTS groups and `[label]` events; `--refresh` queries now (≤ 3 s) |
| `touch logs/AUTOPROMPT-OFF` | per-room kill switch: wake rows toast instead of prompting the controller (tick **and** strip read it; `CONTROLROOM_AUTOPROMPT=0` still works but is user-global) |
| `controlroom pause [--resume-after Nm\|Nh] [reason]` / `play` | write / remove `logs/PAUSED`; `--resume-after` arms a `play` row the tick fires; `launch` refuses while paused; workers drain |
| `controlroom tick-install` / `tick-uninstall` | write + bootstrap (or boot out + remove) `~/.config/controlroom/launchd/io.controlroom.tick.<hash8>.plist`; `init` calls `tick-install` (idempotent) |
| `controlroom watch <agent>…` | manual: log + toast when agents finish or block (90 s grace) — the tick does this for you now; kept for ad-hoc use |
| `controlroom watch-log <logfile> <label>` | log + toast when a pipeline log shows END / DONE / `rc=` |
| `controlroom status` | one-shot text of the board (what the strip shows) |
| `controlroom statusbar` | the live strip (pager) |
| `controlroom detail` / `detail-on` / `detail-off` | toggle the detail view (flag in `~/.config/controlroom/`) |
| `controlroom retire <agent> [reason]` | close a worker's tab; its pi session stays on disk and the board records `pi --resume <session>` |
| `controlroom gc [--hours 24] [--apply] [--keep a,b]` | list (dry run) or retire workers idle longer than N hours; never touches the controller or working/blocked agents |
| `controlroom decide "…" --from <source> [--slug s]` | append a `D###` line to `docs/briefs/memory/DECISIONS.md`; refuses without `--from` (path must exist, or `chat:<ts>`) |
| `controlroom lesson "…" --from <source> [--slug s]` | same, `L###` → `LESSONS.md` |
| `controlroom supersede <ID> <byID>` | strike a line in place, note `superseded-by`, copy it to `memory/archive/YYYY-MM.md` |
| `controlroom memory [--counts\|--decisions\|--lessons\|--unsourced]` | counts + active lines of both files (≤ 70 lines); `⚠ over budget` past 40/30 |
| `controlroom land [<agent\|brief>…]` | move `done` rows with a result link from the workers table into `## Landed`; drop struck decisions from the board |
| `controlroom init --memory-only [--no-seed]` | just the `docs/briefs/memory/` scaffold + LESSONS seed (idempotent; no pane/agent changes) |
| `controlroom dream [--reason r] [--since ISO\|Nd] [--here]` | render `prompts/dream.md` → `memory/.dream-brief.md` (window = `--since`, else last `dreams/*.md` mtime, else 7 d) and `launch` a `dreamer-N` worker (watch row + LESSONS line as usual); `--here` prints the filled prompt for the controller to run itself |
| `controlroom dream --check` | no LLM: newest `dreams/*.md` + `proposed.md` — every `← path[#anchor\|:"phrase"\|:line]` resolves, `DONE dream` present, `## Proposed (N)` = P-lines added, no duplicate slug, ≤ 10; warns if DECISIONS/LESSONS/STATUS/results moved during the run → `dream ok: …` in `agents.log`, or a list + toast `dream report has dead links` (rc 1) |
| `controlroom promote P### [P### …] \| --all [--kind D\|L]` | turn a P-line into a `D`/`L` line through `decide`/`lesson` (same source, same slug); `[D]`/`[L]` tag at the start of the one-liner picks the file, `--kind` overrides the tag for named IDs; with `--all` it is a filter (and the default for untagged lines); the P-line is struck `promoted-as D010`; refuses a slug already in memory |
| `controlroom reject P### [reason]` | strike the P-line `rejected: reason` and copy it to `memory/archive/YYYY-MM.md` |
| `controlroom status-page [--publish] [--snapshot] [--cost] [--quiet]` | render `docs/status/latest.{md,html}` from `STATUS.md` + `health` + your `docs/status/preamble.md` (brief numbers → GitHub links); `--publish` commits **only** `docs/status/**` + `docs/.nojekyll` + `docs/index.html`, pushes, enables GitHub Pages if off, runs `docs/status/publishers.sh`, one line in `logs/publish.log`. `launch` and `land` call it in the background (015) |
| `controlroom event <kind> [arg]` | one `[time] kind — arg` line in `logs/agents.log` (called by the extension and the tick): `flush-requested <pct>` also writes `logs/.flush-requested` + one toast per crossing; `compaction <tokensBefore>` also bumps `logs/.compactions` `{count,last}`; `ext-error <msg>` |
| `/flush` (in the controller's pi) | extension command: send the flush request now (`controlroom memory` → `decide`/`lesson` what's missing → STATUS.md → reply `/compact`) |

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
9. **The human still closes the loop.** Pi cannot start a turn on its own; the strip and the toasts get *your* attention, then you poke the controller. The one explicit exception: **automations prompt the controller only when a row says so** — `wake` rows the controller armed itself ("A002 wakes me at 18:12"), never worker watches.
10. **Dream is on demand.** Schedule it only after the human has read three reports and said they were useful. A dream only *proposes*; `dream --check` greps every citation; `promote`/`reject` is a person's (or the controller's) explicit call.

## Gotchas we hit (so you don't)

- Hidden pi subagents are killed after ~3 minutes without output — use Herdr panes for read-heavy tasks.
- `herdr pane split --ratio` applies to the *original* pane (0.14 gave the new pane 86 %). Fix with `herdr pane resize`.
- `herdr agent list` puts the agent's name in `name`, not `agent_name`.
- Piping JSON into `python3 - <<'EOF'` loses stdin to the heredoc — pass data via an environment variable.
- A prompt-template frontmatter value containing `: ` breaks YAML parsing and pi **silently skips** the template. Quote it. `/reload` picks up new templates in a running pi.
- `controlroom tick-install` in a **scratch repo** bootstraps a real launchd tick for that root (it raced a fake-`herdr` test). Write `logs/.controller` by hand for tests, or `tick-uninstall` right after.
- Herdr toasts default to *off* (`[ui.toast] delivery`), and even when on they're transient. The strip and `logs/agents.log` are the reliable signals.
- Laptop sleep kills long jobs and the API calls of workers mid-write. `caffeinate -i` for pipelines; tell workers to save partial results early.
- A worker sat **26 h** at 98 % CPU with the strip saying `working`. `stuck?` (no write 20 min + quiet session + unchanged pane tail) is the alarm for that; it fires from the tick, not from a process that dies with Herdr.
- Healthy work on this machine never went more than **6.3 min** between write-type tool calls; the one longer honest gap (15 min) was a bash poll loop that wrote to its own `logs/<worker>.log` — which `last write` attributes to the worker anyway. Hence 20 min.
- `herdr agent rename` can be lost across a Herdr restart (the controller pane here showed up unnamed); `controlroom health controller` then says `missing` — re-run `controlroom init` from the controller pane or point `health --jsonl` at the session file.
- `health`'s `ctx %` once said **89 %** for a controller at 18 %: the model (`claude-fable-5-1`, 1 M window) was not in the hard-coded window table (200 k default). `window()` now reads `~/.pi/agent/models-store.json`; the flush fallback would otherwise have fired on a phantom crossing. Always `tick --dry-run` after touching a trigger.
- Two control rooms on one Herdr server both label their strip pane `status`; the old `strip-restart` picked the first one and restarted the *other* room's pager. Pane lookups are scoped to `$HERDR_WORKSPACE_ID` now.
- A Herdr server restart keeps tab/pane ids but kills the processes in them: the strip comes back as a bare shell. `controlroom strip-check` (run by the tick) relaunches it; the controller pi you restart yourself (`herdr agent start …`, then `pi --resume`).
- Herdr panes on a remote host are **non-login** shells: `~/.profile` isn't read, `~/.local/bin` is missing, and `herdr agent start … --kind pi` times out with no visible error. Put the PATH line in `~/.bashrc`.
- Both `controlroom` **and** `controlroom-pager` must be on the remote's PATH, or the strip dies with `exec: controlroom-pager: not found`.
- An LLM cannot run slash commands: a wake saying “run /flush” does nothing; `/reload` and `/flush` are for the human (or keystrokes via `herdr agent prompt <pane> "/flush"`). The extension therefore acts on the controller's *reply* (`/compact` on a line of its own) instead.

## Layout

```
prompts/controller.md        the /controller template (frontmatter + operating rules)
skills/controlroom/SKILL.md  the protocol as a skill, so a fresh agent operates it correctly
skills/controlroom/bin -> ../../bin
bin/controlroom              the CLI (bash)
bin/controlroom-pager        the status strip (python3, curses)
bin/controlroom-md2html      Markdown → HTML for the status page (python3 stdlib, vendored from lookbook-research)
bin/controlroom-pages        publish rendered status files to GitHub Pages via an orphan `gh-pages` branch (one force-pushed commit; nothing lands in the source branch) — see "Status page"
extensions/controlroom.ts    the compaction-flush extension (pi 1.4.0 API; loaded via package.json `pi.extensions`)
docs/design/durable-controlroom.md   the durability design (memory · tick · automations · dream · compaction)
docs/remote-host.md                  worker-host setup checklist (second machine)
docs/two-controller-protocol.md      two rooms, one repo: host tags · modes · HANDOFF · conflict rule · sync
```

MIT © Lance Riedel

### Completion is verified, not assumed (v0.1.5)
Herdr's `done`/`idle` only means the prompt stopped. `controlroom` now reads the worker's pane and reports:
`done` (the `DONE <name>` line is present) · `crashed` (proxy/API error in the tail — e.g. the daily premium spend cap) ·
`stalled` (stopped without DONE). `controlroom verify <agent>` prints it; the watcher notifies accordingly;
`controlroom resume <agent> [note]` re-prompts a stopped worker and re-arms the watcher.
