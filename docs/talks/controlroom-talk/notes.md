# Running a control room — speaker notes

*Lance Riedel · ~25 min · ~50 Shopify engineers · Nov 2026 · internal.* Deck: `deck.md` (Marp) → `deck.html` / `deck.pdf`. Text captures in `assets/`. Every number on a slide is listed under **Sources** at the end with the file or command it came from.

Timing guide: 18 slides, ~80 s each ≈ 24 min; slides 9, 10, 12 can take 2 min; slides 1, 3, 18 under a minute.

## 1. Running a control room

Hi. This talk is about how I actually work day to day: one AI controller per project, a pile of worker agents, and a rule that everything that matters is a Markdown file in git. When I close the laptop, I stop — the project doesn't, because the state is in files and the long jobs are on a VM. Most of you use pi; many use Herdr. Few of you have seen the control-room layer on top, so that's where I'll spend the time. Every number I show traces to a file or a command; the sources are in the notes handout. Nothing here is marketing. Where something is unproven or still open, I'll say so.

## 2. Herdr + pi in 90 seconds

Two tools, quickly. pi is the agent: a session is a JSONL file on disk, it has extensions and skills, and it reaches models through the Shopify proxy. One pi, one pane, one job. Herdr is the multiplexer that owns those panes — locally and on remote machines with the same CLI — and it knows the state of the agent in each pane: working, idle, done, blocked. Four commands matter: list, prompt, read, focus. The capture is my laptop right now: sixty-eight agents; I've shown eight, one controller per room. Everything in this talk is built on those primitives.

## 3. Why I built it

Here's the situation in September. One research project, around fifteen worker agents in Herdr tabs, and the plan lived in the controller's chat. Every failure mode came from that. Compaction or a crash lost the reasoning. The files that did survive were never read back by a fresh session. The watchers were nohup loops that died with Herdr. The one that really stung: a worker sat twenty-six hours at ninety-eight percent CPU while the strip said "working". And when the laptop slept, pipelines died mid-write. So the design rules that fell out were simple: files first, the human closes the loop, every claim verifiable, and cheap enough to leave running.

## 4. The operating model

This is the whole shape. One controller pi per room — I talk to it, it writes briefs, launches workers in their own tabs, and integrates results. It never does long work itself. Six pieces: the controller; briefs that become results, both files; the board, STATUS.md, which is the one shared truth; memory — decisions and lessons, one line each, every line sourced; the tick, a sixty-second reconciler launchd runs; and automations, a Markdown ledger the tick reads and rewrites. The footprint is about twenty-three hundred lines of bash and Python, a ninety-eight-line pi extension, three prompt templates. No server, no database.

## 5. A brief is a contract

Since last week a brief is enforceable, not just instructive. Two optional pieces: a `writes:` line — the only paths the worker may touch — and an Acceptance block: shell lines, exit zero is pass. `controlroom check` runs them plus defaults: result exists, ends with DONE, has a Deviations section. On the right is the live run against brief 019 from this morning. Nine pass, one fail — and the fail is honest: the write-scope check is repo-global, so it caught *this deck* being built in the same repo. Then `land` runs the judge: a short read-only pi run that grades the result against the brief. Advisory, unless a line starts with `must:`. About six cents per review.

## 6. The board & the strip

The board is STATUS.md; the strip is the board plus live state, refreshed every fifteen seconds in a pane under the controller. Above is a real capture from this room, trimmed. Top down: the header says the tick is alive and when the next wake is. ROOMS shows one controller per host and which one is primary. AGENTS is grouped by host; the arrow marks controllers; detail mode adds last write, context percent and the acceptance chip — you can see this worker failing acceptance while it's still working, which is correct. Then cost in detail only, memory counts against budget, and automations. One rule from the legend: red means a human is needed. Everything else, the controller handles.

## 7. Memory

Memory is two files, decisions and lessons, one line each, with a hard grammar: ID, date, slug, one-liner, source arrow. No source, no line — the CLI refuses. Budget is forty and thirty; we're at thirty and thirty. These six lines are real. D015: the controller is a pane id, not a name. L005 is the twenty-six-hour worker. L046 is the compaction storm I'll get to. Memory reaches workers through the brief: the controller pastes the applicable lines verbatim. A dream step only proposes; a person promotes. At seventy-five percent context the extension asks the controller to flush, then compacts. And Boot — the order a fresh controller reads files in — is what makes any of this survivable.

