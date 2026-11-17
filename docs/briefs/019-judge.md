# 019 — judge: an LLM completion gate at land time — does the result actually satisfy the brief?

host: local · **runs after 018 lands** (uses `check`, `writes:`, `## Deviations`)

## Objective
018 makes the mechanical parts of a brief enforceable (files, sections, sentinel, write-scope). The judgment parts — did the worker answer the objective, honour each constraint and memory line, deliver every item in the Deliverable, declare its deviations honestly, label claims — still rely on the controller skimming. Add `controlroom judge <brief|agent>`: a short, cheap, read-only pi run that grades the result against the brief, requirement by requirement, with quoted evidence, and writes `docs/briefs/results/NNN-judge.md`. `land` runs it after `check` and shows the grade; it never blocks on its own (the controller decides), except a `FAIL` on a `must:` requirement which behaves like an acceptance failure (`land --force` overrides).

## Memory that applies (verbatim)
- L032 / L045 save discipline · L011 scratch · L006/L021 hidden subagents die on read-heavy work — the judge must be a **bounded** run: one brief + one result (+ at most the files the result links that are under 2k lines), no exploration · L028 claims need evidence lines · D014 dream is on-demand after a batch — same principle: judge only when a worker says DONE, never on a clock · D004 cost out of the default view (show judge $ in the judge file only).
- Reference shapes: Tobi's "completion gate / obligation"; Harry's Torrent Objectives "charter enforced by a separate judge agent" (`docs/briefs/results/013-tobi-comparison.md`, Slack 10-26).

## Inputs
`prompts/dream.md` + `controlroom dream` (the existing pattern for a bounded, propose-only pi run with `--here` and a results file); `bin/controlroom` `dream_py`, `land`, `check` (018); `docs/briefs/results/0{12,14,15}-*.md` as realistic results to judge in proofs; the brief format in `prompts/controller.md`.

## Work
1. **`prompts/judge.md`** (pi prompt template, frontmatter quoted per L003): inputs = brief path, result path; output = Markdown with a table `requirement · source (Objective/Constraint/Memory/Deliverable line quoted) · verdict PASS/PARTIAL/FAIL/N-A · evidence (quoted line from the result or "none found")`, then `## Undeclared deviations` (constraints violated with no entry in the result's `## Deviations`), `## Unsupported claims` (result statements with no evidence/label), `## Verdict` one line `ACCEPT | ACCEPT WITH NOTES | REJECT` + 2-line why, `## Cost` tokens/$. Rules: read only the two files plus linked files ≤ 2k lines; never run the project's code; ≤ 120 lines; quote, don't paraphrase.
2. **`controlroom judge <brief|agent> [--model <id>] [--here]`** in a `judge_py`/shell block: resolves brief+result, runs `pi -p` (non-interactive) with the template, default model `openai/gpt-6.1-sol` (cheap; env `CONTROLROOM_JUDGE_MODEL`), 5-min alarm, writes `results/NNN-judge.md`, prints the verdict line, logs `judge NNN: <verdict> ($x)` to agents.log. `--here` runs it in a Herdr pane as a worker named `judge-NNN` instead (for long results). Idempotent: re-running overwrites.
3. **Brief grammar:** a requirement line may start with `must:` (hard) — the judge marks these; a `must:` FAIL makes `land` refuse like 018 (`land --force` overrides, note on the board). Everything else is advisory: `land` prints the verdict and lands.
4. **`land` integration:** order = `check` → `judge` (skippable with `--no-judge` or room D-line `judge-off`) → move row; Landed one-liner gets ` · judge: ACCEPT` / `ACCEPT WITH NOTES` / `REJECT (forced)`. Strip worker row shows the verdict next to `✓ acceptance`.
5. **Docs:** README "Judge" paragraph (what it is, cost, how to opt out, `must:`), SKILL rows, controller prompt: "write `must:` only for requirements you'd refuse to land without".

## Proof
Scratch: a brief + a good result → ACCEPT with ≥ 5 PASS rows and evidence quotes; the same result with one constraint silently violated → `## Undeclared deviations` names it; a `must:` requirement unmet → REJECT and `land` refuses, `--force` lands with the note. Live, read-only: `controlroom judge 015` and `judge 014` on this room (write the judge files; they are real artefacts) — report their verdicts and cost in the result. `controlroom tick --once --dry-run` → nothing to do.

## Constraints
bash 3.2 + python3 stdlib; `(019)` markers; ≤ 120 lines net in `bin/controlroom`; template in `prompts/judge.md`; judge model never the room's controller model by default; every save per L032/L045; no commits; scratch for anything destructive; time-box 2 h; result skeleton first 10 min.

## Deliverable
`docs/briefs/results/019-judge.md`: design as built · proof table · the two live verdicts with cost · deviations · still-open · memory lines recorded · `DONE 019`; go idle.

## Acceptance
```sh
cr_has_section "$RESULT" "## Proof"
cr_has_section "$RESULT" "## Deviations"
cr_has_sentinel "$RESULT" 019
test -f "$ROOT/prompts/judge.md"
bash -n "$ROOT/bin/controlroom"
test -f "$ROOT/docs/briefs/results/015-judge.md"
```
writes: bin/**, prompts/judge.md, README.md, skills/controlroom/SKILL.md, prompts/controller.md, docs/briefs/results/019*, docs/briefs/results/*-judge.md
