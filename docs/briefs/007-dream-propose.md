# 007 — dream-propose: `prompts/dream.md` + `controlroom dream` / `dream --check` / `promote` / `reject`

## Objective
Add the consolidation step — **propose-only, on demand**. A dreamer reads *files only* (memory, board, results, logs) and proposes new decision/lesson lines and merge/landed candidates into `memory/proposed.md` + a dated report; a no-LLM checker verifies every citation exists; the controller/human promotes or rejects explicitly. Nothing is auto-promoted, nothing is scheduled. Part of the deliverable is to **run it three times by hand and report honestly whether the output was worth reading** — that gate decides whether a nightly wake ever gets armed.

## Memory that applies (verbatim; `controlroom memory` is the source)
- D001 **facts-cut** — DECISIONS + LESSONS only; no FACTS type
- D003 **dream-after-pause-off** — pause does not arm a dream row
- D007 **memory-via-briefs** — memory reaches workers through the brief the controller writes
- L001 **no-timeout-binary** — `perl -e 'alarm N; exec @ARGV' --`
- L003 **frontmatter-quote-colon** — prompt-template frontmatter values containing `: ` must be quoted or pi skips the template silently
- L009 **worker-never-full-init** — never run full `controlroom init` from a worker pane
- L011 **test-in-scratch-repo** — prove CLI behaviour in a scratch repo, not on live files

## Inputs — read first
1. `docs/design/durable-controlroom.md` **§3 Dream (3.1 what, 3.2 literal prompt text, 3.3 after a dream: `--check`, `promote`, `reject`), §1.2 line grammar (P-lines use it), §1.5 strip MEMORY line (`N proposed`, `last dream`), §9 brief 007 row.**
2. `docs/briefs/results/004-boot-and-memory.md` — how `mem_py` is structured (`decide`/`lesson`/`supersede`/`memory`/`land`), the `proposed.md` placeholder, `dreams/` dir, and gotchas.
3. `bin/controlroom` — the `# ---- memory (004) ----` block; `launch` (you'll reuse it for `dream` without `--here`).
4. `prompts/controller.md` — the template format to copy for `prompts/dream.md`; `package.json` `pi.prompts` already points at `./prompts`.
5. `/Users/lanceriedel/.pi/pkg/pi-1.4.0/docs/prompt-templates.md` — placeholders/arguments (so `{ROOT}`, `{reason}`, `{since}`, `{stamp}` can be filled by the CLI or by template args — pick one and say why).

## Deliverables (code)
A. **`prompts/dream.md`** — the §3.2 prompt as a pi prompt template (frontmatter description quoted per L003). Also usable as a rendered brief: `controlroom dream` writes `docs/briefs/memory/.dream-brief.md` with the placeholders filled and launches a `dreamer` worker via the existing `launch` (so it gets a watch row and the LESSONS one-liner). `--here` prints the filled prompt for the controller to run in its own pane. `--reason <r>` and `--since <ISO|7d>` (default: last `dreams/*.md` mtime or 7 days).
B. **`controlroom dream --check`** (python, no LLM): newest `dreams/*.md` + `proposed.md` — every `← path` exists (`#anchor` / `:"phrase"` validated against the file where cheap), `DONE dream` present in the dreamer's result/report, P-line count matches the report's `## Proposed (count)`, no duplicate slug vs existing D/L/P → append `[time] dream ok: N proposed, M merges, K landed-candidates` to `logs/agents.log`; failures → list them and toast `dream report has dead links` (reuse `note`).
C. **`controlroom promote P### [P### …] | --all [--kind D|L]`** — turn a P-line into a D- or L-line via the existing `decide`/`lesson` code path (same source), strike the P-line in `proposed.md` (`promoted-as D010`); kind is chosen by a `[D]`/`[L]` tag the dreamer puts at the start of the one-liner — add that to the prompt text (minor, allowed deviation; document it). **`controlroom reject P### [reason]`** — strike with `rejected: reason`, copy to `archive/`.
D. **Strip**: MEMORY line already shows `N proposed · last dream …` — make sure counts exclude struck P-lines and `last dream` reads the newest `dreams/*.md`.
E. **Docs**: README vocabulary (*Dream: propose-only consolidation; promote/reject*), Commands table, SKILL.md; one protocol bullet: *"Dream is on demand. Schedule it only after the human has read three reports and said they were useful."*

## Deliverables (proof + the honesty gate)
- Scratch-repo tests (L011) for `--check` (dead link → failure), `promote` (D and L paths, strike + ID continuity), `reject`, duplicate-slug refusal.
- Then **three real dream runs on this repo**, each a fresh `dreamer` worker via `controlroom dream --reason "007 run N"`, windows: run 1 `--since 2026-10-26T00:00`, run 2 default (since run 1), run 3 after you `promote` or `reject` everything from runs 1–2. For each: `dream --check` output, the report path, the P-lines produced, and **your one-paragraph verdict**: did it find anything the controller didn't already record? were citations real? what did it get wrong? Be blunt — "nothing new, cost $X" is a valid and useful result.
- Leave `proposed.md` with only genuinely open P-lines (promote the good ones with `promote`, which creates real D/L lines — that's the controller's call normally, so **list what you promoted** so the controller can `supersede` if it disagrees).
- Retire the `dreamer` workers with `controlroom retire dreamer-N "007 proof"` (their sessions remain resumable); leave no `dreamer` tabs open.
- `bash -n`; `memory --counts`; 004/005 commands still work; `tick --once --dry-run` clean.

## Constraints
- bash + python3 stdlib; ≲ 150 added lines in `bin/controlroom` (new block `# ---- dream (007) ----` beside 004's) + the prompt file.
- The dreamer **never** edits DECISIONS/LESSONS/STATUS/results — enforce in the prompt and check in `--check` (compare mtimes before/after the run; flag if any moved).
- Don't touch the tick / `AUTOMATIONS.md` (worker 006 owns them in parallel). Don't arm any wake.
- Each dreamer run is time-boxed by its brief: tell it ≤ 15 minutes and ≤ 10 P-lines; if it exceeds, `controlroom retire` it and record a lesson.
- No commits, no pushes. Deviations → results, with reasons.

## Where to write
`docs/briefs/results/007-dream-propose.md`: status · what changed (file:lines) · scratch proofs · the three real runs with verdicts · what you promoted · recommendation (schedule nightly? weekly? never?) · deviations · gotchas. Finish with the sentinel line `DONE 007` and go idle.
