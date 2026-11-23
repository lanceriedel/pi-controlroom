---
marp: true
theme: gaia
class: invert
paginate: true
size: 16:9
style: |
  section { font-size: 24px; padding: 48px 56px; }
  section h1 { font-size: 1.5em; margin-bottom: 0.3em; }
  section h2 { font-size: 1.1em; }
  section.small { font-size: 18px; }
  section.tiny { font-size: 15px; }
  section pre { font-size: 19px; line-height: 1.35; background: #0b0d12; color: #f2f2f2; border: 1px solid #3a4250; border-radius: 6px; padding: 14px 18px; }
  section pre code { font-size: inherit; color: #f2f2f2; font-weight: 500; }
  section.small pre, section.tiny pre { font-size: 17px; }
  section.strip pre { font-size: 15.5px; line-height: 1.28; padding: 12px 16px; }
  section.brief pre { font-size: 14.5px; line-height: 1.3; padding: 12px 14px; }
  section.brief table { font-size: 0.72em; }
  section.brief .cols > div:last-child pre { font-size: 14px; }
  section.brief .cols { display: grid; grid-template-columns: 1.25fr 1fr; gap: 20px; align-items: start; }
  section.brief .cols p, section.brief .cols li { font-size: 0.82em; }
  section.strip table { font-size: 0.66em; }
  section.legend table { font-size: 0.82em; line-height: 1.25; }
  section.legend table td, section.legend table th { padding: 0.3em 0.5em; }
  section.legend .cols { gap: 36px; align-items: start; }
  section.strip table td, section.strip table th { padding: 0.15em 0.4em; }
  section :not(pre) > code { color: #ffd479; background: #0b0d12; padding: 0.05em 0.35em; border-radius: 4px; border: 1px solid #3a4250; }
  section pre .pass { color: #7ee787; font-weight: 700; }
  section pre .fail { color: #ff7b72; font-weight: 700; }
  section pre .dim { color: #9aa4b2; }
  section table { font-size: 0.78em; line-height: 1.15; }
  section table td, section table th { padding: 0.25em 0.5em; }
  section.tiny table { font-size: 0.95em; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  .cols3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .dim { color: #9aa4b2; }
  .open { color: #f3c969; }
  footer { font-size: 12px; color: #6b7480; }
footer: 'Running a control room · Lance Riedel · Nov 2026 · internal'
---

<!-- _class: invert lead -->

# Running a control room

## One controller, many workers, everything is a file in git.

### Closing the laptop pauses *me*, not the project.

<span class="dim">pi + Herdr + pi-controlroom · ~25 min · for engineers who already use pi</span>

<!--
Hi. This talk is about how I actually work day to day: one AI controller per project, a pile of worker agents, and a rule that everything that matters is a Markdown file in git. When I close the laptop, I stop — the project doesn't, because the state is in files and the long jobs are on a VM. Most of you use pi; many use Herdr. Few of you have seen the control-room layer on top, so that's where I'll spend the time. Every number I show traces to a file or a command; the sources are in the notes handout. Nothing here is marketing. Where something is unproven or still open, I'll say so.
-->

---

<!-- _class: invert small -->

# Herdr + pi in 90 seconds

<div class="cols">
<div>

**pi** — the agent
- a coding agent with sessions on disk (`~/.pi/agent/sessions/*.jsonl`)
- extensions (TypeScript hooks), skills, prompt templates
- talks to models through the Shopify proxy
- one pi = one pane = one job

</div>
<div>

**Herdr** — the multiplexer
- panes · tabs · workspaces, local **and** remote (`herdr --machine dev002 …`)
- knows each pane's **agent state**: working / idle / done / blocked
- `herdr agent list | prompt | read | focus`

</div>
</div>

```text
$ herdr agent list | …name · status · pane · cwd…      # 68 agents, 8 shown (11-23 13:35)
controller        idle     wC:p1   pi-controlroom
talk-deck         working  wC:pT   pi-controlroom
gs-controller     done     wD:p1   graph-search
gs-curated        working  wD:pT   graph-search
kumo-controller   idle     wF:p1   kumo-research
upi-controller    working  wG:p1   upi-clustering-research
ti-controller     done     wH:p1   taste-id-research
gsd-controller    done     wJ:p1   gsd-reviews
```

<!--
Two tools, quickly. pi is the agent: a session is a JSONL file on disk, it has extensions and skills, and it reaches models through the Shopify proxy. One pi, one pane, one job. Herdr is the multiplexer that owns those panes — locally and on remote machines with the same CLI — and it knows the state of the agent in each pane: working, idle, done, blocked. Four commands matter: list, prompt, read, focus. The capture is my laptop right now: sixty-eight agents; I've shown eight, one controller per room. Everything in this talk is built on those primitives.
-->

---

<!-- _class: invert -->

# Why I built it

**September:** one project, ~15 worker agents in Herdr tabs, and the plan lived in one controller's chat.

What broke:
- **Chat is ephemeral and private** to one agent — compaction, a crash, laptop sleep or a new session lost *why* we decided, what bit us, what was scheduled, what was in flight
- the files that *did* survive (`STATUS.md`, `results/`, `agents.log`) were **never read back** by a fresh controller
- `nohup` watcher loops **died with Herdr**; a worker sat **26 h** at 98 % CPU while the strip said `working`
- laptop sleep killed pipelines mid-write; "ok, what happened overnight?" had no answer

<span class="dim">Design rule that fell out: files first · the human closes the loop · verifiable, not vibes · cheap to run, cheap to leave.</span>

<!--
Here's the situation in September. One research project, around fifteen worker agents in Herdr tabs, and the plan lived in the controller's chat. Every failure mode came from that. Compaction or a crash lost the reasoning. The files that did survive were never read back by a fresh session. The watchers were nohup loops that died with Herdr. The one that really stung: a worker sat twenty-six hours at ninety-eight percent CPU while the strip said "working". And when the laptop slept, pipelines died mid-write. So the design rules that fell out were simple: files first, the human closes the loop, every claim verifiable, and cheap enough to leave running.
-->

---

<!-- _class: invert small -->

# The operating model

<div class="cols">
<div>

```text
┌───────────────────────────────────────────┐
│ CONTROLLER tab                            │
│  ┌─────────────────────────────────────┐  │
│  │ controller pi ← you talk here       │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │ status strip  ← agents·events·memory│  │
│  └─────────────────────────────────────┘  │
├───────────────────────────────────────────┤
│ worker: 018 │ worker: critic │ pipeline…  │
└───────────────────────────────────────────┘
 docs/briefs/NNN.md ──▶ worker ──▶ results/NNN.md
 docs/briefs/STATUS.md ◀── controller integrates
```

</div>
<div>

| Piece | What it is |
|---|---|
| **Controller** | one pi per room; briefs, launches, integrates — never does > 5-min work itself |
| **Briefs → results** | `docs/briefs/NNN-slug.md` → `results/NNN-slug.md`; work is specified and reported in files |
| **Board** | `STATUS.md`: who's on what, landed, waiting on the human |
| **Memory** | `DECISIONS.md` + `LESSONS.md`, one line each, every line cites a source |
| **Tick** | 60-s reconciler (launchd): watches, wakes, stuck?, re-arm, republish |
| **Automations** | `AUTOMATIONS.md` ledger: watch · wake · watch-path · play |

</div>
</div>

<span class="dim">Footprint today: `bin/` 2,335 lines of bash + python3 (stdlib), one 98-line pi extension, three prompt templates. No server, no DB, no daemon beyond launchd.</span>

<!--
This is the whole shape. One controller pi per room — I talk to it, it writes briefs, launches workers in their own tabs, and integrates results. It never does long work itself. Six pieces: the controller; briefs that become results, both files; the board, STATUS.md, which is the one shared truth; memory — decisions and lessons, one line each, every line sourced; the tick, a sixty-second reconciler launchd runs; and automations, a Markdown ledger the tick reads and rewrites. The footprint is about twenty-three hundred lines of bash and Python, a ninety-eight-line pi extension, three prompt templates. No server, no database.
-->

---

<!-- _class: invert small brief -->

# A brief is a contract

<div class="cols">
<div>

**`graph-search/docs/briefs/005-graph-walk-operator.md`** — a real one (trimmed), the brief that produced the engine-native operator:

```text
# 005 — The first index-serving change: a Java graph_walk
#       operator (+ customData explanations), on the local stack
host: dev002

## Objective
003 showed the walk works from a user Scripty with no engine
change — with three engine gaps … 005 makes the first, deliberately
small, index-serving change … built, run and measured on dev002
against the 1 M product / 2 M edge collections from 004, so that
when we propose it to Jonathan's team it comes with a working
prototype and numbers.

## Inputs
- docs/design/003-graph-in-vantage.md §2 §4 §6 · 003-query-shapes §4.1
- results/004-scale-real-data.md "What to do next" (1) — 005 owns it
- index-serving @ main dc40053a1f (do not move); patterns to copy: …
- live: graph_product/v_0_4 (1,046,870) · graph_edge/v_0_3 (2,049,392)

## Constraints
- L004 pin-shared-checkouts — branch off dc40053a1f, never pushed
- L005 human-only-prerequisites — Cloudsmith creds: BLOCKED on <token>
- Java change small and reviewable: ≤ ~400 lines; no shard/proto changes
- Time-box 8 h · log START/END rc= per step · partial result per phase

## Deliverables
- branch + exported diff with a PR-style README · design doc · side-by-sides
- results/005-graph-walk-operator.md ≤ 12 bullets + metrics, "DONE 005"
```

</div>
<div>

**Anatomy** — every brief has the same six parts:

| part | what it does for the worker |
|---|---|
| `host:` | which room launches it (laptop · dev002 · c4d) |
| **Objective** | the *why*, with the prior results it builds on |
| **Inputs** | exact paths, pinned shas, live collection names |
| **Constraints** | the room's **memory lines quoted verbatim** (L004, L005 …), scope, time-box, logging |
| **Deliverables** | files, sizes, the `DONE NNN` sentinel |
| `## Acceptance` · `writes:` | shell checks + allowed paths — **enforced at `land`** (018) |

**What came back** (landed 11-09): Java `graph_walk` operator + `customData` explanations — 2-round lifts brand-path **42 → 63 %**, 17 / 24 ms p50/p95; **+1,054 lines**, **13/13 tests**.

**The contract part** — 005 predates it (11-08); written today it would end with:

```text
## Acceptance
cr_has_section "$RESULT" "## Metrics"      # G-walk vs G-walk-op
cr_has_sentinel "$RESULT" 005
test -f "$ROOT/src/graph_vantage/patches/005-*.diff"
cr_max_lines "$RESULT" 60
writes: src/graph_vantage/**, docs/design/005*, results/005*
```

`land` → `check` → `judge` (read-only `pi -p`, quoted evidence) → `ACCEPT` / `NOTES` / `REJECT`.

</div>
</div>

<!--
This is a real brief, not a toy: the one that got graph-search its first engine-native change. Read the shape, not the
content. Objective says why and what it builds on. Inputs are exact — paths, a pinned sha, collection names with counts —
because a worker that has to guess will guess wrong. Constraints start with the room's memory lines quoted verbatim: the
lesson about pinned checkouts and the one about credentials only I have; so the worker inherits what the room already
learned. Deliverables name files and the sentinel. Since last week there's a seventh part: an Acceptance block and a
writes: line, and `land` refuses a result that fails them; then a cheap judge grades the result against the brief with
quotes. The worker came back with an operator, numbers, and tests — in eight hours on a VM.
-->

---

<!-- _class: invert tiny strip -->

# The board & the strip

`NO_COLOR=1 controlroom status` · graph-search, three hosts, 14 agents — **illustrative composite** of a busy afternoon (real names, states and layout from the 11-17 logs; times/costs combined for one picture)
```text
 CONTROL ROOM  Mon 16:42  graph-search   (say "ok" in CONTROLLER to integrate · blocked = needs you)   tick ok 16:42:07
   next A089 18:31
 ROOMS  local ▶gs-controller ⇄ dev002 ▶gs-remote ‹PRIMARY› ⇄ c4d ▶gs-c4d · MODE: remote · sync: HEAD 4c3f929f · ahead 0 · behind 0
 AGENTS  (detail on — Ctrl+B D to toggle)  ▶ = controller
 ▌ LOCAL · Lances-MacBook-Pro · 3 agents ─────────────────────────────────────────────────────────────────────────────
   ▶ idle     gs-controller      wD:p1   standby            last write 4m  · ctx 31%
   │ working  gs-images          wD:pC   023-images-cards   last write 1m  · ctx 44%
   │ blocked  gs-proof-eval      wD:pF   039-cross-track C  last write 12m · ctx 61%   NEEDS YOU: judge cache lease?
 ▌ DEV002 · reachable · 6 agents ───────────────────────────────────────────────────────────────────────────────────────
   ▶ idle     gs-remote          w2:pM   ‹PRIMARY›          last write 2m  · ctx 18%
   │ working  gs-fix             w2:pC   014-fixes-iterate  last write 0m  · ctx 52%
   │ working  gs-scale7m         w2:p9   007-scale-7m       last write 23m · ctx 37%   stuck?
   │ done     gs-judge           w2:p5   010-seed-free      last write 1.1h · ctx 29%  ✓ acceptance · ⚖ ACCEPT
   │ done     gs-graph           w2:p4   003-graph-in-vantage  last write 2.3h          ✓ acceptance
   │ idle     gs-vantage         w2:p3   —                  last write 6.0h
 ▌ C4D · reachable · 5 agents ───────────────────────────────────────────────────────────────────────────────────────────
   ▶ idle     gs-c4d             w1:p3   standby            last write 9m
   │ working  gs-widen           w1:p6   015-widen-eval     last write 0m  · ctx 48%
   │ working  gs-haystack        w1:p7   016-haystack-c4d   last write 3m  · ctx 71%
   │ working  gs-dense           w1:p9   039-native-prf     last write 1m  · ctx 55%
   │ done     gs-publish         w1:p4   006-publish-status last write 1.2d          ✓ acceptance · ⚖ NOTES
 TICK  last 16:42:07 · 2 actions        COST  controller $27.35 · workers $411.80 · today $63.10
 MEMORY  74 decisions · 162 lessons · 0 proposed · last dream never      AUTOMATIONS  5 armed · next A089 18:31 (in 1.8h) · fired today 9
```


<!--
The board is STATUS.md; the strip is the board plus live state, refreshed every fifteen seconds in a pane under the controller. Above is a real capture from this room, trimmed. Top down: the header says the tick is alive and when the next wake is. ROOMS shows one controller per host and which one is primary. AGENTS is grouped by host; the arrow marks controllers; detail mode adds last write, context percent and the acceptance chip — you can see this worker failing acceptance while it's still working, which is correct. Then cost in detail only, memory counts against budget, and automations. One rule from the legend: red means a human is needed. Everything else, the controller handles.
-->

---
<!-- _class: invert legend -->

# Reading the strip

<div class="cols">
<div>

| line | what to read |
|---|---|
| header | `tick ok HH:MM` or red `NO TICK`; `PAUSED since …`; `next A###` |
| **ROOMS** | one `▶controller` per host, `‹PRIMARY›` chip, `MODE:` from the board, git ahead/behind |
| **AGENTS** | grouped by host; `▶` = controller; detail adds task · last write · ctx % · `✓/✗ acceptance` · `⚖ judge` |
| **PIPELINES / EVENTS** | `logs/*.log` with START/END markers · last 5 lines of `logs/agents.log` |
| **MEMORY / AUTOMATIONS** | counts vs budget 40/30 · armed · next · held · fired today |

</div>
<div>

| colour | state | meaning |
|---|---|---|
| yellow | `working` | busy |
| green | `idle` / `done` | results probably on disk |
| **red** | `blocked` | **the only state that needs a human** |
| **red** | `stuck?` | working, no write 20 min, session quiet 10 min |
| yellow | `spinning?` | burning tokens, nothing written 30 min |

</div>
</div>

<!--
The legend. Three things to remember: the header line tells you if the room is alive (tick ok, or a red NO TICK); every host gets its own group with its controller marked; and of all the colours, red *blocked* is the only one that needs a human — everything else is the room working or waiting on itself.
-->

---

<!-- _class: invert small -->

# Memory

Two append-only, bounded files. Grammar: `- D### YYYY-MM-DD **slug** — one-liner ← source` — **no source, no line**; the CLI refuses. Budget **40 decisions / 30 lessons** (today: 30 · 30).

```text
- D002 2026-10-27 **wakes-prompt-watches-dont** — automations: wake rows prompt the controller by default, watch rows
       do not (toast+log only); CONTROLROOM_AUTOPROMPT=0 forces toast-only ← docs/design/durable-controlroom.md#2.3-cli
- D015 2026-10-27 **controller-by-pane-id** — controller pane id pinned in logs/.controller by init/tick-install;
       automations resolve the controller by pane id, name is a label
       ← docs/briefs/results/006-wake-automations.md:logs/.controller
- D031 2026-11-17 **briefs-are-contracts** — briefs are contracts: writes: globs + ## Acceptance sh block; land runs check
       and refuses failing rows; --force must say why in the one-liner
       ← docs/briefs/results/018-acceptance-checks.md:"land refuses failing rows"
- L005 2026-10-27 **timebox-local-compute** — a worker sat 26 h on one unbounded call at 98 % CPU while the strip said
       `working` — briefs must time-box compute and demand partial outputs ← skills/controlroom/SKILL.md:"blocked 26 h"
- L028 2026-10-27 **mechanism-needs-log-line** — a lesson asserting a mechanism needs a log line from that mechanism
       (ext-error/compaction with source tag), not a pane glance — L023 was wrong
       ← docs/briefs/results/009-durability-tests.md:needs a log line from that mechanism
- L046 2026-11-10 **compaction-storm-breaker** — compaction at 167% ctx (gpt-6.1-sol/272k) never shrank: 79 flush→/compact
       loops, $350 — breaker added; recovery is a fresh session + Boot, not another compact ← extensions/controlroom.ts:"circuit breaker"
```

- **Into briefs:** every brief's Constraints section quotes the D/L lines that apply, verbatim (D007)
- **Dream:** `controlroom dream` → a worker *proposes* `P###` lines; `dream --check` greps every citation; a person `promote`s or `reject`s — nothing auto-promoted
- **Flush at 75 % ctx:** the extension asks the controller to record what's missing, then `/compact`
- **Boot order** (every start/resume): `STATUS.md` → `controlroom memory` → `tail logs/agents.log` → `automations` → `herdr agent list` + `verify` each worker → unread `results/` → arm the round wake if missing

<!--
Memory is two files, decisions and lessons, one line each, with a hard grammar: ID, date, slug, one-liner, source arrow. No source, no line — the CLI refuses. Budget is forty and thirty; we're at thirty and thirty. These six lines are real. D015: the controller is a pane id, not a name. L005 is the twenty-six-hour worker. L046 is the compaction storm I'll get to. Memory reaches workers through the brief: the controller pastes the applicable lines verbatim. A dream step only proposes; a person promotes. At seventy-five percent context the extension asks the controller to flush, then compacts. And Boot — the order a fresh controller reads files in — is what makes any of this survivable.
-->

---

<!-- _class: invert small -->

# Automations

`docs/briefs/AUTOMATIONS.md` — the ledger *is* the state; the tick reads and rewrites it every minute.

```text
id    kind                    state      next (local)  repeat          prompt?  instruction
A033  wake                    fired      11-06 04:57   once            yes      014 proof: reply TAKEN-OK
A040  watch-path results/018  cancelled  —             on-change       yes      018 result changed: if it contains DONE …
A042  wake                    cancelled  11-24 08:00   weekdays 08:00  yes      round: … daily while the room is idle — …
A043  watch talk-deck         armed      —             —               no       integrate 020-talk-deck when DONE
A044  wake                    armed      11-23 15:34   every 2h        yes      round: integrate DONE workers, controlro…
```

**The round wake** (the controller arms it itself at Boot, D020): `round: integrate DONE workers, controlroom land, update STATUS.md; this wake repeats every 2h`

**Prompt uptake** — the tick checks the controller's session actually ran a turn (014; L039 — 08:00 wakes died to connection errors seconds after the Mac woke):
```text
[11-08 16:34] A036 turn aborted (Connection error.) → re-prompted        (logs/agents.log)
[11-09 10:38] A036 turn aborted (Request timed out.) → re-prompted
[11-06 04:54] A032 prompt taken (controller turn ran)                    (logs/tick.log)
```

Guards: wakes prompt, watches only toast (D002) · ≤ 6 prompts/h · `logs/AUTOPROMPT-OFF` per room · paused rows go `held`, collapse into one `[play]` prompt.

<!--
Automations are rows in a Markdown table. The tick reads it, fires what's due, rewrites it — kill the tick, lose nothing. Watch rows are armed by every launch and only toast. Wake rows prompt the controller at a time; the important one is the round wake: every two hours, integrate, land, update the board. The controller arms that itself at Boot — "A44 wakes me at 15:34" is behaviour, not prose. Prompt uptake came from a real failure: eight o'clock wakes died to connection errors seconds after the Mac woke, so the tick now checks the controller actually ran a turn and re-prompts if not. Guards: six prompts an hour, a per-room kill switch, and pause holds rows.
-->

---

<!-- _class: invert tiny -->

# Durability, honestly

| What happens | What survives | Proof | Still open |
|---|---|---|---|
| **Compaction** | memory + board (flush at 75 % → `/compact` → post-compaction wake → Boot) | 012 S6: extension-triggered `compaction — #2 tokensBefore=80674`, nobody typed `/compact` (L030) | automatic ≥ 75 % path proven only via the manual `/flush` route (012 Still open) |
| **Controller restart / fresh session** | everything — files are the memory | 009 S1 scratch Boot; graph-search 11-10/11-11/11-13 fresh sessions from files; model hand-offs via `handoff.md` | — |
| **Herdr / Mac reboot** | tick + ledger + watch rows re-armed from the board | 009 S2 (`launchctl bootout` → back in ~10 s); 11-10 reboot killed every tick → plist moved to `~/Library/LaunchAgents` (L044) | pane *name* lost on restart — Boot step 5 reclaims it; Herdr-restart S10 **never tested** |
| **Sleep / lid closed** | schedule (wakes fire late, not never); remote workers | A025 fired 6 min late ×2 (L035); 014 re-prompt on error-aborted turns (L039); weekend 11-15/16: machines down 53 h, all four controllers alive | local workers' in-flight API calls do not survive (L002) |
| **Human absent for a day** | rounds every 2 h; land; status page republished | graph-search 11-17: 11 rounds, 2 lands, 2 launches with nobody typing (`logs/agents.log`) | `blocked` waits for a person — by design |

**The 167 % storm (graph-search, 11-10 10:08)** — gs-controller on gpt-6.1-sol (272 k window) hit 167 % ctx · the extension's flush → `/compact` loop ran **79 times in 20 min (~$350)** and compaction never reduced tokens · stopped by hand: held the flush marker, Esc, killed the pid · **fix:** a 30-min circuit breaker in the extension (27933ca; L046) · **recovery:** a fresh `gs-controller` session booted from files at 16 % ctx — *that is the design working, not failing.*

<!--
This table is the honest version. Compaction: the flush loop is proven live with a log line, but only through the manual flush route. Fresh sessions from files: proven repeatedly, including model hand-offs in graph-search. Reboot: tick and ledger come back; on November tenth we learned that launchd units outside LaunchAgents die on reboot. Sleep: wakes fire late, not never; a weekend with machines down fifty-three hours left all four controllers alive. Then the storm: a controller at one-sixty-seven percent context looped flush-compact seventy-nine times in twenty minutes, three hundred fifty dollars, and never shrank. We added a breaker. Recovery was a fresh session booted from files — exactly what the design is for.
-->

---

<!-- _class: invert tiny -->

# Remote machines

<div class="cols">
<div>

| host | what runs there |
|---|---|
| **laptop** (`local`) | the primary controller · anything needing my identity: SSO, browser, publishing, Drive, chat |
| **dev002** (n4-standard-16) | ingest / scan · long jobs · a standby controller `gs-remote` · own Herdr server, clone, `tick --loop` |
| **c4d** (c4-standard-48) | serving / judge / demo / latency workers |

- every brief header says who owns it: `host: local` or `host: dev002`
- `controlroom mode remote dev002` → pulls, refuses a dirty board, rewrites `MODE:`, writes a `## HANDOFF` block, signed commit, push, prompts **both** controllers; `mode local` hands it back
- measured round trip, brief pushed → worker DONE → verified on the laptop: **~65 s**

| where you look | primary | standby |
|---|---|---|
| Herdr workspace label | `graph-search ★` | `graph-search` |
| controller tab | `★ CONTROLLER` | `CONTROLLER · standby` |
| strip `ROOMS` line | `dev002 ▶gs-remote ‹PRIMARY›` | `local ▶gs-controller` |
| board, first line | `MODE: remote since <time> (controller (dev002): gs-remote …)` | — |

</div>
<div>

graph-search · `NO_COLOR=1 controlroom status` · 11-23 13:35 (trimmed)
```text
 ROOMS  local ▶gs-controller ‹PRIMARY› ⇄ dev002 ▶gs-remote ⇄ c4d ▶—
        · MODE: local · sync: HEAD 4c3f929f · ahead 0 · behind 0
 AGENTS  ▶ = controller
▌ LOCAL · Lances-MacBook-Pro · 16 agents ───────────────
  ▶  done     gs-controller   wD:p1 ‹PRIMARY›  ctx 68%
  │  stalled  gs-keyauto      wD:p8   last write 13.9d
  │  stalled  gs-images       wD:pC   last write 10.0d
  …
▌ DEV002 · reachable · 4 agents ────────────────────────
  ▶  idle     gs-remote       w2:pM
  │  idle     gs-controller-dev002-old w2:p1
  …
▌ C4D · reachable · 11 agents ──────────────────────────
  │  idle     gs-c4d          w1:p3
  │  idle     gs-widen        w1:p6
  …
```
<span class="dim">Same strip, three hosts, one picture. All four labels are derived from the board's `MODE:` line by the tick, every minute, on every host.</span>

</div>
</div>

<!--
Here is how the laptop problem is solved. Three hosts. The laptop runs the primary controller and anything needing my identity. dev002 runs ingest and long jobs and a standby controller with its own Herdr, clone and tick. c4d runs serving and the judge. Each brief says which host owns it. Before closing the laptop I run `controlroom mode remote dev002`: it pulls, refuses a dirty board, rewrites the MODE line, writes a hand-off block, commits signed, pushes, and prompts both controllers with their roles. The next tick moves the star, the tab labels and the PRIMARY chip — all derived from the board, so they never disagree. The capture: sixteen agents local, four on dev002, eleven on c4d, one strip.
-->

---

<!-- _class: invert small -->

# The projects

| room | what it is | briefs | one number | hosts |
|---|---|---|---|---|
| **pi-controlroom** | the tool itself | 18 | 30 D · 30 L in memory; 0.2.x verified by 009–012 | local |
| **lookbook-research** | taste graph from merchant curation + purchases | 51 | fashion v2: 354 shops · 1.42 M buyers · 79 M line items | local + dev002 |
| **graph-search** | graph-shaped storefront search inside Vantage | 107 | 59 landed · 74 D / 162 L · 37 sessions ≈ $1,050 | local + dev002 + c4d |
| **kumo-research** | Kumo / NVIDIA relational FMs vs tuned flat models | 64 | Q1 answered **NO** (n = 160, 3 universes); room PAUSED on Q6 | local + dev002 + c4d |
| **upi-clustering-research** | UPI clustering at 10 B products — shingling thesis | 10 | 10.13 M real products scored; 45 % @ J≥0.7 | local |
| **taste-id-research** | per-person taste code × taste graph × graph search | 5 | set up 11-17; 5 briefs landed | local + dev002 |
| **gsd-reviews** | my OK1/OK2 review desk (Vault) | 1 | 6 prepared reviews + INBOX from one brief | local |

<span class="dim">Also running: personalized-search-demo (25 briefs; the first two-controller room). Brief counts: `ls docs/briefs | grep -c '^[0-9]'` on 11-23. Each row's number comes from that room's `STATUS.md` or `docs/status/preamble.md` — see notes.</span>

<!--
Seven rooms. pi-controlroom builds the tool and eats its own output on every launch. lookbook-research is where the shape came from — the taste graph, fifty-one briefs. graph-search is the big one: a hundred and seven briefs, fifty-nine landed, three hosts, about a thousand dollars of model spend across thirty-seven worker sessions — and a memory file far over budget, which is a real problem I'll come back to. kumo-research answered its first question with a decision-grade no and is paused waiting for me. upi-clustering ran shingling on ten million real products. taste-id is a week old. And gsd-reviews is a control room pointed at my own review inbox. The pattern is the same in every one of them.
-->

---

<!-- _class: invert small -->

# A day in the life — graph-search, Mon 2026-11-17 (`logs/agents.log`)

```text
[11-17 08:08] A085 turn aborted (401 … AuthenticationError …) → re-prompted     ← Mac just woke; tick retries
[11-17 08:27] overnight backlog serviced once: idle; nightly pull ok on dev002    ← Boot + round
[11-17 08:40] A002#71: idle; figures resized for Docs; L160                      ← a lesson recorded
[11-17 12:31] A085#23: idle; 089 (Cloud Run+IAP access) proposed to Lance        ← a question for the human
[11-17 12:55] 088 exec flow graphic on warm gs-diagram                           ← follow-up to a warm worker
[11-17 13:06] worker gs-diagram: DONE — results in docs/briefs/results/
[11-17 13:12] 088 landed; overview = single doc; brief → pointer                 ← land → status page republished
[11-17 13:40] launched gs-research — docs/briefs/090-graph-search-landscape.md in wD:pS
[11-17 14:01] worker gs-research: DONE — results in docs/briefs/results/
[11-17 14:13] 090 landed+published; overview 6.10; 091 (F4+F1) proposed
[11-17 15:16] HANDOFF → dev002 gs-remote; laptop controller paused (shutdown)   ← laptop closes
[11-17 15:19] laptop wakes A002/A085 cancelled; remote gs-remote (dev002 w2:pM) is primary
[11-18 08:31] controller mode: local — laptop primary; gs-remote standby; wakes re-armed
```

<span class="dim">Honest footnote: this room was running **two** recurring wakes (A002 + A085). On 11-18 that was corrected — one recurring round per room is the rule (L163 graph-search).</span>

<!--
One real day, from the log. Eight-oh-eight: the first wake fires seconds after the Mac wakes and dies to an auth error; the tick re-prompts. Eight twenty-seven, Boot and the overnight round. Morning rounds come back idle and record a lesson. At half twelve the controller proposes brief 089 to me — that's a question, the one thing that waits. Early afternoon: a follow-up to a warm worker, DONE, landed, status page republished; then a new launch, DONE in twenty minutes, landed and published. Three-sixteen I shut the laptop; the room hands off to dev002. Next morning I take it back. The footnote matters: this room ran two round wakes, which is wrong; we fixed the rule the next day.
-->

---

<!-- _class: invert small -->

# Publishing: lancedocs

```text
 STATUS.md + controlroom health + docs/status/preamble.md (hand-written narrative, never overwritten)
        │   controlroom status-page [--no-landed] [--snapshot]        ← runs after every launch and land
        ▼
 docs/status/latest.md + latest.html          (bin/controlroom-md2html, python3 stdlib, dark theme)
        │
        ├─▶ controlroom-pages push            → orphan gh-pages branch, one force-pushed commit
        │        https://lanceriedel.github.io/pi-controlroom/status/latest.html
        │
        └─▶ docs/status/publishers.sh          (room-local, runs after the push; STATUS_HTML in env)
              cp → ~/.brain/memory-bank/personal/docs/<room>/where-we-stand-latest.html
              bash ~/.brain/memory-bank/personal/docs/deploy-lancedocs.sh   → lancedocs (SSO)
                     └─▶ Google Docs mirror (psd 011: 54 native Docs, md5 manifest, owner-only)
 --snapshot → docs/status/YYYY-MM-DD-latest.md ; dated snapshots → ~/.brain/…/docs-archive/
```

- `--no-landed` + a narrative **preamble** when the human-written story should carry the page (graph-search does this)
- event-driven, never on a clock (D029); one line per run in `logs/publish.log`; a committed symlink under `docs/` breaks Pages (L042)
- publishing needs *my* identity → `host: local`; a remote room queues it under `## Pending publish (local)`

<!--
Nobody should have to read a board to know where a project stands, so every launch and land republishes a page. The renderer takes the board, live health, and a hand-written preamble the tool never overwrites, and produces Markdown and HTML. Two publishers: GitHub Pages via an orphan branch, one force-pushed commit, so source history never carries rendered HTML; and a per-room shell hook that copies the HTML into my lancedocs tree and runs the deploy script, which in turn mirrors to Google Docs. Graph-search turns the landed table off and lets the preamble carry the story. Event-driven, never on a clock; it needs my identity, so a remote room just queues it.
-->

---

<!-- _class: invert small -->

# Verification culture

**The 0.2.0 gate (10-27 → 10-28):** design (003) + critic → build (004–008) → **test** (009) → **scorecard** (010) → **review** (011) → **fix** (012) → re-test → commit `327109a`.

| 009 scenario | grade | after 012 |
|---|---|---|
| S1 fresh controller boots from files | pass (silent name collision) | pass, collision printed |
| S2 tick survives restart & re-arms | pass | pass |
| S3 `stuck?` fires on a silent worker | **FAIL** (cache_warm kept the session "busy") | **pass** at 20 min, with the log line |
| S4 pause drains / holds / collapses | pass | pass |
| S5 mid-turn wake queued, not dropped | pass | pass |
| S6 compaction flush loop | partial (typed `/compact`) | **pass**, extension-triggered |
| S7 second room on one machine | pass | pass (+ real-world L036 fix) |
| S8 dream after a batch · S9 kill switch & rate cap | pass · pass | pass · pass |
| S10 Herdr restart | **untested** | **untested** |

011 code review: **3 blockers · 12 should-fix → "not safe to commit"**. 012 fixed all of them and re-proved S3/S6 — every claim with a mechanism log line (L028), not a pane glance.

**Found in use → fixed in the tool → every room inherits it within a minute** — `~/.local/bin/controlroom` is a symlink into the repo (L032): the Nov-10 reboot lesson (L044), the storm breaker (L046), the `is_ctl` fix that broke another room's strip (L036).

<!--
The thing I'm proudest of isn't a feature. Before committing 0.2.0, a worker ran ten scenarios against the live room: fresh boot, tick restart, stuck detection, pause, mid-turn queuing, compaction, two rooms, dream, the kill switch, a Herdr restart. Stuck detection failed — pi's cache warming kept the session looking busy. Compaction was partial. A code review said "not safe to commit", three blockers. A fix brief closed all of it and re-proved the failures with log lines, not screenshots. One scenario is still untested; I say so. Because the CLI is symlinked, a fix found in any room reaches every room within a minute — which is also how a bad save would, hence the lessons about WIP copies.
-->

---

<!-- _class: invert tiny -->

# Not Torrent — and not trying to be

<div class="cols">
<div>

**013 comparison** (Tobi's ULTIMATE harness, screenshot-inferred — we never saw the code):

| area | his | ours | verdict |
|---|---|---|---|
| coordinator | in-app, "2 waiting on you" badge | `controller` pi in a pane; `WAITING ON LANCE` list | spirit |
| landing | Lander agent merges branches | `land` moves rows; results are files, not branches | cut on purpose |
| memory | decisions · 118 facts · lessons, 6.8 k tokens | D + L only; **every line sourced, CLI refuses otherwise** | ours better |
| automations | instant, in-app | ledger + 60-s tick; controller arms its own round | same, slower |
| flush / dream | "Dream before compaction" | flush at 75 %, propose-only dream, human promotes | spirit |
| UI | rich bar, panels, dialogs | one text strip | **his better** |
| `core changed → restart` | on the bar | nothing — controller may run stale prompts | **his better / open** |
| verification | not visible | 009/010/011/012 in `results/` | ours better |

</div>
<div>

**Torrent** (paraphrased from the Nov Slack threads; see notes):
- issues → agents → Delta PRs; a platform, a team, a backlog
- **Objectives**: a lead agent plus a *charter*, enforced by a **judge agent**
- user complaints: "no way to steer" mid-run
- open question: PII in transcripts

**What I borrowed:** the judge as a completion gate (019: `check` → `judge` at land; `must:` lines are hard).

**The bridge:** a controller can brief Torrent too — the brief is a file, the result is a file; whether a worker is a pane or a Torrent issue is a `host:` decision.

**What it is not:** a platform. One person, a folder, bash + python, no server.

</div>
</div>

<!--
People ask how this relates to Torrent: it isn't one and isn't trying to be. The left table is brief 013, comparing to Tobi's personal harness from a screenshot — we never saw his code. His is better on UI, and on a "core changed, restart" indicator we still lack. Where ours is better: sourced, enforced memory and a verification trail in the repo. Torrent is a platform: issues become agents become PRs, and Objectives add a lead agent with a charter enforced by a judge. I borrowed the judge idea directly — brief 019. The bridge: a brief is a file; a Torrent issue could be one kind of worker. But this is one person, a folder, and bash.
-->

---

<!-- _class: invert small -->

# Costs & models

**graph-search, 37 worker sessions ≈ $1,050** (computed 11-11 from the pi session jsonl):

| model | sessions | turns | spend | outcome |
|---|---|---|---|---|
| claude-fable-5-1 | 24 | 3,921 | **$963** | 10 of 12 briefs DONE |
| gpt-6.1-sol | 10 | 1,491 | $39 | cheap; slower rounds |
| gpt-5-mini | 4 | 1,769 | $39 | **0 DONE** |

**Controllers:** sol ≈ **$27/day** vs fable ≈ **$348/day** on graph-search — and on 11-13 I moved *all* controllers to fable anyway (D030: "sol too slow in the controller loop"). Today's strips: pi-controlroom controller $342 lifetime; graph-search controller $651.

**Judge:** $0.05–0.10 per review (`judge 015: ACCEPT WITH NOTES ($0.0664)`).

Rules of thumb I actually use:
- **fable** for build / eval workers · **sol** for a controller if you accept slower rounds · **never mini for deliverables**
- **never switch a model mid-session** — write a `handoff.md`, start fresh (L091 graph-search: a 590 k history does not fit a 400 k model by picking it from a menu)
- `$` lives in the strip's detail view only (D004); the primary alarm is *no progress*, not spend

<!--
Money, plainly. Graph-search's thirty-seven worker sessions cost about a thousand dollars. Fable did almost all the useful work and the spending: ten of twelve briefs done. Sol was cheap and slow. Mini cost the same as sol and finished nothing — never mini for deliverables. For controllers, sol was twenty-seven dollars a day versus three hundred forty-eight for fable, and I still moved every controller to fable mid-November because the round loop was too slow on sol. The judge is pennies. And one rule I learned the expensive way: never switch models inside a session — write a hand-off file and start fresh. Cost is in the detail view on purpose; the alarm that matters is no progress.
-->

---

<!-- _class: invert small -->

# Future

- **A hosted controller** — the laptop controller still sleeps with the lid. pi.shopify.io has the shape: Pi Durable sessions on Cloud Run + Postgres, tab ↔ server, timer wake, a REST/SSE API, `pi.js`. Missing for us: filesystem + shell for the controller, and it's Mint + WARP only, so agents on this machine can't read it (brief 017 is waiting on inputs only I can fetch).
- **`controlroom launch --host <label>`** — today `launch` targets the local Herdr; remote launches are a one-liner or "ask the remote controller". `host-setup` is a checklist, not a command.
- **Tobi's remote workstations** — <span class="open">[Open — Lance to fill]</span>
  - <span class="open">[Open — Lance to fill: what they are, how a room would use one]</span>
- **Objectives-style charters** — a `must:` block is a charter in miniature; a standing room-level charter the judge grades every land against is the next step.
- **Drive publisher** — the lancedocs → Google Docs mirror exists (psd 011); make it a first-class `publishers.sh` recipe that any room gets by default.
- **Known gaps I haven't closed:** `core changed → restart` indicator · Herdr-restart test (S10) · graph-search memory at 74 D / 162 L — the dream/consolidation loop hasn't been run there.

<!--
What's next. The honest gap is still the controller: it sleeps with the lid unless I hand off to the VM. pi.shopify.io has the right shape — durable sessions on Cloud Run, timer wakes, a session API — but no filesystem or shell yet, and an agent can't read its docs behind Mint and WARP; the spike brief is waiting on me. Launch with a host flag is overdue. Tobi's remote workstations — I'll fill that in live; I don't have a source in the repo and I won't invent one. Charters: a must-block is a charter in miniature. A default Drive publisher. And the gaps I know about and haven't fixed, including graph-search's memory being far over budget.
-->

---

<!-- _class: invert -->

# Takeaways

1. **Files are the protocol.** Brief in, result out, board updated; chat is ephemeral. Any fresh agent — or colleague — boots from the files.
2. **Make the brief a contract.** `writes:` + `## Acceptance` + a judge at land. Deviations are declared, not discovered.
3. **Only `blocked` needs you.** Everything else the controller integrates on its own round — and a VM room carries it while the laptop is shut.

```bash
pi install git:github.com/lanceriedel/pi-controlroom       # then, in a pi inside a Herdr pane:
/reload
/controller <one-line objective for this project>
```

- Exec overview: `github.com/lanceriedel/pi-controlroom/blob/master/docs/exec-overview.md`
- Live page: `lanceriedel.github.io/pi-controlroom/status/latest.html`
- This deck + sources: `docs/talks/controlroom-talk/` in the same repo

<!--
Three things to take away. Files are the protocol — if it isn't in a file it didn't happen, and that's what lets a fresh agent or a colleague pick the room up cold. Make the brief a contract: a writes line, an acceptance block, a judge at land, so deviations are declared rather than discovered. And only blocked needs you — the controller rounds every two hours, lands what's done, and a VM room carries on while the laptop is shut. Install is one line; a room is created by typing slash-controller in a pane. The exec overview, the live status page and this deck with every source are all in the repo. Questions.
-->
