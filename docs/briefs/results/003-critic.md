# 003 — Critic findings on the "durable control room" outline

Saved by the controller from the `critic` subagent's reply (2026-10-27). Findings 1–7 were truncated in delivery; their conclusions survive in the summary below. Findings 8–10 are verbatim.

## Findings (tail)

7. (…) **Instead:** `controlroom land` = move done rows to `## Landed (date · agent · brief · result)` — ~10 lines of python. Cost: the 26-hour incident was *no progress while burning CPU*, not $; the strip said `working`. The alarm is "`working` > N min AND no mtime change under results/ or logs/ AND unchanged last tool line" → show `stuck?` in red. This reuses `lastline()` already in the script. **Cut $ / tokens** (what Herdr/pi expose per agent is [Unverified]); add a `last write Xm` column instead.

8. **The biggest real pain — a fresh controller after a crash — needs zero code first.** `prompts/controller.md` never tells a resumed controller to read STATUS.md, results/, or agents.log. A compaction summary, however good, loses less than that omission. **Instead (ship first):** add a "Boot" section: read STATUS.md → inbox → last 20 agents.log lines → `memory/DECISIONS.md` & `LESSONS.md` if present → `herdr agent list`; then state where things are in two lines.

9. **"Durable" can make it worse: a second source of truth.** memory/ files drift from STATUS.md/results unless every line links to a source and the set is bounded. Enforce in the CLI (required `--from`), cap the rendered DECISIONS view (~40 lines), archive older to `memory/archive/` with `supersedes` intact. Never let dream delete lines — only move.

10. **Nightly dream has no reader and a clear hallucination budget.** If nobody reads `dreams/YYYY-MM-DD.md`, it is cost without value. Make dream a `prompts/dream.md` template the human (or a wake) runs on demand; its only outputs are `proposed.md` lines with links and a `land` of done rows. Measure before scheduling it.

## Safer ordering (each ≤ half day, independently useful)
A. Prompt-only: controller Boot section; launch prompt "skim DECISIONS.md"; LESSONS.md extracted from SKILL.md.
B. `land` + `decide` (from struck board items, `--from` required) + DECISIONS/LESSONS rendering on the strip (counts).
C. `tick` reconciler: inbox, watcher re-arm from STATUS, `stuck?` alarm (last-write age), `PAUSED` file.
D. `wake` entries in automations.md (run by tick); strip "AUTOMATIONS armed/held/fired".
E. Tiny compaction extension (customInstructions + event) and `prompts/dream.md` (propose-only).

## Keep / cut / change
- **KEEP:** files-as-protocol; human closes the loop by default; DECISIONS derived from struck-through board items; LESSONS; a `land` command.
- **CUT:** FACTS type; standing lander agent; $/tokens on the strip; LLM dream inside the compaction hook; watchers auto-prompting the controller by default.
- **CHANGE:** automations → one idempotent `controlroom tick` reconciler driven by `automations.md` + an inbox file (not nohup loops); memory goes into briefs via the controller, not into every launch prompt.
- **CHANGE:** dream → propose-only, on-demand, "no link, no line"; compaction hook → ~30-line extension that adds `customInstructions` and logs an event. Hook `session_before_compact` is verified in pi 0.85.1 docs; **the brief's doc path is wrong and pi 1.4.0 is what's installed — pin API names against the installed version.**
- **ORDER:** A (prompt boot) → B (land/decide) → C (tick/inbox/stuck) → D (wake) → E (extension/dream).
