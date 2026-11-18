# 019 — judge · docs/briefs/019-judge.md vs docs/briefs/results/019-judge.md

2026-11-18 08:02 · model `openai/gpt-6.1-sol` · `controlroom judge 019` · 41 s · 2 file read(s)

## Requirements
| requirement | source | verdict | evidence |
|---|---|---|---|
| Completion gate answers objective | Objective: “Add `controlroom judge <brief\|agent>`: a short, cheap, read-only pi run that grades the result against the brief…” | PASS | “`judge 001: ACCEPT ($0.0222)` rc 0” |
| Requirement-by-requirement quoted grading | Objective: “requirement by requirement, with quoted evidence” | PASS | “**12 PASS** / 1 PARTIAL / 1 N-A, every PASS cell a verbatim quote” |
| Judge report artefact | Objective: “writes `docs/briefs/results/NNN-judge.md`.” | PASS | “`results/001-judge.md` single file, mtime advances, stamp line updated” |
| Bounded reads, no exploration | Memory that applies: “one brief + one result (+ at most the files the result links that are under 2k lines), no exploration” | PASS | `prompts/judge.md`: “Never run the project's code or any command; you have no shell.” |
| Evidence discipline | Memory that applies: “L028 claims need evidence lines” | PASS | `prompts/judge.md`: “Every PASS needs a quoted evidence line” |
| On-demand, not clock-driven | Memory that applies: “judge only when a worker says DONE, never on a clock” | PASS | “A tick hook (re-judge on result mtime, like `accept_step`) was deliberately *not* added” |
| Cost outside default view | Memory that applies: “D004 cost out of the default view (show judge $ in the judge file only).” | PARTIAL | “The strip's LOG tail still shows the agents.log line (brief-specified).” |
| Reference shapes | Memory that applies: “Reference shapes: Tobi's "completion gate / obligation"; Harry's Torrent Objectives…” | N-A | none found |
| Save discipline | Constraints: “every save per L032/L045” | N-A | “`logs/scratch/019-wip/bin/controlroom` → `bin/controlroom.tmp` → `mv`” |
| Quoted template frontmatter | Work: “**`prompts/judge.md`** (pi prompt template, frontmatter quoted per L003)” | PASS | `prompts/judge.md`: `argument-hint: "<brief> <result>"` |
| Brief/result template inputs | Work: “inputs = brief path, result path” | PASS | `prompts/judge.md`: `argument-hint: "<brief> <result>"` |
| Table fields and verdict vocabulary | Work: “output = Markdown with a table `requirement · source…” | PASS | `prompts/judge.md`: “`| requirement | source | verdict | evidence |`” |
| Undeclared deviations section | Work: “then `## Undeclared deviations` (constraints violated with no entry in the result's `## Deviations`)” | PASS | `prompts/judge.md`: “`## Undeclared deviations`” |
| Unsupported claims section | Work: “`## Unsupported claims` (result statements with no evidence/label)” | PASS | `prompts/judge.md`: “`## Unsupported claims`” |
| Verdict and two why-lines | Work: “`## Verdict` one line `ACCEPT | ACCEPT WITH NOTES | REJECT` + 2-line why” | PASS | `prompts/judge.md`: “then 2 lines of why” |
| Cost tokens/dollars | Work: “`## Cost` tokens/$” | PARTIAL | “**`## Cost` is written by the CLI, not the model.**” |
| Report bounded to 120 lines | Work: “≤ 120 lines; quote, don't paraphrase.” | PASS | `prompts/judge.md`: “## Output — Markdown, ≤ 120 lines, in exactly this order” |
| CLI resolution and noninteractive run | Work: “resolves brief+result, runs `pi -p` (non-interactive) with the template” | PASS | “resolves via `SELF check <x> --json` (number / path / board agent → brief, result, num)” |
| Dedicated default and model overrides | Work: “default model `openai/gpt-6.1-sol` (cheap; env `CONTROLROOM_JUDGE_MODEL`)” | PASS | “default `openai/gpt-6.1-sol`, env `CONTROLROOM_JUDGE_MODEL`, `--model`” |
| Five-minute alarm | Work: “5-min alarm” | PASS | “`perl -e 'alarm 300'` (L001)” |
| Verdict printed and logged | Work: “prints the verdict line, logs `judge NNN: <verdict> ($x)` to agents.log.” | PASS | “`judge 003: REJECT (must: FAIL ×1) ($0.0234)`” |
| Pane worker mode | Work: “`--here` runs it in a Herdr pane as a worker named `judge-NNN` instead (for long results).” | PARTIAL | “**the pane path is proven to the launch call only**” |
| Idempotent overwrite | Work: “Idempotent: re-running overwrites.” | PASS | “`results/001-judge.md` single file, mtime advances, stamp line updated” |
| Hard requirement marking | Work: “a requirement line may start with `must:` (hard) — the judge marks these” | PASS | “must: Empty source directory succeeds with zero counts” |
| Hard FAIL refuses land | Work: “a `must:` FAIL makes `land` refuse like 018” | PASS | “`refused widget3 003-widget3 judge: must: FAIL — …`” |
| Force override and board note | Work: “`land --force` overrides, note on the board” | PASS | “Landed one-liner `widget3 shipped · judge: REJECT (forced)` · rc 0” |
| Other judgments advisory | Work: “Everything else is advisory: `land` prints the verdict and lands.” | PASS | “Landed one-liners `widget shipped · judge: ACCEPT` / `… · judge: ACCEPT WITH NOTES`” |
| Land ordering | Work: “order = `check` → `judge` … → move row” | PASS | “after the `check` loop” |
| Both judge opt-outs | Work: “skippable with `--no-judge` or room D-line `judge-off`” | PASS | “`grep -c 'judge:' STATUS.md` = 0” |
| Landed grade annotation | Work: “Landed one-liner gets ` · judge: ACCEPT` / `ACCEPT WITH NOTES` / `REJECT (forced)`.” | PASS | “Landed one-liner `widget3 shipped · judge: REJECT (forced)`” |
| Strip verdict by acceptance | Work: “Strip worker row shows the verdict next to `✓ acceptance`.” | PASS | “strip row showed `⚖ judge: ACCEPT WITH NOTES` next to this worker within a second” |
| README Judge documentation | Work: “README "Judge" paragraph (what it is, cost, how to opt out, `must:`)” | PASS | “README `#### Judge (019)` under Acceptance (what, cost, `must:`, opt-out, `--here`)” |
| SKILL documentation | Work: “SKILL rows” | PASS | “SKILL table row + `land` row + protocol bullet” |
| Controller hard-requirement guidance | Work: “controller prompt: "write `must:` only for requirements you'd refuse to land without".” | PASS | “**"write `must:` only for requirements you'd refuse to land without"**” |
| Good scratch result proof | Proof: “a brief + a good result → ACCEPT with ≥ 5 PASS rows and evidence quotes” | PASS | “**12 PASS** / 1 PARTIAL / 1 N-A, every PASS cell a verbatim quote” |
| Silent constraint violation proof | Proof: “the same result with one constraint silently violated → `## Undeclared deviations` names it” | PASS | “Instead: "committed as a1b2c3d on main". The commit is not declared in ## Deviations.” |
| Hard-failure and force proof | Proof: “a `must:` requirement unmet → REJECT and `land` refuses, `--force` lands with the note.” | PASS | “`judge widget3 … REJECT — forced past must: …`” |
| Two live verdicts with cost | Proof: “`controlroom judge 015` and `judge 014` on this room … report their verdicts and cost in the result.” | PASS | “`[11-17 16:09] judge 014: ACCEPT WITH NOTES ($0.0534) · docs/briefs/results/014-judge.md`” |
| Tick dry-run idle | Proof: “`controlroom tick --once --dry-run` → nothing to do.” | PASS | “`tick: nothing to do`” |
| Platform compatibility | Constraints: “bash 3.2 + python3 stdlib” | PASS | “Net **+76 lines** in `bin/controlroom` (≤ 120), 11 `(019)` markers, bash 3.2 + python3 stdlib.” |
| Markers and net line budget | Constraints: “`(019)` markers; ≤ 120 lines net in `bin/controlroom`” | PASS | “Net **+76 lines** in `bin/controlroom` (≤ 120), 11 `(019)` markers” |
| Template location | Constraints: “template in `prompts/judge.md`” | PASS | `prompts/judge.md`: `argument-hint: "<brief> <result>"` |
| No commits | Constraints: “no commits” | N-A | “No commits.” |
| Destructive testing in scratch | Constraints: “scratch for anything destructive” | N-A | “Scratch repo (L011): `mktemp -d` + `git init` (`logs/scratch/019-wip/scratch-path`)” |
| Time-box and skeleton-first | Constraints: “time-box 2 h; result skeleton first 10 min.” | N-A | “Time-box: ~1 h 35 min against 2 h; the result skeleton was written in the first 10 min” |
| Design and proof deliverable | Deliverable: “design as built · proof table” | PASS | “## Design as built” |
| Deviations and still-open deliverable | Deliverable: “deviations · still-open” | PASS | “## Still open” |
| Memory recorded | Deliverable: “memory lines recorded” | PASS | “`D032 **judge-advisory-must-hard**`” |
| Completion sentinel | Deliverable: “`DONE 019`; go idle.” | PASS | “DONE 019” |
| Go idle | Deliverable: “go idle.” | N-A | “Status: DONE · worker `judge` · 2026-11-17 · ~1 h 35 min · no commits (controller commits)” |

## Undeclared deviations
- none

## Unsupported claims
- none

## Verdict
ACCEPT
The objective and deliverables have quoted evidence; the cost, inlining, collision handling, and limited pane proof are declared.
No required change for acceptance; real-pane validation and hard-requirement recall remain documented follow-ups.

## Cost
36,914 in · 2,556 out (cache r 20,781 / w 16,124) · $0.0680 · openai/gpt-6.1-sol · 41 s
