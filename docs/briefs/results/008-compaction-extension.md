# 008 — compaction-extension — results

## Status
**DONE** (10-27 14:10 → 14:35, worker `compaction-ext` wC:pD). Shipped: **A** `extensions/controlroom.ts` (62 lines, pi 1.4.0 API, loads through the package — verified in a real `pi` process), **B** `controlroom event`, **C** tick shell fallback (`flush` / `post-compaction` rows, shared guard), **D** `package.json` 0.2.0 with `pi.extensions` + `peerDependencies`, **E** strip detail `CTX` line, **F** README + SKILL. Proofs: static ✓, extension-load-in-real-pi ✓, `/flush` in a scratch pi ✓, fallback 10/10 passes in a scratch repo ✓, guard ✓, `event compaction` ✓ (scratch), regressions ✓. **Live `/flush` on the controller: blocked on the human** — the controller (asked through wake A013, as the brief says) answered that it *cannot* run slash commands and its pi has not `/reload`-ed; see Deviations 1. Two real bugs found and fixed on the way (phantom `ctx 89 %`, lost blocked `flush` row). Nothing committed; scratch dirs removed; `AUTOMATIONS.md` holds real rows only.

## [Verified] pi 1.4.0 API used (file refs under `~/.pi/pkg/pi-1.4.0/`)
| name | where verified |
|---|---|
| `export default function (pi: ExtensionAPI)`; `.ts` loaded directly via jiti, no build | `docs/extensions.md` "Pi uses `jiti`" · `packages/coding-agent/src/core/extensions/types.ts` |
| `pi.on("session_start", (e, ctx))` — `e.reason` startup/reload/new/resume/fork | `types.ts:755` `SessionStartEvent` · `docs/extensions.md` lifecycle |
| `pi.on("turn_end", (e, ctx))` — `e.message: AgentMessage`, `e.toolResults`; result `BoundaryResult` (we return nothing) | `types.ts:1065` `TurnEndEvent` · `examples/extensions/trigger-compact.ts`, `status-line.ts` |
| `pi.on("session_before_compact", (e, ctx))` — `e.preparation.tokensBefore`, `e.reason`, `e.signal`; return nothing → default compaction | `types.ts:785` · `compaction.ts:759` `CompactionPreparation` · `docs/compaction.md` §session_before_compact · `examples/extensions/custom-compaction.ts` |
| `ctx.getContextUsage()` → `{tokens, contextWindow, percent}` (`percent` **null** right after compaction) | `types.ts:306` `ContextUsage`, `:360` · `trigger-compact.ts`, `border-status-editor.ts` |
| `ctx.compact({ onError })` — triggers pi's own compaction, not awaited | `types.ts:314` `CompactOptions`, `:362` · `trigger-compact.ts` |
| `pi.sendUserMessage(text, { deliverAs: "followUp" })` — queues while streaming; when idle `deliverAs` is ignored and it prompts | `types.ts:1741` · `core/agent-session.ts:2429–2456` · `examples/extensions/send-user-message.ts` |
| `pi.exec(cmd, args, { cwd, timeout })` → `{stdout, stderr, code, killed}`; **never rejects** | `types.ts:1763` · `core/exec.ts:11–28, 34–106` · `auto-commit-on-exit.ts`, `border-status-editor.ts` |
| `pi.registerCommand(name, { description, handler(args, ctx) })`; `ctx.ui.notify`, `ctx.isIdle()`, `ctx.cwd` | `types.ts:1569` `RegisteredCommand`, `:1680` · `docs/extensions.md` quick start · `send-user-message.ts` |
| Package manifest `"pi": {"extensions": [...]}`; host packages in `peerDependencies` `"*"`, not `dependencies` | `docs/packages.md` "Declare dependencies" · `~/.pi/agent/git/github.com/edxeth/pi-subagents/package.json` (`pi.extensions`, `peerDependencies`) |
| This repo is a local package (`../../src/github.com/lanceriedel/pi-controlroom`) → extensions dir auto-loads | `~/.pi/agent/settings.json` `packages` (read-only) · `pi list` |

