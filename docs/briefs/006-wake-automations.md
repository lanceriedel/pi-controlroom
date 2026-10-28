# 006 — wake-automations: `wake` / `watch-path` / `cancel` + the controller-prompting path

## Objective
Give the controller a way to schedule its own future rounds — *"A002 wakes me at 18:12; from that round I'll check whether 004 landed"* — and let selected automations **prompt the controller** (not just toast the human), with the guards the design specifies (opt-in per row, rate cap, blocked-controller retry, global kill switch). Builds on the tick and `AUTOMATIONS.md` shipped in 005.

## Memory that applies (verbatim; `controlroom memory` is the source)
- D002 **wakes-prompt-watches-dont** — `wake` rows prompt the controller by default; `watch` rows do not (human closes the loop) ← design §2.3
- D006 **thresholds-v1** — ≤ 6 controller prompts/hour; other thresholds as in design §10
- D008 **tick-runner-launchd** — tick runs under launchd; `--loop` is the Linux/manual fallback
- L001 **no-timeout-binary** — use `perl -e 'alarm N; exec @ARGV' --`
- L009 **worker-never-full-init** — never run full `controlroom init` from a worker pane; use `tick-install` / `init --memory-only`
- L011 **test-in-scratch-repo** — prove CLI behaviour in a `mktemp -d` scratch repo, not on live files
- L012 **agent-names-global** — herdr agent names are global across workspaces; **resolve the controller by pane id** (the tick plist knows the workspace; store the controller pane id in `AUTOMATIONS.md`'s header or `logs/.controller`), treat the name as a label

## Inputs — read first
1. `docs/design/durable-controlroom.md` **§2.2 (table), §2.3 (CLI + default prompt policy), §2.4 steps 5–6 (wake / watch-path firing), §2.5 (how an automation prompts the controller — literal text, blocked/working/rate-cap rules), §4 (held rows and `play` collapsing), §9 brief 006 row.**
2. `docs/briefs/results/005-tick-stuck-pause.md` — what 005 shipped, deviations (esp. #2 re-arm rule, heartbeat file), gotchas (controller pane had no name).
3. `bin/controlroom` — the `# ---- tick/health/pause (005) ----` block: `AUTOMATIONS.md` parser/writer, tick loop, `pause`/`play`. **Extend it; don't duplicate.** `wake`/`watch-path`/`dream` kinds are currently parsed-and-skipped.
4. `prompts/controller.md` — add the "when you set a wake, tell the human its ID and time" rule.
5. `herdr agent prompt --help`, `herdr agent wait --help`, `herdr agent list` (controller `agent_status` values) — read-only.

## Deliverables (code)
A. **CLI** per §2.3: `wake <when> "<instruction>" [--prompt|--no-prompt] [--repeat …]` (`<when>`: `15m | 2h | 18:12 | 2026-10-28T06:00 | "every 30m" | "daily 06:00" | "weekdays 06:00"`), `watch-path "<glob>" "<instruction>" [--prompt]`, `cancel A###`, `automations [--all]` (already exists — add `next: A002 in 25m` line and show `prompt` column). `wake` prints the two-line confirmation from §2.3 including the sentence the controller should say to the human.
B. **Tick** steps 5–6: wake rows fire when `now ≥ next` (recurring → compute next; once → `fired`); watch-path rows fire when newest mtime under the glob > `last_seen` (kept in `logs/.tick-state.json`) and is older than 120 s (debounce). Honour `held` while `logs/PAUSED` exists; on `play`, collapse all held `prompt?=yes` rows into **one** controller prompt.
C. **Prompting the controller** per §2.5: literal prompt text with `[A### · kind · fired n/… · time]` prefix and the Rules paragraph. Resolve the controller **by pane id** (L012): `init`/`tick-install` records `HERDR_PANE_ID` of the controller into `AUTOMATIONS.md`'s header line (`controller: wC:p1`) or `logs/.controller`; fall back to the name `controller` only if absent. Guards: controller `blocked` → Herdr rejects (`agent_blocked`) → row stays due, retried each tick, toast once after 30 min; controller `working` → still send (pi queues typed input as a follow-up) **but verify this live once** (see proofs); **rate cap ≤ 6 prompts/hour** across rows, excess waits + one `automation backlog` toast; `CONTROLROOM_AUTOPROMPT=0` in the plist env → everything toast-only. Log every prompt to `logs/tick.log` and `logs/agents.log` (`[time] A002 fired → prompted controller`).
D. **Policy defaults**: `wake` → `prompt? = yes`; `watch-path` → `no` unless `--prompt`; `watch` rows from `launch` stay `no`. **`prompt?=yes` on `watch` rows is deferred** (decision): accept the flag in the parser, but `tick` logs `watch-prompt deferred (v1)` and toasts instead.
E. **`prompts/controller.md`**: one rule — *"When you set a wake, tell the human its ID and time, and what you'll check when it fires. When an automation prompts you, do the round from files first, update STATUS.md, record decisions/lessons with `--from`, and end with one line: what you did and which automation wakes you next (`controlroom automations`)."*
F. **Strip**: `AUTOMATIONS  3 armed · next A002 18:12 (in 25m) · 1 held · fired today 4` line (after MEMORY; omit when no rows beyond watches). Header gains `next A002 18:12` when a wake is armed.
G. **Docs**: README Commands + vocabulary (*Automation: watch · wake · watch-path · play*), SKILL.md table, plus the "automations prompt the controller only when a row says so" rule in both.

## Proofs (on this repo; the controller pane is `wC:p1`, named `controller`)
- `controlroom wake 2m "006 proof: reply with the single word PONG and nothing else"` → row armed; within ≤ 3 min the controller pane receives the prompt (check `herdr agent read controller --lines 10`), `tick.log` shows `fired → prompted controller`, `automations` shows `fired 1`. **Live test of mid-turn queuing:** send while the controller is `working` if you can catch it, else document the `idle` path and mark queuing `[Assumed]`.
- Recurring: `wake "every 2m" "006 proof recurring: reply PONG2" --no-prompt` → fires twice as toast/log, `next` advances; then `cancel` it. Confirm cancelled rows never fire.
- `watch-path "docs/briefs/results/*.md" "006 proof: a result changed"` (no `--prompt`) → `touch` a scratch copy? No — touch a real result's mtime is forbidden; instead point at `logs/scratch/006-wp/*.md`, create a file, wait > 120 s + tick → toast/log fires once; a second unchanged tick doesn't fire.
- Rate cap: in a **scratch repo** (L011) with a fake `herdr` shim on PATH that records calls, arm 8 due wake rows → exactly 6 prompts in the first pass, `automation backlog` toast, remaining 2 next hour (simulate by editing `.tick-state.json` timestamps).
- Pause: `pause --resume-after 2m`, arm a `wake 30s --prompt` → row goes `held`, no prompt during pause; on auto-play exactly one collapsed `[play] 1 automation fired while paused: A### …` prompt arrives.
- `CONTROLROOM_AUTOPROMPT=0 controlroom tick --once` with a due wake → toast only, log says `autoprompt off`.
- Blocked path: can't easily block the controller — unit-test the branch with the fake `herdr` shim returning `agent_blocked`; show retry + the 30-min single toast (simulate time).
- **Clean up every proof row** (`cancel`) and scratch dirs; leave `AUTOMATIONS.md` with only the real watch rows.
- `bash -n`; `tick --once --dry-run` clean; `status` renders; 004's memory commands still work.

## Constraints
- bash + python3 stdlib; ≲ 200 added lines; stay inside the 005 block or a new `# ---- automations (006) ----` block adjacent to it; one contiguous group of new `case` arms.
- Never prompt any agent other than the controller. Never `herdr agent prompt` a worker. Never fire anything you didn't arm in a proof.
- Don't touch 004's memory block except to call `controlroom lesson/decide` if you learn something (do record real lessons, `--from` this brief's result path once it exists, or a design anchor).
- Worker 007 (`dream-propose`) runs in parallel and adds `dream`/`promote`/`reject` + `prompts/dream.md`; it does **not** touch the tick. If you need a `dream` automation kind, treat it as `wake` with a fixed instruction (`controlroom dream --reason <r>`) and leave the command itself to 007.
- No commits, no pushes. Deviations → results, with reasons.

## Where to write
`docs/briefs/results/006-wake-automations.md`: status · what changed (file:lines) · proof transcript (incl. the live PONG round-trip and the queuing verdict) · deviations · gotchas · any `decide`/`lesson` lines you recorded. Finish with the sentinel line `DONE 006` and go idle.
