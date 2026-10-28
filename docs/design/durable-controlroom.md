# Durable control room — design

Brief: `docs/briefs/003-durable-design.md` · Critic: `docs/briefs/results/003-critic.md` · Author: worker `durable-design` · 2026-10-27
Installed versions pinned against: **pi 1.4.0** (`~/.pi/pkg/pi-1.4.0/docs`), **Herdr 0.8.2**, macOS launchd. (The brief's `pi-0.85.1` path does not exist on this machine.)

Labels: **[V]** = Verified (how, in §10) · **[A]** = Assumed · **[Q]** = Open question for Lance.

---

## 0. One-page summary

**Problem.** Today the controller's memory is its chat context. Compaction, a crash, laptop sleep, or a new session loses: why decisions were made, what bit us, what is scheduled, and what is in flight. The files that *do* survive (`STATUS.md`, `results/`, `agents.log`) are never read back by a fresh controller — `prompts/controller.md` has no boot step.

**Shape of the fix** (in the project's idiom — markdown files + bash/python3 + Herdr/pi CLIs):

| Piece | What it is | New files | New CLI |
|---|---|---|---|
| **Boot** | the controller template reads the board, results, log, memory, agents on every start/resume | — | — |
| **Memory** | two append-only, source-linked, bounded files; every line = `ID date one-liner ← source` | `docs/briefs/memory/{DECISIONS,LESSONS}.md`, `memory/archive/` | `decide` `lesson` `memory` `supersede` |
| **Tick** | one idempotent reconciler run by launchd every 60 s; replaces nohup watcher loops; fires automations; detects stuck workers; re-arms after restart | `docs/briefs/AUTOMATIONS.md`, `logs/tick.log`, `~/.config/controlroom/launchd/` | `tick` `wake` `watch-path` `automations` `cancel` |
| **Pause/Play** | a marker file the tick and `launch` respect; drains in-flight work; auto-play | `logs/PAUSED` | `pause` `play` |
| **Land** | `## Landed` ledger in `STATUS.md`; a 10-line mover. No lander agent. | — | `land` |
| **Dream** | a propose-only prompt (`prompts/dream.md`) run on demand or by a wake; writes `memory/proposed.md`; nothing is promoted without a source | `memory/proposed.md`, `memory/dreams/` | `dream` `dream --check` |
| **Health** | `stuck?` alarm from last-write age (the 26 h incident); $/tokens from the pi session jsonl in detail view only | `logs/.health.json` | `health` |
| **Hook** | a ~40-line pi extension: at 75 % context, asks the controller to flush memory *before* auto-compaction; logs compaction events. Shell fallback via tick. | `extensions/controlroom.ts` | `/flush` |

**What changed from the controller's outline** (per critic, accepted unless noted): FACTS cut (two types, not three) · standing lander cut · LLM-call-inside-the-compaction-hook cut · watchers no longer auto-prompt the controller *by default* (opt-in per automation) · memory reaches workers through the brief the controller writes, plus a one-line "skim LESSONS.md" in `launch` · dream is propose-only and on-demand first · **$/tokens kept, but in detail view only** — the critic called it unverified; it is now **[V]** cheap and exposed (§6).

**Ship order:** 004 Boot + memory (prompt-only + `decide`/`lesson`/`land`) → 005 tick + stuck + pause → 006 wake/automations → 007 dream → 008 compaction extension. §9.

**Human stays in the loop.** By default only `blocked` and `stuck?` reach the human, and only automations the controller explicitly created can start a controller turn. `CONTROLROOM_AUTOPROMPT=0` turns even that off.

### Glossary diff (additions to README "The vocabulary")

| Term | One-liner |
|---|---|
| **Memory** | `docs/briefs/memory/DECISIONS.md` + `LESSONS.md`: append-only, every line links to a brief/result/log line; what every new brief and every booted controller starts from |
| **Decision** | `D###` — something chosen, with date and source; superseded, never deleted |
| **Lesson** | `L###` — something that bit us and the rule we adopted |
| **Automation** | a row in `docs/briefs/AUTOMATIONS.md` (`A###`): a wake, a path watch, or a play; the tick fires it |
| **Tick** | `controlroom tick` — the one-minute reconciler launchd runs; everything that used to be a background loop |
| **Pause / Play** | `logs/PAUSED` exists → nothing new launches, automations hold, in-flight work drains |
| **Landed** | the `## Landed` table in `STATUS.md`: integrated results, moved out of the live workers table |
| **Dream** | an on-demand consolidation prompt that reads files and *proposes* memory lines; a human/controller promotes them |
| **Flush** | the controller writing un-recorded decisions/lessons to memory before its context is compacted |

---

## 1. Memory

### 1.1 Files
```
docs/briefs/memory/
  DECISIONS.md     # D### lines, newest last
  LESSONS.md       # L### lines, newest last
  proposed.md      # written by dream; empty when nothing pending
  archive/YYYY-MM.md   # superseded / merged lines, moved here by `supersede` or dream — never deleted
  dreams/YYYY-MM-DD-HHMM.md    # dream run reports
```
FACTS is **cut** (critic §Keep/cut): facts about the world belong in README/results and drift fastest; what a fresh controller needs is *what we chose* and *what hurt*. Reversible: the line grammar admits an `F` prefix if ever wanted.

### 1.2 Line format (exact)
```
- D007 2026-10-27 **no-timeout-binary** — use `perl -e 'alarm N; exec @ARGV' --` instead of `timeout`; don't brew-install coreutils ← results/001-mana-install.md#6-gotchas
- L003 2026-09-15 **caffeinate-pipelines** — laptop sleep killed a pipeline step; wrap long jobs in `caffeinate -i` ← README.md:"lost a step to this once"
- ~~D002 2026-10-26 **toast-on-done** — rely on Herdr toasts for DONE~~ superseded-by D005 ← STATUS.md
```
Grammar: `- <ID> <YYYY-MM-DD> **<slug>** — <one-liner, ≤ 160 chars> ← <source>`
`<source>` is a repo-relative path, optionally `#heading-anchor`, `:line`, or `:"quoted phrase"`; or `chat:<ISO-ts>` for something the human said (allowed only via `--from chat`, shown as *unsourced* in `memory` output, and dream proposes a file source for it or it ages into archive after 30 days [A — tune]). **No source, no line** — the CLI refuses.
Counts shown everywhere = `grep -c '^- [DL][0-9]'` per file (struck lines excluded).

### 1.3 Rules
- **Append-only.** Only `supersede` and `dream --apply` touch existing lines, and only by striking + moving to `archive/`. Nothing is ever deleted.
- **Bounded.** Active DECISIONS ≤ 40 lines, LESSONS ≤ 30 [A]. `memory` prints `⚠ over budget` and the strip shows it in yellow; dream's job is to propose merges, the human/controller applies them.
- **One source of truth.** A decision on the board (`## Decisions waiting on the human`, struck when decided) is the *event*; `controlroom decide … --from STATUS.md:"<question text>"` is how it becomes memory. The board row is then deleted at the next `land`.

### 1.4 CLI
```
controlroom decide "<one-liner>" --from <source> [--slug s]     # appends D-line; prints it
controlroom lesson "<one-liner>" --from <source> [--slug s]     # appends L-line
controlroom supersede D002 D005                                 # strike D002 in place, append it to archive/, note "superseded-by D005"
controlroom memory [--counts|--decisions|--lessons|--unsourced] # default: counts line + active lines of both files (≤ 70 lines)
```
Implementation: ~40 lines of python3 inside `bin/controlroom` (same `python3 - <<'PY'` style). ID = max existing + 1. `--from` is validated: path must exist (`:line`/`#anchor`/`:"phrase"` not validated beyond the file) unless `chat:`.

### 1.5 How memory reaches workers and the controller
- **Controller boot** (`prompts/controller.md`, new section — the critic's "ship first", §9 brief 004):
  > **Boot (every start or resume, before anything else):** 1) read `docs/briefs/STATUS.md`; 2) `controlroom memory` (decisions · lessons); 3) `tail -20 logs/agents.log`; 4) `controlroom automations` if it exists; 5) `herdr agent list` and `controlroom verify <name>` for every worker on the board; 6) `ls docs/briefs/results/` and skim any result not yet integrated into the board. Then tell the human in two lines where things stand and what the next wake is. If `logs/PAUSED` exists, say so first.
