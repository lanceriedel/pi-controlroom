# 012 — close-the-loop: fix what 009/010/011 found, so 0.2.0 is safe to commit and the controller survives on its own

## Objective
Three verification workers graded the durable control room: scenario tests (009: 7 pass · 1 partial · **1 FAIL** · 9 bugs), the Tobi scorecard (010: gap = *the controller's own continuity*), and a code review (011: **not safe to commit** — 3 blockers in the AUTOMATIONS ledger). Fix them in severity order, in one worker (every fix touches `bin/controlroom`), and prove each fix with the test that found it. D018 is the list; this brief is the order.

## Memory that applies (verbatim; `controlroom memory` is the source)
- L001 `perl -e 'alarm N; exec @ARGV' --` · L009 never full `init` from a worker pane · L011 scratch repo · L012 agent names are global · L019 llm-cannot-slash · **L020 the CLI is symlinked and live within 60 s — `tick --dry-run` before saving anything the tick reads; bad saves hit the live room** · L021/L006 write partial results early · L024 flush-below-75-never-compacts · L025 cache-warm-defeats-stuck · L026 autoprompt-launchctl-setenv · L028 a lesson asserting a mechanism needs a log line from that mechanism
- D009 stuck thresholds 20/10/30 kept · D015 controller by pane id · D016 flush guard marker · D018 close-the-loop-before-commit

## Inputs (read in this order)
1. `docs/briefs/results/011-code-review.md` — findings #1–#23 with `file:line` and suggested fixes.
2. `docs/briefs/results/009-durability-tests.md` — scorecard, §S3 / §S6 transcripts, **Bugs found 1–9**, "What I'd test next", `logs/scratch/009-stuck.md` (S3 repro), `logs/scratch/009-scratch/` (evidence).
3. `docs/briefs/results/010-tobi-scorecard.md` §3–§4 (the gap) and the four-point "next brief" paragraph.
4. `docs/design/durable-controlroom.md` §2 (tick), §4 (automations), §7 (compaction); `bin/controlroom`; `extensions/controlroom.ts`; `prompts/controller.md`.

## Work, in order (stop and write partial results if you run past 90 min)
**Tier 1 — ledger blockers (011 #1–#3)**
- Monotonic `next_id` in `.tick-state.json`, seeded from max(AUTOMATIONS.md ∪ tick.log ∪ agents.log) so **A023+** is the next id and nothing already in a log is ever reused. SKILL/README: "never delete rows; `cancel`".
- One `with_lock()` (the existing `.tick.lock` mkdir, retry ≤ 10 s, stale > 300 s with the #12 try/rmdir fix) around **every** load→save of AUTOMATIONS.md — tick, `launch`/`resume` arm, `wake`, `watch-path`, `cancel`, `pause`, `play`, `dream`.
- `load_autos` keeps unparseable lines verbatim (pre/post blocks), logs `tick: skipped N unparseable rows` once, escapes `|` in instructions as `\|`.

**Tier 2 — prompt path & detector (011 #4–#7, 009 bugs 2–3, 011 #14–#15)**
- `[play]` collapse: non-`ok` from `prompt_controller` leaves rows `held`/`armed` (same bookkeeping as `fire_auto`'s `waiting`).
- `controller()` returns `fail` → treat as `blocked` (retry each tick, toast once after 30 min); refuse a pane whose agent name is set and ≠ `*controller`.
- `flush`/`post-compaction` bypass the 6/h cap (or own budget of 2/h).
- `watch` on `blocked`/`stalled`: toast with per-row dedupe, stay `armed`; fire only on `done`/`crashed`/GONE.
- **`stuck?` (009 bug 2, the FAIL):** `health()` must ignore `usage`/`cache_warm` jsonl entries when computing "session quiet" — parse the last *non-usage* entry's timestamp (or track mtime of the last tool/assistant entry), keep D009 thresholds. Prove with the S3 repro: `controlroom launch stuck-probe logs/scratch/009-stuck.md` in the live room, poll `health` every 60 s in the background (`caffeinate -i`), expect `stuck?` at **20–21 min**; retire the probe after. Start this first — it runs while you do the rest.
- **Extension (009 bug 3 / 011 #14):** don't reset `requested` below the threshold when the request was *manual* (`/flush`); clear `requested` only after triggering compaction or on the next crossing; accept `/^\s*`?\/compact`?\.?\s*$/m`; touch `.ext-alive` in `turn_end` and have `comp_step` require mtime < 30 min (011 #15); tick (009 bug 4) must not remove a marker whose source is `ext` while a manual request is pending. Prove in a scratch pi with `HERDR_ENV=1 HERDR_PANE_ID=<ctl> pi -p` the way 008 did, **and** live: ask the controller via `controlroom wake 0m "012 proof: Lance or the worker will type /flush; reply with memory counts then /compact on its own line" --prompt` after typing `/flush` into `wC:p1` with `herdr agent prompt wC:p1 "/flush"` (allowed by this brief; 009 did it). Expect `agents.log` `compaction — #2` *without* anyone typing `/compact`, then the `post-compaction` wake.

**Tier 3 — continuity (010 §4, 009 bug 1, 011 #8)**
- `init`: surface the `agent_name_taken` error and offer `controller-<workspace>` as the name; never fall back by name in `tick_install` when `logs/.controller` exists.
- Extension gate: also require that `.ext-alive` is written by the pane's own pi — write `pid` and have `comp_step` check that pid is alive **and** is a `pi` whose cwd is ROOT (`lsof -p` or `ps -o command=`); a subagent inheriting `HERDR_PANE_ID` must not pass. Leave `HERDR_PANE_ID` gating in place as well.
- **Boot arms a round wake:** add to `prompts/controller.md` Boot: "if `controlroom automations` shows no armed `wake`, arm `wake 2h 'round: integrate DONE workers, land, update STATUS, re-arm this wake'`" and make `init` arm it once. This turns "A29 wakes me" into behaviour.
- `--from` validation: lift `check_src` from the dream block into a shared helper used by `decide`/`lesson`; require a file under ROOT; reject `\n`/`|` in text; `chat:` allowed only with `--chat-ok`.
- `land`: always archive struck decisions; warn about D/L lines citing `STATUS.md:"…"` before rewriting.

**Tier 4 — if time remains (011 #10–#13, #16–#23; 009 bugs 5–7):** health brief regex, `.health.json` pruning + incremental jsonl parse + `tick.log` out of PIPELINES, `strip` quoting (#13), `set -u` usage messages, docs drift (README/SKILL/help/AUTOMATIONS preamble/`controller.md` "only wake rows prompt you"), file-flag kill switch `logs/AUTOPROMPT-OFF` read by tick **and** strip, cap derived from `agents.log` when state is empty.

## Constraints
- bash 3.2 + python3 stdlib. Keep the `(004)…(008)` block markers; mark your lines `(012)`. `bin/controlroom` may grow ≤ 150 lines net; refactor duplicates (three STATUS parsers → one `board()`) only if it *removes* lines.
- Every save of `bin/controlroom`: `bash -n`, then `controlroom tick --once --dry-run` **before the next launchd minute**. If a save would change what the tick does to the live room, do it in a scratch copy first (L011) and port.
- Don't `pause`/`init` the live room. The live controller `wC:p1` may be prompted only via `controlroom wake … --prompt` and the one `/flush` keystroke above.
- Prune the inert 009 probe rows A017–A022 **only via a new `cancel --prune-fired` flag** if you add one (then it's CLI, not hand-editing); otherwise leave them.
- No commits. Record `decide`/`lesson` lines for anything verified, `--from` this result or a log line (L028: mechanism claims need a log line).

## Deliverable
`docs/briefs/results/012-close-the-loop.md`: a table **finding → fix (`file:line`) → proof (command + evidence) → status**, covering every 011 #1–#9 and 009 bugs 1–4 at minimum; re-graded 009 scorecard rows S3, S6 (and S1 for the init message); trimmed proof transcript; deviations; "still open" list for 0.2.1; sentinel `DONE 012`; then go idle. Write the table skeleton in the first 10 minutes and fill it as you go.
