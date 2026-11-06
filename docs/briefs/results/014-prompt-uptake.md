# 014 — prompt-uptake · result

Status: DONE 11-06 04:59 (started 11-05 08:03; worker turn died 11-05 08:33 to `Connection error.` — laptop slept; resumed 11-06 04:54)

## Finding → fix → proof

| # | finding | fix (`bin/controlroom`, all `(014)`) | proof (command → log line) |
|---|---|---|---|
| 1 | Three daily rounds (10-30 14:18Z, 11-02 15:02Z, 11-04 15:54Z) were pasted (`agents.log: A030 fired → prompted controller`) but pi's turn died: 4 assistant entries `stopReason:"error"`, `errorMessage:"Connection error."`, `content:[]`, `usage.output 0`, over 2–25 min. The 10-30 user message is `wh[A030 …` (junk keystrokes before the tag). Nothing noticed; the message was re-sent with the next day's turn. | **Uptake check.** `prompt_controller` `:300` records `st["sent"][rid] = {ts, off=jsonl size, text, tag}` on `ok` (`tag` = `[A###` / `[retry · A###`, or the text's first 24 chars for flush/post-compaction texts which carry no id). `ctl_jsonl()` `:302`. `uptake(st,dry,acts)` `:309–333`, run each tick at `:494` (step 5a): seek the controller jsonl to `off`, find the user message containing `tag`, then its assistant entries. (a) any non-error / tool call → `A### prompt taken (controller turn ran)`, entry dropped. (b) all `error` and last ≥ 3 min old → `prompt_controller(rid, "[retry · A### · earlier turn aborted: <err>] "+text, cap=False)` → `agents.log`+`tick.log`: `A### turn aborted (Connection error.) → re-prompted`, `retried=1`. (c) second abort → toast `controller: wake A### failed twice (Connection error.)` once (`toasted`), then re-prompt every 15 min (`last`) until taken — never spent. (d) no user message ≥ 3 min after send and controller not `working` → same as (b) with `prompt not taken`. Retries bypass the 6/h cap, count toward it (D023 pattern). | scratch S1: `A001 turn aborted (Connection error.) → re-prompted`, prompts.log line 2 = `[retry · A001 · earlier turn aborted: Connection error.] [A001 · wake · fired 1/once · 08:07] round: 014 test`. S2: `A001 prompt taken (controller turn ran)`, then `tick: nothing to do`. S3: `A002 turn aborted … → re-prompted`, 2nd abort → toasts.log 1 line `controller: wake A002 failed twice (Connection error.)`, next tick `nothing to do` (< 15 min), after `last -= 1000` → `… re-prompted (retry 2)`, toast count stays 1. S4: `A003 turn aborted (prompt not taken) → re-prompted` only once status ≠ working. S7: flush text (no `[A###]`) → `A009 prompt taken`, no spurious retry. **Live:** `[11-06 04:53] A032 wake fired → prompted controller` → `[11-06 04:54] A032 prompt taken (controller turn ran)` (tick.log), `sent` emptied. |
| 2 | The 08:00 wake lands seconds after the Mac wakes, before network/VPN is back. | **Dodge the dead window.** `just_woke()` `:304–308`: `sysctl -n kern.waketime` `sec` < 120 s ago (fallback: `.tick.last` gap > 300 s). `fire_auto` `:461–464`: prompt rows stay due, one line `deferring prompts 1 tick (just woke)`; uptake also skipped that tick (the retry would hit the same window). | scratch S5: waketime = now−30 s → `deferring prompts 1 tick (just woke)`, A004 still `armed`; waketime old → `A004 wake fired → prompted controller`. Live: `tick.log [11-05 10:11] deferring prompts 1 tick (just woke)` (first real firing of the mechanism). |
| 2b | **Starvation found live:** the laptop spent 11-05 10:03 → 11-06 04:52 in dark-wake cycles; every tick ran inside the 2-min window, so A032 was deferred **19 times** (`tick.log` 10:11, 11:12, 12:13, 13:14, 14:15, 14:49, 15:52, 16:26, 16:57, 16:58, 17:18, 18:19, 21:09, 00:22, 00:56, 02:07, 04:07, 04:51, 04:52) — 18 h 50 min late. | **Deferral cap.** `:494` `dfr=st["deferred"]`, `capped = woke and dfr>=3`; `fire_auto` `:462` counts consecutive deferring ticks, `:464` when capped: `just-woke deferral cap (N consecutive) reached → firing prompts anyway`, counter → 0; a non-woke tick resets it; uptake runs when capped. | scratch S8: 3 × `deferring prompts 1 tick (just woke)` → 4th tick `just-woke deferral cap (3 consecutive) reached → firing prompts anyway` + `A005 wake fired → prompted controller`; `deferred` = 0 after; stays 0 after a normal tick. |
| 3 | No way to see an aborted turn on the strip. | `parse_session` `:393/:402/:410` tracks `last_err` (errorMessage of the **last** assistant entry if `stopReason=="error"`, else None); `health` `:433` copies it; `strip` CTX line `:666` appends `⚠ last turn aborted (<err>)` in red — detail view only. | scratch S6: last entry error → ` CTX   controller ctx 0% · compactions 0 · flushed — · extension absent (tick fallback)   ⚠ last turn aborted (Connection error.)`; after a toolUse entry the phrase is gone. |

Net change `bin/controlroom`: 1100 → 1140 lines (+40, budget ≤ 60). New state keys only: `.tick-state.json` `sent{rid:{ts,off,text,tag,retried,toasted,last}}`, `deferred`. Installed via L032: WIP copy `logs/scratch/014-wip/controlroom` → `bash -n` → `tick --once --dry-run` (`tick: nothing to do` both times) → `cp`+`mv` atomic; `~/.local/bin/controlroom` is a symlink so each save was live on the next launchd tick. Original kept at `logs/scratch/014-wip/controlroom.orig`.

## Scratch transcript (trimmed; full: `logs/scratch/014-wip/proof.log`, harness `proof.sh`)
mktemp repo `/tmp/014-scratch.*`, `git init`, hand-written `logs/.controller = wX:p1` (no tick-install, L013), fake `herdr` (agent list → one `controller` on `wX:p1` with `agent_session` → `ctl.jsonl`; `agent prompt` → `prompts.log`; `notification show` → `toasts.log`), fake `sysctl` reading `waketime`. jsonl entries synthesized with past UTC timestamps.
```
=== S1: 10-30 shape — user [A001 …] + 4 error assistants (≥3 min old)
$ controlroom tick --once            → A001 wake fired → prompted controller
(append: user "wh[A001 · wake · fired 1/once] …" −12m; 4 × error assistants −12…−9m)
$ controlroom tick --once            → A001 turn aborted (Connection error.) → re-prompted
prompts.log (2): [retry · A001 · earlier turn aborted: Connection error.] [A001 · wake · fired 1/once · 08:07] round: 014 test
sent: A001{retried=1,toasted=None}
agents.log: [11-05 08:07] A001 turn aborted (Connection error.) → re-prompted
=== S2: taken turn
(append: user "[retry · A001 …" −1m; assistant toolUse)
$ controlroom tick --once            → A001 prompt taken (controller turn ran)      sent: {}
$ controlroom tick --once            → tick: nothing to do
=== S3: two aborts
$ tick → A002 wake fired → prompted controller ; (user+2 err −8m) $ tick → A002 turn aborted (Connection error.) → re-prompted
(user "[retry · A002 …" −5m + 2 err)  $ tick → tick: nothing to do
toasts.log: controller: wake A002 failed twice (Connection error.) — the tick re-prompts every 15 min — check network/VPN and the controller pane
sent: A002{retried=1,toasted=True}
second tick → tick: nothing to do (toast not repeated, prompts.log still 4)
sent.A002.last −= 1000 → $ tick → A002 turn aborted (Connection error.) → re-prompted (retry 2) ; prompts.log 5 ; toast count: 1
A002 wake  fired  fired 1   (row advanced by the original ok; the pending `sent` entry is what keeps retrying)
=== S4: paste lost
$ tick → A003 wake fired → prompted controller ; sent.A003.ts −= 240 ; status=working → $ tick → tick: nothing to do
status=done → $ tick → A003 turn aborted (prompt not taken) → re-prompted
prompts.log: [retry · A003 · earlier turn aborted: prompt not taken] [A003 · wake · fired 1/once · 08:07] round: 014 lost
=== S5: just woke
waketime=now−30s → $ tick → deferring prompts 1 tick (just woke) ; A004 wake armed
waketime=0       → $ tick → A004 wake fired → prompted controller
=== S6: strip (HERDR_WORKSPACE_ID=scratch014, detail flag private to the scratch room, removed after)
last=error   →  CTX   controller ctx 0% · compactions 0 · flushed — · extension absent (tick fallback)   ⚠ last turn aborted (Connection error.)
last=toolUse →  CTX   controller ctx 0% · compactions 0 · flushed — · extension absent (tick fallback)
=== S7: flush-type prompt (no [A###] in text)
$ tick → A009 flush fired → prompted controller ; sent: A009{tag=[controlroom · flush] Co…}
(user "[controlroom · flush] …" + toolUse) $ tick → A009 prompt taken (controller turn ran)
=== S8: dark-wake cycles (waketime=now−30s every tick)
$ tick ×3 → deferring prompts 1 tick (just woke)
$ tick    → just-woke deferral cap (3 consecutive) reached → firing prompts anyway ; A005 wake fired → prompted controller ; deferred=0
```
Harness fixes along the way: the 6/h cap bit S5 once (retries count toward it, by design) → `st["prompts"]=[]` reset in the harness; `DETAIL=1 controlroom status` does **not** switch detail — the flag file `~/.config/controlroom/detail.<WS>` does.

## Live
- `controlroom tick --once --dry-run` after each install: `tick: nothing to do` (11-05 08:1x, 11-06 04:55 ×2). Today's 11-05 08:00 A030 turn was taken and was never re-prompted (it predates the `sent` bookkeeping; no entry existed).
- Unplanned live proof of #1: `[11-06 04:53] A032 wake fired → prompted controller` → controller ran (user `[A032 · wake · fired 1/every 2h · 04:53]` at 11:53:47Z, 5 toolUse assistants, `stop` at 11:54:41Z) → `[11-06 04:54] A032 prompt taken (controller turn ran)`; `.tick-state.json` `sent` = `{}`.
- Live proof of #2 / #2b: 19 `deferring prompts 1 tick (just woke)` lines 11-05 10:11 → 11-06 04:52 (the bug the cap fixes).

## Live TAKEN-OK proof
```
$ controlroom wake 0m "014 proof: reply TAKEN-OK" --prompt        (11-06 04:57:02; kern.waketime 04:51:17 → not just-woke)
A033 armed — wakes controller at 04:57 (in 0m)
agents.log: [11-06 04:57] A033 fired → prompted controller (wC:p1, was done)
tick.log:   [11-06 04:57] A033 wake fired → prompted controller
            [11-06 04:58] A033 prompt taken (controller turn ran)          ← 1 tick later, no re-prompt
controller jsonl: 11:57:48Z user  '[A033 · wake · fired 1/once · 04:57] 014 proof: reply TAKEN-OK …'
                  11:57:52Z assistant stop 'TAKEN-OK\n\n(014 proof wake A033 — no round work; next: A032 at 06:03.)'
.tick-state.json sent = {}
```
That was the only prompt sent to the live controller by this worker. No `init`, no `pause`, no other room touched; nothing committed.

## Deviations
- (c) "leave the row due": `fire_auto` had already advanced the row when `prompt_controller` returned `ok`, so the row is not un-advanced; the pending `sent` entry plays the "due" role and re-prompts every 15 min until taken. Same effect (never spent), no ledger rewrite.
- Flush/post-compaction texts carry no `[A###]` tag → matched by the first 24 chars of the text (found in review, not in the brief).
- (d) is gated on the controller not being `working` (a paste into a working pi is queued, not lost).
- Worker turn died 11-05 08:33 to the same `Connection error.` (laptop slept), after install and the scratch proof but before the result file was written; this file was written on resume 11-06 04:54. The 45-min time-box was exceeded by wall-clock (sleep), not by work.
- Added after resume at the controller's request: deferral cap (#2b) — not in the brief; found from live tick.log.
- `uptake` writes `A### prompt taken` to tick.log (brief said "drop") — L028: the taken path needs its own log line to be provable.

## Memory lines recorded
- `L040 defer-guard-needs-cap` — 'defer one tick after wake' starved A032 19x: under dark-wake cycles every tick runs < 2 min after kern.waketime — a defer guard needs a consecutive cap ← `docs/briefs/results/014-prompt-uptake.md:"deferred **19 times**"`
- `D028 prompt-uptake-tracked` — tick tracks each sent prompt (sent{ts,off,tag}) until the controller jsonl shows a non-error turn; all-error 3 min → re-prompt; 2nd abort → toast, retry 15m ← `docs/briefs/results/014-prompt-uptake.md:"Uptake check"`
- (the 160-char cap refused 6 longer drafts first — nothing partial was written)

DONE 014
