# 021 — talk-edit · result

Status: DONE 2026-11-23 14:50 CST (≈ 1 h 25 min; time-box 2 h)
Worker: talk-edit · brief: `docs/briefs/021-talk-edit.md`
Deliverables: `docs/talks/controlroom-talk/{deck.md,deck.html,deck.pdf,deck.pptx,notes.md}` (assets/ unchanged). Build log: `logs/021-talk-edit-build.log`.

## What changed, in one paragraph
Every slide now has a **title that states its claim** and a **first line that is the takeaway** (`<p class="take">`), before any table or code. Terminal/code blocks are all ≤ 12 lines (strip on slide 6 excepted, per brief) and were re-wrapped so Marp's gaia auto-scaling no longer shrinks them under 14 px — the 020 deck had three blocks silently rendering at 12–13.5 px (slides 5, 8, 11) and a 12.96 px table (slide 5). **`$` and token figures now appear on the costs slide only** (removed from slides 6, 8, 10, 12; moved into 17). Internal ids (D###/L###/A###) stay only on the memory slide and the automations table; elsewhere the lesson is written out. First mentions of room, brief, board, landed, tick, round, judge, dev002/c4d, lancedocs, Torrent, ULTIMATE get a short gloss. Slide 1 names the three take-aways that slide 19 closes with. Speaker notes rewritten to 107–120 words each, spoken voice, with the anecdotes that left the slides. Two **backup slides** (20, 21) hold the 8-row ULTIMATE table and the 10-row S1–S10 scorecard. `notes.md` is generated from the deck's own `<!-- -->` notes so the two cannot drift, with a rewritten Sources section.

## Per-slide before → after