Not used (considered): `agent_end` (not a final-idle signal per docs), `session_compact` (the `before` hook has `tokensBefore` already), `expandPromptTemplates` (irrelevant).

## What changed (file:lines)
**`extensions/controlroom.ts`** (new, 62 lines)
- `9–10` `THRESHOLD = 75` (D006) and the §7.2 flush text with the live percent (`Context at 89% (threshold 75%)…`) ending *"reply `/compact` on a line of its own (this extension runs it)"*.
- `13–24` state: `active`, `requested` (in-memory half of the rising edge), `root`; `event()` = `pi.exec("controlroom", ["event", kind, arg])`; `guard()` wraps every handler in try/catch → `controlroom event ext-error …`, never throws; `flush()` = `sendUserMessage(..., {deliverAs})` + `event flush-requested <pct>`.
- `26–33` `session_start`: active iff `HERDR_ENV=1` ∧ `docs/briefs/memory/` under `ctx.cwd` ∧ `HERDR_PANE_ID == logs/.controller` (D015, no herdr call); `requested` seeded from the marker file (a restart does not re-fire the same crossing); writes `logs/.ext-alive` (heartbeat for the tick).
- `35–48` `turn_end`: (a) if a flush was requested and the assistant's text contains a line that is exactly `/compact` → `ctx.compact()` (pi's default compaction; nothing replaced — see Deviations 2); (b) `percent` null → skip; `< 75` → clear `requested` + marker; `≥ 75` ∧ not requested ∧ no marker → `flush(followUp)`.
- `50–52` `session_before_compact`: `controlroom event compaction <tokensBefore>`; returns nothing. **No LLM call.**
- `54–61` `/flush`: works wherever `docs/briefs/memory/` exists (manual = explicit intent); `followUp` when busy, immediate when idle.

