# Results — 002 Pulse notify

## 1. Status
**done** — watcher script + launchd agent installed, loaded, and verified against today's real pulse/daily files; all brief design points implemented with stdlib python3 only.

## 2. Files created
- `~/.local/bin/mana-pulse-notify` — the watcher (python3 stdlib, `/usr/bin/python3` shebang so launchd doesn't depend on the dev toolchain PATH).
- `~/Library/LaunchAgents/io.lance.mana-pulse-notify.plist` — `StartInterval` 120, `RunAtLoad` true, `ThrottleInterval` 60, logs → `~/Library/Logs/mana/pulse-notify.log`.
- `~/.local/state/mana-pulse-notify/last-seen.json` — state (per watched path: `mtime`, `needs_you_hash`, `count`), written atomically.
- `~/Library/Logs/mana/pulse-notify.log`.
- Nothing inside `~/Documents/mana/` or Mana's launchd units was touched. Nothing committed.

### Script (`~/.local/bin/mana-pulse-notify`)
```python
#!/usr/bin/python3
"""Notify when today's Mana pulse/daily radar is rewritten with new "Needs you" items.
Usage: mana-pulse-notify [--once] [--verbose] [--test]   (always exits 0)"""
import datetime, hashlib, json, os, re, subprocess, sys, traceback

HOME = os.path.expanduser("~")
VAULT = os.path.join(HOME, "Documents", "mana", "mana", "radars")
STATE_DIR = os.path.join(HOME, ".local", "state", "mana-pulse-notify")
STATE = os.path.join(STATE_DIR, "last-seen.json")
LOG_DIR = os.path.join(HOME, "Library", "Logs", "mana")
LOG = os.path.join(LOG_DIR, "pulse-notify.log")
VERBOSE = "--verbose" in sys.argv
HEADING = re.compile(r"^##\s+needs you", re.I)  # "Needs you (…)" and daily's "Needs your input"


def log(msg):
    line = "%s %s" % (datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), msg)
    if VERBOSE:
        print(line)
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        with open(LOG, "a") as f:
            f.write(line + "\n")
    except OSError:
        pass


def needs_you_items(text):
    """Return the bullet lines under the '## Needs you…' heading (up to the next '## ')."""
    items, inside = [], False
    for line in text.splitlines():
        if line.startswith("## "):
            inside = bool(HEADING.match(line))
            continue
        if inside and re.match(r"^\s*[-*]\s+\S", line):
            items.append(line.strip())
    return items


def clean(item, limit=100):
    s = re.sub(r"^\s*[-*]\s+", "", item)
    s = re.sub(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]", lambda m: m.group(2) or m.group(1), s)  # wikilinks
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)  # markdown links
    s = re.sub(r"\s*#[\w/-]+", "", s)  # tags
    s = re.sub(r"[*_`]", "", s).strip()
    return s if len(s) <= limit else s[: limit - 1].rstrip() + "…"


def notify(title, body, subtitle):
    def q(s):  # escape for AppleScript string literal
        return s.replace("\\", "\\\\").replace('"', '\\"')
    script = 'display notification "%s" with title "%s" subtitle "%s"' % (q(body), q(title), q(subtitle))
    r = subprocess.run(["/usr/bin/osascript", "-e", script], capture_output=True, text=True, timeout=20)
    if r.returncode != 0:
        log("osascript failed rc=%s: %s" % (r.returncode, r.stderr.strip()))
    return r.returncode == 0


