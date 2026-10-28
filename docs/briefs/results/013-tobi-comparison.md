# pi-controlroom 0.2.0 vs Tobi's "ULTIMATE" harness — a comparison for Lance

**Status: DONE** — worker `tobi-comparison` (wC:pN), 2026-10-28 13:09 → 13:35. Read-only.
Labels: **[Verified — path/command]** = I ran/read it on this repo today · **[Inferred]** = reasoning, not observed · **[Open]** = nobody knows yet.
**Caveat up front:** we never saw Tobi's code. Everything about his harness comes from one screenshot (described in `docs/briefs/010-tobi-scorecard.md`) and is **[Inferred]**. Where the 010 scorecard and the 012 result disagree, 012 wins (it is later and live-proven); I write "010 graded X; after 012: Y".

## 1. TL;DR
- **Same idea.** Both are "durable agent" harnesses: a coordinator agent that survives compaction/restarts because its memory, schedule and in-flight work live outside its chat context — typed memory (decisions/lessons), automations that wake it, pause/play, dream/consolidation, a landed ledger, a status bar.
- **Different on purpose.** His is a custom app with panels, dialogs, a Lander agent, FACTS memory, nightly-style dreams and $ on the status bar. Ours is ~1,100 lines of bash+python over plain Markdown files, one 85-line pi extension, Herdr panes, and a launchd tick — no daemons, no DB, no UI beyond a text strip. [Verified — `wc -l bin/controlroom extensions/controlroom.ts`]
- **Where we are better:** every memory line must cite a repo path and the CLI refuses otherwise; dream is propose-only with grep-checked citations; everything is a file a colleague can `cat`; the human closes the loop by default. [Verified — `controlroom memory`: 25 D · 31 L, 56/56 lines carry `←`]
- **Where he is better:** real UI (badge counts, dialogs, "core changed → restart", "ready to fall asleep"), instant automations vs our ≤ 60 s tick, a lander that merges code, memory with facts and a token size, $ visible at a glance.
- **Biggest strength of ours:** verifiability. 10 scenario tests (S1–S10), a 23-finding code review, a scorecard, and a fix pass — all with mechanism log lines, not pane glances (L028). After 012: **S1–S9 pass live**. [Verified — results/009, 012]
- **Biggest weakness of ours:** the controller runs stale code/prompts with nothing saying so (no `core changed → restart`), and the automatic ≥ 75 % flush and a Herdr restart (S10) have never been exercised. [Open]
- **Scale of effort:** 13 briefs, 17 worker launches, essentially two days (10-27 build+verify, 10-28 commit+fixes), ≈ $117 total LLM spend of which the controller is $52. [Verified — `logs/.health.json`, `git log`]
- **Real-world proof the multi-room story matters:** this morning Lance's *other* room (w9) showed `controller $0.00 · ctx ?%` because init's collision rename `controller-<ws>` wasn't recognised by the strip — found in use, fixed (`is_ctl`, e22064f), recorded as L036. [Verified — STATUS.md Notes 10-28 10:45; `git log`]

## 2. What each system is
**Tobi's ULTIMATE harness** [Inferred — screenshot only]: a purpose-built application with its own UI. Left column: a coordinator agent ("2 waiting on you"), a dedicated **Lander** agent that merges worker branches (`LANDED 5 — batches · commits · age`), a **Memory** panel sized in tokens (6.8k: 13 decisions · 118 facts · 19 lessons · History #1), a **DREAM** session with a "Fall asleep →" affordance, **AUTOMATIONS 5** (`wake #792 in 15m`, `Watch rubys/roundhouse — fired 3`, `Dream after a pause`, `Dream before compaction`), **IN FLIGHT 3**, a **PAUSE** dialog ("nothing new starts; Play by itself after 120 min"). The coordinator's reply ends "Automation A29 wakes me at 18:12 UTC to run its round". Status bar: `dream 2 ready to fall asleep · Pausing… · 5 automations · warm · core changed → restart · 1 setup issue · live gen 1 · tailnet · v3-r25 · $576 · 2.6M tokens`. Agent/System/Review tabs, model + thinking selectors. Almost certainly a process with state in memory/DB and a web/native front end; we cannot tell.

