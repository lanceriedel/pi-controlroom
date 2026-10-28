# 008 — compaction-extension: flush decisions to memory before compaction (+ shell fallback)

## Objective
The last durability slice: make sure the controller's *in-context* decisions and lessons reach `memory/` **before** pi compacts its context. A ~40-line pi extension (`extensions/controlroom.ts`) asks the controller to flush at 75 % context (rising edge, once), logs compaction events, and offers `/flush` on demand. The `tick` gets the shell-only fallback (context % from the session jsonl; post-compaction reconcile prompt) as ordinary `AUTOMATIONS.md` rows. No LLM call inside the hook itself.

## Memory that applies (verbatim; `controlroom memory` is the source)
- D006 **thresholds-v1** — flush at 75 % context
- D007 **memory-via-briefs** — memory reaches workers through briefs; the extension does **not** inject memory into the system prompt (Boot covers it)
- D008 **tick-runner-launchd** — tick runs under launchd
- D015 **controller-by-pane-id** — controller pane id is in `logs/.controller`; resolve by pane id, name is a label
- L001 **no-timeout-binary** — `perl -e 'alarm N; exec @ARGV' --`
- L003 **frontmatter-quote-colon** — (if you touch any prompt template)
- L009 **worker-never-full-init** — never run full `controlroom init` from a worker pane
- L011 **test-in-scratch-repo** — prove behaviour in scratch, not on live files
- L012 **agent-names-global** — herdr agent names are global across workspaces

## Inputs — read first
1. `docs/design/durable-controlroom.md` **§7 (7.1 API pinned to pi 1.4.0, 7.2 behaviour with literal prompt texts, 7.3 shipping via `package.json` `pi.extensions`, 7.4 shell fallback), §6 `context %` derivation, §9 brief 008 row.**
2. **Installed pi is 1.4.0** (`pi --version` prints `0.0.0` — ignore; `ls ~/.pi/pkg/` → `pi-1.4.0`). Read `~/.pi/pkg/pi-1.4.0/docs/extensions.md` **completely**, plus `docs/packages.md` and `docs/compaction.md`; examples `~/.pi/pkg/pi-1.4.0/examples/extensions/{trigger-compact,custom-compaction,send-user-message,border-status-editor,status-line}.ts`. Pin every event/API name you use to what those files actually export; list them in results as **[Verified — file]**.
3. `bin/controlroom` — 005's `cr5` block (`health` already computes `ctx %` per session from the jsonl; `tick_pass`; `AUTOMATIONS.md` writer), 006's automations helpers (`prompt_controller`, `controller()`), `note`. Reuse; don't fork.
4. `package.json` (currently `pi.prompts` + `pi.skills`), `~/.pi/agent/settings.json` (how this repo is installed as a package — read-only), and how `pi-subagents` ships extensions: `~/.pi/agent/git/github.com/edxeth/pi-subagents/package.json` (read-only).
5. `docs/briefs/results/005-*.md` §health, `006-*.md` §prompt_controller — the pieces you plug into.