| # | before (020 title) | after (021 title) | change | why |
|---|---|---|---|---|
| 1 | Running a control room | *same* + sub-line naming the three take-aways | promise line added | mirrors slide 19 (principle: promise → takeaways) |
| 2 | Herdr + pi in 90 seconds | Two tools you already have: pi is the agent, Herdr owns the panes | title → claim; top line = "one pi, one pane, one job + four commands"; "room (= project)" glossed in the capture comment; capture line shortened to stop auto-scaling | define before use; one idea |
| 3 | Why I built it | Chat was the memory, and chat does not survive | title → claim; September line is the takeaway; bullets trimmed | top line = takeaway |
| 4 | The operating model | The operating model: one controller, files in between | "room" defined in the top line; **landed** and **round** glossed in the table; diagram redrawn in plain ASCII (box edges misaligned in the slide font) and cut to 9 lines | define before use; code ≤ 12 lines |
| 5 | A brief is a contract | A brief is a contract: exact inputs in, a checked result out | brief excerpt 26 → 12 lines (trimmed and re-wrapped, ≤ 73 chars); anatomy table 0.72 em (12.96 px) → 0.8 em (14.4 px); columns 1.4fr/1fr; "dev002 / c4d, two remote VMs" and **judge** glossed; outcome trimmed to the two numbers that support the claim (42 → 63 %, 13/13 tests; ms and +1,054 lines → Sources); "005 predates Acceptance" label kept | cut, don't shrink; numbers earn their place |
| 6 | The board & the strip | The strip is the board plus live state — one glance per room | title → claim; top line = "who is working, who is done, in red who needs me"; **illustrative composite** label kept; `COST` line dropped from the composite; MEMORY/AUTOMATIONS re-wrapped so no line exceeds the 15.5 px width | `$` on costs slide only; no auto-scaling |
| 7 | Reading the strip | Reading the strip: red is the only colour that needs a human | title → claim; one-line takeaway | the recurring line |
| 8 | Memory | Memory is two files, and no line gets in without a source | 6 memory lines → 4 (D015, D031, L005, L028; dropped D002 and L046 — L046 carries `$350`); re-wrapped to 12 lines ≤ 108 chars; bullets write out dream/flush/Boot without ids except where the slide is about memory | code ≤ 12 lines; `$` rule |
| 9 | Automations | Automations: the ledger is the state, the tick fires it | **wake** and **watch** defined in the top line; "D002 / D020 / L039" replaced by the lesson in words; guards line shortened to one line clear of the footer | define before use; kill shorthand |
| 10 | Durability, honestly | Durability, honestly: what survives what | 4-col table → 3 cols (proof folded into "what survives"); ids kept only as proof pointers; storm paragraph → one dim line without `$` (money → slide 17); table 14.25 → 16.5 px | tables ≤ 3 cols; `$` rule |
| 11 | Remote machines | Remote machines: a VM room carries the work while the laptop is shut | top line defines twin room / **primary**; "n4-standard-16 / c4-standard-48" → "16-vCPU / 48-vCPU VM"; labels table 4 → 3 rows (board `MODE:` row is in the bullet); capture re-wrapped to ≤ 57 chars at 15 px (was auto-scaled to ~13.5 px); tables 14.25 → 16.5 px | gloss; no text < 14 px |
| 12 | The projects | Every project I run is a room now | 7 rows × 5 cols → 6 rows × 3 cols (hosts → notes; gsd-reviews and personalized-search-demo → footnote); `≈ $1,050` removed from the graph-search row; "verified by 009–012" written as "four briefs (test, scorecard, review, fix)" | tables ≤ 6 × 3; `$` rule; kill shorthand |
| 13 | A day in the life — graph-search, Mon 2026-11-17 (`logs/agents.log`) | One real day: the room works, I answer one question, then I close the laptop | 14 log lines → 12 (dropped 08:40 lesson line); footnote writes "one recurring round per room" instead of "L163" | code ≤ 12 lines |
| 14 | Publishing: lancedocs | Publishing: every landed brief republishes a page humans actually read | monospace wall → one sentence + **3-box flow** (room files → generated page → GitHub Pages · lancedocs · Google Docs) + the three asked-for bullets; lancedocs glossed; paths moved to notes | brief's slide-specific ask |
| 15 | Verification culture | Verification is how it earned trust | 10-row table → **5-step timeline** (10 scenario tests → review → fixes → re-tests → 0.2.0) with 3 numbers (10 scenarios, 3 blockers, stuck?/compaction green); "lessons ship within a minute" line; concrete example (11-10 reboot) in notes; table → backup 21 | brief's ask; 3 numbers max |
| 16 | Not Torrent — and not trying to be | Two tools, two jobs: Torrent ships a team's PRs; a control room runs one person's project | **3-row contrast** (unit of work · where it runs · how you steer) + "what I borrowed" + "the bridge"; Torrent glossed; `[Inferred — Nov Slack threads]` and `[Inferred — not built]` labels; 8-row ULTIMATE table → backup 20 | brief's ask; label inference |
| 17 | Costs & models | Costs & models: fable does the work, sol is cheap, mini finishes nothing | leads with 3 rules of thumb; table 3 models × 3 cols (sessions · ≈ $/turn · briefs DONE), $/turn derived from 020's numbers; one-line storm cost; lifetime controller spend ($342/$651 — not in 020's facts) cut with its source line; `$…$` math-parse bug fixed (`\$`) | brief's ask; numbers from 020 only |
| 18 | Future | Future: three bets | **three cards** (hosted controller on pi.shopify.io · Tobi's remote workstations `[Open — Lance to fill]` as one intentional bullet · room-level charters), each what · why · missing; the rest as one dim "also queued" line | brief's ask |
| 19 | Takeaways | Three things to take away | title mirrors slide 1's promise; wording of the three points aligned with slide 1; "rounds every 2 h" | mirror |
| 20 | — | Backup · Tobi's "ULTIMATE" harness vs this room (brief 013) | new backup slide; the 8-row table from old slide 16, labelled screenshot-inferred | detail off the main slide |
| 21 | — | Backup · The 0.2.0 scorecard: ten scenarios, before and after the fixes | new backup slide; the S1–S10 table from old slide 15 | detail off the main slide |

## Readability checklist (rendered PNGs of all 21 slides inspected, `/tmp/deckimg/`)

| check | result |
|---|---|
| overflow / text under the footer | none — tightest is slide 9's guards line, now one line ending ~40 px above the footer |
| text < 14 px | none. Smallest: slide 5 brief excerpt 14.5 px and its table 14.4 px; `small` tables 14.04 px (slides 2–4, 16–17 use 0.78–0.95 em of 18 px); `tiny` tables 16.5 px (`.wide`); strip 15.5 px (slide 6, allowed ≥ 15). Footer 12 → 14 px. Marp auto-scaling checked by line length: longest code line per block ≤ the width at its font size (slide 2: 102 chars @17 px; 5: 75 @14.5 in a 1.4fr column; 6: 125 @15.5; 8: 106 @17; 9: 121 → trimmed; 11: 57 @15 px in a half column; 13: 113 @17) |
| code blocks ≤ 12 lines | yes (slides 2:9, 4:9, 5:12+5, 8:12, 9:6+3, 11:13 incl. a wrapped ROOMS line, 13:12, 19:3); slide 6 strip 23 lines (brief's exception) |
| tables ≤ 6 rows × 3 cols | yes on slides 1–19 (4: 6×2, 5: 6×2, 7: 5×2 + 5×3, 10: 5×3, 11: 3×2 + 3×3, 12: 6×3, 16: 3×3, 17: 3×4 — one extra column (model name + 3 facts), judged clearer than two tables); backup 20 is 8×4, 21 is 9×3 by design |
| prose ≤ ~60 words | title + take + dim lines are ≤ 60 everywhere; counting bullet/box text too, slides 3, 8, 9, 11, 14, 15, 17, 18 run 110–180 words — those are structured bullets/cards, not paragraphs; each bullet is one line or two |
| one idea per slide, title as claim | 19/19 titles are claims or "X: claim" |
| top line = takeaway before table/code | 19/19 (`p.take`) |
| defined before use | room (2, 4) · brief/board/landed/tick/round (4) · judge (5) · dev002/c4d (5) · wake/watch (9) · primary/standby (11) · lancedocs (14) · Torrent (16) · ULTIMATE (16 → 20) · pi.shopify.io (18, "durable session") |
| `$` only on the costs slide | yes — `grep -n '\$' deck.md` outside slide 17 hits only shell `$RESULT/$ROOT` and `$ herdr` |
| labels kept | slide 6 "Illustrative composite" ✓ · slide 5 "005 predates Acceptance (11-08)" ✓ · slide 18 `[Open — Lance to fill]` as one bullet ✓ · `[Inferred]` on slide 16 (twice) and slide 20 ("screenshot-inferred") ✓ |
| voice | first person, present tense, no exclamation marks, no "leverage" (`grep -ci leverage deck.md` → 0; `grep -c '!' deck.md` → 0 outside code) |
| speaker notes 80–120 words | 107–120 per slide (`len(note.split())`, em-dashes counted as words), spoken voice, anecdotes carried (26-h worker, 11-10 reboot, storm, two round wakes) |
| notes.md matches deck | generated from the deck's `<!-- -->` blocks (21 sections) + Sources rewritten; cut numbers' source lines removed (lifetime $342/$651, +1,054 lines / ms, 08:40 L160 line, D002/L046 lines, 6.8 k tokens now under backup 20); added: `≈ $/turn` derivation, "eight rooms" definition, vCPU gloss, lancedocs gloss, ASCII-diagram note |
| builds | `deck.html` 261 KB · `deck.pdf` 257 KB · `deck.pptx` 13.1 MB, 21 slides (`unzip -l` count); all `--html --allow-local-files`; 0 errors in `logs/021-talk-edit-build.log` |

## Acceptance
`controlroom check 021` at 14:52 → **9 pass · 0 fail** (5 brief checks + 3 defaults + write-scope). `grep -c '^---$' deck.md` = 22 ≥ 18.

## Deviations
- **Two backup slides added after 19** (20: ULTIMATE comparison, 21: S1–S10 scorecard). The brief allows "a backup slide after 19" for the Torrent table; I used the same mechanism for the verification scorecard so slide 15 could become the 5-step timeline the brief asked for without losing the per-scenario evidence.
- **Slide 17 table is 3 × 4, not 3 × 3** — model · sessions · ≈ $/turn · briefs DONE. The model name is the row key; splitting into two tables read worse. `$/turn` is derived (963/3,921 · 39/1,491 · 39/1,769) from 020's facts and marked ≈; sol's DONE count is not in 020, shown as "— (not tracked)" rather than invented.
- **Slide 12 is 6 rows, not 7**: gsd-reviews moved to the footnote with personalized-search-demo to meet "≤ 6 rows × 3 cols"; the hosts column moved to Sources.
- **Slide 5 brief excerpt is re-wrapped, not just trimmed** (section headings on the same line as their first item) to fit 12 lines at ≥ 14.5 px in a half-width column; labelled "trimmed and re-wrapped" on the slide and in Sources. The hypothetical Acceptance block's `test -f` path and `writes:` line were shortened (it is already labelled hypothetical).
- **Slide 4 diagram redrawn in plain ASCII** (`+--|`) because the box-drawing glyphs `←` and `·` are not monospaced in the slide font and broke the right edge.
- **Slide 6 composite lost its `COST …` segment** and the MEMORY/AUTOMATIONS line was split in two — to honour "`$` on the costs slide only" and to avoid the auto-scaling shrink. The label and everything else in the composite is unchanged.
- **Prose word count**: counting bullets and card text, eight slides exceed ~60 words (110–180). I treated the limit as applying to paragraph prose (title + takeaway + closing line), which is ≤ 60 everywhere; the bullets are one-liners. Flagging it rather than cutting content the brief asked for (e.g. the three bullets on 14, three cards on 18).
- **Memory lines dropped from slide 8**: D002 (automations detail, now on slide 9 in words) and L046 (carries `$350`). Replaced by nothing — four real lines read better than six.
- Nothing outside `docs/talks/**`, this result and `logs/021-talk-edit-build.log` was written. `docs/briefs/AUTOMATIONS.md` shows modified in `git status` — that is the tick, not me.

## Open / for the controller
- Re-upload to Slides from the new `deck.pptx` (21 slides) and the notes Doc from `notes.md`.
- Slide 18 bullet 2 still needs Lance's words on Tobi's remote workstations (one bullet, kept intentional).

DONE 021
