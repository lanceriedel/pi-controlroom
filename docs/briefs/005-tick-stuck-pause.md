# 005 — tick-stuck-pause: one `controlroom tick` reconciler (launchd) + `stuck?` health + pause/play

## Objective
Replace the per-launch `nohup controlroom watch` loops with a single idempotent reconciler, `controlroom tick`, run by launchd every 60 s, that: verifies workers and re-arms watches from the board after any restart; computes **health** (`last write`, red `stuck?`, yellow `spinning?`, `$`/tokens in detail view) from the pi session jsonl; and honours a **pause/play** marker that drains in-flight work. This is the slice that would have caught the 26-hour blocked worker. **First task: answer the open question — does the `herdr` CLI work from a launchd-spawned process?** Design the rest around the answer.

## Inputs — read first, in this order
1. `docs/design/durable-controlroom.md` — **§2 Automations and the tick (2.1 why, 2.2 AUTOMATIONS.md table format, 2.4 tick algorithm, 2.6 launchd), §4 Pause/Play, §6 Cost & health, §8 Migration, §9 brief 005 row, §10 verification log.** Authoritative. Thresholds marked `[A]` are provisional — use them, then tune per the deliverable below.
2. `docs/briefs/results/003-critic.md` — why one reconciler, not loops; why `stuck?` (no progress) matters more than `$`.
3. `bin/controlroom` — existing `verify`, `note`, `lastline`, `watch`, `launch`, `status_text`, `resume-stalled`. **Reuse `verify`/`note`/`lastline`; don't fork them.**
4. `bin/controlroom-pager` — strip rendering (`AGENTS` block, header line).
5. `logs/scratch/003-session-cost.py` and `logs/scratch/003-launchd-test.plist` — working prototypes from the design worker (cost/tokens parse in 21 ms; launchd bootstrap from a non-LaunchAgents path verified).
6. `~/.local/bin/mana-pulse-notify` + `~/Library/LaunchAgents/io.lance.mana-pulse-notify.plist` — a working launchd poller on this machine (read-only; pattern reference).
7. `herdr agent list --help`, `herdr agent prompt --help`, `herdr api snapshot --help` (read-only).

## Scope for THIS brief (006 owns `wake`/`watch-path`/`cancel`/prompting the controller; 008 owns the compaction hook)
Implement from §2.4: steps **1 (lock), 2 (PAUSED), 3 (watch rows + health), 4 (re-arm), 8 (write back + tick.log)**. Create the `AUTOMATIONS.md` table and parser/writer (§2.2) with `watch` and `play` kinds only — leave `wake`/`watch-path`/`dream` kinds parsed-but-ignored (log `unsupported kind, skipped`) so 006 slots in. **`prompt controller?` is always treated as `no` in this brief** (toast + log only).

