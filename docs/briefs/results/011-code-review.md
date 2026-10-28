# 011 — code-review · Status: DONE (2026-10-27, read-only; nothing in `bin/controlroom` was edited)

Scope covered: full read of `bin/controlroom` (1030 lines, `bash -n` ok, no shellcheck on this Mac), `extensions/controlroom.ts` vs pi 1.4.0 docs/types, `prompts/{controller,dream}.md`, README/SKILL command tables, worker results 004–008, live `logs/*` and `AUTOMATIONS.md`, plus `--from` probes in a mktemp scratch repo (L011). Ran only `tick --once --dry-run`, `automations`, `memory`. Evidence lines cited as `file:line`.

## Blockers

1. **AUTOMATIONS row IDs are recycled — state and logs now point at the wrong rows.** `bin/controlroom:188` `add_row` uses `max(existing)+1`; the 006 worker deleted proof rows A007–A009/A012–A014 by hand (results/006 "Cleanup", claims "IDs stay stable"). They were not: `logs/tick.log:21` says `A013 wake fired → prompted controller` at 14:25 while `AUTOMATIONS.md` now has `A013 = watch durability-tests` and `A012/A014` are watch rows too. `.tick-state.json` keys `wp/blocked/waiting/blocked_toast` are per-ID, so a recycled ID inherits another row's debounce/blocked state. **Fix:** keep a monotonic `next_id` in `.tick-state.json` (seed = max over AUTOMATIONS.md ∪ tick.log ∪ agents.log) and have `add_row` use it; tell SKILL "never delete rows, only cancel".

2. **Lost-update race on `AUTOMATIONS.md`: CLI writers don't take the tick lock.** `load_autos`/`save_autos` (`:176`,`:185`) do read→modify→whole-file-rewrite; `launch`/`resume` (`cr5 auto arm` `:471`), `wake`, `watch-path`, `cancel`, `pause`, `play` all do this unlocked while the launchd tick (`:363`) does the same every 60 s and can take seconds (`lib verify` per agent, 20 s timeouts). A `launch` landing mid-tick silently loses either the new watch row or the tick's state changes. The 006 gotcha "rows vanished between wake calls" is this race, not just fake-herdr. **Fix:** one `with_lock()` (same `.tick.lock` mkdir, retry ≤10 s) around every load→save, tick included; or make CLI arms append an "intent" line the tick applies.

3. **`load_autos` + `save_autos` silently destroy anything it doesn't parse.** `:176-186`: rows with <9 cells, an instruction containing `|` (rewritten to `/` — e.g. the `prompt|…` help text), or any text *below* the table are dropped on the next rewrite; a hand-edited row vanishes within 60 s with no log line. **Fix:** keep unparsed lines verbatim (store them in `pre`/`post`), log `tick: skipped N unparseable rows`, escape `|` as `\|`.

## Should-fix

4. **`[play]` collapse loses the prompt when the controller is blocked / over the cap.** `:398-404`: `prompt_controller("play",…)` may return `blocked`/`backlog`/`fail`, but every held row is still `advance(r)`'d → rows marked fired, controller only ever gets a toast. `fire_auto` (`:383-387`) correctly keeps the row due; the two paths disagree. **Fix:** on non-`ok` leave rows `held` (or back to `armed`), reuse the `waiting` bookkeeping.

5. **Wakes are consumed as toasts when the controller can't be found.** `:251` returns `fail` → `:390` advances the row. With a stale `logs/.controller` after a Herdr restart (L010/L012) and an unnamed controller pane (005 gotcha), every due wake is silently spent. **Fix:** treat `fail` like `blocked` (retry each tick, toast once after 30 min), and have `controller()` (`:240`) refuse a pane whose agent name is set and ≠ `*controller` — a recycled pane id must never prompt a worker.

6. **Rate cap starves the flush.** `:247`: `flush`/`post-compaction` rows share the 6/h `prompts` cap with ordinary wakes, so an 80 % controller can be told "backlog" exactly when it must flush before overflow. **Fix:** bypass (or separate budget for) `kind in (flush, post-compaction)`.

7. **`watch` rows fire once on `blocked` and never re-arm → the later DONE is missed.** `:420`: `blocked` → `fire()`; step 4 re-arm (`:439`) is blocked by the fired row. Only an explicit `resume` restores watching. **Fix:** on `blocked`/`stalled` toast with a per-row dedupe (`st["toasted"][id]=status`) and keep the row `armed`; fire only on `done`/`crashed`/GONE.

8. **`--from` validation is a formality — all six bypasses pass** (scratch-repo probe): a directory (`--from docs`), an absolute path outside the repo (`/etc/hosts`), a dead `#anchor`, a dead `:"phrase"`, `chat:anything`, and a one-liner containing `\n` (writes two lines, the second an unparseable `line2 ← fake`). `:624-631` only checks `exists()` of the path prefix (also relative to *cwd*, not just ROOT). Meanwhile `dream_py.check_src` (`:744-752`) has the real validator, so `decide` accepts what `dream --check` later flags. **Fix:** lift `check_src` into a shared helper (or shell out to it), require `isfile` under ROOT, reject `\n`/`|` in text, and age/limit `chat:` sources per design [A].

9. **`land` orphans citations and can lose text.** `:716`: dropped struck decisions are archived only `if os.path.isdir(mem)`; without memory/ the text is gone. With memory/, D-lines that cite `STATUS.md:"phrase"` go dead after `land` (dream `--check` will fail them) and nothing re-points them. **Fix:** always archive; print `⚠ D0xx cites STATUS.md — re-point to memory/archive/YYYY-MM.md` by grepping DECISIONS/LESSONS for `STATUS.md` before rewriting.