## 8. Automations

Automations are rows in a Markdown table. The tick reads it, fires what's due, rewrites it — kill the tick, lose nothing. Watch rows are armed by every launch and only toast. Wake rows prompt the controller at a time; the important one is the round wake: every two hours, integrate, land, update the board. The controller arms that itself at Boot — "A44 wakes me at 15:34" is behaviour, not prose. Prompt uptake came from a real failure: eight o'clock wakes died to connection errors seconds after the Mac woke, so the tick now checks the controller actually ran a turn and re-prompts if not. Guards: six prompts an hour, a per-room kill switch, and pause holds rows.

## 9. Durability, honestly

This table is the honest version. Compaction: the flush loop is proven live with a log line, but only through the manual flush route. Fresh sessions from files: proven repeatedly, including model hand-offs in graph-search. Reboot: tick and ledger come back; on November tenth we learned that launchd units outside LaunchAgents die on reboot. Sleep: wakes fire late, not never; a weekend with machines down fifty-three hours left all four controllers alive. Then the storm: a controller at one-sixty-seven percent context looped flush-compact seventy-nine times in twenty minutes, three hundred fifty dollars, and never shrank. We added a breaker. Recovery was a fresh session booted from files — exactly what the design is for.

## 10. Remote machines

Here is how the laptop problem is solved. Three hosts. The laptop runs the primary controller and anything needing my identity. dev002 runs ingest and long jobs and a standby controller with its own Herdr, clone and tick. c4d runs serving and the judge. Each brief says which host owns it. Before closing the laptop I run `controlroom mode remote dev002`: it pulls, refuses a dirty board, rewrites the MODE line, writes a hand-off block, commits signed, pushes, and prompts both controllers with their roles. The next tick moves the star, the tab labels and the PRIMARY chip — all derived from the board, so they never disagree. The capture: sixteen agents local, four on dev002, eleven on c4d, one strip.

## 11. The projects

Seven rooms. pi-controlroom builds the tool and eats its own output on every launch. lookbook-research is where the shape came from — the taste graph, fifty-one briefs. graph-search is the big one: a hundred and seven briefs, fifty-nine landed, three hosts, about a thousand dollars of model spend across thirty-seven worker sessions — and a memory file far over budget, which is a real problem I'll come back to. kumo-research answered its first question with a decision-grade no and is paused waiting for me. upi-clustering ran shingling on ten million real products. taste-id is a week old. And gsd-reviews is a control room pointed at my own review inbox. The pattern is the same in every one of them.

## 12. A day in the life — graph-search, Mon 2026-11-17 (`logs/agents.log`)

One real day, from the log. Eight-oh-eight: the first wake fires seconds after the Mac wakes and dies to an auth error; the tick re-prompts. Eight twenty-seven, Boot and the overnight round. Morning rounds come back idle and record a lesson. At half twelve the controller proposes brief 089 to me — that's a question, the one thing that waits. Early afternoon: a follow-up to a warm worker, DONE, landed, status page republished; then a new launch, DONE in twenty minutes, landed and published. Three-sixteen I shut the laptop; the room hands off to dev002. Next morning I take it back. The footnote matters: this room ran two round wakes, which is wrong; we fixed the rule the next day.

## 13. Publishing: lancedocs

Nobody should have to read a board to know where a project stands, so every launch and land republishes a page. The renderer takes the board, live health, and a hand-written preamble the tool never overwrites, and produces Markdown and HTML. Two publishers: GitHub Pages via an orphan branch, one force-pushed commit, so source history never carries rendered HTML; and a per-room shell hook that copies the HTML into my lancedocs tree and runs the deploy script, which in turn mirrors to Google Docs. Graph-search turns the landed table off and lets the preamble carry the story. Event-driven, never on a clock; it needs my identity, so a remote room just queues it.

## 14. Verification culture

The thing I'm proudest of isn't a feature. Before committing 0.2.0, a worker ran ten scenarios against the live room: fresh boot, tick restart, stuck detection, pause, mid-turn queuing, compaction, two rooms, dream, the kill switch, a Herdr restart. Stuck detection failed — pi's cache warming kept the session looking busy. Compaction was partial. A code review said "not safe to commit", three blockers. A fix brief closed all of it and re-proved the failures with log lines, not screenshots. One scenario is still untested; I say so. Because the CLI is symlinked, a fix found in any room reaches every room within a minute — which is also how a bad save would, hence the lessons about WIP copies.

