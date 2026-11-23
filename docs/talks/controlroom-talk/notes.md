# Running a control room — speaker notes

*Lance Riedel · ~25 min · ~50 Shopify engineers · Nov 2026 · internal.* Deck: `deck.md` (Marp) → `deck.html` / `deck.pdf` / `deck.pptx`. Text captures in `assets/`. Edited for clarity and flow by brief 021 (2026-11-23): titles are claims, each slide opens with its takeaway, `$` figures live on slide 17 only, detail moved from slides into these notes. Every number on a slide is listed under **Sources** at the end.

Timing guide: 19 slides + 2 backup, ~75 s each ≈ 24 min. Slides 1, 7, 19 under a minute; slides 5, 10, 11, 17 may take 90 s. Backup slides 20–21 are for questions only.

## 1. Running a control room

This talk is about how I actually work: one AI controller per project, a pile of worker agents, and a rule that everything that matters is a Markdown file in git. When I close the laptop, I stop — the project doesn't, because the state is in files and the long jobs are on a VM. Most of you use pi; few have seen the control-room layer on top, so that is where I will spend the time. Three things to leave with, and I will come back to them at the end: files are the protocol, a brief is a contract, only blocked needs you. Every number traces to a file; where something is unproven, I will say so.

## 2. Two tools you already have: pi is the agent, Herdr owns the panes

Two tools, quickly, because everything else sits on them. pi is the agent: a session is a JSONL file on disk, it has extensions and skills, and it reaches models through the Shopify proxy. The rule I never break: one pi, one pane, one job. Herdr is the multiplexer that owns the panes — locally and on remote machines with the same CLI — and it knows the state of the agent in each pane: working, idle, done, blocked. Four commands matter: list, prompt, read, focus. The capture is my laptop as I built this deck: sixty-eight agents, eight shown, one controller per room — and a room is just one project's control room.

## 3. Chat was the memory, and chat does not survive

Here is September. One research project, about fifteen worker agents in Herdr tabs, and the plan lived in the controller's chat. Every failure came from that one fact. Compaction, a crash, sleep or a new session lost the reasoning — why we decided, what bit us, what was in flight. The files that did survive were never read back by a fresh session, so they might as well not have existed. The watchers were nohup loops that died with Herdr. The one that stung: a worker sat twenty-six hours at ninety-eight percent CPU while the strip said working. Sleep killed pipelines mid-write. The rules that fell out are the rest of this talk.

## 4. The operating model: one controller, files in between

This is the whole shape. A room is one project. One controller pi per room — I talk to it, it writes briefs, launches workers in their own tabs, and integrates what comes back; it never does long work itself. Six kinds of file. A brief is a work order; the result is its answer. The board is the one shared truth: who is on what, what has landed — finished and integrated — and what waits on me. Memory is decisions and lessons, one sourced line each. The tick is a sixty-second reconciler under launchd. Automations is the ledger it fires; the standing one is the two-hour round. Twenty-three hundred lines of bash and Python, no server.

## 5. A brief is a contract: exact inputs in, a checked result out

A real brief, not a toy: the one that got graph-search its first engine-native change. Read the shape, not the content. Objective says why and what it builds on. Inputs are exact — paths, a pinned sha, counts — because a worker that has to guess will guess wrong. Constraints start with the room's memory lines quoted verbatim, so the worker inherits what the room already learned. Since last week there is a seventh part: an Acceptance block and a writes line. Land refuses a result that fails them, then a cheap read-only judge grades it against the brief with quotes. This one came back with a lift from forty-two to sixty-three percent and thirteen passing tests.

## 6. The strip is the board plus live state — one glance per room

The board is STATUS.md; the strip is the board plus live state, refreshed every fifteen seconds under the controller. This one is an illustrative composite of a graph-search afternoon — names, states and layout are real, from the November seventeenth logs; I combined the times into one picture. Top down: the header says the tick is alive and when the next wake is. ROOMS shows one controller per host and which is primary. AGENTS is grouped by host; detail mode adds last write, context and the acceptance and judge chips. Three states on screen: working, done, and one red blocked row with a question for me. Red means a human is needed; everything else the controller handles.