## Deliverables (code)
A. **Spike first (≤ 45 min, time-boxed):** a throwaway launchd unit under `logs/scratch/005-herdr-launchd.plist` whose program runs `herdr agent list` and `herdr agent prompt --help` with the env from §2.6 (`HOME, PATH, HERDR_ENV=1, HERDR_WORKSPACE_ID=<ws>`), writing stdout/stderr + rc to `logs/scratch/005-herdr-launchd.out`. Bootstrap, read result, bootout. Record **[Verified]** yes/no and which env vars were required. If **no** after trying the obvious (socket env vars you find via `env | grep -i herdr` in this pane, `herdr --help` for a socket flag): implement `controlroom tick --loop` (60 s sleep loop, same code path) and have `init` start it in the status pane alongside the pager, under `caffeinate -i`. Either way the tick code is identical; only the runner differs.
B. **`controlroom tick [--once] [--dry-run] [--root R]`** — python3 inside `bin/controlroom`, ≲ 150 lines, per §2.4 steps listed above. `mkdir` lock at `logs/.tick.lock`, stale after 5 min. Atomic table rewrite (`os.replace`). Appends to `logs/tick.log` only when something happened. Must be a silent no-op (exit 0) outside a control room.
C. **`docs/briefs/AUTOMATIONS.md`** — created by `init` (idempotent) with the §2.2 header/table; `launch` appends a `watch <agent>` row (`prompt? = no`, `source: launch <date>`) **instead of** starting `nohup controlroom watch` (keep `controlroom watch` as a manual command; it still works). `resume`/`resume-stalled` re-arm by resetting the row to `armed` rather than spawning a watcher. `retire` sets the row `cancelled`.
D. **`controlroom health [--json] [<agent>…]`** per §6: `last write`, `stuck?`, `spinning?`, `$`/tokens, `context %`; cache in `logs/.health.json` keyed by `(path, size)`. Called from the tick for every `working` agent; `stuck?` → `note` once per hour (`request` sound) + red state on the strip; `spinning?` → yellow. Cost appears **only** in the detail view (`COST  controller $… · workers $… · today $…`).
E. **`controlroom pause [--resume-after Nm] [reason]` / `play`** per §4: `logs/PAUSED` marker (`since= until= reason=`), `launch` refuses with exit 3 unless `--force`, tick auto-plays when `until` passes, strip header shows `PAUSED since … · N draining · play at …` in yellow. **Skip** the `dream --reason pause` row (decision: dream-after-pause is off).
F. **`init`** — writes the plist to `~/.config/controlroom/launchd/io.controlroom.tick.<hash8(ROOT)>.plist` and bootstraps it (idempotent: `launchctl print … || bootstrap`); `controlroom tick-install|tick-uninstall` for manual control; on Linux or if spike A failed, use `--loop` in the status pane. `init` on this repo must leave existing STATUS.md rows intact and migrate the currently-running workers into watch rows (step 4 re-arm does this on first tick).
G. **Strip** — `AGENTS` rows gain `last write Xm` in detail view and `stuck?`/`spinning?` in the state column; header gains `PAUSED…` when applicable; one `TICK  last 00:12 · ok` indicator (or `TICK  not running` in red if `tick.log`/lock older than 5 min).
H. **Docs** — README Commands table + SKILL.md table: `tick`, `health`, `pause`, `play`, `tick-install/uninstall`; vocabulary: *Automation (watch row)*, *Pause*. Note that watchers now survive restarts.

## Deliverables (prove it on this repo)
- Spike A transcript + verdict.
- `controlroom init` → AUTOMATIONS.md exists; first `tick --once --dry-run` shows re-arm actions for whatever is on the board; `tick --once` writes rows; second run is a no-op (idempotent).
- `controlroom health` on `controller`, and on a done worker — show `last write`, `$`, `ctx %`. Fake a `stuck?` by pointing `health` at a copied jsonl with an old mtime (don't block a real worker) and show the red state + one toast.
- `controlroom pause --resume-after 2m "test"` → `launch` refuses (exit 3); strip header yellow; after 2 min the tick auto-plays and logs it.
- Kill the tick (`launchctl bootout` or kill `--loop`) → strip shows `TICK not running` within 5 min; restore.
- `bash -n bin/controlroom`; every pre-existing subcommand still runs (`status`, `verify`, `gc`, `watch` manual).
- **Tune thresholds:** run `health` against the healthy sessions on this machine (`herdr agent list` gives jsonl paths; the design worker's and this controller's sessions are good) and report the max observed `last write` gap during normal work so the 20-min `stuck?` default is justified or adjusted.

## Constraints
- **L — no `timeout` binary**: use `perl -e 'alarm N; exec @ARGV' --` for anything that might hang (launchctl, herdr calls in the spike). **L — laptop sleep kills pipelines; `caffeinate -i`** for the `--loop` fallback. **L — `herdr pane split --ratio` applies to the original pane** if you touch pane layout. **D — human still closes the loop**: nothing in this brief prompts the controller. **D — `$`/tokens in detail view only.** **D — FACTS cut; dream-after-pause off.**
- bash + python3 stdlib. Never delete lines from STATUS.md; `land` (brief 004) owns moving rows.
- Worker 004 (`boot-and-memory`) edits `bin/controlroom` in parallel: keep your code in a delimited block `# ---- tick/health/pause (005) ----` … `# ---- end 005 ----` and add your `case` arms as one contiguous group **above** 004's block if it exists, else at the end. Don't touch `init`'s memory scaffolding if 004 has already added it — add your lines beside it.
- Don't leave test launchd units loaded. Don't touch `~/Library/LaunchAgents/io.mana.*` or `io.lance.*`.
- No commits, no pushes. Deviations from the design go in results under "Deviations" with a reason.

## Where to write
`docs/briefs/results/005-tick-stuck-pause.md`: status · spike verdict · what changed (file:lines) · proof transcript (trimmed) · threshold tuning data · deviations · gotchas. Finish with the sentinel line `DONE 005` and go idle.
