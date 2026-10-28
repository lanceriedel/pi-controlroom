# 006 — wake-automations — results

Worker `wake-automations` · 2026-10-27 · brief `docs/briefs/006-wake-automations.md` · design `docs/design/durable-controlroom.md` §2.2–2.5 §4

## Status
**DONE.** Deliverables A–G shipped: `wake` / `watch-path` / `cancel A###` / `automations [--all]`, tick steps 5–6 (wake + watch-path firing, `held` while paused, collapsed `[play]` prompt), the §2.5 prompt-the-controller path (pane-id resolution, rate cap 6/h, blocked retry + 30-min toast, `CONTROLROOM_AUTOPROMPT=0`), strip `AUTOMATIONS` line + header `next A### HH:MM`, controller-prompt rule, README + SKILL. Every proof below ran — the live ones on this repo through the **launchd** tick (not a manual `tick --once`), the rate-cap/blocked ones in a `mktemp` scratch repo with a fake `herdr` (L011). Live PONG round-trip **verified twice** (direct wake, and collapsed on auto-play). Mid-turn queuing: **[Assumed]** — the controller was `idle` every time a prompt landed (see Proofs). Proof rows and scratch dirs cleaned up; `AUTOMATIONS.md` holds only the real watch/play rows. Nothing committed.