## 7. Reading the strip: red is the only colour that needs a human

The legend, because you will see this strip again. Left, the lines: the header tells you if the room is alive — tick ok, or a red NO TICK — and when the next wake fires. ROOMS: one controller per host and who is primary. AGENTS grouped by host; the rest are log tails and counts. Right, the colours. Yellow is the room working. Green means results are probably on disk. Red comes in two flavours: blocked, the only state that needs a human, and stuck? — a worker that has written nothing for twenty minutes with a quiet session, the alarm built after the twenty-six-hour worker.

## 8. Memory is two files, and no line gets in without a source

Memory is two files, decisions and lessons, one line each, with a hard grammar: ID, date, slug, one-liner, source arrow. No source, no line — the CLI refuses to write it. Budget forty and thirty. These four lines are real. D015: the controller is a pane id, not a name, because names get lost on restart. L005 is the twenty-six-hour worker. L028 is a lesson about lessons: a claim about a mechanism needs a log line from that mechanism, because an earlier lesson turned out to be wrong. Briefs quote it verbatim. Dream only proposes; a person promotes. At seventy-five percent context the extension asks for a flush, then compacts. Boot is the fixed read order that makes it survivable.

## 9. Automations: the ledger is the state, the tick fires it

Automations are rows in a Markdown table — the ledger is the state. Wakes are timed prompts to the controller; watches fire when a worker finishes or blocks. The tick reads the table every minute, fires what is due, rewrites it. Kill the tick, lose nothing. The important row is the round wake: every two hours, integrate, land, update the board. The controller arms that itself at Boot — "A44 wakes me at 15:34" is behaviour, not prose. Prompt uptake came from a real failure: eight o'clock wakes died to connection errors seconds after the Mac woke, so the tick now checks the controller actually ran a turn and re-prompts. Guards: six prompts an hour, a kill switch, pause.

## 10. Durability, honestly: what survives what

This is the honest version. Compaction: the flush loop is proven live with its own log line, but only through the manual flush route; the automatic threshold path has not been exercised. Fresh sessions from files: proven repeatedly. Reboot: tick and ledger come back in seconds — and on November tenth we learned where launchd units must live. A Herdr restart has never been tested; I say so. Sleep: wakes fire late, not never; a weekend with machines down fifty-three hours left all four controllers alive. The storm: a controller at one-sixty-seven percent context looped flush-compact seventy-nine times and never shrank. We added a breaker; recovery was a fresh session from files — exactly what the design is for.

## 11. Remote machines: a VM room carries the work while the laptop is shut

Here is how the laptop problem is solved. Three hosts. The laptop runs the primary controller and anything needing my identity. dev002 runs ingest and long jobs plus a standby controller with its own Herdr, clone and tick; c4d runs serving and the judge. Each brief says which host owns it. Before closing the laptop I run controlroom mode remote dev002: it pulls, refuses a dirty board, rewrites the MODE line, writes a hand-off block, commits, pushes, and prompts both controllers with their new roles. The next tick moves the star, the tab labels and the PRIMARY chip — all derived from the board, so they never disagree. Brief pushed to verified result: about a minute.

## 12. Every project I run is a room now

Eight rooms, and the pattern is identical in each. pi-controlroom builds the tool and eats its own output on every launch. lookbook-research is where the shape came from — the taste graph, fifty-one briefs. graph-search is the big one: a hundred and seven briefs, fifty-nine landed, thirty-seven worker sessions across three hosts — and a memory file far over budget, which I will come back to. kumo-research answered its first question with a decision-grade no and is paused waiting for me. upi-clustering ran the shingling thesis on ten million real products. taste-id is a week old. gsd-reviews is a control room pointed at my own review inbox: one brief, six prepared reviews. Different domains, same six files.

## 13. One real day: the room works, I answer one question, then I close the laptop

One real day, from the log. Eight-oh-eight: the first wake fires seconds after the Mac wakes and dies to an auth error; the tick re-prompts. Eight twenty-seven: Boot and the overnight round, nothing to do. At half twelve the controller proposes brief 089 to me — a question, the one thing that waits for a person. Early afternoon: a follow-up to a warm worker, DONE, landed, page republished; a new launch, DONE in twenty minutes, landed. Three-sixteen I shut the laptop; the room hands off to dev002. Next morning I take it back with one command. The footnote matters: this room ran two round wakes, which is wrong; we fixed the rule the next day.