## 15. Not Torrent — and not trying to be

People ask how this relates to Torrent: it isn't one and isn't trying to be. The left table is brief 013, comparing to Tobi's personal harness from a screenshot — we never saw his code. His is better on UI, and on a "core changed, restart" indicator we still lack. Where ours is better: sourced, enforced memory and a verification trail in the repo. Torrent is a platform: issues become agents become PRs, and Objectives add a lead agent with a charter enforced by a judge. I borrowed the judge idea directly — brief 019. The bridge: a brief is a file; a Torrent issue could be one kind of worker. But this is one person, a folder, and bash.

## 16. Costs & models

Money, plainly. Graph-search's thirty-seven worker sessions cost about a thousand dollars. Fable did almost all the useful work and the spending: ten of twelve briefs done. Sol was cheap and slow. Mini cost the same as sol and finished nothing — never mini for deliverables. For controllers, sol was twenty-seven dollars a day versus three hundred forty-eight for fable, and I still moved every controller to fable mid-November because the round loop was too slow on sol. The judge is pennies. And one rule I learned the expensive way: never switch models inside a session — write a hand-off file and start fresh. Cost is in the detail view on purpose; the alarm that matters is no progress.

## 17. Future

What's next. The honest gap is still the controller: it sleeps with the lid unless I hand off to the VM. pi.shopify.io has the right shape — durable sessions on Cloud Run, timer wakes, a session API — but no filesystem or shell yet, and an agent can't read its docs behind Mint and WARP; the spike brief is waiting on me. Launch with a host flag is overdue. Tobi's remote workstations — I'll fill that in live; I don't have a source in the repo and I won't invent one. Charters: a must-block is a charter in miniature. A default Drive publisher. And the gaps I know about and haven't fixed, including graph-search's memory being far over budget.

## 18. Takeaways

Three things to take away. Files are the protocol — if it isn't in a file it didn't happen, and that's what lets a fresh agent or a colleague pick the room up cold. Make the brief a contract: a writes line, an acceptance block, a judge at land, so deviations are declared rather than discovered. And only blocked needs you — the controller rounds every two hours, lands what's done, and a VM room carries on while the laptop is shut. Install is one line; a room is created by typing slash-controller in a pane. The exec overview, the live status page and this deck with every source are all in the repo. Questions.
## Sources
- Slide 6 strip: **illustrative composite** for graph-search (real agent names/briefs/states from `logs/agents.log` and STATUS 11-17; times, ctx %, costs combined into one moment — say so if asked). Slide 7 ("Reading the strip") is the legend split out of slide 6.
- Slide 5 brief excerpt: `~/src/github.com/shopify-playground/graph-search/docs/briefs/005-graph-walk-operator.md` (trimmed); outcome line: graph-search `docs/status/preamble.md` row 005 (landed 11-09). — every number on a slide, with where it came from

