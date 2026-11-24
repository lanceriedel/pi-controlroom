# 022 — portfolio-doc: an exec-level portfolio of every control-room project — what it does, what it has shown, what we learned

host: local (reads nine repos on this laptop; read-only)

## Objective
Lance wants one document he can hand to a peer or exec: every project that runs as a control room, each in the same shape — what it is, why it exists, where it stands, what has been demonstrated (with links), the numbers that matter, what we learned, what is next, and what it cost. A summary table up front; one page per project after. Honest and specific: numbers from files, demos only if there is an artefact (page, deck, video, result file) to point at.

## Memory that applies (verbatim; `controlroom memory` is the source)
- L028 claims need a source — every number and every "demoed" claim carries a file path or URL; `[Inferred]` where you are reading between lines; nothing invented.
- L037 read-only in every other room: read files, never run `controlroom` commands that change state there, never touch panes. L002 save partials early (one project section at a time). D004 $ belongs in one column, from session files, labelled as computed.
- Internal audience; project details are fine; no buyer/merchant-level data, no private-Slack quotes.

## Inputs — the ten rooms (local paths; most have a dev002/c4d twin — read the local clone)
| room | path | start here |
|---|---|---|
| product-knowledge | `~/src/github.com/Shopify/product-knowledge` | README, `docs/briefs/STATUS.md` if present (w7 `controller-w7`) |
| lookbook-research | `~/src/github.com/shopify-playground/lookbook-research` | README, `docs/plans/`, `docs/briefs/STATUS.md`, `docs/status/preamble.md`, results 001–054 + lettered; lancedocs pages `~/.brain/memory-bank/personal/docs/lookbook/*.html` (dataset-map, kumo-plan, fm-vs-taste-graph, how-it-was-built) |
| personalized-search-demo | `~/src/github.com/shopify-playground/personalized-search-demo` | README, STATUS, results (001–012 incl. gdocs-mirror, kumo/nvidia exec brief), `docs/external/` |
| graph-search | `~/src/github.com/shopify-playground/graph-search` | README, `docs/status/preamble.md` (narrative step table), STATUS, `docs/status/*-overview*.md`, `*-one-pager*.md`, `*-request-flow*.md`, results 001–0xx; demo artefacts under `docs/status/img/`, `evidence/`, `reports/` |
| kumo-research | `~/src/github.com/shopify-playground/kumo-research` | README, STATUS, preamble, results (033 public-native-harness etc.) |
| upi-clustering-research | `~/src/github.com/shopify-playground/upi-clustering-research` | README, STATUS, preamble, results 001 design-eval, 002 context-scout, 003 shingle-blocking, 009/010 real-slice |
| taste-id-research | `~/src/github.com/shopify-playground/taste-id-research` | README, STATUS, preamble (goal may still be TBD — say so) |
| curated-scrapes | `~/src/github.com/shopify-playground/curated-scrapes` | README, STATUS, results (new room, wM `curated-controller`) |
| gsd-reviews | `~/src/github.com/lanceriedel/gsd-reviews` | README, `docs/reviews/INBOX-*.md` (describe the function; **no review contents** in the doc) |
| pi-controlroom | `~/src/github.com/lanceriedel/pi-controlroom` | `docs/exec-overview.md`, README, results 009–021, `docs/talks/controlroom-talk/notes.md` |
Cost per room (optional column, labelled "computed from pi session files"): run the aggregation used on 11-11 — sum `usage.cost.total` over `~/.pi/agent/sessions/<cwd-encoded>/*.jsonl` per room; dev002/c4d sessions are not on this laptop — say "laptop only" where that applies. Briefs count: `ls docs/briefs | grep -c '^[0-9A-Z]'`.

## Deliverable — `docs/portfolio-2026-11.md` in pi-controlroom (≤ 400 lines) + `docs/portfolio-2026-11.html` via `controlroom-md2html`
1. **One paragraph** — what this portfolio is (research/engineering projects run as control rooms by one person with agents), the period (Sep 11 → today), and the two or three themes that connect them (taste graph → graph-shaped search → personalization; catalog/UPI; the tooling itself).
2. **Summary table** — one row per project: name · one-line purpose · status (active / paused / done / new) · started · briefs landed · hosts · headline result (one number or artefact) · demo/page link · laptop-only $ (computed).
3. **One section per project** (same headings every time, ≤ 35 lines): **What it is** (2–3 sentences) · **Why** (the question or bet) · **Where it stands** (phase, what is in flight, blockers) · **Demonstrated** (bulleted artefacts with links: pages, decks, result files, measured numbers; "none yet" is a valid answer) · **Key results** (≤ 5 numbers with sources) · **Learnings** (≤ 5, from the room's `memory/LESSONS.md` + DECISIONS, rewritten as sentences, ids in parentheses) · **Next** (≤ 3) · **People & dependencies** (teams/repos it relies on; names only where the room's files name them).
4. **Cross-project learnings** — ≤ 8 bullets that recur across rooms (e.g. time-box compute, files first, model choice, remote hosts), each with the rooms it came from.
5. **Appendix** — how the numbers were computed; what you could not read.
Then `docs/briefs/results/022-portfolio-doc.md`: coverage table (room · files read · gaps), deviations, `DONE 022`.

## Constraints
Read-only outside `docs/portfolio-2026-11.*` and the result; no `bin/` changes; no publishing (Lance decides where it goes); time-box 2.5 h — write the table and the two biggest rooms (graph-search, lookbook-research) first, save, then the rest.

## Acceptance
```sh
test -f "$ROOT/docs/portfolio-2026-11.md"
test -f "$ROOT/docs/portfolio-2026-11.html"
cr_max_lines "$ROOT/docs/portfolio-2026-11.md" 420
cr_grep "$ROOT/docs/portfolio-2026-11.md" "^## graph-search"
cr_grep "$ROOT/docs/portfolio-2026-11.md" "^## lookbook-research"
cr_has_section "$RESULT" "## Deviations"
cr_has_sentinel "$RESULT" 022
```
writes: docs/portfolio-2026-11.*, docs/briefs/results/022*