## 14. Publishing: every landed brief republishes a page humans actually read

Nobody should have to read a board to know where a project stands, so every launch and land republishes a page. Left box: the inputs — the board, live health, and a hand-written preamble the tool never overwrites. Middle: the renderer turns that into Markdown and HTML. Right: three destinations. GitHub Pages via an orphan branch, force-pushed as one commit so source history never carries rendered HTML. lancedocs, my personal docs site — a per-room shell hook copies the HTML into that tree and runs the deploy script, which mirrors into Google Docs. Three rules: narrative is human, facts are generated; events, never a clock; identity-bound steps run only on the laptop.

## 15. Verification is how it earned trust

The thing I am proudest of is not a feature. Before committing 0.2.0, a worker ran ten scenarios against the live room. Stuck detection failed — pi's cache warming kept the session looking busy. Compaction only half worked. A code review said not safe to commit, three blockers. A fix brief closed all of it and re-proved the failures with log lines, not screenshots. One scenario is still untested; the scorecard is a backup slide. Second half: lessons found in use ship within a minute, because the CLI is a symlink into this repo. Example: the November tenth reboot killed every room's tick — wrong launchd directory. Fixed in tick-install, every room re-bootstrapped that morning.

## 16. Two tools, two jobs: Torrent ships a team's PRs; a control room runs one person's project

People ask how this relates to Torrent. Torrent is Shopify's platform: an issue becomes an agent becomes a PR, with a team behind it. This is one person running one project from a folder. Three contrasts. Unit of work: issue to PR versus brief to result file. Where it runs: a platform versus a folder plus Herdr panes on my machines. How you steer: one Torrent complaint I saw was "no way to steer" mid-run; here you edit the brief or the board, or answer a blocked worker. What I borrowed: Objectives pair a lead agent with a charter enforced by a judge agent — the judge at land is that idea. The bridge is inferred, not built.

## 17. Costs & models: fable does the work, sol is cheap, mini finishes nothing

Money, plainly. Thirty-seven graph-search worker sessions cost about a thousand dollars. Fable did almost all the useful work: ten of twelve briefs done at a quarter a turn. Sol was cheap and slow. Mini cost the same and finished nothing — never mini for deliverables. For controllers, sol was twenty-seven dollars a day versus three hundred forty-eight for fable, and I still moved every controller to fable in mid-November because the round loop was too slow. One rule learned the expensive way: never switch models inside a session — write a hand-off file and start fresh. The storm cost three hundred fifty dollars in twenty minutes; the judge is pennies. The alarm that matters is no progress, not spend.

## 18. Future: three bets

Three bets. First, a hosted controller. The honest gap is that the laptop controller sleeps with the lid unless I hand off to a VM. pi.shopify.io has the right shape — durable sessions, timer wakes, an API — but no filesystem or shell yet, and its docs sit behind Mint and WARP; the spike brief waits on me. Second, Tobi's remote workstations — I will fill that in live; I have no source in the repo and will not invent one. Third, room-level charters: a must block in a brief is a charter in miniature; the judge should grade every land against a standing one. Below the line, the smaller items, including graph-search's memory being far over budget.

## 19. Three things to take away

The three things I promised on the first slide. Files are the protocol — that is what lets a fresh agent or a colleague pick the room up cold. A brief is a contract: a writes line, an acceptance block, a judge at land, so deviations are declared rather than discovered. And only blocked needs you — the controller rounds every two hours, lands what is done, and a VM room carries on while the laptop is shut. If you want to try it: install is one line, and a room is created by typing slash-controller in a pane. The exec overview, the live page and this deck with every source are in the repo. Thank you.

## Backup 20. Tobi's "ULTIMATE" harness vs this room (brief 013)