All paths are relative to `~/src/github.com/lanceriedel/pi-controlroom` unless noted. Captures were taken 2026-11-23 13:35 CST and are saved verbatim in `assets/`. "Brief 020" = `docs/briefs/020-talk-deck.md` (facts the controller pre-computed and handed to this deck's worker).

### Slide 1 — The one-liner
- "closing the laptop pauses the person, not the project" — `docs/exec-overview.md` §"The one-paragraph version".

### Slide 2 — Herdr + pi in 90 seconds
- **68 agents** — `herdr agent list` 2026-11-23 13:35 → `assets/herdr-agent-list.raw.json` (`len(result.agents)`); the 8 shown rows → `assets/herdr-agent-list.txt`.
- Herdr commands — `README.md` "Useful Herdr commands from any pane"; `herdr --machine <label>` — `README.md` §"Multiple machines".
- pi sessions as jsonl — `README.md` §"Health" ("reads each agent's pi session jsonl").

### Slide 3 — Why I built it
- "**~15** worker agents" (September) — brief 020 ("the September situation (15 agents, chat as memory)"); repo history starts 2026-09-16 (`git log --reverse --format=%cd --date=short | head -1`); the lookbook-research board `~/src/github.com/shopify-playground/lookbook-research/docs/briefs/STATUS.md` lists those worker rows.
- problem list — `docs/design/durable-controlroom.md` §0 "Problem" and `docs/exec-overview.md` §"Why this shape".
- `nohup` watchers died with Herdr — `docs/design/durable-controlroom.md` §2.1.
- **26 h** at **98 % CPU** — `docs/briefs/memory/LESSONS.md` L005; `README.md` §"Gotchas".
- sleep killed pipelines — `README.md` "lost a step to this once"; L002.

### Slide 4 — The operating model
- diagram — `README.md` top; six-pieces table — `docs/exec-overview.md` §"What it is made of".
- **2,335** lines in `bin/` — `wc -l bin/controlroom bin/controlroom-pager bin/controlroom-md2html bin/controlroom-pages bin/controlroom-check-lib` (1890 + 132 + … = 2335 total, 11-23).
- **98**-line extension — `grep -c '' extensions/controlroom.ts`. **three** prompt templates — `ls prompts/` (controller.md, dream.md, judge.md).
- "no server, no DB" — `docs/exec-overview.md` "Footprint" (which says ~1,500 lines / 90-line extension as of 11-17; the deck uses today's `wc`).
- controller never does > 5-min work — `README.md` §"Operating rules" #1.

### Slide 5 — A brief is a contract
- header + Acceptance block — `docs/briefs/018-acceptance-checks.md` lines 1–4 and 36–40 → `assets/brief-018-header-acceptance.txt`.
- `controlroom check 019` output (**9 pass · 1 fail**) — run 2026-11-23 13:35 → `assets/check-019.txt`. The FAIL is write-scope naming this deck's own untracked files (`docs/talks/…`, `results/020-talk-deck.md`) — L048 "write-scope is repo-global". (Brief 020 expected "10 pass"; that is what a clean tree gives — the 11-18 board note records `check 10/10` at land.)
- judge line `[11-17 16:08] judge 015: ACCEPT WITH NOTES ($0.0664)` — `logs/agents.log` → `assets/judge-lines.txt`.
- judge cost **$0.02–0.10**, 17–44 s — `docs/briefs/results/019-judge.md` "Cost model"; `README.md` §"Judge (019)".
- `must:` is hard — D032 in `docs/briefs/memory/DECISIONS.md`.

### Slide 6 — The board & the strip
- capture — `NO_COLOR=1 COLUMNS=100 controlroom status` in pi-controlroom, 13:35 → `assets/status-pi-controlroom.txt` (full) / `assets/status-pi-controlroom.trimmed.txt` (slide). ANSI escapes that `NO_COLOR=1` left in the header line were stripped with `sed`.
- numbers on it: `ctx 58%`, `$342.42 / $94.32 / $105.14`, `compactions 2`, `30 decisions · 30 lessons`, `next A044 15:34` — all from that capture.
- legend (states, 20 min / 10 min / 30 min thresholds) — `README.md` §"The status strip" table and §"Health"; D006/D009 in DECISIONS.md.
- budget **40/30** — D006; `README.md` §"Memory".

### Slide 7 — Memory
- grammar line — `docs/briefs/memory/LESSONS.md` line 1; `docs/design/durable-controlroom.md` §1.2.
- budget **40 D / 30 L**, flush **75 %** — D006. today **30 · 30** — capture `assets/status-pi-controlroom.txt` MEMORY line; `controlroom memory --counts`.
- D002, D015, D031 — `docs/briefs/memory/DECISIONS.md` (quoted exactly; wrapped onto two lines for the slide).
- L005, L028, L046 — `docs/briefs/memory/LESSONS.md` (quoted exactly; wrapped).
- memory via briefs — D007. dream propose/promote/reject — `README.md` §"Memory" "Dream"; D014. Boot order — `prompts/controller.md` §"Boot".

### Slide 8 — Automations
- table rows A033, A040, A042, A043, A044 — `docs/briefs/AUTOMATIONS.md` → `assets/automations-excerpt.txt` (instruction cells trimmed).
- round-wake text — A044 row, same file; the controller arms it at Boot — D020; `prompts/controller.md` Boot step 7.
- uptake lines — `logs/agents.log` (`A036 turn aborted (Connection error.) → re-prompted`, 11-08 16:34; 11-09 10:38) and `logs/tick.log` (`A032 prompt taken (controller turn ran)`, 11-06 04:54) → `assets/prompt-uptake-lines.txt`; mechanism — D028, `docs/briefs/results/014-prompt-uptake.md`; root cause — L039.
- guards: wakes prompt / watches don't — D002; **≤ 6/h** — D006; `logs/AUTOPROMPT-OFF` — `README.md` CLI table; held/collapse — `README.md` §"Automation".

### Slide 9 — Durability, honestly
- table skeleton — `docs/briefs/results/010-tobi-scorecard.md` §3 (rows Compaction / Controller restart / Herdr-laptop restart / Sleep / Human absent), re-graded by `docs/briefs/results/012-close-the-loop.md` "Re-graded 009 scorecard rows" and `docs/briefs/results/013-tobi-comparison.md` §6.
- S6 proof line `compaction — #2 tokensBefore=80674` — `logs/agents.log` 10-27 15:41; L030. "automatic ≥ 75 % path untested live" — 013 §6 last rows / 012 "Still open".
- S1 scratch Boot — `docs/briefs/results/009-durability-tests.md` §S1. graph-search fresh sessions 11-10 / 11-11 / 11-13 and `handoff.md` hand-offs — `docs/briefs/STATUS.md` Notes 11-10 10:08, 11-12 08:03, 11-13 10:50.
- S2 `launchctl bootout` → back in **~10 s** — 009 §S2. 11-10 reboot killed every tick → `~/Library/LaunchAgents` — L044; STATUS Notes 11-10 08:02. pane name lost / Boot step 5 — L036, `prompts/controller.md`. S10 untested — 009 §S10, 013 §6.
- A025 fired **6 min late ×2** — L035 (superseded, kept for the observation; `logs/agents.log` "A025 fired" 21:45/23:45). Weekend **53 h** down, four controllers alive — STATUS Notes 11-16 08:55. in-flight API calls don't survive sleep — L002.
- graph-search 11-17 **11 rounds, 2 lands, 2 launches** — count of `A085#NN`/`A002#NN` round lines, `landed` lines and `launched` lines in `~/src/github.com/shopify-playground/graph-search/logs/agents.log` for `[11-17 …]` (also `assets/agents-log-graph-search-11-17.txt`).
- **167 % storm**: 167 % ctx, **272 k** window, **×79 in 20 min**, **~$350**, pid 9046, fresh session at **16 %**, breaker **27933ca** — `docs/briefs/STATUS.md` Note 11-10 10:08; L046; `extensions/controlroom.ts` line 20 comment ("circuit breaker"). "30-min breaker" — STATUS Note 11-10 ("Extension now has a 30-min breaker").

### Slide 10 — Remote machines
- hosts and machine types (`dev002` n4-standard-16 ingest/scan; `c4d` c4-standard-48 serving/judge/demo/latency) — `~/src/github.com/shopify-playground/graph-search/docs/briefs/STATUS.md` line 3 (`hosts:`).
- what stays local — `README.md` "What to keep local"; `docs/two-controller-protocol.md` §1.
- `controlroom mode remote dev002` steps — `README.md` §"Changing the primary"; labels table — `README.md` §"Who is primary — reading the labels" (copied).
- **~65 s** round trip — `docs/two-controller-protocol.md` "Measured round trip"; `README.md` §"Two controllers".
- capture — `HERDR_WORKSPACE_ID=wD HERDR_PANE_ID=wD:p1 NO_COLOR=1 COLUMNS=100 controlroom status` run in `~/src/github.com/shopify-playground/graph-search` 13:35 → `assets/status-graph-search.txt` (full), `assets/status-graph-search.rooms-agents.txt`; slide version shortens lines. (Without the two env vars the LOCAL group shows the pane the command was run from, wC.) **16 / 4 / 11** agents — the group headers in that capture.

### Slide 11 — The projects
Brief counts = `ls <room>/docs/briefs | grep -c '^[0-9]'` on 11-23. Memory counts = `grep -c '^- D' …/memory/DECISIONS.md` / `grep -c '^- L' …/memory/LESSONS.md`. Landed = rows in `## Landed`.
- **pi-controlroom** — 18 briefs; 30 D · 30 L (`controlroom memory --counts`, capture); "0.2.x verified by 009–012" — `docs/briefs/STATUS.md` Landed.
- **lookbook-research** — 51 briefs; fashion v2 **354 shops · 1.42 M buyers · 79 M line items** — `…/lookbook-research/docs/briefs/STATUS.md` Workers row "pipelines tab"; hosts: `dev002-stack` row (020) same file.
- **graph-search** — 107 briefs; **59** landed rows; **74 D / 162 L** (also the strip's `MEMORY 74 decisions · 162 lessons … ⚠ over budget`, `assets/status-graph-search.txt`); **37 sessions ≈ $1,050** — brief 020 "Model/cost facts (computed 11-11 from session jsonl)" and `docs/exec-overview.md` §"Numbers so far"; hosts — STATUS line 3.
- **kumo-research** — 64 briefs; Q1 answered **NO**, **n = 160, 3 universes** — `…/kumo-research/docs/status/preamble.md` "Question 1"; PAUSED on Q6 — same file + `STATUS.md` line 4; hosts dev002 + c4d — STATUS line 31 ("copied dev002 → c4d").
- **upi-clustering-research** — 10 briefs, 10 landed; **10.13 M** products, **45 % @ J ≥ 0.7** — `…/upi-clustering-research/docs/status/preamble.md` "Measuring the shingling thesis".
- **taste-id-research** — 5 briefs; set up 11-17 — pi-controlroom `docs/briefs/STATUS.md` Note 11-17 09:25; hosts — its `STATUS.md` lines 2–3.
- **gsd-reviews** — 1 brief; **6 prepared reviews + INBOX** — pi-controlroom STATUS Note 11-19 08:33 and `~/src/github.com/lanceriedel/gsd-reviews/docs/briefs/STATUS.md` Landed row (`ls docs/reviews` = 7 files = 6 + INBOX); what it is — `~/src/github.com/lanceriedel/gsd-reviews/README.md`.
- **personalized-search-demo** (footnote) — 25 briefs; "first two-controller room" — its `STATUS.md` line 2 ("remote room live, round-trip 020 passed", 11-06).

### Slide 12 — A day in the life
- every line — `~/src/github.com/shopify-playground/graph-search/logs/agents.log`, `[11-17 …]` and `[11-18 08:31]`, verbatim (right-hand annotations added) → `assets/agents-log-graph-search-11-17.txt`.
- two recurring wakes corrected 11-18 — same log, `[11-18 08:46] A090 … one recurring round (A089, 2h) is the standard` and `(L163)`; rule — `docs/two-controller-protocol.md` §"The rest of the protocol" #3.

### Slide 13 — Publishing: lancedocs
- flow — `README.md` §"Status page" and §"Status page (where it is published)"; `docs/briefs/results/015-status-page.md` "Design as built"; `bin/controlroom-pages` (orphan `gh-pages`, one force-pushed commit).
- `publishers.sh` lancedocs recipe (paths `~/.brain/memory-bank/personal/docs/<room>/where-we-stand-latest.html`, `deploy-lancedocs.sh`) — `~/src/github.com/shopify-playground/graph-search/docs/status/publishers.sh`.
- Google Docs mirror **54 native Docs, md5 manifest, owner-only** — `~/src/github.com/shopify-playground/personalized-search-demo/docs/briefs/results/011-gdocs-mirror.md`.
- snapshots → `docs-archive/` — pi-controlroom `docs/briefs/STATUS.md` Note 10-29 ("lancedocs snapshots now go to …/docs-archive/").
- live URL — STATUS Note 11-08 16:40. event-driven — D029. symlink gotcha — L042. `--no-landed` — `README.md` §"Status page"; graph-search `docs/status/flags`.

### Slide 14 — Verification culture
- gate order and commit **327109a** — D017, D027; `docs/briefs/STATUS.md` Landed.
- S1–S10 grades — `docs/briefs/results/009-durability-tests.md` "Scorecard" table (note: its prose header says "two fails, three partials"; the table — 7 pass · 1 FAIL · 1 partial · 1 untested — and the board's Landed one-liner are what the slide uses); after-012 column — `docs/briefs/results/012-close-the-loop.md` "Re-graded" and `013-tobi-comparison.md` §6.
- 011: **3 blockers · 12 should-fix**, "not safe to commit" — `docs/briefs/STATUS.md` Landed row 011; D018.
- fixes land in every room within a minute — L032; the three examples L044, L046, L036 — LESSONS.md.

### Slide 15 — Not Torrent
- comparison rows — `docs/briefs/results/013-tobi-comparison.md` §3 (18 rows → 8 on the slide; wording condensed, verdicts kept). "118 facts · 6.8 k tokens" — 013 §2 (screenshot-inferred, as 013 labels it).
- Torrent bullets — brief 020 "Torrent facts (Slack, in 013)": issues → agents → Delta PRs; Objectives (Harry, 10-26) lead agent + charter + judge agent; "no way to steer"; PII-in-transcripts. Paraphrased; no Slack text quoted (brief constraint). Note: 013 itself does not mention Torrent — these facts come only from the brief.
- "what I borrowed" — `docs/briefs/019-judge.md` / `results/019-judge.md`; D032.

### Slide 16 — Costs & models
- model table (fable 24 / 3,921 / $963 / 10 of 12 DONE; sol 10 / 1,491 / $39; mini 4 / 1,769 / $39 / 0 DONE; controller sol $27/day vs fable $348/day; judge ≈ $0.06) — brief 020 "Model/cost facts (already computed 11-11 from session jsonl, cite as such)". Not recomputed here.
- controllers on fable 11-13 — D030; `docs/briefs/STATUS.md` Note 11-13 10:50.
- today's lifetime controller spend **$342.42** (pi-controlroom) / **$651.21** (graph-search) — strip `COST` lines in `assets/status-pi-controlroom.txt` / `assets/status-graph-search.txt` (from pi session jsonl).
- judge `$0.0664` — `assets/judge-lines.txt`; range — 019 result "Cost model".
- never switch mid-session — `~/src/github.com/shopify-playground/graph-search/docs/briefs/memory/LESSONS.md` L091 ("590k worker history to a 400k model … file handoff and fresh session"); D030 "switch = handoff + fresh session".
- `$` in detail view only — D004.

### Slide 17 — Future
- pi.shopify.io facts (Pi Durable sessions, Cloud Run/Postgres, tab↔server, timer wake, REST/SSE, `pi.js`, no filesystem/shell, Mint + WARP only) — brief 020 "pi.shopify.io facts (STATUS 11-10, docs/briefs/inputs/pi-host/README.md)"; `docs/briefs/inputs/pi-host/README.md`; brief 017 waiting — `docs/briefs/STATUS.md` "Decisions waiting on the human".
- `launch` targets local Herdr; `host-setup` TODO — `README.md` §"Multiple machines" / `docs/two-controller-protocol.md` §6.
- Tobi's remote workstations — **no source in this repo**; left as `[Open — Lance to fill]` per brief 020.
- charters — brief 020 slide 17 spec; `must:` — D032.
- Drive publisher — psd `results/011-gdocs-mirror.md` exists; "default recipe" is the proposal.
- known gaps: `core changed → restart` — 013 §8 #1; S10 — 009 §S10; graph-search **74 D / 162 L**, `last dream never` — `assets/status-graph-search.txt` MEMORY line.

### Slide 18 — Takeaways + links
- install line — `README.md` §"Install"; `/controller` — `README.md` §"First use".
- exec overview path — `docs/exec-overview.md` on branch `master` (`git branch --show-current`); live page URL — `docs/briefs/STATUS.md` Note 11-08 16:40.
- "only blocked needs you" — `README.md` §"Operating rules" #7.

### Captures index (`assets/`)
| file | command / origin |
|---|---|
| `herdr-agent-list.raw.json` | `herdr agent list` (JSON, 68 agents) |
| `herdr-agent-list.txt` | 8-row trim of the above |
| `status-pi-controlroom.txt` / `.trimmed.txt` | `NO_COLOR=1 COLUMNS=100 controlroom status` in pi-controlroom |
| `status-graph-search.txt` / `.rooms-agents.txt` | same in graph-search with `HERDR_WORKSPACE_ID=wD HERDR_PANE_ID=wD:p1` |
| `check-019.txt` | `controlroom check 019` |
| `brief-018-header-acceptance.txt` | `sed -n '1,4p;36,40p' docs/briefs/018-acceptance-checks.md` |
| `automations-excerpt.txt` | rows A033/A040/A042/A043/A044 of `docs/briefs/AUTOMATIONS.md` |
| `prompt-uptake-lines.txt` | `grep 'turn aborted' logs/agents.log`; `grep 'prompt taken' logs/tick.log` |
| `judge-lines.txt` | `grep 'judge 01[45]:' logs/agents.log` |
| `agents-log-graph-search-11-17.txt` | `grep '^\[11-17' …/graph-search/logs/agents.log` (selected lines) + the 11-18 08:31 line |
