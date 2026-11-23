# 021 — talk-edit: a presentation editor's pass over the whole deck — clarity for a wide audience

host: local

## Objective
Lance reviewed `docs/talks/controlroom-talk/deck.md` (19 slides, Marp) and found the flow uneven: slides **Publishing: lancedocs**, **Verification culture**, **Not Torrent — and not trying to be**, **Costs & models**, and **Future** range from unclear to poorly written; the rest is acceptable but should be checked as part of one coherent story. You are the presentation editor: make the entire deck read cleanly for ~50 engineers, most of whom use pi, many Herdr, few the control room — people who should leave able to explain the idea in two sentences and know whether to try it. Edit for clarity and flow, not for new content; every fact stays sourced. Rebuild HTML/PDF/PPTX; the controller re-uploads to Slides.

## Memory that applies (verbatim; `controlroom memory` is the source)
- L028 claims need a source — do not introduce numbers or claims that are not in `notes.md` Sources or the inputs; if you cut a number, cut its source line too; if you need a fact, take it from the inputs below and add the source.
- L037 read-only outside `docs/talks/`; no `bin/` edits. L002 save `deck.md` after every slide you finish.
- Lance's standing style: honest, specific, no marketing; label `[Inferred]`/`[Open]` where it applies; "only *blocked* needs you" is the recurring line.

## Inputs
`docs/talks/controlroom-talk/{deck.md,notes.md,assets/}` (current deck + notes + captures; render slide PNGs with `npx -y @marp-team/marp-cli@latest deck.md --html --allow-local-files --images png -o /tmp/deckimg/s.png` and LOOK at every slide — overflow, tiny text, orphan lines are defects); `docs/exec-overview.md` (the intended narrative and tone); `README.md` (vocabulary, "Two controllers" section incl. the labels table, "Do I need git?"); `docs/briefs/results/013-tobi-comparison.md` (Torrent/ULTIMATE facts); `docs/briefs/results/009-durability-tests.md`, `012-close-the-loop.md` (verification facts); `docs/briefs/results/015-status-page.md` + graph-search `docs/status/publishers.sh` (lancedocs flow); `docs/briefs/STATUS.md` Notes 11-10 → 11-23 (storm, model hand-offs, mode command); `docs/briefs/020-talk-deck.md` (the original outline and the facts block — the model/cost numbers and the pi.shopify.io facts live there).

## Editorial principles (apply to every slide)
1. **One idea per slide, stated in the title.** Titles become claims where possible ("Verification is how it earned trust", not "Verification culture"). Keep the 19-slide order; merging two slides or splitting one is allowed if the story improves — say so in Deviations.
2. **Top line = the takeaway in one sentence**, plain English, before any table or code. A newcomer should get the point from title + first line alone.
3. **Cut, don't shrink.** If a block needs < 14 px to fit, it has too much. Terminal/code blocks ≤ 12 lines; tables ≤ 6 rows × 3 cols on a slide (otherwise split or move detail to notes). No slide needs more than ~60 words of prose.
4. **Define before use.** First mention of brief, board, tick, round, land, judge, lancedocs, Torrent, ULTIMATE, pi.shopify.io, dev002/c4d gets a 3–6 word gloss. Kill internal shorthand the audience won't know (D###/L### ids stay only where the slide is *about* memory; elsewhere write the lesson).
5. **Numbers earn their place.** Each number must support the slide's claim; otherwise notes. Keep "$" and token facts on the costs slide only.
6. **Speaker notes carry the detail** — 80–120 words per slide, written as spoken, with the anecdote; the slide carries the point.
7. **Consistent voice**: first person (Lance), present tense, no exclamation marks, no "leverage".

## Slide-specific asks (minimum)
- **Publishing: lancedocs** — today it is a wall of monospace. Make it: one sentence ("every landed brief republishes a page humans actually read"), a 3-box flow (room files → generated page → three destinations: GitHub Pages · lancedocs · Google Docs), and three bullets (narrative preamble vs generated facts · event-driven, never on a clock · identity-bound steps stay on the laptop). Keep paths in notes.
- **Verification culture** — title as a claim; show the gate as a timeline (scenario tests → review → fixes → re-tests → 0.2.0), with 3 numbers max (e.g. 10 scenarios, 3 blockers fixed, S3/S6 re-run green); one line on "lessons found in use ship within a minute" with one concrete example in notes.
- **Not Torrent — and not trying to be** — reframe as "two tools, two jobs": a 3-row contrast (unit of work · where it runs · how you steer), then "what I borrowed" and "the bridge" as two bullets. Label what is inferred from a screenshot/Slack. Drop the 8-row table to notes or a backup slide after 19.
- **Costs & models** — lead with the rule of thumb (3 bullets: build/eval workers → fable; controllers → fable unless you accept slower rounds; never mini for deliverables; never switch mid-session), then one small table (3 models × 3 columns: sessions · $/turn · DONE rate) and the one-line storm lesson. Numbers from 020's facts block only.
- **Future** — three clear bets, each "what · why it matters · what's missing", including pi.shopify.io durable sessions as the controller's future home and Tobi's remote workstations as `[Open — Lance to fill]` (keep the placeholder, make it look intentional: a single bullet, not two).
- **Everything else** — check against the principles; fix titles, top lines, overflow; make slide 1 and slide 19 mirror each other (promise → takeaways).

## Build + proof
Rebuild `deck.html`, `deck.pdf`, `deck.pptx` (`--html --allow-local-files`); render PNGs and inspect all 19 (+ any backup slides) — no overflow, no text under 14 px (except the illustrative strip on slide 6 at ≥ 15 px), footers not overlapped. Update `notes.md` to match (slide order, notes, Sources). Report a before/after one-liner per slide.

## Constraints
`docs/talks/**` only; no new facts without a source; keep the illustrative-composite label on slide 6 and the "005 predates Acceptance" label on slide 5; time-box 2 h; result skeleton first.

## Deliverable
`docs/briefs/results/021-talk-edit.md`: per-slide before → after table (title · change · why), the readability checklist results, deviations (merges/splits, anything cut), `DONE 021`.

## Acceptance
```sh
test -f "$ROOT/docs/talks/controlroom-talk/deck.html"
test -f "$ROOT/docs/talks/controlroom-talk/deck.pptx"
test "$(grep -c '^---$' "$ROOT/docs/talks/controlroom-talk/deck.md")" -ge 18
cr_has_section "$RESULT" "## Deviations"
cr_has_sentinel "$RESULT" 021
```
writes: docs/talks/**, docs/briefs/results/021*
