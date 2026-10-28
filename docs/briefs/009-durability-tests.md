# 009 — durability-tests: scenario tests of the durable control room against the failure modes it claims to survive

## Objective
We shipped five slices (004–008) that claim a control room now survives: a controller crash/restart, a Herdr or laptop restart, a worker that silently stops making progress, a human walking away (pause/drain), context compaction, and a second control room on the same machine. **Test those claims as scenarios, not unit tests.** Each scenario: set up the failure, let the system react on its own, record what actually happened with evidence (log lines, file diffs, `herdr agent read` output), and grade it **pass / partial / fail** with one sentence why. The point is to find what breaks before 0.2.0 is committed — a fail is a good result.

## Memory that applies (verbatim; `controlroom memory` is the source)
- D008 **tick-runner-launchd** · D009 **stuck-thresholds-kept** (20 m / 10 m / 30 m) · D015 **controller-by-pane-id** · D016 **flush-guard-marker**
- L001 **no-timeout-binary** — `perl -e 'alarm N; exec @ARGV' --`
- L009 **worker-never-full-init** — full `controlroom init` renames the *caller's* pane; never from a worker pane in the live room
- L011 **test-in-scratch-repo** — destructive tests in a `mktemp -d` + `git init` scratch repo
- L012 **agent-names-global** — two control rooms can't both have an agent named `controller`
- L019 **llm-cannot-slash** — wakes can't make the controller run `/reload` `/flush` `/compact`; `herdr agent prompt <pane> "/cmd"` pastes keystrokes and *can*
- L020 **ctx-window-from-models-store** — `~/.local/bin/controlroom` is a symlink to this repo: **every save is live within 60 s**; run `tick --dry-run` before changing anything the tick reads

## Inputs
- `docs/design/durable-controlroom.md` (the claims), `docs/briefs/results/00[45678]-*.md` (what shipped + each worker's own proofs — **don't repeat those**; go after what they marked `[Assumed]`, "untested live", or "blocked on the human").
- `bin/controlroom`, `extensions/controlroom.ts`, `prompts/controller.md`, `docs/briefs/AUTOMATIONS.md`, `logs/tick.log`, `logs/agents.log`, `logs/.tick-state.json`.
- Live control room: workspace `wC`, controller pane `wC:p1` (agent `controller`), status pane `wC:p2`, tick unit `io.controlroom.tick.cc496e1e`. **Read-only on `wC:p1` except where a scenario says otherwise.**
- Herdr CLI: `herdr --help`, `herdr workspace --help`, `herdr tab --help`, `herdr agent --help` — you may create a **new Herdr workspace** for the scratch control room (`herdr workspace new`/`create` — check the help) so names and ticks don't collide.