**`bin/controlroom`** (+≈60 lines, all marked `(008)`)
- `20` help line for `event`.
- `236` `is_auto()` includes `flush` / `post-compaction` (they show in `automations`, the strip, and are held while paused).
- **`260–307` `# ---- compaction (008) ---- … # ---- end 008 helpers ----`** inside the 005 `cr5` python, right after 006's helpers: `FLUSH_PCT` (env `CONTROLROOM_FLUSH_PCT`, default 75), marker/heartbeat/counter paths, `FLUSH_TEXT` / `POST_TEXT` (§7.2 / §7.4 literal), **`event(kind,arg,src)`** (one `[time] kind — arg` line in `agents.log`; `compaction` → `logs/.compactions` `{count,last,tokensBefore}`; `flush-requested` → writes `logs/.flush-requested` and toasts **once per crossing** via the existing `note`), **`comp_step()`** (controller only, resolved by pane id via 006's `controller()`: health for its session → `ctx_pct`; `.ext-alive` mtime ≥ session start = extension alive; `ctx < 75` → remove marker; `ctx ≥ 75` ∧ ext absent ∧ no marker ∧ no armed `flush` row → `add_row(flush, prompt=yes, source=tick …)` + `event flush-requested … tick`; compaction count from `.compactions` when alive else from the jsonl → first sight = baseline, increase → `add_row(post-compaction …)`), and `window()` (005's) now reads `contextWindow` per model id from `~/.pi/agent/models-store.json` before the hard-coded table.
- `312`, `321` `parse_session` cache key gains `win` (so a window fix invalidates stale `ctx_pct`); `327` a `compaction` entry sets `ctx=0` (unknown until the next assistant message → the guard re-arms).
- `383` `fire_auto`: no `RULES` suffix for flush texts (self-contained). `406` `comp_step(...)` runs before the row loop so step 5 fires the new rows in the same pass. `424–428` step 5 handles `flush`/`post-compaction` like `wake` (rate cap, blocked retry, held while paused) and sends the instruction verbatim.
- `558–563` `cr5 strip` detail: ` CTX   controller ctx 18% · compactions 0 · flushed — · extension absent (tick fallback)`.
- `585–587` `cr5 event`; `1026–1028` case arm `event) cr5 event "$@"`.

**`package.json`** `version` 0.1.5 → **0.2.0**; `pi.extensions: ["./extensions"]`; `peerDependencies: {"@earendil-works/pi-coding-agent": "*"}` (what `docs/packages.md` asks for; pi-subagents does the same with ranges).
**`README.md`** new *Durability: memory · tick · automations · dream · compaction flush* section (links the design), Commands rows `event` + `/flush`, two gotchas, Layout gains `extensions/controlroom.ts` + the design doc. **`skills/controlroom/SKILL.md`** Protocol bullet *Compaction flush* + Commands row.
**`logs/scratch/`** `008-fake-herdr.sh` (006's shim + `agent_session.value`), `008-fallback-proof.sh` (the 10-pass proof, self-cleaning), `008-fallback-proof.txt` (its transcript).

## Proof transcript (trimmed; local time)
```
$ bash -n bin/controlroom && echo ok                                   → ok   (and the cr5 python ast-parses)
$ node load-ext.mjs extensions/controlroom.ts <scratch> 80             # pi's own jiti + a stub `pi`
events: session_start,turn_end,session_before_compact commands: flush
sendUserMessage {"deliverAs":"followUp"} [controlroom · flush] Context at 80% …   exec controlroom event flush-requested 80
(2nd turn_end at 80 %: nothing)  (turn_end at 20 %: nothing, marker cleared)  (80 % again: fires)  exec controlroom event compaction 123456
(/flush when idle: sendUserMessage undefined … notify info flush requested)
(reply "Recorded D016.\n/compact" after a request → ctx.compact called; "/compact is a thing" → not a bare line → no compact)
HERDR_PANE_ID=wX:p9 → turn_end does nothing (not the controller); /flush still works

$ pi list → "../../src/github.com/lanceriedel/pi-controlroom" (local package)
$ cd <scratch with docs/briefs/memory + logs/.controller=wX:p1>; HERDR_ENV=1 HERDR_PANE_ID=wX:p1 pi -p --no-tools --verbose "Reply with exactly: ok"
ok                                        → logs/.ext-alive = "2026-10-27T20:21:17.543Z 63127"   [extension loaded by the package in a real pi]
$ HERDR_ENV=1 HERDR_PANE_ID=wX:p1 pi -p --no-tools "/flush"
→ logs/.flush-requested = "2026-10-27T14:22 ext 0"
→ agents.log: [10-27 14:22] flush requested — controller ctx 0% (ext) — asked to flush decisions/lessons to memory, then /compact
  (stderr: "Extension error (<boundary>): turn_end could not resolve the persisted assistant entry ID" — pi internal, agent-session.ts:856, print-mode + command-as-prompt; not ours)

$ bash logs/scratch/008-fallback-proof.sh        # mktemp repo, fake herdr, crafted jsonl (model unknown → 200k window)
== pass 1 — ctx 80 %, no .ext-alive → arm + fire flush once
A001 armed flush (ctx 80% ≥ 75%, extension absent) / A001 flush fired → prompted controller      marker: … tick 80 · prompts sent: 1
== pass 2 — same crossing, marker present → nothing                                                tick: nothing to do · prompts 1
== pass 3 — compaction line appended (ctx → 0) → post-compaction fires, marker cleared
A002 armed post-compaction (compactions 1 via jsonl) / A002 post-compaction fired → prompted controller   marker: none · prompts 2
== pass 4 — ctx 75 % again after the drop → flush fires again (new crossing)                       A003 … fired · prompts 3
== pass 5 — ctx 70 % → marker cleared, nothing fired                                               marker: none
== pass 6 — .ext-alive newer than session start, ctx 85 % → tick does NOT fire flush               tick: nothing to do
== pass 7 — ext alive: `controlroom event compaction` ×2 → .compactions 0→2 → ONE post-compaction row (count rose)   A004 … fired · prompts 4
== pass 8 — ext absent, controller blocked → A005 armed flush … / A005 flush due → blocked, retrying each tick     prompts 4
== pass 9 — still blocked → tick: nothing to do (logged once per state change; row stays armed)
== pass 10 — unblocked → A005 flush fired → prompted controller                                     prompts 5
AUTOMATIONS.md: A001 flush fired · A002 post-compaction fired · A003 flush fired · A004 post-compaction fired · A005 flush fired  (all `prompt yes`, source `tick 10-27 14:20`)
agents.log: flush requested — controller ctx 80% (tick) … · A001 fired → prompted controller (wX:p1, was idle) · … · compaction — #1 tokensBefore=170000 · compaction — #2 tokensBefore=171000 · …
.compactions: {"count": 2, "last": "2026-10-27 14:20", "tokensBefore": "171000"}
prompts received by the fake controller: 3× "[controlroom · flush] Context at NN% …", 2× "[controlroom · post-compaction] Your context was just compacted. Re-run Boot …"
removed /tmp/cr008.FmRq

$ controlroom health controller      (before the window fix)  … ctx 89%        (after)  … ctx 18%
$ controlroom tick --dry-run         (before)  DRY A013 armed flush (ctx 89% ≥ 75%, extension absent) / DRY A013 flush fired → prompted controller
                                     (after)   tick: nothing to do          — and the live launchd tick never fired it (tick.log clean)
$ controlroom wake 1m "008 proof: run /flush, then confirm in one line what it sent. If /flush is not available because your pi has not /reload-ed … say exactly that …"
A013 armed — wakes controller at 14:25
tick.log: [10-27 14:25] A013 wake fired → prompted controller · agents.log: [10-27 14:25] A013 fired → prompted controller (wC:p1, was idle)
$ herdr agent read controller --lines 25
"/flush is not available in this session: this pi has not /reload-ed since extensions/controlroom.ts landed (and slash commands are typed by the human,
 not callable by me — Lance, type /reload then /flush in this pane to exercise it)."     footer: 17.9%/1.0M (anthropic) claude-fable-5-1
$ DETAIL=1 cr5 strip
 TICK  last 14:26:32 · ok
 COST  controller $23.50 · workers $40.11 · today $61.21
 CTX   controller ctx 18% · compactions 0 · flushed — · extension absent (tick fallback)
$ controlroom memory --counts → 15 decisions · 17 lessons · 0 proposed   $ controlroom automations → table + next: —   $ controlroom dream --check → dream ok …   $ controlroom status → renders
$ A013 proof row removed from AUTOMATIONS.md (9 real rows remain); /tmp/cr008* gone
```

## Deviations (with reasons)
1. **Live `/flush` on the controller — not exercised; [Assumed] on the human.** The brief forbids typing into the controller pane and asks for a wake instead; the wake (A013) ran and the controller replied that it **cannot run slash commands** and its pi has not `/reload`-ed. Both `/reload` and `/flush` are TUI commands → only the human (or keystrokes via `herdr agent prompt wC:p1 "/flush"`, which is typing into the pane) can run them. **Manual step for Lance:** in CONTROLLER type `/reload`, then `/flush`; expect the toast *flush requested*, `logs/.flush-requested = … ext 18`, the `[controlroom · flush] …` prompt in the pane, and after its `/compact` reply a compaction + `agents.log: compaction — #1 tokensBefore=…` + `CTX … compactions 1 · extension alive`. The extension-side code path *was* exercised in a real pi (scratch, print mode).
2. **Added: the extension acts on the reply.** Design §7.2's text ends *"Then reply `/compact`"*, which an LLM cannot execute. `turn_end` now runs `ctx.compact()` (pi's **default** compaction — nothing replaced, no custom instructions) when a flush was requested and the assistant's message contains a line that is exactly `/compact`. Guarded by `requested`, so an incidental "/compact" in prose never triggers it. This is what makes the design's flow close without a human. The flush text says so ("on a line of its own (this extension runs it)").
3. **Flush text shows the live percent** (`Context at 89% (threshold 75%)`) instead of the literal `75%`; the threshold is still named.
4. **`/flush` is not gated on "this pane is the controller"** — it works wherever `docs/briefs/memory/` exists (a human typing it is explicit intent; a worker gets the same request). The automatic paths are fully gated.
5. **First observation above 75 % fires** (no "previous value" needed, unlike `trigger-compact.ts`): a controller already at 80 % when the extension/tick arrives gets one request; the marker stops repeats. Compaction count, by contrast, is **baselined** on first sight (history is not actionable).
6. **Two fixes outside the 008 block** (both one-liners, marked): `window()` reads `models-store.json`; `parse_session` caches `win` and zeroes `ctx` on a compaction entry. Without the first, the fallback would have prompted the live controller on a phantom crossing (dry-run caught it with ~40 s to spare before the launchd tick).
7. **62 lines of TS** vs "≲ 60" — the `/compact` hook (Deviation 2) costs 5. `bin/controlroom` +≈60 lines (budget 80).
8. **Extension does not touch `.ext-alive` after `session_start`.** Good enough for the "absent" test (mtime vs session start); a crashed extension inside a live pi would look alive until the next start/reload — accepted (the fallback then costs one duplicate request at most, and the marker still dedupes the same crossing).
9. `event()` runs inside the `cr5` python (no bash `note`-format fork): non-flush kinds append `[time] kind — arg` directly; `flush-requested` goes through the existing `note` so the one toast and the log line share one implementation.

## Gotchas
- **`health`'s hard-coded window table lied: ctx 89 % for a controller at 18 %** — `claude-fable-5-1` has a 1 M window (`models-store.json`) and fell to the 200 k default. Any trigger built on `ctx %` must read the real window; and run `tick --dry-run` before the live tick picks up a trigger change — `~/.local/bin/controlroom` is a symlink to this repo, so **every save is live within 60 s**. This came within one tick of a phantom crossing.
- **An LLM cannot run slash commands.** `/flush`, `/reload`, `/compact` are TUI commands; a wake saying "run /flush" produces an apology. Hooks have to act on the agent's *reply* (as the extension now does) or the human types.
- A row the tick adds and fails to fire (blocked controller) is lost unless `changed` is flagged — `add_row()` alone does not mark the table dirty; `advance()` does. (Fixed; pass 8–10 cover it.)
- `ctx.getContextUsage().percent` is **null right after compaction** until the next model response — skip, don't treat as 0. The jsonl side has the mirror problem (last assistant usage stays pre-compaction) — hence `ctx=0` on a compaction entry.
- `pi -p "/flush"` in print mode executes the extension command but pi then logs `turn_end could not resolve the persisted assistant entry ID` (`agent-session.ts:856`) — harmless, print-mode only.
- `pi.exec` never rejects (`core/exec.ts` resolves `{code:1}` on spawn failure) — so a missing `controlroom` on PATH is silent; `ext-error` lines are the only signal.
- `herdr agent prompt` pastes keystrokes ("before any input is sent" in its help) — it *can* run slash commands in a pi pane; the wake path wraps text in `[A### · wake …]` so wakes never can.
- My first guess for the pass-10 silence (bash 3.2 leaking `VAR=x func`) was **wrong** — `/bin/bash` 3.2.57 restores it. Verify the hypothesis before writing the lesson.

## Memory lines recorded
- `L019` **llm-cannot-slash** ← this file "cannot run slash commands"
- `L020` **ctx-window-from-models-store** ← this file "phantom crossing"
- `D016` **flush-guard-marker** ← this file "shared guard"
(see `controlroom memory`; exact text below the sentinel in `docs/briefs/memory/`)

## Cleanup
A013 proof row removed from `AUTOMATIONS.md` (9 real rows remain: A001–A006, A010–A012); scratch dirs `/tmp/cr008*` removed; `.bak` files removed; `logs/.flush-requested` / `.compactions` **not** created on the live repo (the `event compaction` proof ran in scratch, pass 7); live `tick.log`/`agents.log` keep only the A013 wake lines. Nothing committed or pushed; `~/.pi/agent/settings.json` untouched; no `pi install`.

DONE 008