## Deliverables (code)
A. **`extensions/controlroom.ts`** (~40–60 lines, TypeScript, no build step — pi loads `.ts` extensions directly; confirm in docs). Behaviour per §7.2:
   - Activate only when `process.env.HERDR_ENV === "1"`, `docs/briefs/memory/` exists under the session cwd, **and** this pane is the controller: compare `process.env.HERDR_PANE_ID` with the contents of `logs/.controller` (D015) — no herdr call needed.
   - On each turn end (pick the right event from the docs — `turn_end` / `agent_end` / whatever 1.4.0 names it): read `ctx.getContextUsage().percent`; on a **rising-edge crossing of 75 %** (state kept in memory + `logs/.flush-requested` so a restart doesn't re-fire for the same crossing) → `pi.sendUserMessage(<§7.2 flush text>, {deliverAs:"followUp"})` and `pi.exec("controlroom", ["event", "flush-requested", String(percent)])`.
   - `session_before_compact`: `pi.exec("controlroom", ["event", "compaction", String(tokensBefore)])`; return nothing (default compaction). **No LLM call.**
   - `pi.registerCommand("flush", …)` → sends the same flush text on demand.
   - Fail-safe: every handler wrapped in try/catch; errors logged via `pi.exec("controlroom",["event","ext-error",msg])`, never thrown.
B. **`controlroom event <kind> [arg]`** — new tiny subcommand: appends `[time] <kind> <arg>` to `logs/agents.log` via `note`-style formatting (no toast except `flush-requested`, which toasts once), and for `compaction` increments `logs/.compactions` (JSON `{count, last}`) so the tick/strip can read it.
C. **Tick fallback (§7.4)** inside the 005/006 block: each pass, for the controller session only: (1) `ctx %` from `health` crossing 75 % and **no extension heartbeat** (the extension writes `logs/.ext-alive` at `session_start`; if its mtime is older than the controller session's start, assume extension absent) → arm+fire a one-shot `flush` row (`kind: flush`, `prompt?: yes`, `source: tick`) with the §7.2 text; (2) compaction count increase (`logs/.compactions` **or** count of `"type":"compaction"` lines in the jsonl when the extension is absent) → one-shot `[controlroom · post-compaction] …` row from §7.4. Both go through `prompt_controller` (rate cap, blocked retry, `CONTROLROOM_AUTOPROMPT`). Never fire both the extension's and the fallback's flush for the same crossing (the `.flush-requested` marker is the shared guard).
D. **Shipping**: `package.json` → `"pi": {"prompts": ["./prompts"], "skills": ["./skills"], "extensions": ["./extensions"]}`; add whatever `peerDependencies`/types the docs require for `.ts` extensions (keep it to what `pi-subagents` does). Bump `version` to `0.2.0` (first durable release) — version only, no publish.
E. **Strip**: header or detail gains `ctx 61% · compactions 2 · flushed 13:40` for the controller (detail view is fine).
F. **Docs**: README — new section *Durability: memory · tick · automations · dream · compaction flush* (short; link to `docs/design/durable-controlroom.md`), the `/flush` command, the `event` subcommand in the Commands table, note that `/reload` loads the extension; SKILL.md: one bullet (*"At 75 % context the controller is asked to flush decisions/lessons to memory, then `/compact`; `/flush` does it on demand."*).

## Proofs
- **Static**: `bash -n bin/controlroom`; the extension type-checks or at least loads — run `pi` in a **scratch** repo (L011) with `HERDR_ENV=1 HERDR_PANE_ID=<fake>` and a `logs/.controller` matching, `/reload`, confirm the extension registers (`/flush` appears in command list; `logs/.ext-alive` written). If a scratch pi can't run headless, document the exact manual steps and mark `[Assumed]`.
- **`/flush` on the real controller**: *do not* type into the controller pane yourself. Instead ask the controller via a one-shot wake: `controlroom wake 1m "008 proof: run /flush, then confirm in one line what it sent" ` — the controller is `wC:p1`; the result shows in `herdr agent read controller --lines 20` and `logs/agents.log` (`flush-requested`). Then `controlroom cancel`/clean the row.
- **Fallback**: in the scratch repo with the fake-herdr shim from 006 (`logs/scratch/006-fake-herdr.sh`), craft a session jsonl whose last assistant `usage` puts ctx at 80 % and no `.ext-alive` → `tick --once` arms+fires a `flush` row exactly once across two passes; append a `"type":"compaction"` line → one `post-compaction` row fires; show `AUTOMATIONS.md` rows and `tick.log`.
- **Guard**: with `.flush-requested` present for the current crossing, neither path fires again; after ctx drops below 75 % (post-compaction) and rises again → fires again.
- `controlroom event compaction 123456` → `agents.log` line + `.compactions` JSON; strip detail shows it.
- Everything else still works: `memory --counts`, `automations`, `dream --check`, `status`.

## Constraints
- TypeScript only for the extension; bash + python3 stdlib for the rest. ≲ 60 lines TS, ≲ 80 lines added to `bin/controlroom` in a `# ---- compaction (008) ----` block adjacent to 006's, one contiguous group of `case` arms.
- **Never** replace or alter pi's compaction summary. Never inject memory into the system prompt (D007).
- Don't modify `~/.pi/agent/settings.json`; don't `pi install` anything. Don't type into the controller pane.
- Clean up scratch dirs and proof rows; leave `AUTOMATIONS.md` with real rows only.
- No commits, no pushes. Deviations → results, with reasons.

## Where to write
`docs/briefs/results/008-compaction-extension.md`: status · **[Verified]** API list with file refs · what changed (file:lines) · proof transcript · deviations · gotchas · any `decide`/`lesson` recorded. Finish with the sentinel line `DONE 008` and go idle.
