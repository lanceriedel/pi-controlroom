# 018 — acceptance-checks: briefs become enforceable — acceptance blocks, write-scope, declared deviations, re-anchoring, steer ACKs

host: local

## Objective
Today a brief steers a worker by instruction only: `launch` pastes "read this brief and execute it", `verify` looks for `DONE`, `land` wants a result link. Nothing checks that the deliverable's sections exist, that constraints held, that only allowed paths were written, or that a mid-flight steer was heard. Make adherence **checkable and enforced at land time** without adding a server, a model call, or a new daemon. (The LLM judge is brief 019, after this lands.)

## Memory that applies (verbatim; `controlroom memory` is the source)
- L032 symlink-save-is-live: WIP copy → `bash -n` → `controlroom tick --once --dry-run` → atomic `mv`; a bad save hits seven live rooms within 60 s. L045 test the hook's exact invocation **and** one flagged variant before pushing. L011 scratch repo for behaviour tests. L009 never full `init` from a worker pane. L037 never touch other rooms. L001 `perl -e 'alarm N; exec @ARGV' --`. L002 partial results early. L028 mechanism claims need a log line. L043→L045 parse tables by header. D021 ledger never hand-edited. D015 controller by pane id.
- From the 11-17 discussion (`docs/briefs/STATUS.md` "adherence is by instruction"): leaks seen — steer arriving after DONE silently dropped; dreamer nearly wrote a forbidden file; workers reporting into the wrong room; a tester publishing in a room it was told not to.

## Inputs
`bin/controlroom` — `launch` (`:~1391` prompt text), `verify()` (`:39`), `mem_py land` (`:~800`), `fire_auto` watch handling, `prompt_controller`/uptake (`sent` state, 014), `status_text` worker rows; `prompts/controller.md` (brief format), `skills/controlroom/SKILL.md`; `docs/briefs/012-close-the-loop.md` and `015-status-page.md` as examples of briefs with proof tables; `docs/briefs/results/014-prompt-uptake.md` for the `sent`/uptake bookkeeping to reuse for ACKs.

## Work (in order; stop and write partials if you pass 2.5 h)
**T1 — Brief header + acceptance block (the contract).** Briefs may carry a header line `writes: <glob>[, <glob>…]` (paths the worker may create/modify; always implicitly includes `docs/briefs/results/NNN*`) and a section `## Acceptance` holding a fenced ```` ```sh ```` block of checks, each line an independent command; exit 0 = pass. Provide helpers available to those checks via `controlroom check` env/PATH: `cr_has_section <file> "<heading>"`, `cr_has_sentinel <file> NNN`, `cr_max_lines <file> N`, `cr_grep <file> <regex>`. Ship a default acceptance (used when a brief has none): result file exists · contains `DONE NNN` · contains a `## Deviations` section (may say "none") · every constraint path marked read-only in the brief (`read-only:` header, optional) is unchanged in `git status`.
**T2 — `controlroom check <brief|agent> [--json]`.** Resolves the brief (number or path), runs the acceptance block in a subshell with `ROOT`, `BRIEF`, `RESULT` set, prints one line per check `PASS|FAIL  <check> — <first line of stderr>`, then **write-scope**: `git status --porcelain` + untracked files under ROOT not matching `writes:` globs (nor `logs/**`, nor the result path) → `FAIL  write-scope: <paths>`; **sentinel/sections** via the default checks. Exit 0 all pass · 1 any fail · 2 brief not found. Time-box each check 60 s.
**T3 — `land` enforces.** Before moving a `done` row to Landed, run `check` for that brief; on failure leave the row in Workers with state `done — acceptance failed (N): <first failing check>`, print the failures, log `acceptance failed <agent>: …` to agents.log, and toast once. `land --force` lands anyway and writes `(accepted with failures: …)` in the one-liner. `land` for rows whose brief has no acceptance and no result file behaves as today (only the default checks apply).
**T4 — Declared deviations.** Result-file convention: `## Deviations` is mandatory (default check). The launch prompt says so. Also add to the launch prompt: *"after any compaction or context reset, re-read your brief before continuing"* (re-anchoring). Keep the prompt one paragraph.
**T5 — Steer ACKs.** When the controller prompts a *working* agent via `controlroom steer <agent> "<text>"` (new, thin wrapper over `herdr agent prompt`), it appends ` — reply ACK <id> on its own line when you have read this` with a short id, records `st["steers"][id]={agent,ts}`, and the tick checks the agent's pane tail (`herdr agent read … --lines 80`) for `ACK <id>` within 10 min; missing → toast `steer <id> to <agent> not acknowledged (agent was <status>)` + agents.log line, once. If the agent's status was `done` when steered → immediately log `steer after DONE — re-launch or resume` so the 015 agent-column case can't recur silently.
**T6 — Strip + docs.** Worker row in `status_text` shows `✓ acceptance` / `✗ acceptance (N)` once a result exists (cache result of `check` per agent in `.health.json`, re-run only when the result file mtime changes). README "Briefs → acceptance" section + SKILL rows for `check`, `steer`, `land --force`, `writes:` header; `prompts/controller.md`: briefs include `writes:` and `## Acceptance`; land never force-lands without saying why on the board.

## Proof (write as you go)
Scratch repo (L011) with a fake herdr where needed: brief with acceptance that passes → `check` 0, `land` lands; brief whose result lacks `## Deviations` → `check` 1, `land` refuses with the row text, `land --force` lands with the note; `writes: src/**` and a stray edit to `docs/x.md` → write-scope FAIL naming the path; default acceptance on a brief with no block; `steer` ACK seen within 10 min → nothing logged; ACK missing → one toast line; steer to a `done` agent → the "steer after DONE" line. Live, read-only: `controlroom check 015` and `check 014` on this room's real briefs (expect default checks to pass or report precisely what is missing); `controlroom tick --once --dry-run` → nothing to do.

## Constraints
bash 3.2 + python3 stdlib; `(018)` markers; ≤ 180 lines net in `bin/controlroom` (put the checker in a `check_py` heredoc function like `mem_py`); helpers may live in `bin/controlroom-check-lib` (symlinked into `~/.local/bin` by the install line — update README/SKILL install lines). Every save per L032 + L045. No commits (controller commits). Don't `land` real rows in this room during tests — scratch only. Time-box 2.5 h; result skeleton in the first 10 min.

## Deliverable
`docs/briefs/results/018-acceptance-checks.md`: finding/fix table (`file:line`) · proof table (scratch + live) · the exact new launch-prompt text · deviations · still-open · `decide`/`lesson` lines recorded (`--from` this file) · `DONE 018`; go idle.

## Acceptance
```sh
cr_has_section "$RESULT" "## Proof"
cr_has_section "$RESULT" "## Deviations"
cr_has_sentinel "$RESULT" 018
bash -n "$ROOT/bin/controlroom"
"$ROOT/bin/controlroom" check --help >/dev/null
```
writes: bin/**, README.md, skills/controlroom/SKILL.md, prompts/controller.md, docs/briefs/results/018*