def check(kind, path, state):
    if not os.path.exists(path):
        if VERBOSE:
            log("%s: %s does not exist yet" % (kind, path))
        return
    mtime = os.stat(path).st_mtime
    prev = state.get(path, {})
    if prev.get("mtime") == mtime:
        if VERBOSE:
            log("%s: unchanged (mtime %s)" % (kind, mtime))
        return
    with open(path, encoding="utf-8", errors="replace") as f:
        items = needs_you_items(f.read())
    digest = hashlib.sha256("\n".join(items).encode()).hexdigest() if items else ""
    state[path] = {"mtime": mtime, "needs_you_hash": digest, "count": len(items)}
    if not items:
        log("%s: changed, Needs you empty -> no notify" % kind)
    elif digest == prev.get("needs_you_hash"):
        log("%s: changed, %d Needs you item(s) unchanged -> no notify" % (kind, len(items)))
    else:
        title = "Mana %s: %d need%s you" % (kind, len(items), "s" if len(items) == 1 else "")
        body = clean(items[0])
        notify(title, body, datetime.datetime.now().strftime("%H:%M"))
        log("%s: NOTIFY %d item(s) | %s" % (kind, len(items), body))


def main():
    if "--test" in sys.argv:
        ok = notify("Mana pulse: 1 needs you", "Test notification from mana-pulse-notify",
                    datetime.datetime.now().strftime("%H:%M"))
        log("test notification %s" % ("sent" if ok else "FAILED"))
        return
    today = datetime.date.today().isoformat()  # system clock = Lance's local tz
    try:
        with open(STATE) as f:
            state = json.load(f)
    except (OSError, ValueError):
        state = {}
    before = json.dumps(state, sort_keys=True)
    for kind in ("pulse", "daily"):
        check(kind, os.path.join(VAULT, kind, today + ".md"), state)
    if json.dumps(state, sort_keys=True) != before:
        os.makedirs(STATE_DIR, exist_ok=True)
        tmp = STATE + ".tmp"
        with open(tmp, "w") as f:
            json.dump(state, f, indent=1, sort_keys=True)
        os.replace(tmp, STATE)
    elif VERBOSE:
        log("no-op")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("ERROR " + traceback.format_exc().strip().replace("\n", " | "))
    sys.exit(0)
```

### launchd plist (`~/Library/LaunchAgents/io.lance.mana-pulse-notify.plist`)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>io.lance.mana-pulse-notify</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Users/lanceriedel/.local/bin/mana-pulse-notify</string>
  </array>
  <key>StartInterval</key>
  <integer>120</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>60</integer>
  <key>ProcessType</key>
  <string>Background</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>HOME</key>
    <string>/Users/lanceriedel</string>
    <key>PATH</key>
    <string>/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>StandardOutPath</key>
  <string>/Users/lanceriedel/Library/Logs/mana/pulse-notify.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/lanceriedel/Library/Logs/mana/pulse-notify.log</string>
</dict>
</plist>
```

## 3. Proof

### `mana-pulse-notify --once --verbose` against today's real files (first run, fresh state → notifies; second run → no-op)
```
== run 1 ==
2026-10-27 09:45:12 pulse: NOTIFY 3 item(s) | Brooklyn Doak, group DM with you, Antoine, Grady Karp (11:05 EDT) — asks whether Search will share…
2026-10-27 09:45:12 daily: NOTIFY 4 item(s) | mana/inbox/2026-10-27-daily-reply-javier-new-org-member — Did you book time with Javier / reach the…
rc=0
== run 2 ==
2026-10-27 09:45:12 pulse: unchanged (mtime 1793115512.2219641)
2026-10-27 09:45:12 daily: unchanged (mtime 1793115672.4374962)
2026-10-27 09:45:12 no-op
rc=0
```

### `mana-pulse-notify --test --verbose`
```
2026-10-27 09:45:12 test notification sent
rc=0
```

### Debounce / quiet-hour behaviour (run against a temp copy of today's pulse, notify stubbed; vault untouched)
```
-- a: first sight
pulse: NOTIFY 3 item(s) | Brooklyn Doak, group DM with you, Antoine, Grady Karp (11:05 EDT) — asks whether Search will share…
-- b: file rewritten, same 3 items + a new "Still open" bullet
pulse: changed, 3 Needs you item(s) unchanged -> no notify
-- c: rewritten as "Quiet hour. Nothing new needs you." + Still open
pulse: changed, Needs you empty -> no notify
-- d: rewritten with one new Needs-you item
pulse: NOTIFY 1 item(s) | Someone, DM — please decide by 3pm.
```

