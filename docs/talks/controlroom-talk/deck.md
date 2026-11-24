---
marp: true
theme: gaia
class: invert
paginate: true
size: 16:9
style: |
  section { font-size: 24px; padding: 48px 56px; }
  section h1 { font-size: 1.45em; margin-bottom: 0.3em; line-height: 1.15; }
  section h2 { font-size: 1.1em; }
  section.small { font-size: 18px; }
  section.tiny { font-size: 15px; }
  section p.take { font-size: 1.05em; margin: 0 0 0.7em; color: #e8e8e8; }
  section.tiny p.take { font-size: 1.1em; }
  section pre { font-size: 19px; line-height: 1.35; background: #0b0d12; color: #f2f2f2; border: 1px solid #3a4250; border-radius: 6px; padding: 14px 18px; }
  section pre code { font-size: inherit; color: #f2f2f2; font-weight: 500; }
  section.small pre, section.tiny pre { font-size: 17px; }
  section.briefwide pre { font-size: 12.6px; line-height: 1.24; padding: 8px 10px; margin: 0; }
  section.briefwide h1 { font-size: 1.3em; margin-bottom: 0.1em; }
  section.briefwide .take { font-size: 0.85em; }
  section.briefwide .brief2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
  section.briefwide .take { margin-bottom: 6px; }
  section.anatomy table { font-size: 0.95em; line-height: 1.3; width: 100%; }
  section.anatomy table td, section.anatomy table th { padding: 0.35em 0.6em; }
  section.strip pre.stripc { color:#f2f2f2; font-size: 14.2px; line-height: 1.26; white-space: pre; overflow: hidden; }
  section.strip pre { font-size: 15.5px; line-height: 1.28; padding: 12px 16px; }
  section.brief pre { font-size: 14.5px; line-height: 1.3; padding: 12px 14px; }
  section.brief table { font-size: 0.8em; }
  section.brief .cols { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; align-items: start; }
  section.remote pre { font-size: 15px; line-height: 1.3; }
  section.tiny.wide table { font-size: 1.1em; line-height: 1.2; }
  section.small.wide table { font-size: 0.9em; line-height: 1.2; }
  section.contrast table { font-size: 0.95em; }
  section.costs table { font-size: 0.9em; }
  section.brief .cols p, section.brief .cols li { font-size: 0.85em; }
  section.legend table { font-size: 0.82em; line-height: 1.25; }
  section.legend table td, section.legend table th { padding: 0.3em 0.5em; }
  section.legend .cols { gap: 36px; align-items: start; }
  section :not(pre) > code { color: #ffd479; background: #0b0d12; padding: 0.05em 0.35em; border-radius: 4px; border: 1px solid #3a4250; }
  section table { font-size: 0.78em; line-height: 1.15; }
  section table td, section table th { padding: 0.25em 0.5em; }
  section.tiny table { font-size: 0.95em; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  .cols3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .dim { color: #9aa4b2; }
  .open { color: #f3c969; }
  .flow { display: grid; grid-template-columns: 1fr auto 1fr auto 1.25fr; gap: 12px; align-items: stretch; margin: 0.4em 0 0.9em; }
  .steps { grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr auto 1fr; }
  .box { background: #0b0d12; border: 1px solid #3a4250; border-radius: 8px; padding: 14px 16px; font-size: 17px; line-height: 1.32; }
  .box b { color: #ffd479; display: block; margin-bottom: 5px; font-size: 18px; }
  .box em { color: #9aa4b2; font-style: normal; }
  .arrow { color: #9aa4b2; font-size: 26px; align-self: center; }
  .bets { align-items: stretch; margin: 0.4em 0 0.8em; }
  .bets .box { font-size: 16.5px; }
  .bets .box b { font-size: 19px; margin-bottom: 8px; }
  footer { font-size: 14px; color: #6b7480; }
footer: 'Running a control room · Lance Riedel · Nov 2026 · internal'
---

<!-- _class: invert lead -->

# Running a control room

## One controller, many workers, everything is a file in git.

### Closing the laptop pauses *me*, not the project.

<span class="dim">pi + Herdr + pi-controlroom · ~25 min · three things to leave with: <b>files are the protocol</b> · <b>a brief is a contract</b> · <b>only <code>blocked</code> needs you</b></span>

<!--
This talk is about how I actually work: one AI controller per project, a pile of worker agents, and a rule that everything that matters is a Markdown file in git. When I close the laptop, I stop — the project doesn't, because the state is in files and the long jobs are on a VM. Most of you use pi; few have seen the control-room layer on top, so that is where I will spend the time. Three things to leave with, and I will come back to them at the end: files are the protocol, a brief is a contract, only blocked needs you. Every number traces to a file; where something is unproven, I will say so.
-->

---
<!-- _class: invert small -->

# pi: the agent — a session is a file, and everything is a hook

<p class="take">pi is Shopify's terminal coding agent (Mario Zechner's <code>pi</code>, wired to the Shopify AI proxy). Four properties make it a good building block for a control room.</p>

<div class="cols">
<div>

**1 · Sessions are files.** Every turn is appended to a JSONL at `~/.pi/agent/sessions/…` — resumable (`pi --resume`), forkable, readable by other programs. The control room reads them for cost, context size, "did this prompt actually run?", and `stuck?`.

**2 · Extensible in three cheap ways.**
- **extensions** — TypeScript hooks on events (`session_start`, `turn_end`, `session_before_compact`); ours flushes memory at 75 % and compacts
- **skills** — a `SKILL.md` the agent reads when the task matches; ours teaches `/controller`
- **prompt templates** — `/controller`, `/dream`, `/judge` are Markdown files

</div>
<div>

**3 · Scriptable.** `pi -p "<prompt>"` runs one non-interactive turn — the judge is just that, with a template. `codemode` lets a turn call many tools from one script; the Tool Gateway MCP gives it Slack, Vault, GitHub.

**4 · Models are a flag.** `pi --model anthropic/claude-fable-5-1`; the Shopify proxy handles auth and metering. (Switching mid-session is the one thing *not* to do — hand off with a file.)

```text
~/.pi/agent/
  sessions/<cwd>/<timestamp>.jsonl   # one agent's memory
  extensions/  skills/  prompts/     # how you change it
  settings.json                      # packages · default model
```

</div>
</div>

<!--
pi first. It is the terminal coding agent most of you already run — Mario's pi, installed through the Shopify installer so
it talks to the AI proxy with no keys to manage. Four things matter for what follows. Sessions are files on disk, so other
programs — my tick — can read them: cost, context size, whether a prompt produced a turn, whether a worker has gone quiet.
It is extensible three cheap ways: TypeScript extensions on lifecycle events, skills the agent reads on demand, and prompt
templates — the whole control room is one extension, one skill, three templates. It is scriptable: `pi -p` is a single
non-interactive turn, which is all the judge is. And the model is a flag, with one rule: never switch it mid-session.
-->

---
<!-- _class: invert small -->

# Herdr: the multiplexer — it owns the panes and knows what each agent is doing

<p class="take">Herdr is a terminal multiplexer built for agents: workspaces → tabs → panes, on this machine and on others, with the state of every agent reported back.</p>

<div class="cols">
<div>

**What it gives a control room**
- **Placement**: a workspace per project, a tab per agent, a pane per job — on the laptop or `--machine dev002`
- **Agent state** without parsing screens: `working · idle · done · blocked` for every pane (`herdr integration install pi`)
- **Four verbs**: `herdr agent list | prompt | read | focus` — enough to launch, steer, inspect and jump to any agent
- **Labels**: workspace and tab names are API — the tick writes `★` on the primary room
- **Toasts & keys**: in-window notifications; `Ctrl+B D` toggles the strip's detail

</div>
<div>

```text
$ herdr agent list      # 11-23, 8 of 68 agents shown
controller        idle     wC:p1   pi-controlroom
talk-deck         working  wC:pT   pi-controlroom
gs-controller     done     wD:p1   graph-search
gs-curated        working  wD:pT   graph-search
kumo-controller   idle     wF:p1   kumo-research
upi-controller    working  wG:p1   upi-clustering-research
ti-controller     done     wH:p1   taste-id-research
gsd-controller    done     wJ:p1   gsd-reviews

$ herdr --machine dev002 agent list    # same verbs, other host
gs-remote         idle     w2:pM   graph-search ★
ti-remote         idle     w4:p1   taste-id-research
```

**The rule everything else rests on:** one pi, one pane, one job — Herdr makes that cheap, and makes the state of all of them visible from one place.

</div>
</div>

<!--
Herdr is the multiplexer; if you have used tmux, it is that, built for agents. Three things I lean on. Placement: workspaces,
tabs and panes, and the same commands against a remote machine over SSH. Agent state: Herdr knows whether each pane's agent
is working, idle, done or blocked, without anyone scraping a screen — that is what the strip and the watchers are built on.
And four verbs: list, prompt, read, focus — that is the whole API the controller needs to launch a worker, steer it, read its
output and jump to it. Labels are API too, which is how the primary room gets its star. The rule under all of it: one pi,
one pane, one job.
-->

---
<!-- _class: invert -->

# Why I built it: a chat window does not scale to many agents

<p class="take">With ~15 agents on one project, I was the scheduler and the chat was the memory. Four things kept breaking.</p>

| what broke | what the control room does instead |
|---|---|
| **The plan lived in one chat** — compaction, a crash or a new session lost it | the plan is files: a board, briefs, results, a memory of decisions and lessons — any agent re-reads them |
| **Nothing watched the workers** — one sat 26 h at 98 % CPU "working" | a 60-second tick watches every pane: `done`, `blocked`, `stuck?` |
| **I was the scheduler** — follow-ups happened when I remembered | the controller schedules its own rounds and wakes |
| **Closing the laptop stopped everything** | long work runs on a VM room; the laptop room hands off and picks up |

<p class="take" style="margin-top:14px">Rules that fell out: <b>files first</b> · <b>the human closes the loop</b> · <b>verifiable, not vibes</b> · <b>cheap to run, cheap to leave</b>.</p>

<!--
Why build anything. In September I had about fifteen agents on one data project, each in a Herdr tab, and the plan lived in
one controller's chat. Four things kept breaking. The plan itself: a compaction, a crash or a new session and the why was
gone. Nobody watched the workers: one sat for 26 hours at 98 % CPU while the status said "working". I was the scheduler,
so follow-ups happened when I remembered. And closing the laptop stopped everything. Each of those became a design rule:
files first, a tick that watches, a controller that schedules itself, and a second room on a VM. The rest of the talk is
those four fixes.
-->

---

<!-- _class: invert small -->

# The operating model: one controller, files in between

<p class="take">A <b>room</b> is one project: a controller pi I talk to, worker pis it launches, and six kinds of file in the repo.</p>

<div class="cols">
<div>

```text
+-------------------------------------------+
| CONTROLLER tab                            |
|   controller pi   <- you talk here        |
|   status strip    <- agents, events, mem  |
+-------------------------------------------+
| worker: 018 | worker: critic | pipeline.. |
+-------------------------------------------+
 docs/briefs/NNN.md --> worker --> results/NNN.md
 docs/briefs/STATUS.md <-- controller integrates
```

</div>
<div>

| Piece | What it is |
|---|---|
| **Controller** | one pi per room; writes briefs, launches workers, integrates — never does > 5-min work itself |
| **Brief → result** | a work order, `docs/briefs/NNN-slug.md`; the worker answers in `results/NNN-slug.md` |
| **Board** | `STATUS.md`: who is on what, what has **landed** (finished and integrated), what waits on me |
| **Memory** | `DECISIONS.md` + `LESSONS.md`, one line each, every line cites a source |
| **Tick** | a 60-s reconciler under launchd: watches workers, wakes the controller, flags `stuck?` |
| **Automations** | the ledger of those watches and wakes; the standing one is the **round** — every 2 h: integrate, land, update the board |

</div>
</div>

<span class="dim">Footprint today: `bin/` 2,335 lines of bash + python3 (stdlib), one 98-line pi extension, three prompt templates. No server, no DB, no daemon beyond launchd.</span>

<!--
This is the whole shape. A room is one project. One controller pi per room — I talk to it, it writes briefs, launches workers in their own tabs, and integrates what comes back; it never does long work itself. Six kinds of file. A brief is a work order; the result is its answer. The board is the one shared truth: who is on what, what has landed — finished and integrated — and what waits on me. Memory is decisions and lessons, one sourced line each. The tick is a sixty-second reconciler under launchd. Automations is the ledger it fires; the standing one is the two-hour round. Twenty-three hundred lines of bash and Python, no server.
-->

---
<!-- _class: invert briefwide -->

# A brief is a contract: exact inputs in, a checked result out

<p class="take">A real brief from graph-search — <code>005-graph-walk-operator.md</code>, abridged in its own words.</p>

<div class="cols brief2">
<div>

```text
# 005 — The first index-serving change: a Java graph_walk
#       operator (+ customData explanations), proven on the local stack
host: dev002

## Objective
003 showed the walk works from a user Scripty with no engine change —
but with three engine gaps: the hop is a shard fan-out over a graph_edge
collection with the edge payload parsed out of the doc *key*;
explanations cannot reach SearchResult.customData; 2-round frontiers hit
the 999-result cap and the Python glue is ~250 lines. 005 makes the
first, deliberately small, index-serving change: a Java @ScriptyOperator
graph_walk (typed frontier, truncation per round, one RPC per hop when
an entity index is available) and a result operator that stamps `why`
into customData. Built, run and measured on the local stack on dev002,
against the 1 M product / 2 M edge collections from 004, so that when we
propose it to Jonathan's team it comes with a working prototype and
numbers.

## Inputs
- docs/design/003-graph-in-vantage.md §2 (apply findings), §4 (graph_walk_v1
  algorithm + request contract), §6 (what the operator must look like,
  per scripty/operators/AGENTS.md: stage package, @ScriptyOptions record,
  seam not raw client, typed return, registration, parity tests)
- results/004-scale-real-data.md "What to do next" (1): agree one edge-key
  encoding and make the hop read a forward field — 005 owns this decision
- index-serving @ main dc40053a1f (do not move); patterns to copy:
  CapnpScatterGatherOperator, LookupTermHashOperator, EntityLookupDownstream
- live collections: graph_product/v_0_4 (1,046,870) · graph_node/v_0_2
  (142,646) · graph_edge/v_0_3 (2,049,392); harness run_seeds.rs (50 seeds)
```

</div>
<div>

```text
## Constraints
- L004 pin-shared-checkouts — index-serving stays at dc40053a1f; all changes
  on branch lanceriedel/graph-walk-operator, never pushed upstream
- L005 human-only-prerequisites — Cloudsmith / dev credentials are Lance-only;
  if the build needs them write "BLOCKED on <token>" and take the no-cred path
- do not rewrite what works (keep graph_walk_v1 glue and the Rust harness);
  new code in Rust — except inside index-serving, which is Java
- Java change small and reviewable: ≤ ~400 lines across operator + options
  record + result operator + tests + registration; no shard/proto changes
- time-box 8 h wall clock; logs/graph-walk-operator.log START/END rc= per
  step; partial result after every phase

## Phases
0. Can we build and run a modified broker here? (≤ 2 h, gate for the rest)
   (a) Gradle with the dev registry (b) layer a derived image (c) fallback
1. Edge-key / forward-field decision (owned here) → graph_edge/v_0_4
2. graph_walk operator (Java): options record, hop via the capnp seam,
   truncation per round, restart mass α, typed GraphFrontier; unit tests
3. Explanations into customData — prove with a response that carries `why`
5. Measure: run_seeds gains shape G-walk-op; 50 seeds × scales; latency
   p50/p95; identical frontiers on the 3 fixtures

## Deliverables
- branch + exported diff with a PR-style README · design doc 005
- results/005-graph-walk-operator.md ≤ 12 bullets: build path go/no-go,
  lines changed, metrics table G-walk vs G-walk-op, latency, "DONE 005"

## Acceptance
cr_has_section "$RESULT" "## Metrics" · cr_has_sentinel "$RESULT" 005
test -f "$ROOT/src/graph_vantage/patches/005-graph-walk-operator.diff"
writes: src/graph_vantage/**, docs/design/005*, docs/briefs/results/005*
```

</div>
</div>

<!--
This is a real brief, abridged but in its own words — the one that got graph-search its first engine-native change. Read it
as a shape. The Objective is a paragraph, not a sentence: it says what the previous brief found, what the three gaps are,
exactly what this one changes, where it runs, and why — so the worker can make judgement calls. Inputs are exact: design
sections, a pinned sha, the patterns to copy, live collection names with counts, the machine. Constraints open with the
room's lessons quoted verbatim, then scope, then logging and a time-box. Phases turn a day of work into gates. Deliverables
name files and the sentinel. Acceptance and writes: are what `land` enforces. The worker came back with an operator,
numbers and tests, in eight hours on a VM.
-->

---
<!-- _class: invert anatomy -->

# What a brief gives the worker — and what the room gets back

<p class="take">Seven parts, the same every time, so a worker never has to guess and the controller never has to trust.</p>

| part | what it gives the worker |
|---|---|
| `host:` | which machine runs it (laptop · `dev002` / `c4d`, two remote VMs) |
| **Objective** | the *why*, what the previous brief found, exactly what changes, where it runs |
| **Inputs** | exact paths and sections, pinned shas, patterns to copy, live collection names with counts |
| **Constraints** | the room's memory lines **quoted verbatim**; scope limits; logging; a time-box |
| **Phases** | gates in order — the first one decides whether the rest is possible |
| **Deliverables** | files, sizes, the `DONE NNN` sentinel |
| **Acceptance** · `writes:` | shell checks + allowed paths — **enforced at `land`** since 11-17 |

**What came back** (landed 11-09): the Java `graph_walk` operator — 2-round brand-path lift **42 → 63 %**, 17 / 24 ms p50/p95, **+1,054 lines** on a branch, **13/13 tests**.

**At `land`:** `check` runs the Acceptance lines and the write-scope, then `judge` — a read-only pi that grades the result against the brief, quoting evidence → `ACCEPT` / `NOTES` / `REJECT`.

<!--
The anatomy, now that you have seen one. Three parts carry most of the weight: Inputs that are exact enough that the worker
never guesses; Constraints that start with what the room has already learned, quoted so the lesson arrives intact; and the
Acceptance block, which is the part the harness can check without a model. Then the gate: `check` is grep-level and
deterministic, `judge` is a cheap read-only model pass that quotes the result back against each requirement. The result for
005 was an operator, numbers and tests in eight hours on a VM.
-->

---

<!-- _class: invert tiny strip -->

# The strip is the board plus live state — one glance per room

<p class="take">Who is working, who is done, and — in red — who needs me. <b>Illustrative composite</b> of a graph-search afternoon: real names, states and layout from the 11-17 logs; times combined into one picture.</p>

<pre class="stripc"><span style="color:#f2f2f2;font-weight:700"> CONTROL ROOM  Mon 16:42  graph-search</span>   (say &quot;ok&quot; in CONTROLLER to integrate · <span style="color:#ff7b72;font-weight:700">blocked</span> = needs you)   <span style="color:#9aa4b2">tick ok 16:42</span>
   next A089 18:31
 ROOMS  local ▶gs-controller ⇄ dev002 ▶gs-remote <span style="color:#79c0ff;font-weight:700">‹PRIMARY›</span> ⇄ c4d ▶gs-c4d · <span style="color:#79c0ff;font-weight:700">MODE: remote</span>
 AGENTS  (detail on — Ctrl+B D to toggle)  ▶ = controller
 <span style="color:#79c0ff;font-weight:700">▌ LOCAL · Lances-MacBook-Pro · 3 agents</span> <span style="color:#9aa4b2">──────────────────────────────────────────────────────────────────────────</span>
<span style="color:#9aa4b2">   ▶</span> <span style="color:#7ee787">idle</span>     gs-controller      wD:p1   <span style="color:#9aa4b2">standby</span>            last write 4m  · ctx 31%
<span style="color:#9aa4b2">   │</span> <span style="color:#f2c744">working</span>  gs-images          wD:pC   023-images-cards   last write 1m  · ctx 44%
<span style="color:#9aa4b2">   │</span> <span style="color:#ff7b72;font-weight:700">blocked</span>  gs-proof-eval      wD:pF   039-cross-track C  last write 12m · ctx 61%   <span style="color:#ff7b72;font-weight:700">NEEDS YOU: judge cache?</span>
 <span style="color:#7ee787;font-weight:700">▌ DEV002 · reachable · 6 agents</span> <span style="color:#9aa4b2">──────────────────────────────────────────────────────────────────────────────────</span>
<span style="color:#9aa4b2">   ▶</span> <span style="color:#7ee787">idle</span>     gs-remote          w2:pM   <span style="color:#79c0ff;font-weight:700">‹PRIMARY›</span>          last write 2m  · ctx 18%
<span style="color:#9aa4b2">   │</span> <span style="color:#f2c744">working</span>  gs-fix             w2:pC   014-fixes-iterate  last write 0m  · ctx 52%
<span style="color:#9aa4b2">   │</span> <span style="color:#f2c744">working</span>  gs-scale7m         w2:p9   007-scale-7m       last write 23m · ctx 37%   <span style="color:#ff7b72;font-weight:700">stuck?</span>
<span style="color:#9aa4b2">   │</span> <span style="color:#7ee787;font-weight:700">done</span>     gs-judge           w2:p5   010-seed-free      last write 1.1h · ctx 29%  <span style="color:#7ee787">✓ acceptance</span> · <span style="color:#7ee787">⚖ ACCEPT</span>
<span style="color:#9aa4b2">   │</span> <span style="color:#7ee787;font-weight:700">done</span>     gs-graph           w2:p4   003-graph-in-vantage  last write 2.3h          <span style="color:#7ee787">✓ acceptance</span>
<span style="color:#9aa4b2">   │</span> <span style="color:#7ee787">idle</span>     gs-vantage         w2:p3   —                  last write 6.0h
 <span style="color:#7ee787;font-weight:700">▌ C4D · reachable · 5 agents</span> <span style="color:#9aa4b2">─────────────────────────────────────────────────────────────────────────────────────</span>
<span style="color:#9aa4b2">   ▶</span> <span style="color:#7ee787">idle</span>     gs-c4d             w1:p3   <span style="color:#9aa4b2">standby</span>            last write 9m
<span style="color:#9aa4b2">   │</span> <span style="color:#f2c744">working</span>  gs-widen           w1:p6   015-widen-eval     last write 0m  · ctx 48%
<span style="color:#9aa4b2">   │</span> <span style="color:#f2c744">working</span>  gs-haystack        w1:p7   016-haystack-c4d   last write 3m  · <span style="color:#f2c744">ctx 71%</span>
<span style="color:#9aa4b2">   │</span> <span style="color:#f2c744">working</span>  gs-dense           w1:p9   039-native-prf     last write 1m  · ctx 55%
<span style="color:#9aa4b2">   │</span> <span style="color:#7ee787;font-weight:700">done</span>     gs-publish         w1:p4   006-publish-status last write 1.2d          <span style="color:#7ee787">✓ acceptance</span> · <span style="color:#f2c744">⚖ NOTES</span>
 TICK  last 16:42:07 · 2 actions          MEMORY  74 decisions · 162 lessons · 0 proposed · last dream never
 AUTOMATIONS  5 armed · next A089 18:31 (in 1.8h) · fired today 9</pre>

<!--
The board is STATUS.md; the strip is the board plus live state, refreshed every fifteen seconds under the controller. This one is an illustrative composite of a graph-search afternoon — names, states and layout are real, from the November seventeenth logs; I combined the times into one picture. Top down: the header says the tick is alive and when the next wake is. ROOMS shows one controller per host and which is primary. AGENTS is grouped by host; detail mode adds last write, context and the acceptance and judge chips. Three states on screen: working, done, and one red blocked row with a question for me. Red means a human is needed; everything else the controller handles.
-->

---

<!-- _class: invert legend -->

# Reading the strip: red is the only colour that needs a human

<p class="take">Yellow is the room working, green is results on disk, red is a question for me.</p>

<div class="cols">
<div>

| line | what to read |
|---|---|
| header | `tick ok HH:MM` or red `NO TICK`; `PAUSED since …`; `next A###` |
| **ROOMS** | one `▶controller` per host, `‹PRIMARY›` chip, `MODE:` from the board, git ahead/behind |
| **AGENTS** | grouped by host; `▶` = controller; detail adds brief · last write · ctx % · `✓/✗ acceptance` · `⚖ judge` |
| **PIPELINES / EVENTS** | `logs/*.log` with START/END markers · last 5 lines of `logs/agents.log` |
| **MEMORY / AUTOMATIONS** | counts vs budget 40/30 · armed · next · held · fired today |

</div>
<div>

| colour | state | meaning |
|---|---|---|
| yellow | <code style="color:#f2c744;background:#0b0d12">working</code> | busy |
| green | <code style="color:#7ee787;background:#0b0d12">idle</code> / <code style="color:#7ee787;background:#0b0d12;font-weight:700">done</code> | results probably on disk |
| **red** | <code style="color:#ff7b72;background:#0b0d12;font-weight:700">blocked</code> | **the only state that needs a human** |
| **red** | <code style="color:#ff7b72;background:#0b0d12;font-weight:700">stuck?</code> | working, no write 20 min, session quiet 10 min |
| yellow | <code style="color:#f2c744;background:#0b0d12">spinning?</code> | burning tokens, nothing written 30 min |

</div>
</div>

<!--
The legend, because you will see this strip again. Left, the lines: the header tells you if the room is alive — tick ok, or a red NO TICK — and when the next wake fires. ROOMS: one controller per host and who is primary. AGENTS grouped by host; the rest are log tails and counts. Right, the colours. Yellow is the room working. Green means results are probably on disk. Red comes in two flavours: blocked, the only state that needs a human, and stuck? — a worker that has written nothing for twenty minutes with a quiet session, the alarm built after the twenty-six-hour worker.
-->

---

<!-- _class: invert small -->

# Memory is two files, and no line gets in without a source

<p class="take">Decisions and lessons, one line each, append-only, bounded — budget 40 / 30, today 30 · 30. Grammar: <code>- D### date **slug** — one-liner ← source</code>. No source, no line; the CLI refuses.</p>

```text
- D015 2026-10-27 **controller-by-pane-id** — controller pane id pinned in logs/.controller by
       init/tick-install; automations resolve the controller by pane id, name is a label
       ← docs/briefs/results/006-wake-automations.md:logs/.controller
- D031 2026-11-17 **briefs-are-contracts** — briefs are contracts: writes: globs + ## Acceptance sh block;
       land runs check and refuses failing rows; --force must say why in the one-liner
       ← docs/briefs/results/018-acceptance-checks.md:"land refuses failing rows"
- L005 2026-10-27 **timebox-local-compute** — a worker sat 26 h on one unbounded call at 98 % CPU while
       the strip said `working` — briefs must time-box compute and demand partial outputs
       ← skills/controlroom/SKILL.md:"blocked 26 h"
- L028 2026-10-27 **mechanism-needs-log-line** — a lesson asserting a mechanism needs a log line from that
       mechanism (ext-error/compaction with source tag), not a pane glance — L023 was wrong
       ← docs/briefs/results/009-durability-tests.md:needs a log line from that mechanism
```

- **Into briefs:** the controller pastes the lines that apply into every brief's Constraints, verbatim
- **Dream** (`controlroom dream`): a worker *proposes* new lines; `--check` greps every citation; a person promotes — nothing lands by itself
- **Flush at 75 % context:** the extension asks the controller to write down what is missing, then compacts
- **Boot** — a fresh controller reads board → memory → log → automations → agents → unread results, then arms its round wake

<!--
Memory is two files, decisions and lessons, one line each, with a hard grammar: ID, date, slug, one-liner, source arrow. No source, no line — the CLI refuses to write it. Budget forty and thirty. These four lines are real. D015: the controller is a pane id, not a name, because names get lost on restart. L005 is the twenty-six-hour worker. L028 is a lesson about lessons: a claim about a mechanism needs a log line from that mechanism, because an earlier lesson turned out to be wrong. Briefs quote it verbatim. Dream only proposes; a person promotes. At seventy-five percent context the extension asks for a flush, then compacts. Boot is the fixed read order that makes it survivable.
-->

---

<!-- _class: invert small -->

# Automations: the ledger is the state, the tick fires it

<p class="take"><b>Wakes</b> (timed prompts to the controller) and <b>watches</b> (a worker finished or blocked) are rows in a Markdown table; the tick reads and rewrites it every minute — kill the tick, lose nothing.</p>

```text
id    kind                    state      next (local)  repeat          prompt?  instruction
A033  wake                    fired      11-06 04:57   once            yes      014 proof: reply TAKEN-OK
A040  watch-path results/018  cancelled  —             on-change       yes      018 result changed: if it contains DONE …
A042  wake                    cancelled  11-24 08:00   weekdays 08:00  yes      round: … daily while the room is idle …
A043  watch talk-deck         armed      —             —               no       integrate 020-talk-deck when DONE
A044  wake                    armed      11-23 15:34   every 2h        yes      round: integrate DONE workers, land …
```

**The round wake** — the controller arms it itself at Boot: `round: integrate DONE workers, controlroom land, update STATUS.md; this wake repeats every 2h`

**Prompt uptake** — 08:00 wakes used to die to connection errors seconds after the Mac woke; now the tick checks that the controller's session actually ran a turn, and re-prompts if not:
```text
[11-08 16:34] A036 turn aborted (Connection error.) → re-prompted        (logs/agents.log)
[11-09 10:38] A036 turn aborted (Request timed out.) → re-prompted
[11-06 04:54] A032 prompt taken (controller turn ran)                    (logs/tick.log)
```

<span class="dim">Guards: watches toast, wakes prompt · ≤ 6 prompts/h · a per-room kill switch · pause holds rows, then one <code>[play]</code> prompt.</span>

<!--
Automations are rows in a Markdown table — the ledger is the state. Wakes are timed prompts to the controller; watches fire when a worker finishes or blocks. The tick reads the table every minute, fires what is due, rewrites it. Kill the tick, lose nothing. The important row is the round wake: every two hours, integrate, land, update the board. The controller arms that itself at Boot — "A44 wakes me at 15:34" is behaviour, not prose. Prompt uptake came from a real failure: eight o'clock wakes died to connection errors seconds after the Mac woke, so the tick now checks the controller actually ran a turn and re-prompts. Guards: six prompts an hour, a kill switch, pause.
-->

---

<!-- _class: invert tiny wide -->

# Durability, honestly: what survives what

<p class="take">Files survive everything; in-flight work on the laptop does not — and one scenario is still untested.</p>

| What happens | What survives — and the proof | Still open |
|---|---|---|
| **Compaction** | memory + board: flush at 75 % → `/compact` → post-compaction wake → Boot — extension-triggered, proven with its own log line (012 S6) | the automatic ≥ 75 % path proven only via the manual `/flush` route |
| **Fresh controller session** | everything — files are the memory: scratch Boot (009 S1); graph-search fresh sessions 11-10 / 11-11 / 11-13, incl. model hand-offs via `handoff.md` | — |
| **Herdr / Mac reboot** | tick + ledger + watch rows re-armed from the board (`launchctl bootout` → back in ~10 s); the 11-10 reboot killed every tick → plist now in `~/Library/LaunchAgents` | pane *name* lost on restart (Boot reclaims it); a Herdr restart **never tested** |
| **Sleep / lid closed** | the schedule — wakes fire late, not never (6 min late ×2); re-prompt on error-aborted turns; weekend 11-15/16: machines down 53 h, all four controllers alive | local workers' in-flight API calls do not survive |
| **Nobody typing for a day** | rounds every 2 h, land, status page: graph-search 11-17 — 11 rounds, 2 lands, 2 launches | `blocked` waits for a person — by design |

<span class="dim"><b>Seen once (graph-search, 11-10):</b> a controller at 167 % context looped flush → compact 79 times in 20 min and never shrank. Fix: a 30-min breaker in the extension. Recovery: a fresh session booted from files at 16 % — <em>the design working, not failing.</em> What it cost is on the costs slide.</span>

<!--
This is the honest version. Compaction: the flush loop is proven live with its own log line, but only through the manual flush route; the automatic threshold path has not been exercised. Fresh sessions from files: proven repeatedly. Reboot: tick and ledger come back in seconds — and on November tenth we learned where launchd units must live. A Herdr restart has never been tested; I say so. Sleep: wakes fire late, not never; a weekend with machines down fifty-three hours left all four controllers alive. The storm: a controller at one-sixty-seven percent context looped flush-compact seventy-nine times and never shrank. We added a breaker; recovery was a fresh session from files — exactly what the design is for.
-->

---

<!-- _class: invert tiny remote wide -->

# Remote machines: a VM room carries the work while the laptop is shut

<p class="take">A room can have a twin on a VM — same repo, same tick, its own controller; git is the hand-off and one controller is <b>primary</b> at a time.</p>

<div class="cols">
<div>

| host | what runs there |
|---|---|
| **laptop** · `local` | the primary controller · anything needing my identity: SSO, browser, publishing, Drive, chat |
| **dev002** (16-vCPU VM) | ingest, scans, long jobs · a standby controller `gs-remote` with its own Herdr, clone and tick |
| **c4d** (48-vCPU VM) | serving, judge, demo and latency workers |

- every brief header says who owns it: `host: local` or `host: dev002`
- before I close the lid: `controlroom mode remote dev002` — pulls, refuses a dirty board, rewrites `MODE:`, writes a `## HANDOFF` block, commits, pushes, prompts **both** controllers; `mode local` hands it back
- brief pushed → worker DONE on the VM → verified on the laptop: **~65 s**

| where you look | primary | standby |
|---|---|---|
| Herdr workspace label | `graph-search ★` | `graph-search` |
| controller tab | `★ CONTROLLER` | `CONTROLLER · standby` |
| strip `ROOMS` line | `dev002 ▶gs-remote ‹PRIMARY›` | `local ▶gs-controller` |

</div>
<div>

graph-search · `NO_COLOR=1 controlroom status` · 11-23 13:35 (trimmed)
```text
 ROOMS  local ▶gs-controller ‹PRIMARY›
        ⇄ dev002 ▶gs-remote ⇄ c4d ▶—
        MODE: local · sync: 4c3f929f · ahead 0 · behind 0
▌ LOCAL · Lances-MacBook-Pro · 16 agents ─────────────
  ▶  done     gs-controller  wD:p1 ‹PRIMARY›  ctx 68%
  │  stalled  gs-keyauto     wD:p8  last write 13.9d
  …
▌ DEV002 · reachable · 4 agents ──────────────────────
  ▶  idle     gs-remote      w2:pM
  …
▌ C4D · reachable · 11 agents ────────────────────────
  │  idle     gs-c4d         w1:p3
  …
```
<span class="dim">Three hosts, one strip. All the labels are derived from the board's <code>MODE:</code> line by the tick, every minute, on every host — they cannot disagree.</span>

</div>
</div>

<!--
Here is how the laptop problem is solved. Three hosts. The laptop runs the primary controller and anything needing my identity. dev002 runs ingest and long jobs plus a standby controller with its own Herdr, clone and tick; c4d runs serving and the judge. Each brief says which host owns it. Before closing the laptop I run controlroom mode remote dev002: it pulls, refuses a dirty board, rewrites the MODE line, writes a hand-off block, commits, pushes, and prompts both controllers with their new roles. The next tick moves the star, the tab labels and the PRIMARY chip — all derived from the board, so they never disagree. Brief pushed to verified result: about a minute.
-->

---

<!-- _class: invert small wide -->

# Every project I run is a room now

<p class="take">Eight rooms, same files, same tick, same strip — from a one-brief review desk to a 107-brief program on three hosts.</p>

| room | what it is | briefs · one number |
|---|---|---|
| **pi-controlroom** | the tool itself | 18 · 0.2.x verified by four briefs (test, scorecard, review, fix); memory 30 D · 30 L |
| **lookbook-research** | taste graph from merchant curation + purchases | 51 · fashion v2: 354 shops · 1.42 M buyers · 79 M line items |
| **graph-search** | graph-shaped storefront search inside Vantage | 107 · 59 landed · 37 worker sessions on three hosts |
| **kumo-research** | Kumo / NVIDIA relational models vs tuned flat models | 64 · Q1 answered **NO** (n = 160, 3 universes); paused on Q6 |
| **upi-clustering-research** | UPI clustering at 10 B products — shingling thesis | 10 · 10.13 M real products scored; 45 % at J ≥ 0.7 |
| **taste-id-research** | per-person taste code × taste graph × graph search | 5 · set up 11-17; 5 landed |

<span class="dim">Also: <b>gsd-reviews</b> (1 brief → 6 prepared reviews + an inbox; my review desk) and <b>personalized-search-demo</b> (25 briefs; the first two-controller room). Hosts and the command behind each number are in the notes.</span>

<!--
Eight rooms, and the pattern is identical in each. pi-controlroom builds the tool and eats its own output on every launch. lookbook-research is where the shape came from — the taste graph, fifty-one briefs. graph-search is the big one: a hundred and seven briefs, fifty-nine landed, thirty-seven worker sessions across three hosts — and a memory file far over budget, which I will come back to. kumo-research answered its first question with a decision-grade no and is paused waiting for me. upi-clustering ran the shingling thesis on ten million real products. taste-id is a week old. gsd-reviews is a control room pointed at my own review inbox: one brief, six prepared reviews. Different domains, same six files.
-->

---

<!-- _class: invert small -->

# One real day: the room works, I answer one question, then I close the laptop

<p class="take">graph-search, Monday 2026-11-17, straight from <code>logs/agents.log</code> — annotations on the right are mine.</p>

```text
[11-17 08:08] A085 turn aborted (401 … AuthenticationError …) → re-prompted     ← Mac just woke; tick retries
[11-17 08:27] overnight backlog serviced once: idle; nightly pull ok on dev002    ← Boot + round
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

<span class="dim">Honest footnote: this room was running <b>two</b> recurring wakes (A002 + A085). Corrected 11-18 — one recurring round per room is the rule.</span>

<!--
One real day, from the log. Eight-oh-eight: the first wake fires seconds after the Mac wakes and dies to an auth error; the tick re-prompts. Eight twenty-seven: Boot and the overnight round, nothing to do. At half twelve the controller proposes brief 089 to me — a question, the one thing that waits for a person. Early afternoon: a follow-up to a warm worker, DONE, landed, page republished; a new launch, DONE in twenty minutes, landed. Three-sixteen I shut the laptop; the room hands off to dev002. Next morning I take it back with one command. The footnote matters: this room ran two round wakes, which is wrong; we fixed the rule the next day.
-->

---

<!-- _class: invert small -->

# Publishing: every landed brief republishes a page humans actually read

<p class="take">Nobody should have to read a board to know where a project stands.</p>

<div class="flow">
<div class="box"><b>Room files</b>the board · live health · a hand-written <em>preamble</em> the tool never overwrites</div>
<div class="arrow">▶</div>
<div class="box"><b>Generated page</b><code>controlroom status-page</code> → <code>docs/status/latest.md</code> + <code>latest.html</code></div>
<div class="arrow">▶</div>
<div class="box"><b>Three destinations</b>GitHub Pages (orphan branch, one commit) · <b>lancedocs</b> — my personal docs site, deployed from the laptop · a Google Docs mirror</div>
</div>

- **Narrative vs facts:** the preamble carries the story; workers, decisions and the landed table are generated — graph-search even turns the landed table off and lets the preamble lead
- **Event-driven, never on a clock:** runs after every launch and land; one line per run in `logs/publish.log`
- **Identity-bound steps stay on the laptop:** lancedocs and Google Docs need my credentials, so a remote room queues them under *Pending publish (local)*

<!--
Nobody should have to read a board to know where a project stands, so every launch and land republishes a page. Left box: the inputs — the board, live health, and a hand-written preamble the tool never overwrites. Middle: the renderer turns that into Markdown and HTML. Right: three destinations. GitHub Pages via an orphan branch, force-pushed as one commit so source history never carries rendered HTML. lancedocs, my personal docs site — a per-room shell hook copies the HTML into that tree and runs the deploy script, which mirrors into Google Docs. Three rules: narrative is human, facts are generated; events, never a clock; identity-bound steps run only on the laptop.
-->

---

<!-- _class: invert small -->

# Verification is how it earned trust

<p class="take">Before 0.2.0 shipped, a worker tested the live room, a reviewer said "not safe to commit", and the failures were fixed and re-proven with log lines.</p>

<div class="flow steps">
<div class="box"><b>10 scenario tests</b>fresh boot · tick restart · <code>stuck?</code> · pause · compaction · two rooms · dream · kill switch … <em>(009, 10-27)</em></div>
<div class="arrow">▶</div>
<div class="box"><b>Code review</b><b>3 blockers</b> → "not safe to commit" <em>(011)</em></div>
<div class="arrow">▶</div>
<div class="box"><b>Fixes</b>every blocker closed, every fix proved by the test that found it <em>(012)</em></div>
<div class="arrow">▶</div>
<div class="box"><b>Re-tests</b><code>stuck?</code> and compaction re-run <b>green</b>, each with the mechanism's own log line</div>
<div class="arrow">▶</div>
<div class="box"><b>0.2.0</b>committed 10-28 · one scenario — a Herdr restart — still untested, and the table says so</div>
</div>

**Lessons found in use ship within a minute.** The `controlroom` every room runs is a symlink into this repo, so a fix found in one room reaches all of them on the next tick — and so would a bad save, which is its own lesson.

<!--
The thing I am proudest of is not a feature. Before committing 0.2.0, a worker ran ten scenarios against the live room. Stuck detection failed — pi's cache warming kept the session looking busy. Compaction only half worked. A code review said not safe to commit, three blockers. A fix brief closed all of it and re-proved the failures with log lines, not screenshots. One scenario is still untested; the scorecard is a backup slide. Second half: lessons found in use ship within a minute, because the CLI is a symlink into this repo. Example: the November tenth reboot killed every room's tick — wrong launchd directory. Fixed in tick-install, every room re-bootstrapped that morning.
-->

---

<!-- _class: invert small contrast -->

# Two tools, two jobs: Torrent ships a team's PRs; a control room runs one person's project

<p class="take"><b>Torrent</b> is Shopify's platform that turns issues into agent-written PRs. This is not that, and is not trying to be.</p>

| | Torrent <span class="dim">[Inferred — Nov Slack threads, paraphrased]</span> | control room |
|---|---|---|
| **unit of work** | an issue → an agent → a Delta PR | a brief → a worker → a result file |
| **where it runs** | a platform, with a team and a backlog | a folder in a repo + Herdr panes on my laptop and VMs |
| **how you steer** | "no way to steer" mid-run was a user complaint | edit the brief or the board; answer a `blocked` worker |

- **What I borrowed:** Torrent's *Objectives* pair a lead agent with a charter enforced by a **judge agent** — the judge-at-land gate on slide 5 is that idea (brief 019)
- **The bridge:** a brief is a file and so is a result; a Torrent issue could be one kind of worker, chosen by `host:` <span class="dim">[Inferred — not built]</span>

<span class="dim">The closer cousin is Tobi's personal "ULTIMATE" harness — a screenshot-inferred comparison is on the backup slide.</span>

<!--
People ask how this relates to Torrent. Torrent is Shopify's platform: an issue becomes an agent becomes a PR, with a team behind it. This is one person running one project from a folder. Three contrasts. Unit of work: issue to PR versus brief to result file. Where it runs: a platform versus a folder plus Herdr panes on my machines. How you steer: one Torrent complaint I saw was "no way to steer" mid-run; here you edit the brief or the board, or answer a blocked worker. What I borrowed: Objectives pair a lead agent with a charter enforced by a judge agent — the judge at land is that idea. The bridge is inferred, not built.
-->

---

<!-- _class: invert small costs -->

# Costs & models: fable does the work, sol is cheap, mini finishes nothing

<p class="take">Rules of thumb I actually use — from graph-search's 37 worker sessions, ≈ $1,050, computed 11-11 from the session files:</p>

- **Workers:** claude-fable for build and eval work · **never mini for deliverables**
- **Controllers:** fable too — sol was ≈ $27/day against ≈ $348/day, but its rounds were too slow, so on 11-13 every controller moved to fable
- **Never switch a model mid-session** — write a `handoff.md` and start fresh; a 590 k history does not fit a 400 k model by picking it from a menu

| model | sessions | ≈ $ / turn | briefs DONE |
|---|---|---|---|
| claude-fable-5-1 | 24 | $0.25 | **10 of 12** |
| gpt-6.1-sol | 10 | $0.03 | — (not tracked) |
| gpt-5-mini | 4 | $0.02 | **0** |

<span class="dim"><b>The storm, in money:</b> the 167 % controller's 79 flush → compact loops cost ≈ $350 in 20 min; the breaker and a fresh session fixed it. The judge is ≈ \$0.06 a review. Dollars live in the strip's detail view only — the alarm that matters is <em>no progress</em>, not spend.</span>

<!--
Money, plainly. Thirty-seven graph-search worker sessions cost about a thousand dollars. Fable did almost all the useful work: ten of twelve briefs done at a quarter a turn. Sol was cheap and slow. Mini cost the same and finished nothing — never mini for deliverables. For controllers, sol was twenty-seven dollars a day versus three hundred forty-eight for fable, and I still moved every controller to fable in mid-November because the round loop was too slow. One rule learned the expensive way: never switch models inside a session — write a hand-off file and start fresh. The storm cost three hundred fifty dollars in twenty minutes; the judge is pennies. The alarm that matters is no progress, not spend.
-->

---

<!-- _class: invert small -->

# Future: three bets

<p class="take">The honest gap is still the controller itself — it sleeps with the lid unless I hand off to a VM.</p>

<div class="cols3 bets">
<div class="box"><b>1 · A hosted controller</b><em>What:</em> the controller as a durable session on pi.shopify.io (Cloud Run + Postgres, timer wakes, a REST/SSE API).<br><em>Why:</em> no hand-off needed; the room lives where nothing sleeps.<br><em>Missing:</em> a filesystem and shell for the controller; its docs are Mint + WARP only, so agents here cannot read them (brief 017 waits on me).</div>
<div class="box"><b>2 · Tobi's remote workstations</b><span class="open">[Open — Lance to fill: what they are · why a room would want one · what is missing]</span></div>
<div class="box"><b>3 · Room-level charters</b><em>What:</em> a standing charter the judge grades every land against — Objectives-style.<br><em>Why:</em> a brief's <code>must:</code> block is a charter in miniature; the room should have one too.<br><em>Missing:</em> the charter file and a judge prompt that reads it.</div>
</div>

<span class="dim">Also queued: <code>launch --host &lt;label&gt;</code> · the Google Docs publisher as a default recipe · a "core changed → restart" indicator · the untested Herdr-restart scenario · graph-search memory over budget (74 D / 162 L, never dreamed).</span>

<!--
Three bets. First, a hosted controller. The honest gap is that the laptop controller sleeps with the lid unless I hand off to a VM. pi.shopify.io has the right shape — durable sessions, timer wakes, an API — but no filesystem or shell yet, and its docs sit behind Mint and WARP; the spike brief waits on me. Second, Tobi's remote workstations — I will fill that in live; I have no source in the repo and will not invent one. Third, room-level charters: a must block in a brief is a charter in miniature; the judge should grade every land against a standing one. Below the line, the smaller items, including graph-search's memory being far over budget.
-->

---

<!-- _class: invert -->

# Three things to take away

1. **Files are the protocol.** Brief in, result out, board updated; chat is ephemeral. Any fresh agent — or colleague — boots from the files.
2. **A brief is a contract.** `writes:` + `## Acceptance` + a judge at land; deviations are declared, not discovered.
3. **Only `blocked` needs you.** The controller rounds every 2 h and lands what is done; a VM room carries it while the laptop is shut.

```bash
pi install git:github.com/lanceriedel/pi-controlroom       # then, in a pi inside a Herdr pane:
/reload
/controller <one-line objective for this project>
```

- Exec overview: `github.com/lanceriedel/pi-controlroom/blob/master/docs/exec-overview.md`
- Live page: `lanceriedel.github.io/pi-controlroom/status/latest.html`
- This deck + sources: `docs/talks/controlroom-talk/` in the same repo

<!--
The three things I promised on the first slide. Files are the protocol — that is what lets a fresh agent or a colleague pick the room up cold. A brief is a contract: a writes line, an acceptance block, a judge at land, so deviations are declared rather than discovered. And only blocked needs you — the controller rounds every two hours, lands what is done, and a VM room carries on while the laptop is shut. If you want to try it: install is one line, and a room is created by typing slash-controller in a pane. The exec overview, the live page and this deck with every source are in the repo. Thank you.
-->

---

<!-- _class: invert tiny wide -->

# Backup · Tobi's "ULTIMATE" harness vs this room (brief 013)

<p class="take">Screenshot-inferred — we never saw the code. Verdicts are 013's.</p>

| area | his | ours | verdict |
|---|---|---|---|
| coordinator | in-app, "2 waiting on you" badge | `controller` pi in a pane; `WAITING ON LANCE` list | spirit |
| landing | Lander agent merges branches | `land` moves rows; results are files, not branches | cut on purpose |
| memory | decisions · 118 facts · lessons, 6.8 k tokens | D + L only; **every line sourced, CLI refuses otherwise** | ours better |
| automations | instant, in-app | ledger + 60-s tick; controller arms its own round | same, slower |
| flush / dream | "Dream before compaction" | flush at 75 %, propose-only dream, human promotes | spirit |
| UI | rich bar, panels, dialogs | one text strip | **his better** |
| `core changed → restart` | on the bar | nothing — the controller may run stale prompts | **his better / open** |
| verification | not visible | 009 / 010 / 011 / 012 in `results/` | ours better |

<!--
Backup, for questions. Brief 013 compared this to Tobi's personal ULTIMATE harness from one screenshot — we never saw his code, so the "his" column is inferred. His is better on UI, and on a "core changed, restart" indicator we still lack; the controller here can run a stale prompt with nothing saying so. Where ours is better: memory where every line is sourced and the CLI refuses otherwise, and a verification trail that lives in the repo. The rest is the same idea with different trade-offs: a ledger and a sixty-second tick instead of instant in-app automations, a propose-only dream, and no lander because results are files, not branches.
-->

---

<!-- _class: invert tiny wide -->

# Backup · The 0.2.0 scorecard: ten scenarios, before and after the fixes

<p class="take">Grades from the test brief (009, 10-27) and after the fix brief (012, 10-28). Every pass has a log line, not a pane glance.</p>

| 009 scenario | grade | after 012 |
|---|---|---|
| S1 fresh controller boots from files | pass (silent name collision) | pass, collision printed |
| S2 tick survives restart & re-arms | pass | pass |
| S3 `stuck?` fires on a silent worker | **FAIL** (cache warming kept the session "busy") | **pass** at 20 min, with the log line |
| S4 pause drains / holds / collapses | pass | pass |
| S5 mid-turn wake queued, not dropped | pass | pass |
| S6 compaction flush loop | partial (typed `/compact`) | **pass**, extension-triggered |
| S7 second room on one machine | pass | pass (+ a real-world strip fix) |
| S8 dream after a batch · S9 kill switch & rate cap | pass · pass | pass · pass |
| S10 Herdr restart | **untested** | **untested** |

<span class="dim">The code review (011) between the two columns: 3 blockers · 12 should-fix → "not safe to commit".</span>

<!--
Backup: the full scorecard behind the verification slide. Two things to point at. S3, stuck detection, failed because pi's cache warming appends a usage entry every few minutes during a long tool call, so "session quiet" never became true in exactly the stuck case; the fix measures quiet from the last non-usage entry, and the re-run flagged a silent worker at twenty minutes with a log line. S6, compaction, was partial because a typed compact did the work; after the fix the extension compacted on its own. S10, a Herdr restart, has never been tested. The review between the columns found three blockers and said not safe to commit; all were closed before 0.2.0.
-->
