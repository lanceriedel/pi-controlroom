# 005 — tick-stuck-pause — results

Worker `tick-stuck-pause` · 2026-10-27 · brief `docs/briefs/005-tick-stuck-pause.md` · design `docs/design/durable-controlroom.md` §2 §4 §6 §8

## Status
**DONE.** All code deliverables A–H shipped in `bin/controlroom` (one delimited block + one contiguous case-arm group, above 004's), README + SKILL updated, every proof below run on this repo. The tick is installed and running under launchd (`io.controlroom.tick.cc496e1e`, 60 s). Nothing committed.

## Spike A verdict — herdr CLI from launchd: **[Verified] YES**
Unit: `logs/scratch/005-herdr-launchd.plist` → `logs/scratch/005-herdr-launchd.sh`; output `logs/scratch/005-herdr-launchd.out`.
Env given to launchd: `HOME, PATH=/usr/bin:/bin:/usr/sbin:/sbin:~/.local/bin:/opt/homebrew/bin, HERDR_ENV=1, HERDR_WORKSPACE_ID=wC` — **no `HERDR_SOCKET_PATH`, no `HERDR_BIN_PATH`** (both are set in a Herdr pane; neither is needed).
```
=== 2026-10-27T18:39:01Z pid=35216 ppid=1          ← ppid 1 = launchd
--- herdr agent list            → full agents JSON, rc=0
--- herdr agent prompt --help   → help text, rc=0
--- herdr notification show     → {"reason":"shown","shown":true}, rc=0
bootstrap rc=0 · bootout rc=0 · "unloaded ok"
```
Required: `HOME` (socket is discovered at `$HOME/.config/herdr/herdr.sock`) and `/opt/homebrew/bin` on `PATH`. `HERDR_ENV`/`HERDR_WORKSPACE_ID` are for `controlroom` (workspace filter), not for the herdr CLI.
→ **Runner = launchd** (`StartInterval 60`, `RunAtLoad`). `tick --loop` kept as the Linux/manual fallback; `statusbar` starts it automatically on non-Darwin. Test unit booted out; no test units left loaded (`launchctl print gui/$UID/io.controlroom.spike005` → not found).

## What changed (file:lines)
**`bin/controlroom`** (248 → 714 lines; 004 added ~130 in parallel, mine ≈ 330)
- `13–15` help lines for `tick` `health` `automations` `pause` `play` `tick-install|uninstall`; `*)` arm prints `2,17p`.
- `46` header printf gains `%s` ← `cr5 pause-hdr` (yellow `PAUSED since … · N draining · play at … (A###)`; empty when not paused).
- `62–63` `lastline()` in `status_text` now calls `controlroom lastline <agent>` — **one implementation**, moved to a case arm (`700–708`) so `health` can reuse it (brief: don't fork `lastline`).
- `65–67, 71–72, 78–80` AGENTS block reads `logs/.health.json`: `stuck?` (red) / `spinning?` (yellow) replace `working` in the state column; detail adds `last write Xm · ctx NN%`; the cyan `→` line also shows for flagged agents.
- `84` `cr5 strip` → `TICK  last HH:MM:SS · ok|N actions` (red `TICK  not running` after 5 min) and, in detail, `COST  controller $… · workers $… · today $…`.
- `96` PIPELINES skips `tick.log` (and `agents.log`) — control-room logs, not pipelines. `121` BRIEFS line excludes `AUTOMATIONS`.
- **`128–426` `# ---- tick/health/pause (005) ---- … # ---- end 005 ----`**: `cr5()` python dispatcher (`tick | health | auto init/arm/cancel/list | pause | play | pause-hdr | strip | plist`), `tick_label()`, `tick_install()`, `tick_uninstall()`.
  - AUTOMATIONS.md parser/writer `171–186` (§2.2 columns; preamble preserved; whole table rewritten via `os.replace`; `|` in cells sanitised).
  - `parse_session` `207–229` (cost · cost_today · tokens · turns · model · last write-tool ts · compactions · ctx % from last assistant `input+cacheRead+cacheWrite` ÷ window; cached by `(path,size,today)` in `logs/.health.json`).
  - `health()` `230–249` (§6 fields; `stuck?` = working ∧ last write > 20 m ∧ session mtime quiet ≥ 10 m ∧ `lastline` unchanged since the previous run; `spinning?` = working ∧ last write > 30 m ∧ session growing; one `request` toast per hour via existing `note`).
  - `tick()`/`tick_pass()` `257–311` — §2.4 steps **1** (mkdir lock, stale 5 min) **2** (PAUSED; auto-play when `until` passes; fires the `play` row) **3** (watch rows → existing `verify` → same four toasts the old `watch` loop used → `fired`; `prompt? = yes` logged as “not supported in 005, toast only”; 180 s launch grace replaces the loop's `sleep 90`; agent missing from herdr → one `GONE` toast; health for every agent, flags logged on change) **4** (re-arm: board `working|launched` ∧ live in herdr ∧ no row ever → `source: rearm`) **8** (atomic write-back only if changed; `tick.log` appended only when something happened; heartbeat `logs/.tick.last` every pass). `wake`/`watch-path`/`dream` rows: `unsupported kind in 005, skipped` logged once per row id.
  - `plist` `385–408` (§2.6 + `WorkingDirectory`; `/bin/bash -c` not `-lc`, see Deviations).
- `553` `statusbar`: non-Darwin → `tick --loop &` beside the pager. `578–590` `init`: strip split now idempotent (skips when the workspace already has a pane labelled `status`). `591` `init` calls `tick_install`.
- `596–600` `launch`: `--force` parsing; refuses with exit 3 while `logs/PAUSED` exists. `606` `nohup watch` → `cr5 auto arm` (row `prompt? = no`, `source: launch MM-DD HH:MM`). `630` `resume` re-arms the row (so `resume-stalled` inherits). `660` `retire` → row `cancelled`.
- `684–709` the 005 case arms (contiguous, above 004's).

**`docs/briefs/AUTOMATIONS.md`** — created by `tick-install`/`init`; currently A001 (fired) · A002 (armed) · A003 play (fired).
**`README.md`** — vocabulary: *Automation (watch row)*, *Pause*, *Health*; Event wording; strip state table (+`stuck?`, `spinning?`), detail/COST/TICK/PAUSED paragraph; CLI table rows for `launch --force`, `tick`, `health`, `automations`, `pause/play`, `tick-install/uninstall`, `watch` (manual); 3 gotchas.
**`skills/controlroom/SKILL.md`** — description, Commands rows, protocol bullet (Automation/Pause/`stuck?`), gotchas.
**Scratch** — `logs/scratch/005-herdr-launchd.{plist,sh,out}`, `005-tune-thresholds.py`, `005-fake-stuck.jsonl`, `005-block.sh` (the block as written), `005-controlroom.before` (pre-edit copy).
**Not touched**: `~/Library/LaunchAgents/io.mana.*`, `io.lance.*`; STATUS.md rows (zero lines deleted); `init`'s memory scaffolding (my `tick_install` line sits beside it).

## Proof transcript (trimmed; all on this repo, 12:39–13:03 local)
```
$ controlroom tick --once --dry-run                      # before AUTOMATIONS.md existed
DRY  A001 armed watch boot-and-memory (rearm from STATUS.md)
DRY  A002 armed watch tick-stuck-pause (rearm from STATUS.md)
(0.07 s; no files written)

$ controlroom tick-install                               # = the 005 half of `init` (see Deviations for why not full init from this pane)
AUTOMATIONS.md created
tick      launchd io.controlroom.tick.cc496e1e bootstrapped (60 s) · ~/.config/controlroom/launchd/io.controlroom.tick.cc496e1e.plist
$ cat logs/tick.log                                      # RunAtLoad tick, from launchd
[10-27 12:48] A001 armed watch boot-and-memory (rearm from STATUS.md)
[10-27 12:48] A002 armed watch tick-stuck-pause (rearm from STATUS.md)
$ controlroom tick --once                                # 60 s later — 004 had just printed DONE (real, verified in its pane)
A001 watch boot-and-memory → done (toast)
$ controlroom tick --once
tick: nothing to do                                      # idempotent
$ controlroom automations
   A001 watch boot-and-memory    fired  … fired 1  prompt no  integrate 004-boot-and-memory when DONE  ← rearm 10-27 12:48
   A002 watch tick-stuck-pause   armed  … fired 0  prompt no  integrate 005-tick-stuck-pause when DONE ← rearm 10-27 12:48

$ controlroom health
   boot-and-memory    done     last write    2m · session quiet    2m · $3.84 · 2.5M tok · 35 turns · ctx 50%
   durable-design     done     last write   35m · session quiet   34m · $3.68 · 1.5M tok · 18 turns · ctx 63%
   mana-install       done     last write 21.3h · session quiet 21.3h · $1.09 · 0.4M tok · 19 turns · ctx 18%
   pulse-notify       done     last write  3.0h · session quiet  3.0h · $0.98 · 0.3M tok · 14 turns · ctx 17%
   tick-stuck-pause   working  last write    0m · session quiet    0m · $4.47 · 2.6M tok · 32 turns · ctx 57%
$ controlroom health controller
   controller         missing  (no session file)        # wC:p1 is unnamed in herdr right now — see Gotchas
$ controlroom health --jsonl <wC:p1 session> --name controller --status idle
   controller         idle     last write   11m · session quiet   11m · $11.08 · 5.3M tok · 88 turns · ctx 67%

# fake stuck: copy of durable-design's jsonl, mtime set to 06:00, status forced to working (no real worker touched)
$ controlroom health --jsonl logs/scratch/005-fake-stuck.jsonl --name durable-design --status working   # run 1: candidate, stores pane tail
   durable-design     working  last write   36m · session quiet  6.8h · $3.68 · 1.5M tok · 18 turns · ctx 63%
$ … run 2 (pane tail unchanged → confirmed)
   durable-design     working  last write   36m · session quiet  6.8h · … · ctx 63%   stuck?        ← red
$ … run 3
   … stuck?                                                                                           ← still red, no 2nd toast
$ grep STUCK logs/agents.log
[10-27 12:50] worker durable-design STUCK? — working, but no write for 36m and session quiet 6.8h — check pane / controlroom resume durable-design
(1 toast; `request` sound)
# strip rendering of the red state (flag injected on the live working agent's cache entry; the next tick cleared it):
   stuck?   tick-stuck-pause   wC:p7                     ← \033[31;1m

$ controlroom pause --resume-after 2m "test: 005 proof"
PAUSED since 12:50 · play at 12:52 (A003) — launch refuses (use --force); workers drain; controlroom play to resume
$ cat logs/PAUSED
since=2026-10-27T12:50 until=2026-10-27T12:52 reason="test: 005 proof"
$ controlroom launch nope docs/briefs/005-tick-stuck-pause.md ; echo rc=$?
paused since 2026-10-27T12:50 — controlroom play, or --force
rc=3
$ controlroom status | head -1
 CONTROL ROOM  Tue 12:50  pi-controlroom   (…)   PAUSED since 10-27 12:50 · 1 draining · play at 12:52 (A003)    ← yellow
$ sleep …; tail -2 logs/tick.log                          # launchd tick, 12:52
[10-27 12:52] A003 play (auto)
[10-27 12:52] play (auto) — pause since 2026-10-27T12:50 ended · reason: test: 005 proof
$ ls logs/PAUSED → No such file · agents.log: [10-27 12:52] PLAY (auto) — pause ended — launches allowed again

$ controlroom tick-uninstall                              # kill the tick
tick      io.controlroom.tick.cc496e1e booted out · removed …plist
$ (5 min later) controlroom status | grep TICK
(13:02:07)  TICK  not running  last 12:57 (5m ago) — controlroom tick-install                            ← red (heartbeat 12:57:02, booted out 12:57:18)
$ controlroom tick-install                                # restore
AUTOMATIONS.md present (skipped) · tick launchd io.controlroom.tick.cc496e1e bootstrapped (60 s)
 TICK  last 13:02:08 · ok                                 ← green again; `launchctl list | grep controlroom` → only io.controlroom.tick.cc496e1e
$ controlroom tick --loop --once   (earlier, 8 s, then killed)     # fallback runner
tick: nothing to do  → heartbeat refreshed → ` TICK  last 12:56:52 · ok`; loop + caffeinate processes gone after kill

$ bash -n bin/controlroom → OK · verify durable-design → done · verify tick-stuck-pause → working · gc --hours 2 → 2 "would retire" (dry)
$ controlroom watch durable-design  (manual; ran 8 s, killed) OK · memory --counts → 7 decisions · 8 lessons · status rc=0
$ (cd /tmp && controlroom tick --once; echo rc=$?) → rc=0, no output (silent no-op outside a control room)
```

## Threshold tuning data
`logs/scratch/005-tune-thresholds.py` over the **22 pi sessions** `herdr agent list` knows (4 workspaces, incl. this controller, the design worker, 004 and me). Per session: longest gap between consecutive `write`/`edit`/`bash` tool calls **while continuously working** (no user message in between), and longest intra-turn silence between messages.

| | max write gap | max intra-turn message gap | note |
|---|---|---|---|
| 21 of 22 sessions | **≤ 6.3 min** (cat-owner-brief, 107 writes) | ≤ 6.3 min | this repo's sessions: 0.7–3.2 min |
| vantage-crawl (`2026-10-20T17-49-44`) | **15.0 min** | 15.0 min | one `bash` okta auth **poll loop** (`for i in $(seq 1 30)… sleep`) — it wrote `[time] START auth-wait` to `logs/vantage-crawl.log`, which `last write` attributes to the worker by name → would **not** have counted as silence |
| the 26 h incident (SKILL.md) | ~26 h | ~26 h | would fire at 20 min + 1 tick |

**Verdict: keep `stuck?` = 20 min, session-quiet = 10 min, `spinning?` = 30 min.** 20 min is 3× the worst normal gap and above the one honest long gap (a poll loop that logged anyway). The extra guard (pane tail unchanged across two ticks) means a long-running bash that prints progress also stays green. Projects with routinely longer quiet tool calls can set `CONTROLROOM_STUCK_MIN=30` in the plist env. Health parse cost: full `health` over 5 sessions in well under 1 s; cached by `(path,size)` so a tick on a quiet board costs ~70 ms plus one `herdr agent list`.

## Deviations (from the design/brief, with reasons)
1. **Heartbeat file `logs/.tick.last`** for the `TICK` indicator instead of inferring from `tick.log`/lock age. `tick.log` is only written when something happened and the lock is removed at exit, so neither says "alive but idle". One tiny file, rewritten every pass.
2. **Re-arm (step 4) adds a row only when the agent has *no* row at all** (not "no armed row"). Otherwise a `fired` row (worker done, board still `working` until the controller integrates) would be re-armed and re-fire every minute. `resume` re-arms explicitly. Also only when the agent is live in herdr (a board row with no agent after a Herdr restart would otherwise churn rearm→GONE each minute).
3. **Health runs for every named agent, not only `working`** — `stuck?`/`spinning?` are still computed only for `working`; the extra pass is cache-hit-only and gives the `COST workers $…` sum for done workers too.
4. **plist uses `/bin/bash -c` with an explicit `PATH`, plus `WorkingDirectory`**, not `bash -lc`: a login shell sources profiles every minute (slow/noisy in `tick.log`), and `ROOT` from `git rev-parse` needs the cwd.
5. **Proof used `controlroom tick-install` rather than full `controlroom init`.** `init` from *this* pane would `herdr agent rename wC:p7 controller` (renaming me) and re-rename my tab; `init` is for the controller pane. `tick-install` is exactly the 005 half that `init` now calls (AUTOMATIONS.md + plist, both idempotent). I also made the strip split idempotent so a second `init` from the controller pane leaves `wC:p2` unchanged — but that part is untested live (needs the controller pane).
6. **`controlroom lastline` is a new (internal) subcommand**: the strip's `lastline()` moved there so `health` can reuse it without forking.
7. **`verify` is skipped for agents herdr already reports `working`/`blocked`** (same as the old loop) and a worker missing from `herdr agent list` gets its own `GONE` toast rather than the old "stopped WITHOUT DONE".
8. Dream-after-pause row: skipped, as decided. `prompt controller? = yes` is parsed and logged, never acted on (006).

## Gotchas
- **The controller pane `wC:p1` has no `name` in `herdr agent list`** (the rename from `init` did not survive something — probably a Herdr restart). Consequences: `health controller` → `missing`, `COST controller $0.00`, and nothing watches the controller. Fix: re-run `controlroom init` (now idempotent) from the controller pane, or `herdr agent rename wC:p1 controller`. Recorded in README/SKILL gotchas.
- **Duplicate DONE toast during migration**: 004's launch (pre-005) had a live `nohup controlroom watch` loop; both it (12:47) and the tick (12:48) toasted. Expected once; new launches arm only a row.
- `cp` of a session file resets `st_ctime` → `start` fell back to "now" and `last write` read `0m`. Fixed: fall back to the first timestamp *inside* the file. Only mattered for the `--jsonl` test path.
- `edit` tool pitfalls while 004 edited the same file: 004 landed first; my block went above theirs; both `bash -n` clean. `§`/`→` in anchors needed python-side replacement.
- No `timeout`: all `launchctl` calls wrapped in `perl -e 'alarm N; exec @ARGV' --`; herdr calls from python use `subprocess timeout`.
- The launchd tick runs with `cwd=ROOT` and `HERDR_WORKSPACE_ID` baked into the plist — one control room per workspace; a second repo gets its own `io.controlroom.tick.<hash8>` unit.
- `tick --loop` must not be run alongside the launchd unit (harmless — the lock serialises — but wasteful). `statusbar` only starts it on non-Darwin.

DONE 005
