# 002 — Notify Lance when a Mana pulse has "Needs you" items

## Objective
Mana (Obsidian plugin + CLI, vault `~/Documents/mana`) runs an hourly **pulse** radar (`0 8-18 * * 1-5`, via launchd) that rewrites `~/Documents/mana/mana/radars/pulse/YYYY-MM-DD.md` each hour. Mana does **not** notify for radar runs. Build a small, robust watcher that posts a macOS notification when a pulse (or the daily radar) is rewritten **and** contains at least one bullet under `## Needs you`, so Lance can glance at Slack/Obsidian only when something needs him.

## Inputs
- Radar definition: `~/Documents/mana/mana/radars/pulse.md` (read it — it defines the report format: `# Pulse — … ` H1, `## Needs you (next few hours)`, `## Still open …`, `## Worth knowing`, `## Coverage`; quiet runs say `Quiet hour. Nothing new needs you.`).
- Example report: `~/Documents/mana/mana/radars/pulse/2026-10-27.md` (and `mana/radars/daily/2026-10-27.md`).
- Existing launchd units for reference (don't modify): `ls ~/Library/LaunchAgents/io.mana.*`.
- Mana CLI: `mana radar status`, `mana radar list` (on PATH via `~/.local/bin/mana`).
- Lance's timezone: Central/Mountain (laptop clock is authoritative).

## Design (do this unless you find a strong reason not to — then explain in results)
- One script `~/.local/bin/mana-pulse-notify` (bash or python3 stdlib only; **no Homebrew installs**, no `fswatch`, no `terminal-notifier`).
- Polling, not fs-events: a launchd agent `~/Library/LaunchAgents/io.lance.mana-pulse-notify.plist` with `StartInterval` 120 s, `RunAtLoad` true, logs to `~/Library/Logs/mana/pulse-notify.log`.
- State file `~/.local/state/mana-pulse-notify/last-seen.json` storing, per watched file, the last mtime + a hash of the "Needs you" section. Notify only when the file changed **and** the "Needs you" section is non-empty **and** its hash differs from last time (so the same open items don't re-ping every hour; "Still open" alone must not ping).
- Notification: `osascript -e 'display notification "<first item, truncated ~100 chars>" with title "Mana pulse: N need you" subtitle "<HH:MM>"'`. Clicking isn't actionable via osascript — fine. Also append a one-line summary to the log.
- Watch both `mana/radars/pulse/*.md` and `mana/radars/daily/*.md` (today's file only — derive the date from the system clock; handle the file not existing yet).
- Add `--once --verbose` flags for manual testing and `--test` that fires a sample notification. Exit 0 on no-op.
- Fail-safe: any exception → log and exit 0; never leave launchd in a crash loop (`ThrottleInterval` 60).

## Constraints
- Time-box: nothing in this brief should take more than a few seconds to run; wrap any test invocation in `perl -e 'alarm 60; exec @ARGV' --` (no `timeout` on this machine).
- Don't modify anything inside `~/Documents/mana/` or the Mana repo. Don't touch Mana's own launchd units.
- Don't install software. Don't commit/push anything.
- `launchctl bootstrap gui/$(id -u) <plist>` to load; verify with `launchctl print gui/$(id -u)/io.lance.mana-pulse-notify | head`. If a macOS notification permission prompt would be needed for `osascript`, note it in results (Script Editor / osascript may need to be allowed under System Settings → Notifications).

## Deliverable
Write `docs/briefs/results/002-pulse-notify.md` (in `~/src/github.com/lanceriedel/pi-controlroom`) with:
1. Status (`done`/`partial`/`blocked`) + one line why.
2. Files created (paths) and the full script inline (it should be short, < 120 lines).
3. Proof: output of `mana-pulse-notify --once --verbose` against today's real pulse file, output of `--test`, and `launchctl print … | head -5`.
4. How to pause/resume/uninstall (`launchctl bootout …`, `rm` the plist/script/state).
5. Gotchas (notification permission, timezone, file-not-yet-exists, etc.).

When finished, print the sentinel line `DONE 002` and go idle.