### `launchctl print gui/$(id -u)/io.lance.mana-pulse-notify | head -5`
```
gui/501/io.lance.mana-pulse-notify = {
	active count = 0
	path = /Users/lanceriedel/Library/LaunchAgents/io.lance.mana-pulse-notify.plist
	type = LaunchAgent
	state = not running
```
(further down: `program = /Users/lanceriedel/.local/bin/mana-pulse-notify`, `runs = 1`, `last exit code = 0`, `run interval = 120 seconds` — i.e. it ran once at load and exited cleanly.)

### State file after first run
```json
{
 "/Users/lanceriedel/Documents/mana/mana/radars/daily/2026-10-27.md": {"count": 4, "mtime": 1793115672.4374962, "needs_you_hash": "f488f81f…"},
 "/Users/lanceriedel/Documents/mana/mana/radars/pulse/2026-10-27.md": {"count": 3, "mtime": 1793115512.2219641, "needs_you_hash": "78e2896c…"}
}
```

## 4. Pause / resume / uninstall
```sh
# pause (unload until next login or manual bootstrap)
launchctl bootout gui/$(id -u)/io.lance.mana-pulse-notify
# resume
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/io.lance.mana-pulse-notify.plist
# force a run now
launchctl kickstart gui/$(id -u)/io.lance.mana-pulse-notify
# manual check / test
mana-pulse-notify --once --verbose
mana-pulse-notify --test
# uninstall completely
launchctl bootout gui/$(id -u)/io.lance.mana-pulse-notify
rm ~/Library/LaunchAgents/io.lance.mana-pulse-notify.plist ~/.local/bin/mana-pulse-notify
rm -rf ~/.local/state/mana-pulse-notify ~/Library/Logs/mana/pulse-notify.log
```
To reset the debounce (re-ping for current items): `rm ~/.local/state/mana-pulse-notify/last-seen.json`.

## 5. Gotchas
- **Notification permission.** `osascript` returned rc=0 for `--test`, but macOS only *displays* `display notification` banners if **Script Editor** (the bundle osascript notifies as) is allowed under *System Settings → Notifications*. If the test banner didn't appear, find "Script Editor" there and enable it (and check Focus/Do Not Disturb). When launched by launchd there is no interactive prompt, so grant it once from a terminal `--test`.
- **Daily radar heading differs.** The daily report uses `## Needs your input`, not `## Needs you`. The script matches any `## Needs you…` prefix (case-insensitive) so both work. Daily's items are Obsidian wikilinks; the body strips `[[…]]`/`[…](…)`/`#tags` for readability.
- **First-run burst.** On first load (or after deleting state) it will ping once per watched file that already has items today — that's expected; afterwards only a *changed* Needs-you set pings. Note: the hash covers the full bullet text, so if Mana rewords an existing item (e.g. adds "still unanswered") it will re-ping. Removing an item (set shrinks but is non-empty) also re-pings; acceptable as "state changed", but tweakable.
- **Timezone / date.** "Today" = `datetime.date.today()` from the laptop clock (Mountain right now). Pulse bodies mix EDT/MDT timestamps; the notification subtitle uses local clock time. After midnight the watcher simply starts looking for the new date's files; the old day's state entries remain in `last-seen.json` (harmless, tiny).
- **File not yet existing** (before 08:00 or on weekends) is a silent no-op (logged only with `--verbose`).
- **Polling latency** ≤ 120 s after a rewrite. Mana writes the file in one go, but if a partial write were ever observed the next poll (new mtime) re-evaluates and the hash guard prevents a duplicate ping.
- **Interpreter.** Uses `/usr/bin/python3` (3.9.6, Xcode CLT). If CLT is ever removed, launchd runs will fail with exit 126/127 — visible in `launchctl print … last exit code` — but `ThrottleInterval 60` prevents a hot crash loop.
- **No-op log noise.** Non-verbose runs log nothing unless a file changed, so the log only grows ~hourly.
- `--once` is accepted for clarity but the script is single-shot by design (launchd handles the interval), so it changes nothing.

DONE 002