10. **Health "last write" ignores result files for every row on the current board.** `:337`: `brief[:3].isdigit()` — board cells are `011-code-review` (ok) but `launch` writes `docs/briefs/…` paths in some rooms and `dream` rows have `.dream-brief` → only the agent-name key is used, so a worker writing `results/009-stuck.md` under a different agent name looks stuck. **Fix:** `re.search(r"\d{3}", brief)`.

11. **Unbounded growth / re-parse cost.** `.health.json` `sessions` + `agents` (`:311`, already 16 entries incl. retired workers) are never pruned; `tick.log` is both launchd stdout and the action log with no rotation, and `status_text` lists it as a PIPELINE (`:98` only excludes `agents`); `.tick-state.json` `wp/blocked/waiting` keep IDs of cancelled rows. `parse_session` (`:314`) re-reads the whole controller JSONL on every size change — a 1 M-context controller session means MBs per minute at 98 % of one core (cf. L005). **Fix:** prune cache entries for agents absent >24 h; incremental parse from a cached byte offset; exclude `tick.log` from PIPELINES; rotate at 1 MB.

12. **Stale-lock race throws.** `:366`: two ticks both see a >300 s lock, both `rmdir` → second gets `FileNotFoundError` traceback into tick.log (and `play`'s inline `tick()` can be that second caller). **Fix:** wrap `rmdir` in `try`, then retry `mkdir` once.

13. **Shell injection via agent names in the strip.** `status_text` `:78` interpolates the herdr agent name into `bash -c "… verify \"{n}\""`; `lib()` (`:159`) already does it right with `"$@"`. Also `strip-restart` `:935` embeds `$ROOT` in single quotes (breaks on `'`), and the launchd plist (`:570`) interpolates ROOT into XML with no escaping (`&`). Low likelihood, trivial fixes.

14. **Extension: the `/compact`-on-reply trigger is fragile.** `extensions/controlroom.ts:38`: requires a bare `/compact` line; the LLM's typical reply is `` `/compact` `` (backticked) or "Then reply /compact." → no compaction, no retry, and `requested` stays true until ctx drops, so *any later* turn with a bare `/compact` line (e.g. the controller quoting the flush text) compacts. Event names/APIs check out against 1.4.0 (`turn_end` → `e.message: AgentMessage`, `session_before_compact.preparation.tokensBefore`, `sendUserMessage` with `deliverAs` required while busy — correct). **Fix:** accept `/^\s*`?\/compact`?\.?\s*$/m`, clear `requested` after triggering, and add a 2-turn retry ("you said you'd compact") instead of waiting for the human.

15. **Extension heartbeat is one-shot.** `.ext-alive` is written only at `session_start` (`:30`); if the extension errors out later (every handler is `guard`ed, so silently) the tick still believes `alive` and never arms the fallback flush row. **Fix:** touch `.ext-alive` in `turn_end` too and have `comp_step` require mtime < 30 min old.

## Nits

16. `set -u` crashes with usage-less tracebacks: `cancel` with no arg → `IndexError` (`:508`); `pause --resume-after ""` (`:521`); `watch-log` (`:945`), `lastline`, `verify` with no arg → "unbound variable"; `init --no-seed --rows 5` ignores `--rows` (only honoured as `$1`).
17. `row_age` (`:191`) builds `f"{year}-{MM-DD}"` → `ValueError` on Feb 29 in a non-leap year; wrap in try.
18. `watch-path` text (`:430`) and every wake instruction are sent to the LLM verbatim — fine by design, but a filename is an injection vector; prefix the changed path with a literal `path:`.
19. Three STATUS.md parsers (`:62` any table, `:165` Workers only, `:690` land) — `status_text` picks up the Landed/Retired tables' second column as "tasks". Share `board()`.
20. `event compaction` writes `.compactions` non-atomically (`:269`); heartbeat `:444` likewise (harmless).
21. Multiple overdue wakes after sleep fire as N separate prompts in one pass (up to the cap); collapse like `[play]`.
22. Docs drift: README table lacks `resume-stalled`, `strip-restart`, `lastline`, `detail-on/off`; SKILL table lacks `resume`, `retire`, `gc`, `land --help`; the on-disk `AUTOMATIONS.md` preamble predates the `flush`/`post-compaction` kinds (HDR is only used on first create); help header (`:2-21`) omits `verify`, `resume`, `resume-stalled`, `strip-restart`, `detail`. `prompts/controller.md` still says "Only `wake` rows prompt you" — `flush`/`post-compaction`/`dream` rows do too.
23. `tick_install` (`:565-575`) never checks that `$HOME/.local/bin/controlroom` exists; if installed elsewhere launchd fails every 60 s into tick.log with no strip signal beyond "TICK not running".

## Verdict
**Not safe to commit as-is**: #1–#3 mean the ledger that everything else keys off can lose rows and recycle IDs under normal use (any `launch` during a tick).
**Fix first:** monotonic IDs (#1), one lock around every AUTOMATIONS.md load→save (#2), preserve-unparsed rows (#3); then #4–#7 (prompt-path consistency) and #8 (`--from`), which are each <20 lines.
Everything else can follow in 0.2.1; the extension is correct against pi 1.4.0 and fail-safe, only its trigger regex (#14) needs tightening before relying on it.

DONE 011
