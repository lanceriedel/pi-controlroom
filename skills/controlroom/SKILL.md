---
name: controlroom
description: Set up and operate a pi + Herdr control room (controller pi, worker pis, briefs/results files, live status strip, tick/watch rows, pause). Use when the user says control room, controller, /controller, launch a worker, brief, status board, or asks to parallelize agent work in Herdr.
---

# controlroom

Requires: Herdr (`HERDR_ENV=1` inside a Herdr pane), pi, python3, bash. macOS or Linux.

## Install the CLI once per machine
The scripts live in this skill's `bin/`. Put them on PATH (idempotent):

```bash
mkdir -p ~/.local/bin && cp "$(dirname "$SKILL_PATH")/bin/controlroom" "$(dirname "$SKILL_PATH")/bin/controlroom-pager" ~/.local/bin/ && chmod +x ~/.local/bin/controlroom ~/.local/bin/controlroom-pager
```
(If `$SKILL_PATH` is not set, resolve `bin/` relative to this SKILL.md.) Verify with `controlroom` (prints usage).

Optional Herdr config (`~/.config/herdr/config.toml`): `[ui.toast] delivery = "herdr"`, and a key for the detail toggle:
```toml
[[keys.command]]
key = "prefix+d"
type = "shell"
command = "controlroom detail"
```

## Commands
| command | does |
|---|---|
| `controlroom init [--rows N]` | rename this agent → `controller`, tab → `CONTROLLER`, add live status strip pane below, scaffold `docs/briefs/{README,STATUS}.md` + `results/` |
| `controlroom launch <name> <brief.md> ["tab label"] [--force]` | new tab → start pi → prompt it with the brief → `watch <name>` row armed in `docs/briefs/AUTOMATIONS.md` (the tick fires it; survives restarts); exit 3 while paused unless `--force` |
| `controlroom tick [--once] [--dry-run] [--loop]` | the 60 s reconciler launchd runs (`init` installs it): verify armed watch rows → toast/log → `fired`; re-arm rows for `working` board workers; `health` for working agents; auto-`play`. `--dry-run` shows actions only |
| `controlroom health [--json] [<agent>…]` / `automations` | last write · session quiet · `$` · tokens · ctx % · red `stuck?` (no write 20 m ∧ quiet session 10 m ∧ pane tail unchanged → 1 toast/h) · yellow `spinning?` (30 m, tokens burning) / the automations table |
| `controlroom wake <when> "<instr>" [--prompt\|--no-prompt] [--repeat "every 30m"]` | arm a `wake` row (`15m` \| `18:12` \| `2026-10-28T06:00` \| `"every 30m"` \| `"daily 06:00"` \| `"weekdays 06:00"`); when due the tick **prompts the controller** (default) or toasts; prints the sentence to say to the human ("A002 wakes me at 18:12; from that round I'll …") |
| `controlroom watch-path "<glob>" "<instr>" [--prompt]` / `cancel A###` / `automations [--all]` | toast (or prompt) when a newer file (≥ 120 s old) lands under the glob / cancel a row / table + `next: A### in Nm`. **Never delete ledger rows by hand — `cancel` them** (ids are monotonic; `cancel --prune-fired` is the only remover). `touch logs/AUTOPROMPT-OFF` = per-room kill switch |
| `controlroom resume <agent> [note]` / `resume-stalled` / `retire <agent> [why]` / `gc [--hours N] [--apply]` / `land [--help]` | re-prompt + re-arm / all crashed·stalled / close a worker tab (session resumable) / retire idle workers / move done rows to `## Landed` |
| `controlroom pause [--resume-after Nm] [reason]` / `play` | `logs/PAUSED`: no new launches, workers drain, header yellow; the tick plays automatically when the time passes |
| `controlroom tick-install` / `tick-uninstall` | launchd unit `~/.config/controlroom/launchd/io.controlroom.tick.<hash8>.plist` (idempotent); on Linux `tick --loop` runs beside the strip |
| `controlroom watch <agent…>` / `watch-log <log> <label>` | manual watcher (kept): log to `logs/agents.log` + toast when agents finish/block or pipelines end |
| `controlroom status` / `statusbar` / `detail` | one-shot board / the pager strip (scroll-safe, refreshes after 15 s idle) / toggle detail |
| `controlroom decide "…" --from <src>` / `lesson "…" --from <src>` | append `D###` / `L###` to `docs/briefs/memory/{DECISIONS,LESSONS}.md` — **no source, no line** (`<src>` = repo path[`#anchor`\|`:"phrase"`] or `chat:<ts>`) |
| `controlroom memory [--counts\|--decisions\|--lessons\|--unsourced]` | what a booting controller reads: counts + active lines (≤ 70); `⚠ over budget` past 40 D / 30 L |
| `controlroom supersede <ID> <byID>` / `land` | strike + archive a line / move `done` workers to `## Landed` and drop struck decisions from the board |
| `controlroom dream [--reason r] [--since ISO\|Nd] [--here]` | propose-only consolidation, on demand: render `prompts/dream.md` → `memory/.dream-brief.md`, launch a `dreamer-N` worker that reads files only and appends `P###` lines to `memory/proposed.md` + a report in `memory/dreams/`; `--here` prints the prompt instead |
| `controlroom dream --check` | no LLM: every `← source` in the newest report + `proposed.md` resolves (path, `#anchor`, `:"phrase"`), `DONE dream`, `## Proposed (N)` matches, no dup slug, ≤ 10; warns when guarded files moved → `dream ok: …` in `agents.log` or a list + toast (rc 1) |
| `controlroom promote P###… \| --all [--kind D\|L]` / `reject P### [why]` | P-line → real `D`/`L` line via `decide`/`lesson` (`[D]`/`[L]` tag at the start of the one-liner picks the file; struck `promoted-as D010`; dup slug refused) / strike `rejected: why` + copy to `memory/archive/` |
| `controlroom event <kind> [arg]` / `/flush` | log an extension/tick event to `logs/agents.log` (`flush-requested <pct>` → marker + one toast; `compaction <tokensBefore>` → `logs/.compactions`; `ext-error <msg>`) / in the controller's pi: request the memory flush now |