**pi-controlroom 0.2.0** [Verified — README.md, `controlroom` help, `git log`]: a bash+python3 CLI (`bin/controlroom`, 1,100 lines) plus one pi extension (`extensions/controlroom.ts`, 85 lines) and two prompt templates, running inside **Herdr** panes. The controller is an ordinary `pi` in one pane, renamed by `controlroom init`; workers are pis in their own tabs launched with a brief file. **Files are the protocol**: `docs/briefs/STATUS.md` (board + Landed + Retired), `docs/briefs/AUTOMATIONS.md` (the automation ledger *is* the state), `docs/briefs/memory/{DECISIONS,LESSONS}.md` (append-only, source-linked, bounded), `logs/agents.log`. A **launchd job runs `controlroom tick` every 60 s** — one idempotent reconciler that fires watch/wake/watch-path/play/flush/post-compaction rows, re-arms watches from the board, runs `stuck?` health, and prompts the controller via `herdr agent prompt` by pane id. No daemons, no database, no UI beyond a refreshing text strip in a pane. Committed as `327109a` 2026-10-28.

## 3. Feature comparison
| Area | Tobi (screenshot) | pi-controlroom 0.2.0 | Verdict | Evidence |
|---|---|---|---|---|
| Coordinator / controller | in-app coordinator, "2 waiting on you" badge | `controller` pi in a Herdr pane; strip `WAITING ON LANCE` list; board `## Decisions waiting on the human`; resolved by pane id (D015), name is a label (`is_ctl` since 10-28) | in spirit — no count badge | [Verified — `DETAIL=1 controlroom status`; `prompts/controller.md`] |
| Workers & lifecycle | IN FLIGHT 3; warm/cold | `launch <name> <brief>` → new tab → pi; strip AGENTS (state · pane · brief · last write · ctx); warm idle reuse; `retire`/`gc` after 24 h; `## Retired` keeps `pi --resume` paths | same (text, not panel) | [Verified — STATUS.md 18 retired rows; `controlroom health`] |
| Landing / integration | Lander agent merges branches; LANDED 5 (batches · commits · age) | **no lander**; `controlroom land` moves DONE rows to `## Landed` (13 rows); results are files, not branches | cut on purpose | [Verified — STATUS.md `## Landed`; results/003-critic.md "CUT: standing lander"] |
| Memory types | 13 decisions · 118 facts · 19 lessons · 6.8k tokens · History #1 | DECISIONS + LESSONS only (FACTS cut, D001); 25 D · 31 L; `memory/archive/` + `dreams/`; strip shows counts, age, proposed, last dream — no token size | partial by design | [Verified — `controlroom memory`; D001] |
| Memory sourcing | slug · age · one-liner | `- D### date **slug** — one-liner ← source`; `--from` **required** and validated (file under ROOT, `#anchor` must be a heading, `:"phrase"` must occur); refuses `\n`/`\|` | **ours better** | [Verified — `controlroom memory` 56/56 sourced; results/012 #8 six bypasses now refuse] |
| Memory budgets / archive | not visible | 40 D / 30 L budget; `⚠ over budget` on strip (LESSONS is 31/30 now); supersede strikes + archives, never deletes | ours better (he may have it; unseen) | [Verified — strip MEMORY line; `memory/archive/2026-10.md`] |
| Dream / consolidation | DREAM session 2; "ready to fall asleep →" | `controlroom dream` → `dreamer-N` worker, **propose-only** → `proposed.md`; `dream --check` greps every citation (no LLM); `promote`/`reject`; 4 runs, last 6 promote / 4 reject | in spirit; manual by design (D014) | [Verified — STATUS.md Landed "dream 2026-10-27-1740"; results/009 S8 pass] |
| Automations: wake | `wake #792 in 15m`; "A29 wakes me at 18:12" | `wake <when> "…" [--repeat]`; tick fires ≤ 60 s; cap 6/h, backlog, blocked-retry; controller **arms its own round wake at Boot** (D020) — A025 fired 4×, A027 1×, A029 armed | same; 010 graded "never armed by controller"; after 012: behaviour | [Verified — `controlroom automations --all`; agents.log "A025 fired" ×4] |
| Automations: watch / watch-path | `Watch rubys/roundhouse — fired 3` | `watch <agent>` auto-armed by `launch` (13 fired rows); `watch-path <glob>`; toast+log only unless `--prompt` (D002); blocked toasts once, DONE still caught | same, quieter on purpose | [Verified — AUTOMATIONS.md; results/012 #7] |
| Round / flush / post-compaction | "Dream before compaction — armed" | extension flush at 75 % ctx (or `/flush`) → controller records memory → replies `/compact` → extension compacts → tick fires `post-compaction` → Boot; tick-side fallback rows when extension absent; flush bypasses the cap (D023) | in spirit (flush, no LLM dream); 010 "not live"; after 012: **live S6 pass** | [Verified — agents.log "compaction — #2 tokensBefore=80674"; L030] |
| Dream after a pause | armed | designed, **off by default** (D003) | cut on purpose (reversible) | [Verified — D003; design §4] |
| Pause / play | dialog: drain, nothing new starts, Play after 120 min | `pause --resume-after Nm`: `launch` rc 3, workers drain, rows `held`, auto-play collapses held rows into one prompt; yellow header | same | [Verified — results/009 S4 pass; 005/006 live] |
| Stuck / health alarms | "1 setup issue" | `stuck?` = working ∧ no write 20 m ∧ session quiet 10 m (non-usage entries, L029) ∧ pane tail unchanged; `spinning?`; red `TICK not running`; per-symptom, no aggregate | ours deeper on *stuck*, no aggregate | 010: S3 **FAIL**; after 012: **pass** [Verified — agents.log 15:45 "stuck-probe STUCK?"] |
| Compaction survival | implied by "Dream before compaction" | Boot section re-reads files; flush loop above; `.ext-alive` 3-field heartbeat gates the fallback (L031); compaction count from jsonl (D022) | in spirit, proven once live | [Verified — results/012 S6; `CTX … compactions 2 · extension alive`] |
| Cost / tokens | `$576 · 2.6M tokens` on the bar | detail view only (D004): `COST controller $52.11 · workers $64.19 · today $71.66`; per-agent `$ · tok · turns · ctx %` in `health` | his better for glanceability; ours by design | [Verified — `DETAIL=1 controlroom status`; `controlroom health`] |
| UI / status bar | rich bar + panels + dialogs + tabs | one text strip: header · AGENTS · TICK · [COST · CTX] · PIPELINES · EVENTS · MEMORY · AUTOMATIONS · WAITING · BRIEFS | **his better** | [Verified — `controlroom status`] |
| `core changed → restart` | on the bar | **nothing**; CLI is live via symlink within 60 s (L032), but prompt/extension edits need a human `/reload` with no indicator | **his better / open** | [Verified — results/010 row 17; nothing in 012 touched it] |
| Restart / durability | unknown | tick survives `launchctl bootout` + state loss (S2); fresh controller boots from files (S1); Herdr restart **untested** (S10) | in spirit; S10 open | [Verified — results/009 S1/S2 pass, S10 untested] |
| Multi-room | not visible | one room per Herdr workspace, own `io.controlroom.tick.<hash>` (D011); S7 pass; name collision → `controller-<ws>`; `verify`/`lastline` not WS-filtered | ours proven (and bitten) | [Verified — results/009 S7; L036 this morning] |
| Verification evidence | none visible | 009 (10 scenarios) · 010 (21-row scorecard) · 011 (23 findings) · 012 (fix + re-proof); all in `results/` | **ours better** (his may exist; unseen) | [Verified — `ls docs/briefs/results/`] |

## 4. Pros and cons
**Pros of our approach**
- **Every memory line is checkable** — `--from` is mandatory and validated; a colleague can grep the source. (Tobi's slug·age·one-liner has no visible source.) [Verified — results/012 #8]
- **Everything is a file** — board, ledger, memory, heartbeat, state; `cat` and `git diff` are the debugger; `memory/`, `AUTOMATIONS.md`, `STATUS.md` are tracked in git (D027). [Verified — `git status`]
- **No daemons, no DB** — one idempotent 60 s reconciler under launchd; killing it or deleting its state loses nothing but the hour's rate-cap counter. [Verified — results/009 S2]
- **Human closes the loop by default** — only rows the controller created can start a controller turn; ≤ 6/h; `logs/AUTOPROMPT-OFF` per room. [Verified — D002; README "kill switch"]
- **Dream cannot hallucinate into memory** — propose-only, `--check` greps every citation, human/controller promotes. [Verified — results/009 S8]
- **The alarm is for the real failure mode** — `stuck?` targets *no progress* (the 26 h incident, L005), not spend. [Verified — D004, D009, L029]
- **Honest self-grading** — 007 recommended against scheduling its own dreams; 009 failed its own S3; 011 said "not safe to commit"; L023 was struck when it proved wrong (L028). [Verified — results/]
- **Works in any repo today** — it rides on pi + Herdr, which Lance already runs; no new app to maintain.

**Cons / what Tobi's does that ours doesn't**
- **No UI** — a Markdown table and a text strip instead of panels, dialogs, badge counts; "2 waiting on you" is a list, not a number in the header. [Verified — `controlroom status`]
- **No `core changed → restart`** — the controller can run yesterday's prompt/extension silently; this is the biggest operational blind spot (010 §4 (d), still open after 012). [Open]
- **60 s latency** on everything the tick does, vs instant in-app automations. [Verified — design §2.1]
- **No lander, no merge** — results are files; code integration is the controller/human's job. If workers produced branches this would hurt. [Verified — design §5]
- **No FACTS, no memory size in tokens** — cut deliberately, but his 118 facts suggest he finds them useful; our Boot reads README/results instead. [Inferred]
- **Dream is manual** — nothing says "ready to fall asleep"; dream-after-pause / before-compaction are off/not-LLM. [Verified — D003, D014]
- **Thin aggregate health** — no "1 setup issue" roll-up; a stale extension has no symptom at all. [Verified — results/010 row 20]
- **Multi-room is young** — the name-collision path shipped 10-27 and broke Lance's other room 10-28 (L036); `verify`/`lastline` still see across rooms (009 bug 7). [Verified — STATUS.md Notes; results/012 Still open]
- **Controller cost** — the controller is $52 of $117 (22 M tokens, 238 turns); a 2 h self-prompting round wake costs money when the room is idle (backed off to weekdays 08:00 once, L035). [Verified — `controlroom health`; STATUS.md 10-27 23:47]

## 5. Design choices made deliberately differently
- **FACTS cut** (D001) — facts about the world drift fastest and already live in README/results; what a fresh controller needs is *what we chose* and *what hurt*. [Verified — results/003-critic.md "CUT: FACTS type"]
- **No lander agent** — results are files, not branches; a 10-line `land` mover does the ledger and a standing agent would be cost without work. [Verified — design §5 "no lander"]
- **Dream on demand, never nightly** (D014) — value tracks results landed, not the clock; a nightly dream has no reader and a hallucination budget; three reports had to be read and judged useful before anything is scheduled. [Verified — results/003-critic.md finding 10; README rule 10]
- **Human closes the loop** (D002) — watches toast+log; only `wake`/`flush`/`post-compaction` rows prompt the controller, capped 6/h; the critic's "watchers auto-prompting the coordinator" was cut as the thing most likely to run away. [Verified — results/003-critic.md "CUT: watchers auto-prompting"]
- **$ in detail view only** (D004) — the 26 h incident was *no progress*, not spend; `stuck?` is the primary alarm and the default strip stays about progress. [Verified — results/003-critic.md finding 7]
- **Flush, not an LLM dream, before compaction** — the hook asks the controller to write memory and reply `/compact`; no model call inside a compaction hook. [Verified — results/003-critic.md "CUT: LLM dream inside the compaction hook"]
- **One reconciler instead of loops** — nohup watchers died with Herdr; a 60 s idempotent tick with the ledger as state trades latency for survivability. [Verified — design §2.1]

## 6. Proven vs on paper
| Scenario | 009 grade | after 012 | Proof |
|---|---|---|---|
| S1 fresh controller boots from files | pass (silent name collision) | pass; collision now printed and renamed `controller-<ws>` | results/009 §S1; results/012 S1 (snippet-verified, init not re-run live) |
| S2 tick survives restart & re-arms | pass | pass | results/009 §S2 (launchctl bootout + state rm → back in ~10 s, wake fired) |
| S3 `stuck?` fires on a real silent worker | **FAIL** (cache_warm) | **pass** at 20 m | agents.log 15:45 "stuck-probe STUCK?"; tick.log 15:46; L029 |
| S4 pause drains / holds / collapses | pass | pass | tick.log 14:50–14:53 "play (auto) … 1 collapsed" |
| S5 mid-turn wake is queued, not dropped | pass | pass | agents.log "was working"; L022 |
| S6 compaction flush loop | partial (typed `/compact`) | **pass**, extension-triggered | agents.log "compaction — #2 tokensBefore=80674"; L030; L027 superseded |
| S7 second room on one machine | pass | pass + real-world L036 fix 10-28 | results/009 §S7; STATUS.md Notes 10-28 10:45 |
| S8 dream after a batch | pass | pass (4 runs total) | results/009 §S8; STATUS.md Landed dream 1740 |
| S9 kill switch & rate cap | pass (global switch) | pass; per-room `logs/AUTOPROMPT-OFF` added but **code-only** | results/009 §S9; results/012 "009 bug 5 … unproven live" |
| S10 Herdr restart | untested | **untested** | results/009 §S10 (needs a separate named Herdr session) |
| Automatic flush at ≥ 75 % ctx | — | **untested live** (only the manual `/flush` path at 8 % and 21 %) | results/012 Still open |
| Idle wakes fire late, not never | — | observed: 6 min late after sleep ×2 | agents.log "A025 fired" 21:45/23:45; L035 |

What this means: durable for **schedule** (S2, S4, S9, L035), **in-flight state** (watch rows, Retired resume paths) and **memory across compaction** (S6) — each with a log line. Not yet shown: surviving a Herdr restart, and the automatic threshold flush. "Proven" here means once, live, by a worker; none of it has months of use behind it. [Verified — the table's sources]

## 7. What it cost and took
- **Timeline** [Verified — `git log --date=short`]: repo started 2026-09-16 (control room 0.1: strip, launch, watch); the durable work (briefs 003–012) was designed, built, verified and fixed on **2026-10-27**, committed as 0.2.0 (`327109a`) on 2026-10-28 09:21, followed by 8 small fix/memory commits the same day (L036 `is_ctl`, strip CTX).
- **Briefs**: 13 (`001`–`013`), 13 landed rows, 17 worker launches incl. 4 dreamers and 2 stuck-probes [Verified — STATUS.md `## Landed`, `## Retired` (18 rows, two names twice)].
- **Code**: `bin/controlroom` 1,030 → 1,100 lines; extension 62 → 85; `prompts/controller.md` 29 lines; README 265 [Verified — `wc -l`; results/012].
- **Spend** [Verified — `logs/.health.json`, `controlroom health`]: ≈ **$117 total** across 18 sessions; controller $52.16 (22.2 M tokens, 238 turns, 2 compactions); biggest workers close-the-loop $9.87, compaction-ext $8.17, wake-automations $7.34, tick-stuck-pause $7.06, durability-tests $6.81; four dreams ≈ $4. Today so far $71.66 of which this worker $0.82. (Tobi's bar read `$576 · 2.6M tokens` — not comparable without knowing the window. [Inferred])
- **Not counted**: Lance's time steering, and the pre-10-27 0.1 work.

## 8. If you wanted to close the remaining gaps (in order)
1. **`core changed → restart` indicator** — red strip line when `prompts/controller.md` / `extensions/controlroom.ts` / `bin/controlroom` is newer than the controller's session start (or last `/reload`). ~20 lines in `status_text`; removes today's biggest blind spot (010 §4 (d)). Cost: small. Benefit: high.
2. **"Waiting on you" count in the header** — `N waiting` next to `next A###`, from the board's decisions list + blocked agents. ~5 lines; matches Tobi's one glanceable number. Cost: trivial.
3. **Herdr-restart test (S10)** — scratch room in `herdr --session cr-test`, `herdr session stop`, restart; expect GONE toasts, stale `.controller` → `blocked` (D026), `pi --resume` + re-init. Half a day of a worker; it is the one durability claim with zero evidence.
4. **Automatic ≥ 75 % flush test** — scratch controller with `CONTROLROOM_FLUSH_PCT=5` or a small-window model; confirm one flush, one `/compact`, one post-compaction wake, no duplicate from the tick fallback. ~1 h; closes the last untested half of S6.
5. **tick.log rotation + `.health.json` pruning** (011 #11) — rotate at 1 MB, drop agents absent > 24 h, incremental jsonl parse. tick.log is only 47 lines today, so low urgency; the controller jsonl re-parse (22 M tokens) is the real cost. ~40 lines.
6. **Dream before compaction?** — probably **no**: the flush already captures decisions/lessons without an LLM call, and D014 says dream after a batch. Revisit only if post-compaction Boots keep finding gaps; if so, arm a `dream` row from `post-compaction` instead. Cost: a rule, not code.

DONE 013
