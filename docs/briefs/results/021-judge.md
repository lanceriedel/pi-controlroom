# 021 — judge · docs/briefs/021-talk-edit.md vs docs/briefs/results/021-talk-edit.md

2026-11-23 14:51 · model `openai/gpt-6.1-sol` · `controlroom judge 021` · 43 s · 1 file read(s)

## Requirements
| requirement | source | verdict | evidence |
|---|---|---|---|
| Edit the whole deck for clarity and flow | Objective: “make the entire deck read cleanly for ~50 engineers” | PASS | “Slide 1 names the three take-aways that slide 19 closes with.” |
| Preserve sourced facts; remove sources with cut numbers | Memory that applies: “L028 claims need a source — do not introduce numbers or claims that are not in `notes.md` Sources…” | PARTIAL | “cut numbers' source lines removed (lifetime $342/$651, +1,054 lines / ms, 08:40 L160 line, D002/L046 lines” |
| Stay within permitted write scope | Constraints: “`docs/talks/**` only; no new facts without a source; keep the illustrative-composite label on slide 6…” | PARTIAL | “Nothing outside `docs/talks/**`, this result and `logs/021-talk-edit-build.log` was written.” |
| No bin edits | Memory that applies: “L037 read-only outside `docs/talks/`; no `bin/` edits. L002 save `deck.md` after every slide you finish.” | N-A | “Nothing outside `docs/talks/**`, this result and `logs/021-talk-edit-build.log` was written.” |
| Save after every finished slide | Memory that applies: “L037 read-only outside `docs/talks/`; no `bin/` edits. L002 save `deck.md` after every slide you finish.” | N-A | none found |
| Honest voice and inference labels | Memory that applies: “Lance's standing style: honest, specific, no marketing; label `[Inferred]`/`[Open]` where it applies…” | PASS | “`[Inferred — Nov Slack threads]` and `[Inferred — not built]` labels” |
| Recurring blocked-needs-you message | Memory that applies: “Lance's standing style: honest, specific, no marketing; label `[Inferred]`/`[Open]` where it applies…” | PARTIAL | “Reading the strip: red is the only colour that needs a human” |
| One idea and claim title | Editorial principles: “**One idea per slide, stated in the title.**” | PARTIAL | “19/19 titles are claims or "X: claim"” |
| Preserve order; declare structural changes | Editorial principles: “Keep the 19-slide order; merging two slides or splitting one is allowed if the story improves…” | PASS | “Two **backup slides** (20, 21) hold the 8-row ULTIMATE table and the 10-row S1–S10 scorecard.” |
| Takeaway before tables/code | Editorial principles: “**Top line = the takeaway in one sentence**, plain English, before any table or code.” | PASS | “19/19 (`p.take`)” |
| Minimum text size | Editorial principles: “If a block needs < 14 px to fit, it has too much.” | PASS | “Smallest: slide 5 brief excerpt 14.5 px and its table 14.4 px” |
| Code blocks at most 12 lines | Editorial principles: “Terminal/code blocks ≤ 12 lines; tables ≤ 6 rows × 3 cols on a slide…” | FAIL | “11:13 incl. a wrapped ROOMS line” |
| Tables within size limit | Editorial principles: “Terminal/code blocks ≤ 12 lines; tables ≤ 6 rows × 3 cols on a slide…” | PARTIAL | “backup 20 is 8×4, 21 is 9×3 by design” |
| Approximately 60 prose words per slide | Editorial principles: “No slide needs more than ~60 words of prose.” | PARTIAL | “counting bullets and card text, eight slides exceed ~60 words (110–180).” |
| Gloss unfamiliar terms before use | Editorial principles: “First mention of brief, board, tick, round, land, judge, lancedocs, Torrent, ULTIMATE, pi.shopify.io, dev002/c4d…” | PARTIAL | “pi.shopify.io (18, "durable session")” |
| Internal IDs only on memory slide | Editorial principles: “Kill internal shorthand the audience won't know (D###/L### ids stay only where the slide is *about* memory…” | FAIL | “ids kept only as proof pointers” |
| Numbers support slide claims | Editorial principles: “Each number must support the slide's claim; otherwise notes.” | PASS | “outcome trimmed to the two numbers that support the claim (42 → 63 %, 13/13 tests; ms and +1,054 lines → Sources)” |
| Money and token facts only on costs slide | Editorial principles: “Keep "$" and token facts on the costs slide only.” | FAIL | “6.8 k tokens now under backup 20” |
| Spoken notes of 80–120 words with anecdotes | Editorial principles: “**Speaker notes carry the detail** — 80–120 words per slide, written as spoken, with the anecdote…” | PASS | “107–120 per slide (`len(note.split())`, em-dashes counted as words)” |
| First person, present tense; prohibited words/punctuation absent | Editorial principles: “**Consistent voice**: first person (Lance), present tense, no exclamation marks, no "leverage".” | PASS | “`grep -ci leverage deck.md` → 0; `grep -c '!' deck.md` → 0 outside code” |
| Publishing sentence, flow, bullets; paths in notes | Slide-specific asks: “**Publishing: lancedocs** — today it is a wall of monospace.” | PASS | “room files → generated page → GitHub Pages · lancedocs · Google Docs” |
| Verification claim and timeline, at most three numbers | Slide-specific asks: “**Verification culture** — title as a claim; show the gate as a timeline…” | PARTIAL | “10 scenario tests → review → fixes → re-tests → 0.2.0” |
| Minute-to-ship lesson with concrete example | Slide-specific asks: “one line on "lessons found in use ship within a minute" with one concrete example in notes.” | PASS | “"lessons ship within a minute" line; concrete example (11-10 reboot) in notes” |
| Two-tools contrast, borrowed ideas, bridge and inference labels | Slide-specific asks: “**Not Torrent — and not trying to be** — reframe as "two tools, two jobs"…” | PASS | “**3-row contrast** (unit of work · where it runs · how you steer) + "what I borrowed" + "the bridge"” |
| Move eight-row comparison to notes/backup | Slide-specific asks: “Drop the 8-row table to notes or a backup slide after 19.” | PASS | “8-row ULTIMATE table → backup 20” |
| Costs rules of thumb | Slide-specific asks: “**Costs & models** — lead with the rule of thumb (3 bullets: build/eval workers → fable…” | PARTIAL | “leads with 3 rules of thumb” |
| Costs table, storm lesson, numbers from 020 only | Slide-specific asks: “then one small table (3 models × 3 columns: sessions · $/turn · DONE rate) and the one-line storm lesson.” | PARTIAL | “model · sessions · ≈ $/turn · briefs DONE.” |
| Three future bets with why/missing; intentional placeholder | Slide-specific asks: “**Future** — three clear bets, each "what · why it matters · what's missing"…” | PASS | “Tobi's remote workstations `[Open — Lance to fill]` as one intentional bullet” |
| First and final slides mirror | Slide-specific asks: “make slide 1 and slide 19 mirror each other (promise → takeaways).” | PASS | “wording of the three points aligned with slide 1” |
| Rebuild HTML/PDF/PPTX with required flags | Build + proof: “Rebuild `deck.html`, `deck.pdf`, `deck.pptx` (`--html --allow-local-files`)…” | PASS | “`deck.html` 261 KB · `deck.pdf` 257 KB · `deck.pptx` 13.1 MB, 21 slides” |
| Render and inspect every slide | Build + proof: “render PNGs and inspect all 19 (+ any backup slides)” | PASS | `logs/021-talk-edit-build.log`: “pngs:       21” |
| No overflow or footer overlap; strip at least 15 px | Build + proof: “no overflow, no text under 14 px (except the illustrative strip on slide 6 at ≥ 15 px)…” | PASS | “strip 15.5 px (slide 6, allowed ≥ 15). Footer 12 → 14 px.” |
| Synchronize notes, order and Sources | Build + proof: “Update `notes.md` to match (slide order, notes, Sources).” | PASS | “generated from the deck's `<!-- -->` blocks (21 sections) + Sources rewritten” |
| Preserve required slide labels | Constraints: “keep the illustrative-composite label on slide 6 and the "005 predates Acceptance" label on slide 5…” | PASS | “slide 6 "Illustrative composite" ✓ · slide 5 "005 predates Acceptance (11-08)" ✓” |
| Two-hour time box | Constraints: “time-box 2 h; result skeleton first.” | N-A | “Status: DONE 2026-11-23 14:50 CST (≈ 1 h 25 min; time-box 2 h)” |
| Skeleton first | Constraints: “time-box 2 h; result skeleton first.” | N-A | none found |
| Per-slide before/after title, change, why | Deliverable: “per-slide before → after table (title · change · why)” | PASS | “| # | before (020 title) | after (021 title) | change | why |” |
| Readability checklist | Deliverable: “the readability checklist results, deviations (merges/splits, anything cut), `DONE 021`.” | PASS | “## Readability checklist (rendered PNGs of all 21 slides inspected, `/tmp/deckimg/`)” |
| Declare deviations and cuts | Deliverable: “the readability checklist results, deviations (merges/splits, anything cut), `DONE 021`.” | PASS | “**Memory lines dropped from slide 8**: D002 (automations detail, now on slide 9 in words) and L046 (carries `$350`).” |
| Completion sentinel | Deliverable: “the readability checklist results, deviations (merges/splits, anything cut), `DONE 021`.” | PASS | “DONE 021” |

## Undeclared deviations
- Code length: “Terminal/code blocks ≤ 12 lines”; result reports “11:13 incl. a wrapped ROOMS line” and “slide 6 strip 23 lines (brief's exception)”. The brief exempts the strip's font size, not its line count.
- Internal shorthand: “D###/L### ids stay only where the slide is *about* memory”; slide 10 instead has “ids kept only as proof pointers”.
- Token placement: “Keep "$" and token facts on the costs slide only”; result places “6.8 k tokens now under backup 20”.

## Unsupported claims
- none

## Verdict
ACCEPT WITH NOTES
The editorial deliverables and rebuild evidence are present; several size and scope departures are honestly declared.
For ACCEPT, fix or explicitly reconcile code length, non-memory IDs and backup token figures; clarify the partially evidenced editorial checks.

## Cost
16,639 in · 2,666 out (cache r 8,257 / w 8,376) · $0.0484 · openai/gpt-6.1-sol · 43 s