## Protocol (the part that matters)
- **Controller never does >5-minute work.** It writes a brief (`docs/briefs/NNN-slug.md`: objective · inputs with paths · constraints · deliverable · where to write) and launches a worker.
- **Files are the protocol**: brief in, `docs/briefs/results/<same>.md` out. Chat is ephemeral; a fresh session can pick up from the files.
- **Board**: `docs/briefs/STATUS.md` — workers table, decisions waiting on the human. Update on every launch/integration.
- **Boot from files** (every controller start/resume): STATUS.md → `controlroom memory` → `tail -20 logs/agents.log` → `herdr agent list` + `controlroom verify` → unintegrated `results/`. Then two lines to the human.
- **Memory**: every brief's Constraints section starts with the applicable `D###`/`L###` lines copied verbatim from `controlroom memory`. Record decisions/lessons as they happen (`controlroom decide|lesson … --from <file>`); `controlroom land` after integrating.
- **Pipelines** (long deterministic jobs): own Herdr tab, `logs/<name>.log` with `START` / `END … rc=<n>` markers, wrapped in `caffeinate -i` on macOS; scratch logs in `logs/scratch/`.
- Decisions serial (one question to the human), execution parallel. Reuse warm idle workers via `herdr agent prompt <name>`. Only **blocked** needs a human.
- **Time-box local compute in briefs** (e.g. `timeout 600 …` / a `--max-seconds` flag). A worker once blocked 26 h on one graph-algorithm call at 98% CPU: no writes, no progress, no alarm — the status strip showed `working`. Prefer pruned inputs + a bounded first pass + partial outputs.
- Hidden pi subagents die after ~3 min without output — use Herdr panes for read-heavy tasks.
- **Automation (watch row)** = a row in `AUTOMATIONS.md` the tick fires; **Pause** = `logs/PAUSED` exists → nothing launches, in-flight work drains. When a worker shows `stuck?`, look at its pane before resuming — it is the 26 h failure mode. **Automations prompt the controller only when a row says so**: `wake` rows yes by default, `watch`/`watch-path` rows no (`--prompt` opts in; deferred on `watch`). Prompts go to the controller by pane id (`logs/.controller`), ≤ 6/hour, retried while it is `blocked`, held during a pause and collapsed into one `[play] …` prompt on play; `CONTROLROOM_AUTOPROMPT=0` = toast-only. The controller tells the human the ID and time of every wake it sets.
- **Compaction flush.** At 75 % context the controller is asked to flush decisions/lessons to memory (`controlroom memory` → `decide`/`lesson --from …` for what is missing → STATUS.md → note the next wake), then reply `/compact` on a line of its own — the extension runs the compaction; `/flush` does it on demand. Without the extension the tick sends the same request as `flush` / `post-compaction` rows. Record only what you can cite from files, never from the summary alone.
- **Dream is on demand.** Schedule it only after the human has read three reports and said they were useful. The dreamer never edits DECISIONS/LESSONS/STATUS/results; run `controlroom dream --check` when it says DONE, then `promote`/`reject` each P-line by hand.
- End each check-in with a one-line reminder of where the controller is and how to use agents.

## Gotchas learned
the `herdr` CLI works from a launchd job with only `HOME` + `PATH` (socket is `~/.config/herdr/herdr.sock`) · `herdr agent rename` can be lost after a Herdr restart (`health controller` → `missing`) · `herdr pane split --ratio` applies to the original pane · `herdr agent list` names are in `name` · piping JSON into `python3 - <<EOF` loses stdin (use an env var) · prompt-template frontmatter values containing `: ` must be quoted or pi skips the template silently · `/reload` picks up new templates in a running pi.