## Scenarios (run in this order; time-box each; stop a scenario at its cap and grade `partial`)
| # | claim under test | setup | expected | cap |
|---|---|---|---|---|
| S1 | **Fresh controller boots from files** (the #1 pain) | Scratch control room in a **new Herdr workspace**: copy this repo's `docs/briefs/`, `logs/`, `bin/`, `prompts/`, `skills/`, `extensions/`, `package.json` into `mktemp -d`; `git init`; in a new tab there start `pi`, run `/controller "scratch: boot test"` → it runs `init` (renames *that* pane — fine, it's the scratch room; name will collide with `controller` (L012) → observe what `init` does, grade that too). Then ask it (via `herdr agent prompt <pane>`) "where are we?" | Its first reply cites STATUS.md rows, memory counts, last log lines, automations, and names the next wake — without being told any of it | 20 min |
| S2 | **Tick survives restart & re-arms** | In the scratch room: arm 2 watch rows + 1 wake (10 m); `launchctl bootout` the scratch tick unit; delete `logs/.tick-state.json`; `tick-install` again | Rows still there, watches re-verified, wake fires on time, no duplicate rows, `TICK` indicator recovers | 15 min |
| S3 | **`stuck?` fires on a real silent worker** | In the **live** room (safe: it's one extra tab): `controlroom launch stuck-probe docs/briefs/scratch-009-stuck.md` where that brief tells the worker to run exactly one command: `perl -e 'alarm 1500; exec @ARGV' -- sleep 1500` and nothing else (write the brief under `logs/scratch/`, not `docs/briefs/`). Start a timer. | Red `stuck?` on the strip and one toast + `agents.log` line at **20–21 min**, not before (no false positive at 10/15), not after 25. Then `controlroom retire stuck-probe` | 26 min — **run this one in the background while doing S4–S6** |
| S4 | **Pause drains, holds, collapses** | Live room: `pause --resume-after 4m "009 S4"`; arm `wake 1m "009 S4 held: reply HELD-OK" --prompt`; try `controlroom launch x y` | launch refused rc=3; row `held`; strip header yellow; at +4 m auto-play, **one** collapsed `[play]` prompt reaches `wC:p1`; controller replies HELD-OK; `tick.log` shows the sequence | 8 min |
| S5 | **Mid-turn queuing** ([Assumed] in 006) | Live room: get the controller `working` (prompt it via a wake with a 2-minute task: "009 S5: run `controlroom memory` and summarize the 3 newest lessons in ≤ 5 lines") and, ~20 s later, arm `wake 0m "009 S5b: reply QUEUED-OK"` so the tick sends while it's working | Controller finishes S5 then answers QUEUED-OK (queued), rather than dropping or interleaving. Record `herdr agent read controller` | 6 min |
| S6 | **Compaction flush loop** (blocked on human in 008) | Live room, with explicit permission (this brief is that permission): `herdr agent prompt wC:p1 "/reload"`, wait for *extension active* toast/log, then `herdr agent prompt wC:p1 "/flush"` | Flush prompt arrives; controller records to memory / updates STATUS / replies `/compact`; extension compacts; `agents.log` `compaction — #1 tokensBefore=…`; **after** compaction, prompt "where are we?" and check the Boot re-read happened (cites memory counts, automations) | 10 min |
| S7 | **Second control room on one machine** | From S1's scratch room: `controlroom status`, `automations`, `health` — confirm they see only *their* workspace's agents; both tick units loaded (`launchctl list \| grep io.controlroom`), separate `tick.log`s; the live room's board untouched (diff STATUS.md before/after) | Isolation holds; the only collision is the agent name (L012) — document exactly how `init` behaved | 10 min |
| S8 | **Dream after a batch** | Scratch room: `controlroom dream --reason "009 batch"` with ≥ 3 result files in window → `dream --check` → `promote` one, `reject` one | `dream ok`, P-lines cite real paths, promote creates D/L with same source, strip counts update | 12 min |
| S9 | **Kill switch & rate cap in the live tick** | Live room: `CONTROLROOM_AUTOPROMPT=0` is in the plist env? Check how to toggle without editing the plist (document). Arm 7 `--prompt` wakes at `0m` in the **scratch** room instead (avoid spamming the live controller) | ≤ 6 prompts, `automation backlog` toast, 7th next hour; with autoprompt off → all toasts | 8 min |
| S10 | **Herdr restart** — *do not do this* (would kill every workspace). Instead: read `herdr --help` for a per-workspace or per-pane reload; if none, grade **untested** and say what would need to happen | — | 5 min |

## Constraints
- **Never** edit `bin/controlroom`, the extension, prompts, or the live `AUTOMATIONS.md` by hand. Use only the CLI. If you find a bug, **don't fix it** — record it with a reproduction; the controller will brief the fix.
- Clean up: retire/cancel every probe row and agent you created; `launchctl bootout` the scratch tick unit; remove the scratch workspace (or leave it closed and say so). The live `AUTOMATIONS.md` ends with real rows only; `logs/agents.log` keeps your scenario lines (they're evidence).
- Everything that can hang is wrapped in `perl -e 'alarm N; exec @ARGV' --`. S3 is the only long wait and runs in the background.
- Record `decide`/`lesson` lines only for things you *verified*, `--from` this result's path or a log line.

## Deliverable
`docs/briefs/results/009-durability-tests.md`: a **scorecard table** (S1–S10 · claim · pass/partial/fail/untested · one-sentence why · evidence pointer), then one section per scenario with the trimmed transcript, then **Bugs found** (numbered, each with repro + severity), then **What I'd test next**. Finish with the sentinel line `DONE 009` and go idle.