Backup, for questions. Brief 013 compared this to Tobi's personal ULTIMATE harness from one screenshot — we never saw his code, so the "his" column is inferred. His is better on UI, and on a "core changed, restart" indicator we still lack; the controller here can run a stale prompt with nothing saying so. Where ours is better: memory where every line is sourced and the CLI refuses otherwise, and a verification trail that lives in the repo. The rest is the same idea with different trade-offs: a ledger and a sixty-second tick instead of instant in-app automations, a propose-only dream, and no lander because results are files, not branches.

## Backup 21. The 0.2.0 scorecard: ten scenarios, before and after the fixes

Backup: the full scorecard behind the verification slide. Two things to point at. S3, stuck detection, failed because pi's cache warming appends a usage entry every few minutes during a long tool call, so "session quiet" never became true in exactly the stuck case; the fix measures quiet from the last non-usage entry, and the re-run flagged a silent worker at twenty minutes with a log line. S6, compaction, was partial because a typed compact did the work; after the fix the extension compacted on its own. S10, a Herdr restart, has never been tested. The review between the columns found three blockers and said not safe to commit; all were closed before 0.2.0.

## Sources
- Slide 5 is the full abridged 005 brief (graph-search `docs/briefs/005-graph-walk-operator.md`, its own words, sections shortened); its `## Acceptance`/`writes:` lines are illustrative (005 predates the 11-17 feature). Slide 6 is the anatomy + outcome + gate.
- Slide 5: the `## Acceptance` / `writes:` lines are illustrative — added to the condensed 005 brief for the talk (005 itself predates the 11-17 feature); everything above them is from the real brief. — every number on a slide, with where it came from

All paths are relative to `~/src/github.com/lanceriedel/pi-controlroom` unless noted. Captures were taken 2026-11-23 13:35 CST and are saved verbatim in `assets/`. "Brief 020" = `docs/briefs/020-talk-deck.md` (facts the controller pre-computed for the first deck; the 021 edit introduced no number that is not in 020, in a room file, or derived below by arithmetic from them). Slide 6 is an **illustrative composite** (say so if asked); slide 7 is its legend; slides 20–21 are backup.

