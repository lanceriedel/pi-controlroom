# 009 — durability-tests · results

**Status: DONE** (worker `durability-tests`, wC:pE, 10-27 14:38 → 15:20). Ten scenarios run against the live room (wC) and a scratch room (new Herdr workspace wD, `mktemp -d` + `git init`). **Two fails, three partials, five passes; one untested by design.** Nothing in `bin/controlroom`, the extension, prompts or the live `AUTOMATIONS.md` was edited by hand; bugs are recorded with reproductions below, not fixed.

## Scorecard
| # | claim | grade | why (one sentence) | evidence |
|---|---|---|---|---|
| S1 | fresh controller boots from files | **pass** | `/controller` in a scratch workspace ran `init`, then Boot, and its first reply named the board rows, `16 D · 19 L`, 8 landed results, the pause state and `A016 wakes me at 14:59` unprompted — but `init` swallowed the `agent_name_taken` collision silently (bug 1). | §S1; scratch-ctl session jsonl `…--private-tmp-cr009-scratch.fFDt--/2026-10-27T20-42-49-186Z_….jsonl` |
| S2 | tick survives restart & re-arms | **pass** | After `launchctl bootout` + `rm .tick-state.json` + `tick-install`, the tick was back in ~10 s, rows A016–A019 intact with no duplicates, and the 10-min wake fired on time (`S2-WAKE-OK`); only the in-state counters (`fired today`, rate-cap window) reset. | §S2; `logs/scratch/009-scratch/tick.log` 14:57 |
| S3 | `stuck?` fires on a real silent worker | **FAIL** | A worker blocked 25 min in one `sleep` never went `stuck?` because pi 1.4.0's cache warming appends a `usage/cache_warm` jsonl entry every ~4.5 min during long tool runs, so "session quiet ≥ 10 m" is never true in exactly the stuck case (bug 2). | §S3; `logs/scratch/009-s3-poll.log`; probe jsonl `2026-10-27T20-41-03-383Z_….jsonl` |
| S4 | pause drains, holds, collapses | **pass** | `launch` refused rc=3, A018 went `held`, header turned yellow `PAUSED … 3 draining · play at 14:53`, auto-play at +4 m sent one collapsed `[play]` prompt and the controller replied `HELD-OK`. | §S4; `logs/tick.log` 14:50–14:53; `logs/agents.log` 14:53 |
| S5 | mid-turn queuing (006 [Assumed]) | **pass** | A021 was sent while the controller was 50 s into a 100 s `sleep` (`agents.log: … was working`); pi queued it and the pane shows `S5-SLEEP-DONE` then `QUEUED-OK-2`, in order, nothing dropped. | §S5; `logs/agents.log` 14:57 |
| S6 | compaction flush loop | **partial** | `/reload` and `/flush` typed via `herdr agent prompt` worked and the controller flushed D017/L022 and replied `/compact` — but the extension did **not** compact (ctx 21 % < 75 % resets `requested` at the first tool-call `turn_end`; bug 3); after a typed `/compact`, `compaction — #1 tokensBefore=201073` → A022 post-compaction → Boot re-read all worked. | §S6; `logs/agents.log` 15:01–15:04; `logs/.compactions` |
| S7 | second control room on one machine | **pass** | Scratch `status`/`health` showed only wD agents, both `io.controlroom.tick.*` units were loaded with separate `tick.log`s, and the live `STATUS.md` diff contained only the live controller's own edits; the only collision was the agent name (silent, see S1); `verify` is not workspace-filtered. | §S7 |
| S8 | dream after a batch | **pass** | `dream --reason "009 batch" --since 7d` → `dreamer-1` finished in 3 min, `dream --check` → `dream ok: 10 proposed, 3 merges, 1 landed-candidates`, every citation resolved, `promote P022` → `L021` with the same source, `reject P015` archived, strip `MEMORY 16 · 20 · 8 proposed`. | §S8; `logs/scratch/009-scratch/dream-2026-10-27-1509.md`, `proposed.md` |
| S9 | kill switch & rate cap in the live tick | **pass** | 7 `--prompt` wakes due in one tick → 4 prompted (2 already in the hour = 6), 3 `backlog` with one `automation backlog` toast; `launchctl setenv CONTROLROOM_AUTOPROMPT 0` reached the launchd tick on its next run and the 3 fired as `toast (autoprompt off)` — but the switch is user-global and invisible on the strip (bug 5). | §S9; `logs/scratch/009-scratch/tick.log` 15:09–15:11 |
| S10 | Herdr restart | **untested** | No per-workspace/pane restart exists (`herdr server reload-config` reloads config only; `server stop`/`session stop` kill everything); it could be tested in a separate named session (`herdr --session cr-test`) — see §S10. | `herdr --help`, `herdr server --help`, `herdr session --help` |