- **Into briefs, by the controller** (critic: not by `launch`): the controller template gains a rule — *"Every brief's Constraints section starts with the decisions and lessons that apply to it, copied verbatim with their IDs (`D007`, `L003`). `controlroom memory` is your source."* Workers therefore get memory inside the one file they are told is everything.
- **`launch` adds one sentence, only if the dir exists** (cheap insurance; the critic's ordering A allows it): `…Read docs/briefs/memory/LESSONS.md first (project lessons; treat as rules). Then read $BRIEF…` [V — `launch` prompt line is a plain string, trivial change].
- **Strip:** `MEMORY  12 decisions · 7 lessons · newest 2h ago · 3 proposed · last dream 1.2d` (one line, between EVENTS and WAITING).

---

## 2. Automations and the tick

### 2.1 Why one reconciler instead of loops (critic §CHANGE, accepted)
Today `launch` starts `nohup controlroom watch` loops that die with Herdr/laptop restart and are not idempotent. A single `controlroom tick`, run by launchd every 60 s, reads the files, compares to reality (`herdr agent list`), fires what is due, and writes back. Nothing lives in process memory; killing it loses nothing. Latency goes from instant (`herdr agent wait`) to ≤ 60 s — fine for this protocol.

### 2.2 State file — `docs/briefs/AUTOMATIONS.md` (the ledger *is* the state)
```
# Automations — control room (pi-controlroom)
Rows are read and rewritten by `controlroom tick` every minute. `armed` = will fire; `held` = paused; `fired` = done (once) · next (recurring).

| id | kind | state | next (local) | repeat | fired | prompt controller? | instruction | source |
|---|---|---|---|---|---|---|---|---|
| A001 | watch | armed | — | — | 0 | yes | integrate 003-durable-design when DONE | launch 10-27 12:05 |
| A002 | wake | armed | 2026-10-27 18:12 | once | 0 | yes | check whether 004 result landed; if not, resume-stalled | wake 10-27 12:40 |
| A003 | wake | armed | 2026-10-28 06:00 | daily | 3 | no | controlroom dream --reason nightly | wake 10-27 12:41 |
| A004 | watch-path | armed | — | on-change | 1 | yes | re-read README.md and check the vocabulary table is current | watch-path 10-27 12:50 |
| A005 | play | armed | 2026-10-27 14:10 | once | 0 | — | play (from pause --resume-after 120m) | pause 10-27 12:10 |
```
Kinds: `watch <agent>` (worker finished/blocked/stuck) · `wake` (time) · `watch-path <glob>` (newest mtime under glob changed) · `play` (end a pause) · `dream` (alias of wake with a fixed instruction). State: `armed | held | fired | cancelled`. Parsing/writing: python3, rewrite the whole table atomically (`os.replace`). Row IDs are stable; the controller refers to them by ID.

### 2.3 CLI
```
controlroom wake <when> "<instruction>" [--prompt|--no-prompt] [--repeat every 30m|daily HH:MM|weekdays HH:MM]
    <when>: 15m | 2h | 18:12 | 2026-10-28T06:00 | "every 30m" | "daily 06:00"
    prints:  A002 armed — wakes controller at 18:12 (in 25m): "check whether…"
             → Say to the human: "A002 wakes me at 18:12; from that round I'll check whether 004 landed."
controlroom watch-path "<glob>" "<instruction>" [--prompt]
controlroom automations [--all]          # the table, plus "next: A002 in 25m"
controlroom cancel A002
controlroom tick [--once] [--dry-run]    # what launchd runs; --dry-run prints actions without doing them
```
Default for `prompt controller?`: **no** for `watch` rows created by `launch` (keeps README rule 9: the human closes the loop); **yes** for `wake` rows the controller creates (that is their purpose). `CONTROLROOM_AUTOPROMPT=0` in the tick's env forces toast-only for all rows.

### 2.4 Tick algorithm (one pass, ~120 lines python3; idempotent)
1. `ROOT` from argv; exit 0 silently if `docs/briefs/` missing. Lock: `logs/.tick.lock` (`mkdir` lock, stale after 5 min).
2. If `logs/PAUSED` exists: load it; if `until` passed → remove it, log `play (auto)`, continue; else only `play` rows and the `dream --reason pause` row may fire; others stay `held`.
3. **Watch rows** — for each `armed watch <agent>`: `verify <agent>` (existing function) → `done | crashed | stalled | blocked | working`; on a terminal state: `note` (existing toast+log), set `fired`, and if `prompt? = yes` → §2.5. Also run **health** (§6) for every `working` agent.
4. **Re-arm** — every worker in the `STATUS.md` workers table with state `working`/`launched` and no watch row → add one (`source: rearm`). This replaces "watchers survive restart".
5. **Wake rows** — `now ≥ next` → fire (§2.5 or `note`), `fired += 1`; recurring → compute next; once → `fired`.
6. **Watch-path rows** — newest mtime under glob (python `glob` + `os.stat`) > stored `last_seen` (kept in `logs/.tick-state.json`, not in the table) and older than 120 s (debounce) → fire.
7. **Compaction fallback** (§7.4) — count `"type":"compaction"` lines in the controller's session jsonl; if increased → fire the post-compaction reconcile prompt once.
8. Write the table back; append one line per action to `logs/tick.log` (`[time] A002 fired → prompted controller`); nothing happened → write nothing (log stays small).

### 2.5 How an automation "prompts the controller"
```
herdr agent prompt controller "[A002 · wake · fired 1/once · 18:12] <instruction>
Rules: files first (STATUS.md, results/, logs/agents.log). Do the round, update STATUS.md, record any decision/lesson with controlroom decide|lesson --from …, then end with one line: what you did and which automation wakes you next (controlroom automations)."
```
- Controller `blocked` → Herdr rejects with `agent_blocked` [V — `herdr agent prompt --help`]; the row stays `due`, retried next tick; after 30 min of rejection → toast the human once.
- Controller `working` → the text is typed into the pane and pi queues it as a follow-up for the end of the current turn [A — pi TUI queues typed input mid-stream; verify with one live test in brief 006].
- Rate cap: ≤ 6 controller prompts per hour across all rows [A]; excess rows wait, toast `automation backlog`.
- The controller's reply convention ("A003 wakes me at 06:00; from that round I'll run the nightly dream") is enforced by the prompt text above and by the template rule *"When you set a wake, tell the human its ID and time."*

### 2.6 Running the tick: launchd (survives Herdr restart and sleep)
`controlroom init` writes `~/.config/controlroom/launchd/io.controlroom.tick.<hash8(ROOT)>.plist`:
```xml
ProgramArguments = [/bin/bash, -lc, "exec ~/.local/bin/controlroom tick --root <ROOT>"]
StartInterval = 60 · RunAtLoad = true · ThrottleInterval = 30 · ProcessType = Background
EnvironmentVariables = {HOME, PATH=/usr/bin:/bin:/usr/sbin:/sbin:~/.local/bin:/opt/homebrew/bin, HERDR_ENV=1, HERDR_WORKSPACE_ID=<WS>}
StandardOutPath/StandardErrorPath = <ROOT>/logs/tick.log
```
then `launchctl bootstrap gui/$UID <plist>` (idempotent: `launchctl print … >/dev/null || bootstrap`). **[V]** bootstrap from a path outside `~/Library/LaunchAgents` works and `RunAtLoad` fires (`logs/scratch/003-launchd-test.plist`). **[A]** launchd runs a missed `StartInterval` job soon after wake from sleep (documented launchd behaviour; not observed here). **[Q]** Does `herdr` CLI work from a launchd process with no `HERDR_*` env besides what we set? The socket path is discovered by the CLI, but the pulse-notify unit (`002`) only used osascript. Brief 005 must test `herdr agent list` from the launchd context first; fallback = `controlroom tick --loop` run in the status pane under `caffeinate -i` (Herdr pane survives the pi session, not a Herdr restart).
Linux: `--loop` fallback only.

---

## 3. Dream (propose-only, on demand)

### 3.1 What it is
A **prompt template** `prompts/dream.md` (ships like `controller.md`) plus `controlroom dream` which launches it as a worker (`controlroom launch dreamer docs/briefs/memory/.dream-brief.md` — the brief is rendered from the template with the window dates filled in) or, with `--here`, prints the prompt for the controller to run itself. The dreamer **reads files only** — never chat — so it cannot hallucinate what happened; it can only mis-cite, and `dream --check` catches that.

Triggers: manual (`controlroom dream`) · a wake (`controlroom wake "daily 06:00" "controlroom dream --reason nightly" --no-prompt`, only *after* a week of manual runs shows value — critic §10) · after pause (armed by `pause`) · **not** before compaction (§7 uses a lighter "flush").

### 3.2 Prompt text (literal; `{…}` filled by the CLI)
```
You are the dreamer for the control room at {ROOT}. Reason: {reason}. Window: since {since} (last dream or 7 days).
Read, in order: docs/briefs/memory/DECISIONS.md, LESSONS.md, proposed.md; docs/briefs/STATUS.md; every docs/briefs/results/*.md
modified since {since}; logs/agents.log and logs/tick.log lines since {since}; skills/controlroom/SKILL.md "Gotchas".
You PROPOSE; you do not promote. Write exactly two files:
1. docs/briefs/memory/dreams/{stamp}.md with sections: ## Read (paths + mtimes) · ## Proposed (count) · ## Merge candidates
   (pairs of existing IDs that say the same thing, with why) · ## Landed candidates (board rows that are done and integrated)
   · ## Unsure (things that look like decisions but have no file source — phrase each as a question for the human)
2. docs/briefs/memory/proposed.md: APPEND lines in the exact memory grammar
   `- P### YYYY-MM-DD **slug** — one-liner ← source` where source is a path that exists, with #anchor or :"quoted phrase".
   No link, no line. Max 10 lines per run. Never duplicate an existing D/L/P slug.
Do not edit DECISIONS.md, LESSONS.md, STATUS.md or any result. Finish with the single line: DONE dream
```
### 3.3 After a dream
`controlroom dream --check` (python, no LLM): every `← path` in proposed.md and the dream report exists; `DONE dream` present; counts match → appends `[time] dream ok: 6 proposed, 2 merges, 3 landed-candidates` to `agents.log`; failures → toast `dream report has dead links`. Promotion is explicit: `controlroom promote P012` (= `decide`/`lesson` with the P-line's source, strike the P-line) or `controlroom promote --all --kind L`. `land` (§5) takes the landed candidates. Strip shows `3 proposed` until promoted or `controlroom reject P012`.

---

## 4. Pause / Play

| | |
|---|---|
| Marker | `logs/PAUSED` — one line `since=2026-10-27T12:10 until=2026-10-27T14:10 reason="lunch; let 2 workers drain"` |
| `controlroom pause [--resume-after 120m] [reason]` | writes the marker; `--resume-after` adds an `A### play` row; arms one `dream --reason pause` row with `--no-prompt` [Q — only once dreams are proven useful; default off]; `note "PAUSED …"` |
| `controlroom play` | removes the marker; cancels the play row; fires `held` rows **collapsed into one controller prompt** (`[play] 3 automations fired while paused: A002 …, A004 …`) if any had `prompt? = yes`; `note` |
| `launch` | refuses with `paused since 12:10 — controlroom play, or --force` (exit 3) |
| In-flight workers | untouched; they drain. `resume`/`resume-stalled` still work (they continue existing work) |
| Watch rows | still verified and logged/toasted (the human wants to know a worker finished); `prompt?` suppressed → `held` |
| Wake / watch-path rows | `held` (not skipped: they fire on play, recurring ones compute next normally) |
| Strip header | `CONTROL ROOM … PAUSED since 12:10 · 2 draining · play at 14:10 (A005)` in yellow |
| Laptop sleep | orthogonal. Pause never needs the laptop awake; the tick catches up on wake. `caffeinate` remains the pipeline/worker concern; `controlroom` does not start it |

---

## 5. Landed ledger — no lander

`## Landed` in `STATUS.md` (created on first `land`):
```
## Landed
| when | brief | worker | result | one-liner |
|---|---|---|---|---|
| 10-27 | 002-pulse-notify | pulse-notify | [results/002-pulse-notify.md](results/002-pulse-notify.md) | launchd poller + osascript notify; installed |
```
`controlroom land <brief|agent>…` (≈ 10 lines python): move the matching workers-table row(s) whose state starts with `done` and whose result column has a link → `## Landed` (newest first), carry the one-liner, delete struck items from `## Decisions waiting` whose text appears as a `--from` in DECISIONS.md. `land --older-than 24h` for bulk.
**Lander agent: not for this project.** Results are files, not branches; there is no merge queue or CI gate to serialize. If a future project uses worktrees per worker, the minimal version is a *brief template* (`docs/briefs/templates/lander.md`: "merge these N branches in order, run tests, report") launched on demand — never standing.

---

## 6. Cost & health on the strip

**What is actually exposed [V]:** `herdr agent list` → `agent_status`, `agent_session.value` (path to the pi session jsonl), `state_change_seq`; no cost, no last-output time (`herdr api snapshot` has the same fields). The pi session jsonl has, per assistant message, `usage.{totalTokens, cost.total}` and `timestamp`, plus tool calls by name (`write`/`edit`/`bash`); `usage` and `compaction` entries carry cost too. Prototype `logs/scratch/003-session-cost.py`: controller session = **$7.92 · 3.3M tokens · 70 turns**, parsed in **21 ms** for a 2.4 MB file.

`controlroom health` (python; run by the tick; cached in `logs/.health.json` keyed by `(path, size)`):

| field | derivation | shown |
|---|---|---|
| `last write` | newest of: last `write`/`edit`/`bash` toolCall ts in the jsonl, newest mtime under `docs/briefs/results/` and `logs/` attributable by worker name | AGENTS detail: `last write 14m` |
| **`stuck?`** | `working` **and** last-write age > 20 min **and** session jsonl mtime unchanged ≥ 10 min **and** `lastline()` (existing) unchanged since last tick → red `stuck?`, one event line, one toast per hour (`request` sound). This is the 26 h incident (CPU spinning, no API calls, no writes) | AGENTS state column |
| `spinning?` | `working`, jsonl growing (cost rising) but no write for > 30 min — burning $ with nothing landing | AGENTS state (yellow) |
| `$ / tokens` | sum per session; **detail view only** (critic: cut from the default strip — accepted; keep because it is verified and free) | `COST  controller $7.92 · 3.3M  workers $3.42  today $4.10` |
| `last dream` / `next wake` | newest `dreams/*.md` mtime; min `next` over armed wake rows | MEMORY line + header `next A002 18:12` |
| `context %` | last assistant message `usage.input+cacheRead+cacheWrite` ÷ model window (window hard-coded per model id [A]) | detail: `ctx 61%` — also the shell fallback trigger in §7.4 |

Thresholds are [A]; brief 005 tunes them against the one known incident and a healthy run.

---

## 7. Compaction hook — the only extension

### 7.1 API pinned to pi 1.4.0 [V — `docs/extensions.md`, `examples/extensions/`]
`session_before_compact` (event: `preparation`, `branchEntries`, `signal`; return `{compaction}` to replace, or nothing) · `ctx.getContextUsage()` → `{tokens, contextWindow, percent}` (`trigger-compact.ts`, `border-status-editor.ts`) · `ctx.compact({customInstructions, onComplete, onError})` · `pi.sendUserMessage(text, {deliverAs:"followUp"})` (`send-user-message.ts`) · `pi.exec(cmd, args, {cwd})` (`auto-commit-on-exit.ts`) · `pi.registerCommand` · `session_start`.

### 7.2 Behaviour (`extensions/controlroom.ts`, ~40 lines)
Active only when `HERDR_ENV=1`, `docs/briefs/memory/` exists under `ctx.cwd`, and this pane's agent is named `controller` (`pi.exec("herdr",["agent","get",HERDR_PANE_ID])` once at `session_start`).
1. **`turn_end`**: if `percent` crosses **75 %** [A] (rising edge, once per crossing) → `pi.sendUserMessage("[controlroom · flush] Context at 75%. Before compaction: run `controlroom memory`, then record every decision/lesson from this session that is not yet there (controlroom decide|lesson --from <file>), update STATUS.md, note your next wake. Then reply `/compact`.", {deliverAs:"followUp"})` and `pi.exec("controlroom",["event","flush-requested"])`. This is "dream before compaction" done by the agent that has the context, as a normal turn, propose-nothing/record-sourced-only.
2. **`session_before_compact`**: no LLM call (critic: cut). `pi.exec("controlroom",["event","compaction", String(tokensBefore)])` → `agents.log` line + `logs/.compactions` counter so the tick/strip know. Return nothing → default compaction.
3. **`/flush`** command: sends the same flush message on demand.
Not done: replacing the summary, injecting memory into the system prompt (the Boot section covers it; cheaper and visible).

### 7.3 Shipping
`package.json`: `"pi": {"prompts":["./prompts"], "skills":["./skills"], "extensions":["./extensions"]}` [V — `docs/packages.md` manifest form; pi-subagents ships `extensions` this way; this repo is already installed as a local package path in `~/.pi/agent/settings.json`]. Type imports from `@earendil-works/pi-coding-agent` as a `peerDependencies: {"*"}` entry. `/reload` picks it up.

### 7.4 Shell-only fallback (extension absent or disabled)
The tick computes `context %` from the jsonl (§6) and, on crossing 75 %, fires a one-shot automation `flush` with the §7.2 text via `herdr agent prompt controller`. On a compaction count increase it fires `[controlroom · post-compaction] Your context was just compacted. Re-run Boot (STATUS.md, controlroom memory, automations). Record anything the summary mentions that memory lacks.` Both are rows in AUTOMATIONS.md like any other (`kind: flush`, `source: tick`), so they are visible and cancellable.

---

## 8. Migration & compatibility

`controlroom init` becomes idempotent per feature and prints what it did:
```
agent → controller · tab → CONTROLLER · strip → wC:p2 (unchanged)
memory/   created DECISIONS.md LESSONS.md proposed.md archive/ dreams/   (skipped if present)
          seeded 6 L-lines from skills/controlroom/SKILL.md "Gotchas" + README "Gotchas we hit" (--no-seed to skip)
AUTOMATIONS.md created · 2 watch rows re-armed from STATUS.md
tick      launchd io.controlroom.tick.3f9a1c2b bootstrapped (60 s)   · or: already loaded
STATUS.md ## Landed header appended
```
- Existing boards are never rewritten; new sections are appended. Users who ignore the new features see: one `MEMORY` line on the strip (zero counts) and a `tick.log`. `launch` adds the LESSONS sentence only if the dir exists. Watch rows default to `prompt? = no`, so no behaviour change in who talks to the controller.
- `controlroom uninstall-tick` boots out and removes the plist. `gc` and `retire` unchanged.
- Version marker `docs/briefs/memory/.version = 1` so later migrations can key off it. `prompts/controller.md` keeps `$ARGUMENTS`; the Boot section is additive.

---

## 9. Sequencing — five briefs (critic's A→E, mapped)

| # | Brief | Scope (one line) | Depends | Half-day? |
|---|---|---|---|---|
| **004** | **boot-and-memory** (ship first) | Boot section + brief-writing rule in `prompts/controller.md`; `memory/{DECISIONS,LESSONS,proposed}.md` + `archive/`; `decide` `lesson` `supersede` `memory` `land` CLI; seed LESSONS from SKILL/README gotchas; `launch` LESSONS sentence; `MEMORY` strip line; README vocabulary + SKILL rules | — | yes (mostly prompt/text; ~90 lines bash/py) |
| **005** | **tick-stuck-pause** | `controlroom tick` reconciler (watch rows from `launch`, re-arm from board, `verify`, `note`); launchd plist install/uninstall in `init`; `health` with `stuck?`/`spinning?`/last-write + `$` in detail; `pause`/`play`/`logs/PAUSED`; **first task: prove `herdr agent list` works from launchd** (fallback `--loop`) | 004 (for `land`-aware re-arm only; can ship without) | yes |
| **006** | **wake-automations** | `wake` (once/recurring parser), `watch-path`, `automations`, `cancel`; §2.5 prompt-the-controller path with blocked/working/rate-cap handling and the one live test of mid-turn queuing; strip `AUTOMATIONS` line + header `next A### HH:MM`; template rule "say which automation wakes you" | 005 | yes |
| **007** | **dream-propose** | `prompts/dream.md`; `controlroom dream [--here]` renders brief + launches `dreamer`; `dream --check`; `promote`/`reject`; `land --older-than`; run it three times by hand and record in results whether anyone read the output (gate for scheduling it via 006) | 004, (006 for scheduling) | yes |
| **008** | **compaction-extension** | `extensions/controlroom.ts` (flush at 75 %, compaction event, `/flush`), `package.json` `pi.extensions`, tick shell fallback (context % from jsonl, post-compaction reconcile row), README "Layout" | 004, 005 | yes |

**Why 004 first:** zero runtime risk, pure files + ~100 lines; fixes the largest real loss (a resumed controller that reads nothing — critic §8); every later brief writes into the files it creates. **Why 005 before 006:** the tick is the engine; wakes are just rows it fires. **Why dream before the extension:** the extension's flush text asks the controller to do what dream/decide make possible; and dream's value should be measured before anything schedules it.

### Critic points — disposition
| Critic | Disposition |
|---|---|
| Cut FACTS | **Accepted** (§1.1) |
| Cut standing lander | **Accepted** (§5) |
| Cut $/tokens on strip | **Partly** — verified exposed and 21 ms; kept in detail view only; `stuck?` is the primary alarm (§6) |
| Cut LLM dream in hook | **Accepted** — hook sends a flush request; no model call (§7.2) |
| Watchers must not auto-prompt by default | **Accepted** — `prompt? = no` default for watch rows; wake rows yes; `CONTROLROOM_AUTOPROMPT=0` global off (§2.3) |
| One idempotent tick, not nohup loops | **Accepted** (§2) |
| Memory into briefs via controller, not launch | **Accepted**, with the one-sentence LESSONS skim in `launch` the critic's step A also lists (§1.5) |
| Dream propose-only, on demand, measured before scheduling | **Accepted** (§3, brief 007) |
| Boot section first, prompt-only | **Accepted** — brief 004 |
| Pin API against installed pi (1.4.0) | **Done** (§7.1) |
| `decide` requires `--from`; cap rendered view ~40; archive never delete | **Accepted** (§1.2–1.4) |

---

## 10. Verification log

| Claim | How |
|---|---|
| [V] pi **1.4.0** installed; no 0.85.1 | `pi --version`; `ls ~/.pi/pkg` |
| [V] `session_before_compact`, `ctx.getContextUsage()` (`percent`, `contextWindow`), `ctx.compact({customInstructions})`, `pi.sendUserMessage(…,{deliverAs})`, `pi.exec`, `pi.registerCommand`, `session_start` | `docs/extensions.md` §lifecycle; `examples/extensions/{custom-compaction,trigger-compact,border-status-editor,send-user-message,auto-commit-on-exit,file-trigger}.ts` |
| [V] packages ship extensions via `pi.extensions` | `docs/packages.md`; `~/.pi/agent/git/github.com/edxeth/pi-subagents/package.json`; this repo is a local package in `~/.pi/agent/settings.json` |
| [V] session jsonl path per agent | `herdr agent list` → `agent_session.value` |
| [V] cost/tokens/last-write-tool/compaction count from jsonl, 21 ms | `logs/scratch/003-session-cost.py` on 4 sessions |
| [V] `herdr api snapshot` has no cost/last-output | key dump of snapshot |
| [V] `herdr agent prompt` rejects when target blocked; `--wait/--until`; `herdr agent wait`; `herdr pane wait-output --regex` | `--help` texts |
| [V] launchd bootstrap of a plist outside LaunchAgents; `RunAtLoad` fired; calendar stream registered; bootout clean | `logs/scratch/003-launchd-test.plist`, `003-launchd-fired.txt` |
| [A] launchd catches up `StartInterval` after sleep; `StartCalendarInterval` fires (not observed separately — fired at load coincided) | — |
| [A] pi TUI queues text typed into the pane mid-turn as a follow-up | test in brief 006 |
| [A] thresholds: 75 % flush, 20/30 min stuck/spinning, 40/30 line budgets, 6 prompts/h, 30-day chat-source ageing | tune in 005/007 |
| [Q] `herdr` CLI usable from a launchd process (socket discovery without `HERDR_*` env) | first task of brief 005 |
| [Q] should wake rows prompt the controller by default, or should *everything* be toast-only until Lance opts in per project? | §2.3 default proposed: wakes yes, watches no |
| [Q] dream after pause — on by default? (proposed: off until 007 shows value) | §4 |
| [Q] seed LESSONS automatically from SKILL/README gotchas at `init`, or leave empty and let Lance curate? | §8 (proposed: seed, `--no-seed`) |
| [Q] keep `$` in detail view (this design) or cut entirely (critic)? | §6 |