### Slide 1 — Running a control room
- "closing the laptop pauses the person, not the project" — `docs/exec-overview.md` §"The one-paragraph version". The three take-aways mirror slide 19 (`README.md` §"Operating rules" #7 "only blocked needs you").

### Slide 2 — Two tools you already have
- **68 agents** — `herdr agent list` 13:35 → `assets/herdr-agent-list.raw.json` (`len(result.agents)`); the 8 rows → `assets/herdr-agent-list.txt`.
- Herdr commands — `README.md` "Useful Herdr commands from any pane"; `herdr --machine <label>` — `README.md` §"Multiple machines". pi sessions as jsonl — `README.md` §"Health".
- "room = one project's control room" — `docs/exec-overview.md` "One per room"; `README.md` vocabulary.

### Slide 3 — Chat was the memory
- **~15** worker agents (September) — brief 020 ("the September situation (15 agents, chat as memory)"); repo history starts 2026-09-16 (`git log --reverse --format=%cd --date=short | head -1`).
- problem list — `docs/design/durable-controlroom.md` §0 "Problem"; `docs/exec-overview.md` §"Why this shape". `nohup` watchers died with Herdr — design §2.1.
- **26 h** at **98 % CPU** — `docs/briefs/memory/LESSONS.md` L005. sleep killed pipelines — `README.md` "lost a step to this once"; L002.

### Slide 4 — The operating model
- diagram — `README.md` top (redrawn in ASCII so the box edges align in the slide font); six-pieces table — `docs/exec-overview.md` §"What it is made of"; "round" wording — A044 row of `docs/briefs/AUTOMATIONS.md`.
- **2,335** lines in `bin/` — `wc -l bin/controlroom bin/controlroom-pager bin/controlroom-md2html bin/controlroom-pages bin/controlroom-check-lib` (11-23). **98**-line extension — `grep -c '' extensions/controlroom.ts`. **three** prompt templates — `ls prompts/`.
- controller never does > 5-min work — `README.md` §"Operating rules" #1.

### Slide 5 — A brief is a contract
- brief excerpt — `~/src/github.com/shopify-playground/graph-search/docs/briefs/005-graph-walk-operator.md`, **trimmed and re-wrapped** to 12 lines (headings pulled onto the same line as their first item; `graph_edge` count 2,049,392 dropped for width). Outcome **42 → 63 %**, **13/13 tests** — graph-search `docs/status/preamble.md` row 005 (landed 11-09). Dropped from the 020 deck: 17/24 ms p50/p95 and +1,054 lines (same source).
- anatomy table — `README.md` §"Briefs"; `docs/briefs/018-acceptance-checks.md` (Acceptance · `writes:`, enforced at `land` — landed 11-17, STATUS Landed row 018). "dev002 / c4d, two remote VMs" — `docs/exec-overview.md` "a remote VM (`dev002`, `c4d`)".
- the Acceptance block is **hypothetical** ("written today it would end with") — helper names from `bin/controlroom-check-lib`; `cr_has_section`/`cr_has_sentinel` as used in `docs/briefs/018-acceptance-checks.md`.
- `land` → `check` → `judge` → ACCEPT / NOTES / REJECT — `README.md` §"Judge (019)"; D032.

### Slide 6 — The strip (illustrative composite)
- layout, section order and field names — `NO_COLOR=1 COLUMNS=100 controlroom status` in graph-search → `assets/status-graph-search.txt`; agent names / briefs / states — `~/src/github.com/shopify-playground/graph-search/logs/agents.log` 11-17 and that room's STATUS 11-17. Times, ctx % and the `tick ok` stamp are combined into one moment. The 020 deck's `COST` line was dropped (D004: `$` on the costs slide only).
- `MEMORY 74 decisions · 162 lessons … last dream never` — the real MEMORY line in `assets/status-graph-search.txt`.

### Slide 7 — Reading the strip
- lines and states — `README.md` §"The status strip" table and §"Health" (stuck? = no write 20 min ∧ session quiet 10 min; spinning? 30 min); D006 / D009. budget **40/30** — D006.

### Slide 8 — Memory
- grammar — `docs/briefs/memory/LESSONS.md` line 1; `docs/design/durable-controlroom.md` §1.2. budget **40 D / 30 L**, flush **75 %** — D006. today **30 · 30** — `assets/status-pi-controlroom.txt` MEMORY line.
- D015, D031 — `docs/briefs/memory/DECISIONS.md`; L005, L028 — `docs/briefs/memory/LESSONS.md` (quoted exactly, re-wrapped onto three lines). D002 and L046 from the 020 deck were dropped (L046 carries a `$` figure → slide 17).
- memory via briefs — D007. dream propose / `--check` / promote — `README.md` §"Memory"; D014. Boot order — `prompts/controller.md` §"Boot".

### Slide 9 — Automations
- rows A033 / A040 / A042 / A043 / A044 — `docs/briefs/AUTOMATIONS.md` → `assets/automations-excerpt.txt` (instruction cells trimmed). round wake armed at Boot — D020; `prompts/controller.md` Boot step 7.
- uptake lines — `logs/agents.log` 11-08 16:34, 11-09 10:38; `logs/tick.log` 11-06 04:54 → `assets/prompt-uptake-lines.txt`; mechanism — D028, `docs/briefs/results/014-prompt-uptake.md`; root cause (08:00 wakes died to connection errors) — L039.
- guards: watches toast / wakes prompt — D002; **≤ 6/h** — D006; `logs/AUTOPROMPT-OFF` — `README.md` CLI table; held / `[play]` — `README.md` §"Automation".

### Slide 10 — Durability, honestly
- rows — `docs/briefs/results/010-tobi-scorecard.md` §3, re-graded by `results/012-close-the-loop.md` "Re-graded 009 scorecard rows" and `results/013-tobi-comparison.md` §6.
- S6 extension-triggered compaction (`compaction — #2 tokensBefore=80674`) — `logs/agents.log` 10-27 15:41; L030. automatic ≥ 75 % path untested — 012 "Still open"; 013 §6.
- S1 scratch Boot — 009 §S1. graph-search fresh sessions 11-10 / 11-11 / 11-13 and `handoff.md` — `docs/briefs/STATUS.md` Notes 11-10 10:08, 11-12 08:03, 11-13 10:50.
- `launchctl bootout` → back in **~10 s** — 009 §S2. 11-10 reboot killed every tick → `~/Library/LaunchAgents` — L044; STATUS Note 11-10 08:02. pane name lost / Boot reclaims — STATUS Note 11-10 08:02. S10 untested — 009 §S10.
- wakes **6 min late ×2** — L035 (struck, kept for the observation; `logs/agents.log` "A025 fired" 21:45 / 23:45). weekend **53 h** down, four controllers alive — STATUS Note 11-16 08:55. in-flight API calls — L002.
- **11 rounds, 2 lands, 2 launches** on 11-17 — counts of round / `landed` / `launched` lines in graph-search `logs/agents.log` for `[11-17 …]` (`assets/agents-log-graph-search-11-17.txt`).
- storm: **167 %** ctx, **×79 in 20 min**, never shrank, **30-min breaker**, fresh session at **16 %** — STATUS Note 11-10 10:08; L046; `extensions/controlroom.ts` "circuit breaker". The `~$350` figure moved to slide 17.

### Slide 11 — Remote machines
- hosts — graph-search `docs/briefs/STATUS.md` line 3 (`hosts:` — dev002 n4-standard-16 ingest/scan; c4d c4-standard-48 serving/judge/demo/latency). "16-vCPU / 48-vCPU" is the gloss of those machine types.
- what stays local — `README.md` "What to keep local"; `docs/two-controller-protocol.md` §1. `controlroom mode remote dev002` steps — `README.md` §"Changing the primary". labels table (3 of README's 4 rows; the board `MODE:` row is in the bullet) — `README.md` §"Who is primary — reading the labels".
- **~65 s** round trip — `docs/two-controller-protocol.md` "Measured round trip".
- capture — `HERDR_WORKSPACE_ID=wD HERDR_PANE_ID=wD:p1 NO_COLOR=1 COLUMNS=100 controlroom status` in graph-search 13:35 → `assets/status-graph-search.txt` / `.rooms-agents.txt`; slide version re-wraps the ROOMS line. **16 / 4 / 11** agents — the group headers in that capture.

### Slide 12 — Every project I run is a room now
Brief counts = `ls <room>/docs/briefs | grep -c '^[0-9]'` on 11-23; memory counts = `grep -c '^- D' / '^- L'` in each room's `memory/`; landed = rows in `## Landed`. "Eight rooms" = the six table rows + the two in the footnote.
- **pi-controlroom** — 18 briefs; 30 D · 30 L (`assets/status-pi-controlroom.txt`); "verified by four briefs" = 009 test · 010 scorecard · 011 review · 012 fix (`docs/briefs/STATUS.md` Landed). host: local.
- **lookbook-research** — 51 briefs; **354 shops · 1.42 M buyers · 79 M line items** — `~/src/github.com/shopify-playground/lookbook-research/docs/briefs/STATUS.md` Workers row "pipelines tab". hosts: local + dev002 (`dev002-stack` row).
- **graph-search** — 107 briefs; **59** landed; **37 worker sessions** — brief 020 "Model/cost facts" and `docs/exec-overview.md` §"Numbers so far"; hosts local + dev002 + c4d — STATUS line 3. (74 D / 162 L appear on slides 6 and 18.)
- **kumo-research** — 64 briefs; Q1 **NO**, **n = 160, 3 universes**, PAUSED on Q6 — `~/src/github.com/shopify-playground/kumo-research/docs/status/preamble.md` "Question 1" + `STATUS.md` line 4; hosts local + dev002 + c4d (STATUS line 31).
- **upi-clustering-research** — 10 briefs; **10.13 M** products, **45 % @ J ≥ 0.7** — `…/upi-clustering-research/docs/status/preamble.md` "Measuring the shingling thesis"; host local.
- **taste-id-research** — 5 briefs, 5 landed; set up 11-17 — pi-controlroom STATUS Note 11-17 09:25; hosts local + dev002 (its STATUS lines 2–3).
- **gsd-reviews** (footnote) — 1 brief; **6 prepared reviews + INBOX** — STATUS Note 11-19 08:33; `~/src/github.com/lanceriedel/gsd-reviews/README.md`. **personalized-search-demo** — 25 briefs; "first two-controller room" — its `STATUS.md` line 2 (11-06).

### Slide 13 — One real day
- every line — graph-search `logs/agents.log`, `[11-17 …]` and `[11-18 08:31]`, verbatim (annotations added) → `assets/agents-log-graph-search-11-17.txt`. The 020 deck's `08:40 … L160` line was dropped to keep the block at 12 lines.
- two recurring wakes corrected 11-18 — same log, `[11-18 08:46] A090 … one recurring round (A089, 2h) is the standard`; rule — `docs/two-controller-protocol.md` §"The rest of the protocol" #3.

### Slide 14 — Publishing
- flow — `README.md` §"Status page" and §"Status page (where it is published)"; `docs/briefs/results/015-status-page.md` "Design as built"; `bin/controlroom-pages` header (orphan `gh-pages`, one force-pushed commit).
- preamble never overwritten — `README.md` §"Status page" ("created once from a template, never overwritten"). `--no-landed` + preamble carries the narrative (graph-search) — `README.md` §"Status page"; graph-search `docs/status/flags`.
- **lancedocs** — `~/src/github.com/shopify-playground/graph-search/docs/status/publishers.sh`: `cp "$STATUS_HTML" ~/.brain/memory-bank/personal/docs/graph-search/where-we-stand-latest.html` then `BRAIN_ROOT=$HOME/.brain bash ~/.brain/memory-bank/personal/docs/deploy-lancedocs.sh` (comment: "lancedocs (Lance's laptop; cached Google creds)"); brief 020 "lancedocs = `~/.brain/memory-bank/personal/docs/` + `deploy-lancedocs.sh`". Google Docs mirror — `~/src/github.com/shopify-playground/personalized-search-demo/docs/briefs/results/011-gdocs-mirror.md` (54 native Docs, md5 manifest — detail kept here, off the slide). Snapshots → `docs-archive/` — STATUS Note 10-29.
- event-driven, `logs/publish.log` — D029; `README.md` "It is event-driven, never on a clock". needs my identity → `host: local`, queued under `## Pending publish (local)` — `docs/exec-overview.md` §"What happens when the laptop closes". Pages URL — STATUS Note 11-08 16:40.

### Slide 15 — Verification
- gate order and commit **327109a** (10-28) — D017, D027; `docs/briefs/STATUS.md` Landed. **10 scenarios** — `docs/briefs/results/009-durability-tests.md` "Scorecard". **3 blockers** (12 should-fix → backup slide), "not safe to commit" — STATUS Landed row 011; STATUS Note 10-27 15:25; D018.
- re-tests green with the mechanism's log line — `results/012-close-the-loop.md` ("S3 `stuck?`, S6 flush→compact now pass with mechanism log lines"); L028, L029, L030. S10 untested — 009 §S10.
- fixes ship within a minute via the symlink — L032; the concrete example in the notes (11-10 reboot → tick-install fix → every room re-bootstrapped) — L044; STATUS Note 11-10 08:02.

### Slide 16 — Two tools, two jobs (Torrent)
- Torrent facts — brief 020 "Torrent facts (Slack, in 013)": issues → agents → Delta PRs; a platform / team / backlog; Objectives (Harry, 10-26) = lead agent + charter enforced by a judge agent; "no way to steer" complaints. Paraphrased; labelled `[Inferred — Nov Slack threads]`; no Slack text quoted. (The PII-in-transcripts question from 020 was dropped — not needed for the three-row contrast.)
- "what I borrowed" — `docs/briefs/019-judge.md`, `results/019-judge.md`; D032. "the bridge" is a proposal, labelled `[Inferred — not built]`.
- "closer cousin" — `docs/briefs/results/013-tobi-comparison.md` → backup slide 20.

### Slide 17 — Costs & models
- **37 sessions ≈ $1,050**; fable **24 sessions / 3,921 turns / $963 / 10 of 12 DONE**; sol **10 / 1,491 / $39**; mini **4 / 1,769 / $39 / 0 DONE**; controller **sol ≈ $27/day vs fable ≈ $348/day**; **judge ≈ $0.06/review** — brief 020 "Model/cost facts (already computed 11-11 from session jsonl)". Not recomputed.
- **≈ $/turn** is derived from those: 963 / 3,921 = $0.25 · 39 / 1,491 = $0.03 · 39 / 1,769 = $0.02. sol "briefs DONE" is not in 020 → shown as "— (not tracked)".
- controllers → fable 11-13 — D030 ("sol too slow in the controller loop"); STATUS Note 11-13 10:50.
- never switch mid-session, **590 k → 400 k** — graph-search `docs/briefs/memory/LESSONS.md` L091; D030 "switch = handoff + fresh session".
- storm **~$350**, 79 loops, 20 min — STATUS Note 11-10 10:08; L046. `$` detail-view only — D004.
- Dropped from the 020 deck (not in 020's facts block): today's lifetime controller spend $342 / $651 from the strips.

### Slide 18 — Future
- pi.shopify.io facts (Pi Durable sessions on Cloud Run + Postgres, timer wake, REST/SSE API; no filesystem/shell yet; Mint + WARP only) — brief 020 "pi.shopify.io facts"; `docs/briefs/inputs/pi-host/README.md`; brief 017 waiting on inputs — `docs/briefs/STATUS.md` "Decisions waiting on the human".
- Tobi's remote workstations — **no source in this repo**; `[Open — Lance to fill]` per brief 020, kept as one bullet.
- charters / `must:` — D032; brief 020 slide-17 spec. `launch --host` / `host-setup` TODO — `README.md` §"Multiple machines", `docs/two-controller-protocol.md` §6. Google Docs publisher — psd `results/011-gdocs-mirror.md` exists; default recipe is the proposal.
- known gaps: `core changed → restart` — 013 §8 #1; S10 — 009 §S10; graph-search **74 D / 162 L, last dream never** — `assets/status-graph-search.txt` MEMORY line.

### Slide 19 — Three things to take away
- install line — `README.md` §"Install"; `/controller` — `README.md` §"First use". exec overview path — `docs/exec-overview.md` on `master`; live page — STATUS Note 11-08 16:40. "only blocked needs you" — `README.md` §"Operating rules" #7.

### Backup 20 — ULTIMATE vs this room
- rows — `docs/briefs/results/013-tobi-comparison.md` §3 (18 rows → 8; wording condensed, verdicts kept). "118 facts · 6.8 k tokens" — 013 §2 (screenshot-inferred, as 013 labels it).

### Backup 21 — The 0.2.0 scorecard
- S1–S10 grades — `docs/briefs/results/009-durability-tests.md` "Scorecard" (7 pass · 1 FAIL · 1 partial · 1 untested); after-012 column — `results/012-close-the-loop.md` "Re-graded" and 013 §6. S3 cause (cache_warm) — L025/L029. 011: **3 blockers · 12 should-fix** — STATUS Landed row 011.

### Captures index (`assets/`)
| file | command / origin |
|---|---|
| `herdr-agent-list.raw.json` | `herdr agent list` (JSON, 68 agents) |
| `herdr-agent-list.txt` | 8-row trim of the above |
| `status-pi-controlroom.txt` / `.trimmed.txt` | `NO_COLOR=1 COLUMNS=100 controlroom status` in pi-controlroom |
| `status-graph-search.txt` / `.rooms-agents.txt` | same in graph-search with `HERDR_WORKSPACE_ID=wD HERDR_PANE_ID=wD:p1` |
| `check-019.txt` | `controlroom check 019` (no longer on a slide; kept) |
| `brief-018-header-acceptance.txt` | `sed -n '1,4p;36,40p' docs/briefs/018-acceptance-checks.md` (no longer on a slide; kept) |
| `automations-excerpt.txt` | rows A033/A040/A042/A043/A044 of `docs/briefs/AUTOMATIONS.md` |
| `prompt-uptake-lines.txt` | `grep 'turn aborted' logs/agents.log`; `grep 'prompt taken' logs/tick.log` |
| `judge-lines.txt` | `grep 'judge 01[45]:' logs/agents.log` (judge cost, slide 17 notes) |
| `agents-log-graph-search-11-17.txt` | `grep '^\[11-17' …/graph-search/logs/agents.log` (selected lines) + the 11-18 08:31 line |