Timing: S3 ran in the background 14:41–15:06 while S1/S2/S4/S5/S6 ran; total wall time 42 min for the scenarios, ~$2.70 of scratch LLM spend (scratch-ctl $1.23, 3 sleepers/probes $0.30, dreamer $0.60, live controller turns ≈ $5 incl. a 201 k-token compaction).

---

## S1 — fresh controller boots from files (scratch wD, 14:42–14:46) — pass
- Scratch: `/tmp/cr009-scratch.fFDt` (`git init`; copies of docs/ bin/ prompts/ skills/ extensions/ package.json + logs/{agents.log,tick.log,.tick-state.json,.health.json,.controller,.tick.last}); copied armed rows A013–A015 cancelled first so the scratch tick would not toast GONE for wC agents.
- `herdr workspace create --cwd $S --label cr009-scratch --no-focus` → **wD**, pane wD:p1. `herdr agent start scratch-ctl --kind pi --pane wD:p1` → idle. `herdr agent prompt wD:p1 '/controller "scratch: boot test"'` at 14:43:02. (The package is installed by path in `~/.pi/agent/settings.json`, so `/controller` and the extension load in any directory.)
- The model read SKILL.md, ran `controlroom init` (14:43:25). init output (from the session jsonl):
```
tab → CONTROLLER
status strip → pane wD:p2 (9 rows)
memory/   present (skipped) · LESSONS already seeded (skipped) · AUTOMATIONS.md present (skipped)
tick      launchd io.controlroom.tick.1f0e33ce bootstrapped (60 s) · ~/.config/controlroom/launchd/io.controlroom.tick.1f0e33ce.plist
board  → /private/tmp/cr009-scratch.fFDt/docs/briefs/STATUS.md
```
  **No `agent → controller` line**: the rename failed and init said nothing (its stdout+stderr go to /dev/null). Direct repro: `herdr agent rename wD:p1 controller` → `{"error":{"code":"agent_name_taken","message":"agent name controller is already used; candidates: … pane_id=wC:p1 workspace_id=wC …"}}`. The agent stayed `scratch-ctl`; `logs/.controller` = `wD:p1` (pane-id pin, D015), so the tick, the extension and `herdr agent prompt wD:p1` all still resolved it. The controller itself noticed ("the global name controller is held by the live room in wC, so the name stayed — pin is by pane id per D015").