## What changed (file:lines)
**`bin/controlroom`** (714 → 974; 007 added ≈ 125 in parallel, mine ≈ 147 added + 13 modified)
- `18` help line for `wake · watch-path · cancel A### · automations [--all]`.
- `123` `status_text` calls `cr5 auto strip` after `mem_py strip` → the `AUTOMATIONS` line.
- `139` `TSTATE` (`logs/.tick-state.json`), `CTRL` (`logs/.controller`), `AUTOPROMPT` (env), `RAW` (unfiltered herdr list, filled by `agents()` at `164`).
- **`205–258` `# ---- automations (006) ----` helpers** inside the 005 `cr5` python: `load_state/save_state` · `fmt/human` · `next_after` (every N[smhd] / daily / weekdays) · `parse_when` (all §2.3 forms; `HH:MM` rolls to tomorrow when past) · `is_auto` · `next_wake` · **`controller()`** (pane id from `logs/.controller`, fallback name `controller` in this WS — L012) · **`prompt_controller(rid,text,st,dry)`** → `ok | off | backlog | blocked | fail` (rate cap ≤ 6/h on `st["prompts"]`, one `automation backlog` toast/h; `blocked` from `herdr agent list` → no attempt, or `agent_blocked` in the reply → row stays due; one `controller blocked 30 min` toast per row; every success appended to `logs/agents.log` as `A002 fired → prompted controller (wC:p1, was idle)`).
- `331–345` in `tick_pass`: `advance()` (fired+1, recurring → next, once → `fired`, `fired today` counter), `hold()`, `fire_auto()` (prompt if `prompt?=yes`, else toast; `blocked/backlog` logged once per state change, retried every tick). `355–362` **held-row release** on play (auto or manual): all held rows fire, `prompt?=yes` ones collapsed into **one** `[play] N automation(s) fired while paused: A### …` prompt (toast fallback if the prompt can't be sent). `379` watch rows with `prompt?=yes` now log `watch-prompt deferred (v1), toast only`. `380–389` **step 5** (wake/dream: `now ≥ next`, paused → `held`) and **step 6** (watch-path: `glob` newest mtime > `st["wp"][id]`, ≥ 120 s old; prompt text names the changed file). `398` `save_state(st)` alongside the cache.
- `432–462` `cr5 auto` arms: `wake` (opt parser, `--repeat` validated, `controlroom dream …` instruction → kind `dream`, prints the two §2.3 lines), `watch-path` (baseline = current newest mtime, so existing files never fire), `cancel A###` (armed/held only; falls through to the 005 `cancel <agent>`), `strip`. `468–473` `list --all` hides `cancelled` by default, adds `next: A### HH:MM (in Nm)`, `autoprompt off` marker. `496` manual `play` runs a tick pass when held rows exist (immediate collapse). `503–504` header fragment gains dim `next A### HH:MM`.
- `541–542` `tick_install` pins `logs/.controller` once by name if absent (safe from a worker pane — L009); `834` `init` writes `$HERDR_PANE_ID` there. `939` `automations) cr5 auto list "$@"`. **`954–958` the 006 case arms** (`wake`, `watch-path`, `cancel`), contiguous, between 005's and 004's.

**`docs/briefs/AUTOMATIONS.md`** — preamble `Kinds:` line updated (also in `HDR`); proof rows removed (see Cleanup). **`logs/.controller`** = `wC:p1`. **`logs/.tick-state.json`** = `{prompts:[…], fired:{date:n}, wp:{A###:mtime}, blocked:{}, blocked_toast:{}, backlog_toast, waiting:{}}`.
**`prompts/controller.md:21`** — the Automations rule (E): set a wake → tell the human ID, time and what you'll check; when prompted → files first, STATUS.md, `--from`, one closing line with the next wake. Frontmatter unchanged (L003 checked).
**`README.md`** — `102–103` vocabulary *Automation: watch · wake · watch-path · play* incl. the "automations prompt the controller only when a row says so" rule, guards, pane-id; `160–163` header `next` + `AUTOMATIONS` strip line; `178,182–184` CLI rows; `219` rule 9 exception; gotcha for L013.
**`skills/controlroom/SKILL.md`** — `33–34` command rows; `56` protocol bullet with the prompt rule.
**Scratch** — `logs/scratch/006-controlroom.before` (pre-edit copy), `logs/scratch/006-fake-herdr.sh` (the shim used for rate-cap/blocked tests).

## Proof transcript (trimmed; all times local 13:13–13:31)
```
# scratch repo (L011): parser / cancel / strip
$ controlroom wake 15m "check whether 004 landed"
A001 armed — wakes controller at 13:28 (in 15m): "check whether 004 landed"
→ Say to the human: "A001 wakes me at 13:28; from that round I'll check whether 004 landed."
$ wake 2h … --no-prompt → A002 armed — toast (no prompt) at 15:13 (in 2.0h) · "A002 toasts you at 15:13: …"
$ wake 18:12 · wake 2026-10-28T06:00 · wake "every 30m" (next 13:43 · every 30m) · wake "daily 06:00" "controlroom dream --reason nightly" --no-prompt (kind dream)
$ wake "weekdays 06:00" (next 10-28 06:00, a Wednesday) · wake 10m … --repeat "every 5m" (first 13:23, then every 5m)
$ wake bogus "x" → bad <when>: 'bogus' (15m | 2h | 18:12 | …) rc=1 · wake 5m "x" --repeat "every fortnight" → bad repeat rc=1
$ cancel A003 → A003 cancelled (wake) · again → "A003 is cancelled — nothing to cancel" · cancel A999 → not found rc=1
$ automations → 7 rows + `next: A008 13:23 (in 9m)`; --all shows `A003 … cancelled … · cancelled 10-27 13:13`
$ status → header `… next A008 13:23` (dim) · ` AUTOMATIONS  7 armed · next A008 13:23 (in 9m) · fired today 0`

# live PONG — launchd tick, this repo (controller wC:p1 `working` when armed 13:14:07, `idle` when fired)
$ controlroom tick-install → controller pane → wC:p1 (logs/.controller)
$ controlroom wake 2m "006 proof: reply with the single word PONG and nothing else"
A007 armed — wakes controller at 13:16 (in 2m): "…"   → Say to the human: "A007 wakes me at 13:16; from that round I'll …"
 AUTOMATIONS  1 armed · next A007 13:16 (in 1m) · fired today 0
[10-27 13:16] A007 wake fired → prompted controller                                        ← logs/tick.log
[10-27 13:16] A007 fired → prompted controller (wC:p1, was idle)                           ← logs/agents.log
$ herdr agent read controller --lines 12 → "[A007 · wake · fired 1/once · 13:16] 006 proof: … / Rules: files first … / PONG"
$ automations | grep A007 → fired · fired 1 · prompt yes ; .tick-state.json → {"prompts":[1793128571.59],"fired":{"2026-10-27":1}}

# recurring (toast only) — fired twice, next advanced, cancelled rows never fire
$ controlroom wake "every 2m" "006 proof recurring: reply PONG2" --no-prompt            # 13:17:40 → A008 next 13:19
[10-27 13:19] A008 wake fired → toast · next 2026-10-27 13:21
[10-27 13:21] A008 wake fired → toast · next 2026-10-27 13:23
$ controlroom cancel A008 → A008 cancelled (wake)                                        # 13:22; the 13:23 tick: no A008 line, fired stays 2

# watch-path (toast only) — scratch dir logs/scratch/006-wp/, no real result touched
$ controlroom watch-path "logs/scratch/006-wp/*.md" "006 proof: a result changed" → A009 armed … → toast ; wp.A009 = 0 (no files yet)
$ echo "# proof file" > logs/scratch/006-wp/one.md                                      # 13:17:52
13:18, 13:19 ticks: nothing (debounce < 120 s) · [10-27 13:20] A009 watch-path fired → toast · 13:21 tick: unchanged → not fired (fired 1)
(scratch: a second file < 120 s old → `tick: nothing to do`, fired stays 1)

# pause → held → collapsed [play] prompt (live, launchd tick)
$ controlroom pause --resume-after 2m "006 proof: held + collapsed play" → PAUSED since 13:23 · play at 13:25 (A012)
$ controlroom wake 30s "006 proof held: reply with the single word PONG3 and nothing else" --prompt → A013 next 13:23
[10-27 13:24] A013 wake due → held (paused)        strip: ` AUTOMATIONS  1 armed · 1 held · fired today 4` · header yellow PAUSED … play at 13:25 (A012)
[10-27 13:25] A012 play (auto) / play (auto) — pause since 2026-10-27T13:23 ended · reason: 006 proof: held + collapsed play
[10-27 13:25] play: 1 held row(s) fired — A013 · 1 collapsed into one controller prompt
[10-27 13:25] play fired → prompted controller (wC:p1, was idle)                           ← agents.log; exactly one prompt
$ herdr agent read controller → "[play] 1 automation(s) fired while paused: A013 006 proof held: … / Rules: … / PONG3"
(scratch: manual `controlroom play` with 3 held wakes (2 prompt, 1 not) + 1 held watch-path → one `[play] 2 automation(s) fired while paused: A001 held one; A002 held two` prompt, 2 toasts, 4 rows advanced)

# CONTROLROOM_AUTOPROMPT=0 (live; armed right after a launchd pass so it couldn't race)
$ controlroom wake "2026-10-27T13:00" "006 proof: autoprompt off (toast only)" → A014 (due)
$ CONTROLROOM_AUTOPROMPT=0 controlroom tick --once → A014 wake fired → toast (autoprompt off)   (agents.log: `A014 wake — … (autoprompt off)`; no herdr prompt)
$ CONTROLROOM_AUTOPROMPT=0 controlroom automations → `next: — (no armed wake)   autoprompt off` · strip `… fired today 6   autoprompt off`

# rate cap — scratch repo, fake `herdr` records calls; 8 wake rows due at 13:00, controller idle
$ controlroom tick --once → A001…A006 wake fired → prompted controller (6 `herdr agent prompt wX:p1 …` recorded)
  A007 wake due → backlog, retrying each tick · A008 … backlog ; one toast `automation backlog — A007 waits — 6 controller prompts already this hour (cap)`
$ tick --once → nothing to do (6 prompts total; backlog logged once, not per tick)
$ python3: s["prompts"]=[t-3601 …] (next hour) ; tick --once → A007, A008 wake fired → prompted controller (8 total, 8 rows fired)

# blocked path — fake herdr
FAKE_STATUS=blocked tick ×2 → `A001 wake due → blocked, retrying each tick` (once); 0 prompt attempts; row armed/due
FAKE_BLOCKED=1 (status idle, herdr replies agent_blocked) tick → 1 attempt, row still due, no toast
s["blocked"].A001 aged 31 min; tick ×2 → exactly one toast `controller blocked 30 min — A001 waiting`
unblocked tick → `A001 wake fired → prompted controller`; state blocked {} · blocked_toast {A001}

# final
$ bash -n bin/controlroom → OK · tick --once --dry-run → tick: nothing to do (rc 0) · status → 20 lines, TICK/MEMORY/WAITING render, AUTOMATIONS omitted (no wake rows)
$ controlroom memory --counts → 13 decisions · 17 lessons · 0 proposed · lesson L013 appended (below) · launchctl list | grep controlroom → only io.controlroom.tick.cc496e1e
```

### Queuing verdict (controller `working` while a prompt lands)
**[Assumed], not observed.** Both live prompts (13:16 direct, 13:25 collapsed) found wC:p1 `idle`; two 3-minute polls (13:26–13:29, 13:32–13:35) never caught it `working`, so no prompt was sent mid-turn. Evidence for the assumption: `herdr agent prompt --help` says a submission to an already-working agent is accepted ("that active turn's completion may match"), and the code path is the same — `herdr agent prompt wC:p1 <text>` with no `--wait`. The tick logs `was <status>` on every success, so the first real mid-turn case will show up in `logs/agents.log` as `… (wC:p1, was working)`; if pi ever drops such input, that line plus a missing reply is the diagnostic.

## Deviations (with reasons)
1. **Controller pane id lives in `logs/.controller`, not the `AUTOMATIONS.md` header.** Keeps the ledger a pure table (005's parser preserves the preamble verbatim, so a header field would need a second parser) and lets a worker pin it via `tick-install` without rewriting the table. `init` writes `$HERDR_PANE_ID`; `tick-install` fills it once by name if absent (brief allowed either).
2. **Held rows are released by the tick pass, and manual `play` simply runs one.** One code path for auto-play and manual play, one place that holds the rate-cap/blocked state. Effect is identical (the collapse happens in the same second `play` runs).
3. **Blocked/backlog are logged once per state change, not every tick** (`st["waiting"]`). Retry still happens every tick; `tick.log` stays small (a 30-minute block would otherwise add 30 lines).
4. **`next` is stored at minute precision** (`YYYY-MM-DD HH:MM`, the 005 `play` format), so `wake 30s` floors to the current minute and fires on the next tick — fine for a 60 s reconciler.
5. **Watch-path baseline is set at arm time** (current newest mtime) so a glob over existing files never fires on its first tick. The brief's "0 when empty" case was proven (`wp.A009 = 0`).
6. **Proof rows were deleted from `AUTOMATIONS.md`, not just cancelled** — the brief asked for the ledger to end with only the real rows. IDs stay stable (A007–A009, A012–A014 are gaps). Only `cancel` is exposed to users; deleting was a one-off `python3` edit.
7. The collapsed `[play]` prompt counts as one rate-cap slot under the key `play`; if it can't be sent (blocked/backlog/off/no controller) every held row toasts instead — nothing is lost, nothing waits.

## Gotchas
- **`tick-install` in a scratch repo bootstraps a real launchd unit** for that root. It raced my fake-`herdr` passes (rows vanished between `wake` calls, three "no controller found" toasts went to the real human via real herdr). Booted out immediately (`controlroom tick-uninstall` in the scratch; `launchctl list` shows only the real unit). → L013; README gotcha. For tests write `logs/.controller` by hand.
- `next_wake` used `min()` over `(datetime, row)` tuples — two armed wakes at the same minute raised `TypeError` (compared dicts). Fixed with `key=`; caught by the scratch "tie" test, never by the live table.
- The edit tool: `\uXXXX` escapes inside JSON edit payloads arrive as literal backslash sequences — type `→ · —` as characters. (Cost me three failed edit batches; one slipped into SKILL.md and was repaired.)
- `herdr agent prompt`/`read` accept a **pane id** as `<TARGET>` (`wC:p1`), which is what makes L012 workable.
- Shared-file editing with 007: both of us edited `bin/controlroom` live (it's a symlink from `~/.local/bin`, so every save is what the launchd tick runs). `bash -n` after each batch; no broken tick observed (`TICK … ok` throughout).
- A 2-minute live `pause` also blocks `launch` for 007's dreamers (exit 3); dreamer-3 launched at 13:23 just before the marker landed, so nothing was refused — but a future proof should coordinate.

## Memory lines recorded
- `L013 2026-10-27 **scratch-tick-install-launchd** — tick-install in a scratch repo bootstraps a REAL launchd tick for that root (raced my fake-herdr test) — write logs/.controller by hand or tick-uninstall now ← docs/briefs/results/006-wake-automations.md`
- No new decision; D002 (wakes prompt, watches don't) and D006 (≤ 6/h) are implemented as written. The `watch --prompt` deferral is the brief's decision, logged by the tick as `watch-prompt deferred (v1)`.

## Cleanup
`cancel A009` (watch-path); proof rows A007, A008, A009, A013, A014 and my pause's play row A012 removed from `AUTOMATIONS.md`; `logs/.tick-state.json` → `wp` emptied (`prompts` kept — the two real prompts this hour count toward the cap; `fired today 6` kept as history); `logs/scratch/006-wp/` and the `mktemp` repo deleted; scratch launchd unit booted out and its plist removed; `logs/PAUSED` gone.

DONE 006