- Boot (14:43:38, one codemode batch): STATUS.md, `controlroom memory`, `tail -20 logs/agents.log`, `controlroom automations`, `herdr agent list`, `ls results/`, README; then `controlroom verify durability-tests / tobi-scorecard` → `working` (**`verify` is not workspace-filtered** — it found wC's agents from wD), `controlroom health` (WS-filtered: only scratch-ctl). It noticed the board was inherited, noted it in STATUS.md, armed A016 (`wake 15m`).
- First reply (14:44): pane/agent/tick unit/strip, "16 D · 19 L, 8 results all landed", the two working rows and that they belong to wC, the open human decision, "Next wake: A016 at 14:59". `where are we?` (14:45) → "Not paused … 8 results landed, 16 D · 19 L … A016 at 14:59 (in ~13 min) … No launches planned." It did not quote `agents.log` lines (it had read them).
- Later, unattended: A016 fired at 14:59, the controller re-ran Boot, found s2-a/s2-b (launched by me) and armed its own A020 for 15:20 — the self-scheduling loop works in a fresh room.

## S2 — tick survives restart & re-arms (scratch wD, 14:47–14:58) — pass
- Armed: `launch s2-a` → A017, `launch s2-b` → A018 (15-min sleepers, brief at logs/scratch/009-s2-sleep.md), `wake 10m "009 S2: … reply S2-WAKE-OK" --prompt` → A019 (14:57). Added s2-a/s2-b rows to the scratch STATUS.md so step-4 re-arm had something to (not) duplicate.
```
14:48:39 $ launchctl bootout gui/501/io.controlroom.tick.1f0e33ce   → gone from launchctl list
         $ rm logs/.tick-state.json   (was {"prompts":[1793132731.866],"fired":{"2026-10-27":7},"wp":{},"flush":{…}})
         $ controlroom tick-install   → AUTOMATIONS.md present (skipped) · tick launchd io.controlroom.tick.1f0e33ce bootstrapped (60 s)
14:48:44 logs/.tick.last = "1793134124 ok"   (RunAtLoad → first pass ~5 s after bootstrap)
         automations: A016 armed 14:59 · A017 watch s2-a armed · A018 watch s2-b armed · A019 armed 14:57   (unchanged, no new rows)
         strip: working s2-a wD:p3 · working s2-b wD:p4 · TICK last 14:48:44 · ok · AUTOMATIONS 2 armed · next A019 14:57 (in 8m) · fired today 0
14:57    tick.log: A019 wake fired → prompted controller · agents.log: A019 fired → prompted controller (wD:p1, was idle)
         scratch-ctl: "S2-WAKE-OK — A019 received after tick restart (no board changes; next wake A016 at 14:59)."
15:03    tick.log: A017 watch s2-a → done (toast) · A018 watch s2-b → done (toast)   (sleepers finished, watches verified after the restart)
```
- State loss visible and worth knowing: `fired today 7 → 0`, the 6/h rate-cap window emptied, flush baseline re-taken. The ledger (AUTOMATIONS.md) is the durable state; `.tick-state.json` is a cache — a tick restart that loses it also forgets the prompts already sent this hour.

## S3 — `stuck?` on a real silent worker (live wC, 14:41–15:06) — FAIL
- `controlroom launch stuck-probe logs/scratch/009-stuck.md` 14:41:00 → wC:pG, A015. The probe issued `perl -e 'alarm 1500; exec @ARGV' -- sleep 1500 (timeout 1600s)` at 14:41:15 — its only tool call (the bash call itself is the "last write" in `parse_session`).
- Poll every 30 s (`controlroom health stuck-probe --json`), 15:00–15:06 (full log: `logs/scratch/009-scratch/s3-poll.log`):
```
15:00:06 working flag='' lw=18m quiet=0m      15:03:37 working flag='' lw=22m quiet=4m
15:01:37 working flag='' lw=20m quiet=2m      15:04:07 working flag='' lw=22m quiet=0m   ← jsonl touched again
15:02:37 working flag='' lw=21m quiet=3m      15:06:08 working flag='' lw=24m quiet=2m
```
- No `stuck?` at 20, 21, 22, 23, 24 min; no toast, no `agents.log` line; strip stayed yellow `working`. Probe pane at 15:06: `Cache warmed: $0.002899` ×2 … `Took 25m 0s` · `DONE stuck-probe`. A015 then fired normally (`[15:06] A015 watch stuck-probe → done (toast)`); `controlroom retire stuck-probe`.
- **Root cause (verified in the probe's jsonl):** entries at 20:45:50, 20:50:24, 20:54:57, 20:59:34 Z are `{"type":"usage","kind":"cache_warm",…}` — pi 1.4.0 keeps the prompt cache warm **during a long tool run** (`cacheWarming` default `"streaming"`, `docs/settings.md`; `docs/session-format.md`: *"cache warming uses `"cache_warm"`"*). `health()` measures "session quiet" as the jsonl **mtime** age, so `j_age ≥ 10 m` can never hold while a tool call blocks — exactly the case `stuck?` exists for. The pane-tail clause was never reached (and `lastline` would have returned the stable `$ perl …` line, so it was not the blocker). `spinning?` (`lw > 30 m ∧ quiet < 10 m`) would have fired instead at ~30 min — the wrong flag, after the 25-min cap. 005's thresholds were tuned on sessions recorded before cache warming appeared in the data.
- Fix sketch (not applied): compute session quiet from the timestamp of the last `message` entry (`last_msg` is already parsed) or ignore growth that is only `usage` entries; then re-run this probe.

## S4 — pause drains, holds, collapses (live wC, 14:49–14:54) — pass
```
14:49:33 $ controlroom pause --resume-after 4m "009 S4"   → PAUSED since 14:49 · play at 14:53 (A017) — launch refuses (use --force); workers drain
         $ controlroom wake 1m "009 S4 held: reply HELD-OK" --prompt → A018 (14:50)
         $ controlroom launch x y → "paused since 2026-10-27T14:49 — controlroom play, or --force"   rc=3
         strip header: \e[33m PAUSED since 10-27 14:49 · 3 draining · play at 14:53 (A017) \e[0m  (yellow) · next A018 14:50
14:50    tick.log: A018 wake due → held (paused)        strip: AUTOMATIONS 0 armed · 1 held
14:53    tick.log: A017 play (auto) · play (auto) — pause since 2026-10-27T14:49 ended · reason: 009 S4 · play: 1 held row(s) fired — A018 · 1 collapsed into one controller prompt
         agents.log: PLAY (auto) — pause ended — launches allowed again · play fired → prompted controller (wC:p1, was idle)
         wC:p1: "[play] 1 automation(s) fired while paused: A018 009 S4 held: reply HELD-OK … Rules: …"  →  controller: "HELD-OK"
```
A017/A018 both `fired 1`; `logs/PAUSED` removed. Exactly one prompt reached the controller.

## S5 — mid-turn queuing (live wC, 14:54–14:59) — pass
- Attempt 1: `wake 0m "009 S5: run controlroom memory, read results/008 in full, summarize 3 newest lessons…" --prompt` → A019 fired 14:54:43 (controller idle→working 14:54:46); armed A020 `S5b` at 14:54:46 → the tick fired it at 14:55:43, but the controller had finished at 14:55:12 (`agents.log: … was done`). Not mid-turn — inconclusive. (With thinking=high the controller finished a 3-step round in 25 s.)
- Attempt 2 (the long task sent directly so it would not burn a cap slot): 14:57:09 `herdr agent prompt wC:p1 "…run perl -e 'alarm 100…' -- sleep 100 … then reply S5-SLEEP-DONE"` → working; `wake 0m "009 S5b-retry: reply QUEUED-OK-2" --prompt` → A021; tick 14:57:45: `agents.log: A021 fired → prompted controller (wC:p1, was working)`. Pane afterwards, in order:
```
$ perl -e 'alarm 100; exec @ARGV' -- sleep 100 (timeout 120s) · Took 100.0s
[A021 · wake · fired 1/once · 14:57] 009 S5b-retry: reply QUEUED-OK-2 …
S5-SLEEP-DONE
QUEUED-OK-2
```
  The prompt typed mid-turn was queued by pi and answered after the running turn — not dropped, not interleaved. 006's [Assumed] is now observed; the controller recorded it as L022 **midturn-wake-queued**.

## S6 — compaction flush loop (live wC, 15:01–15:07) — partial
```
15:01:18 $ herdr agent prompt wC:p1 "/reload"  → pane: "Reloaded keybindings, extensions, skills, prompts, themes, and context files"
         logs/.ext-alive rewritten 2026-10-27T21:01:19Z pid 61930 (the controller's pi)   → tick state flush.ext = true
15:01:39 $ herdr agent prompt wC:p1 "/flush"   → pane: "[controlroom · flush] Context at 21% (threshold 75%). Before compaction: … Then reply /compact on a line of its own (this extension runs it)." + "flush requested"
         agents.log: [15:01] flush requested — controller ctx 21% (ext) — asked to flush decisions/lessons to memory, then /compact
         logs/.flush-requested: gone 10 s later (ctx 21 % < 75 → the tick's comp_step and the extension's turn_end both unlink it)
15:02:01–15:02:22 controller: controlroom memory · decide ×3 (two "refused: one-liner is 169/163 chars (max 160)", then D017) · lesson → L022 · STATUS.md note
15:02:26 controller reply: "Flush done: recorded D017 … L022 … no wake armed by me.\n\n/compact"      ← /compact on its own line
15:03:41 controller jsonl: 0 compaction entries · no logs/.compactions · no ext-error line · footer still 20.1 %/1.0M   → the extension did NOT compact
```
- **Why (bug 3):** `turn_end` fires after *every* model response ("Act after one model response and its tool calls", pi docs/extensions.md). The flush round had four tool-call turns; at the first `turn_end` `pct (21) < THRESHOLD (75)` → `requested = false` and the marker is unlinked. By the final `/compact` turn `requested` is false and the hook is skipped. So a `/flush` below 75 % — the manual path 008 left "[Assumed] on the human" — never closes. Only the automatic ≥ 75 % path can (all intermediate turns stay ≥ 75 %); that path is still untested live (no controller near 75 %).
- Second half, forced: 15:04:14 `herdr agent prompt wC:p1 "/compact"` (typed — a deviation, but it is the flow's intended next step). `agents.log [15:04] compaction — #1 tokensBefore=201073`; `.compactions {"count":1,"last":"2026-10-27 15:04"}`; tick 15:04:43: `A022 armed post-compaction (compactions 1 via file)` → `A022 post-compaction fired → prompted controller (wC:p1, was done)` — pane: `Queued message for after compaction · Steering: [controlroom · post-compaction] …` while `⠧ Compacting context…`. 15:05:59 controller done, footer 20 % → 5 %; reply: "Boot re-run after compaction #1 (201k tokens → fresh context): STATUS, memory (17 D · 22 L), automations and log all agree — nothing from the summary was missing". `where are we?` (15:06) → a full board/009 status with next steps. **Boot re-read after compaction: observed.**
- ⚠ The controller then recorded **L023 compaction-loop-live** claiming "/compact → extension compacts". From inside the pane my typed `/compact` was indistinguishable from the extension's; L023 is inaccurate as written and should be superseded once this lands.
- Prompt budget: 14:25, 14:53 (play), 14:54, 14:55, 14:57, 15:04 = 6 in the hour — the cap (`len ≥ 6 → backlog`) was reached exactly, not exceeded; a 7th automation before 15:25 would have backlogged.

## S7 — second control room on one machine (15:07) — pass
```
scratch (HERDR_WORKSPACE_ID=wD) $ controlroom status → AGENTS: stalled scratch-ctl wD:p1 · done s2-a wD:p3 · done s2-b wD:p4 · TICK last 15:07:50 · ok   (no wC agents)
                                $ controlroom automations → A016–A019 fired, A020 armed 15:20 (the scratch controller's own) · next: A020 15:20
                                $ controlroom health → s2-a / s2-b / scratch-ctl only
$ launchctl list | grep io.controlroom → io.controlroom.tick.cc496e1e (live) · io.controlroom.tick.1f0e33ce (scratch)
$ wc -l tick.log → 26 (scratch) vs 34 (live); the scratch log carries A016–A019 lines the live one never saw
$ grep -c -E "wD|s2-a|s2-b|Scratch note" live/docs/briefs/STATUS.md → 0 ; diff STATUS.md before/after → only the live controller's S6 note + my stuck-probe retire row
```
- Isolation holds: the plist bakes `WorkingDirectory`/`--root`/`HERDR_WORKSPACE_ID=wD`, so each tick sees its own agents and ledger. Side observations: (a) the strip calls the scratch controller `stalled` (L014 — a controller never prints DONE); (b) `controlroom verify <name>` is global by design (names are global), so a controller in one room can "verify" another room's workers; (c) `dream` reused the retired name `dreamer-1` and re-armed the copied, already-fired row A006 instead of adding one — harmless, but the ledger lost the first firing's `fired` count (reset to armed/1).

## S8 — dream after a batch (scratch wD, 15:09–15:14) — pass
```
$ controlroom dream --reason "009 batch" --since 7d → dreamer-1 → wD:p5 (dreamer: 009 batch), A006 armed watch dreamer-1 · dream 2026-10-27-1509 (since 2026-10-20T15:09)
  .dream-pre.json: stamp 2026-10-27-1509 · p_max 14 · guarded mtimes recorded
15:12:50 dreamer-1 done; report ends "DONE dream"; pane "DONE dreamer-1"
$ controlroom dream --check → 10 P-lines listed, no ⚠, "dream ok: 10 proposed, 3 merges, 1 landed-candidates · docs/briefs/memory/dreams/2026-10-27-1509.md · 3 min"
$ controlroom promote P022 → "P022 → - L021 2026-10-27 **herdr-prompt-pastes-keys** — … ← docs/briefs/results/008-compaction-extension.md:"pastes keystrokes""   (same source as the P-line)
$ controlroom reject P015 "009 S6: a manual /flush at 21% did not compact …" → struck in proposed.md, copied to memory/archive/2026-10.md
$ controlroom memory --counts → 16 decisions · 20 lessons · 8 proposed   strip: MEMORY 16 decisions · 20 lessons · newest 0m ago · 8 proposed · last dream 1m
$ controlroom dream --check → dream ok: 10 proposed … (8 still open)
```
- Content quality: all 10 citations are `path:"phrase"` (L017) and resolved; the Landed section caught that *my* hand-added `wD:?` rows duplicated the scratch controller's own s2-a/s2-b rows; Unsure asked exactly the S5 and S9 questions ("is prompting a working controller safe?", "should same-tick wakes collapse like `play` does?"). P015 (the dreamer proposing to record "extension compacts on /compact reply" as a decision) is the kind of line S6 shows must not be promoted blind.

## S9 — kill switch & rate cap in the live tick (scratch wD, 15:09–15:12) — pass
- The plist has **no** `CONTROLROOM_AUTOPROMPT` key (`grep -c AUTOPROMPT …plist → 0`); the tick reads it from its environment. Toggle without editing the plist: `launchctl setenv CONTROLROOM_AUTOPROMPT 0` (user domain; the next launchd spawn inherits it), `launchctl unsetenv …` to restore. Caveats: it is **user-global** (every control room's tick flips at once), it does not survive logout, and the strip/`automations` indicator `autoprompt off` only reflects the *strip process's* own environment — so the strip keeps showing prompts enabled while the tick toasts.
```
15:09:42 $ controlroom wake 0m "009 S9 wake N of 7: reply S9-N-OK only; no file edits" --prompt  ×7 → A021…A027   (state: 2 prompts already this hour: 14:57, 14:59)
15:09    tick.log: A021–A024 wake fired → prompted controller · A025–A027 wake due → backlog, retrying each tick
         agents.log: 4× "A02x fired → prompted controller (wD:p1, was done)" · "automation backlog — A025 waits — 6 controller prompts already this hour (cap)"  (one toast)
         state: prompts 6 · waiting {A025,A026,A027: backlog} · strip: AUTOMATIONS 4 armed · next A025 15:09 (in 0m) · fired today 6
         scratch-ctl pane: S9-1-OK · S9-2-OK · S9-3-OK · S9-4-OK  (four queued prompts answered in order)
15:11:15 $ launchctl setenv CONTROLROOM_AUTOPROMPT 0   ($ launchctl getenv → 0)
15:11    tick.log: A025 wake fired → toast (autoprompt off) · A026 … · A027 …   agents.log: 3× "A02x wake — … (autoprompt off)"
15:12:25 $ launchctl unsetenv CONTROLROOM_AUTOPROMPT   — the live tick had no armed wake during that minute (tick.log unchanged)
```
- The cap counts *all* controller prompts in the trailing hour (automations + play collapses), so "7 wakes → 6 prompts" only holds from a cold hour; here 2 + 4 = 6. The 7th-wait-an-hour behaviour was demonstrated by the `backlog` state, then short-circuited by the kill switch (which fires backlogged rows as toasts — nothing is lost).

## S10 — Herdr restart — untested (by design)
- `herdr --help` / `herdr server --help` / `herdr session --help` / `herdr workspace --help` / `herdr pane --help`: the only reload is `herdr server reload-config` (config.toml only). `herdr server stop` and `herdr session stop <name>` stop a whole server. There is no per-workspace or per-pane restart.
- What would need to happen to test it safely: run a **separate named session** (`herdr --session cr-test`) that holds only a scratch control room, init there, then `herdr session stop cr-test` / `herdr --session cr-test` again. Expected from the code: launchd keeps ticking; every `watch` row sees `agent not in herdr` → after 180 s `worker X GONE` toast (one per row); `logs/.controller` holds a pane id that may not exist in the new server → `controller()` falls back to the name `controller` in the workspace (which also may differ) → wakes return `fail` → toast "(no controller found)"; the human must `pi --resume` the controller session and re-run `/controller` (which re-pins `.controller` via init). The STATUS.md `Retired workers` table has the resume paths. None of that is verified.

---

## Bugs found
1. **`init` swallows the agent-name collision** — *medium*. `herdr agent rename "$HERDR_PANE_ID" controller >/dev/null 2>&1 && echo "agent → controller"` prints nothing on failure; a second room's controller keeps its old name with no warning, and `tick_install`'s name-based fallback (`a.get("name")=="controller"`) can then point at the *other* room's controller if `logs/.controller` is ever missing. Repro: with wC's `controller` alive, `herdr agent rename <otherpane> controller` → `agent_name_taken`; run `controlroom init` from that pane → output lacks `agent → controller`, no error. Fix: print the herdr error, or rename to `controller-<ws>` and say so.
2. **`stuck?` cannot fire while a tool call blocks (pi cache warming)** — *high* (it is the primary alarm, D004). `health()` uses the jsonl mtime for "session quiet"; pi 1.4.0 writes `usage/cache_warm` entries every ~4.5 min during long tool runs, so `j_age ≥ 10 m` is unreachable; a 25-min silent worker stayed `working` throughout (S3). Repro: launch `logs/scratch/009-stuck.md`; poll `controlroom health <name> --json` — `session_idle` saw-tooths 0–4 m forever. Fix: derive quiet from the last `message` entry timestamp (`last_msg`), not `st.st_mtime`; `spinning?` then also needs re-reading, since "session growing" can now be cache warming.
3. **Extension never compacts after a `/flush` below 75 %** — *high* for the manual path, *latent* for the automatic one. `turn_end` runs after each tool-call turn; `pct < THRESHOLD` resets `requested` (and unlinks the marker) before the final `/compact` reply arrives (S6: 4 tool turns, 0 compactions, no `ext-error`). Repro: `/reload`, `/flush` on a controller at < 75 %, let it do any tool call before replying `/compact`. Fix: don't reset `requested` while a flush is pending (reset only after a compaction, or only when the *previous* turn was also below threshold); and `requested` should not depend on `pct` for a manual `/flush` at all.
4. **Tick deletes the extension's flush marker below 75 %** — *low* (same root as 3, other side). `comp_step` removes `logs/.flush-requested` whenever `pct < FLUSH_PCT`, so a manual `/flush` leaves no durable trace for a restarted extension; the "shared guard" (D016) only guards automatic crossings.
5. **Kill switch is invisible and global** — *low*. `CONTROLROOM_AUTOPROMPT` is not in the plist; the only hands-off toggle is `launchctl setenv`, which affects every room and is not reflected by the strip (`autoprompt off` is computed from the strip's own env). Fix: a file flag (`logs/AUTOPROMPT-OFF`) read by both tick and strip, or write the key into the plist via `controlroom tick-install --no-autoprompt`.
6. **`.tick-state.json` loss resets the 6/h cap and `fired today`** — *low*. Deleting the state (or a crash that corrupts it) forgets prompts already sent; a burst of due wakes right after a tick restart can exceed 6/h (S2). Fix: derive the hour's count from `agents.log` "fired → prompted controller" lines when the state is empty.
7. **`verify` and `lastline` are not workspace-filtered** — *low* / by design (names are global): `controlroom verify <name>` from room A happily reports room B's worker. Harmless until two rooms reuse a worker name.
8. **Controller recorded an untrue lesson (L023)** — *process*, not code. After S6 the live controller wrote "extension compacts" from pane evidence that could not distinguish a typed `/compact` from the hook. Lessons that assert a mechanism need a log line from that mechanism (`ext-error`/`compaction` with a source tag), not a pane glance. Supersede L023 after this lands.
9. **Strip shows a controller as `stalled`** — *cosmetic*, known (L014) and still present in the scratch room (S7).

## What I'd test next
- **S3 again after bug 2 is fixed**, plus the twin case: a worker spinning in short tool calls that never write (expect `spinning?`), and a worker whose only "write" is a `bash` read-only command (the `bash` tool counts as a write today — a `grep` loop would mask `stuck?` too).
- **Automatic flush at ≥ 75 %** with the extension alive: drive a scratch controller past 75 % (small-window model or `CONTROLROOM_FLUSH_PCT=5` for the tick fallback), confirm one flush prompt, one `/compact` compaction, one post-compaction wake, no duplicate from the tick fallback (`.ext-alive` gate), and the marker re-arming on the next crossing.
- **Herdr restart in a separate named session** (S10 plan above): GONE toasts, stale `logs/.controller`, `pi --resume` + re-init, and whether `watch` rows should re-arm for resumed workers.
- **Rate cap + play collapse interaction**: 7 wakes due during a pause, then play — does the single collapsed prompt count as 1 (code says yes) and do backlogged rows inside a pause get `held` or `backlog` first?
- **Two rooms, one worker name**: launch `probe` in both; check `verify`, `lastline`, `health`, and `retire` resolve the right pane.
- **Controller-only Boot timing**: how long after `/controller` until the first wake is armed with no human input (S1: 90 s); same for `pi --resume <controller session>` without `/controller`.
- **Laptop sleep across a wake** (L002): arm a wake 3 min out, sleep the Mac 5 min — does launchd fire it late once or skip it, and does `fired today` count it.

## Cleanup
- Scratch: A020 cancelled; `s2-a`, `s2-b`, `dreamer-1` retired; `controlroom tick-uninstall` → `io.controlroom.tick.1f0e33ce booted out`, plist removed; `herdr workspace close wD` → ok; `/tmp/cr009-scratch.fFDt` deleted. Evidence copied to `logs/scratch/009-scratch/` (`tick.log`, `agents.log`, `AUTOMATIONS.md`, `dream-2026-10-27-1509.md`, `proposed.md`, `s3-poll.log`). `launchctl list | grep io.controlroom` → only `io.controlroom.tick.cc496e1e`.
- Live: `stuck-probe` retired (A015 → fired); no `logs/PAUSED`, no `logs/.flush-requested`; `logs/.compactions` = `{"count":1,…}` is real state (the controller did compact) and stays. `controlroom tick --dry-run` → `tick: nothing to do`. My probe rows A017–A022 are **left in `AUTOMATIONS.md` as `fired`** (inert): the brief forbids editing the ledger by hand and the CLI has no delete — if "real rows only" matters more, the controller can prune them the way 006/008 did. `logs/agents.log` keeps all scenario lines. `logs/scratch/009-stuck.md` kept (it is the S3 repro). Nothing committed.

## Memory lines recorded (verified here, sourced to this file)
- `L024` **flush-below-75-never-compacts** ← this file `"turn_end\` runs after each tool-call turn"` (S6, bug 3)
- `L025` **cache-warm-defeats-stuck** ← this file `"cache_warm"` (S3, bug 2)
- `L026` **autoprompt-launchctl-setenv** ← this file `"user-global"` (S9, bug 5)
No decision recorded — the fixes are the controller's call. (The live controller added D017, L021–L023 during S6 on its own; L023 should be superseded, see bug 8.)

DONE 009
