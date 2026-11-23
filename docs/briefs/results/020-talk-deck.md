# 020 — talk-deck · result

Status: DONE · worker `talk-deck` (wC:pT) · 2026-11-23 13:34 → 13:48 CST (~14 min of a 2.5 h box) · read-only outside `docs/talks/` · no commits, no publishing.

## Deliverables
`docs/talks/controlroom-talk/`
- `deck.md` — Marp, 18 slides (19 `---` separators incl. frontmatter), theme `gaia` + `class: invert` (dark), 16:9, speaker notes as `<!-- -->` comments on every slide (100–121 words each)
- `deck.html` — 161 KB, self-contained
- `deck.pdf` — 18 pages, 185 KB (Chrome present; `--pdf --allow-local-files` worked first time)
- `notes.md` — 18 note sections + **Sources** (every number on every slide → file/command) + captures index
- `assets/` — 12 text captures (no PNGs; `herdr pane read` not needed — `controlroom status` / `herdr agent list` / `check` outputs saved as files)

## Build log (commands, in order)
```sh
cd docs/talks/controlroom-talk
# captures (read-only; other rooms touched only via `controlroom status` run from their repo — L037)
perl -e 'alarm 20; exec @ARGV' -- herdr agent list > assets/herdr-agent-list.raw.json          # 68 agents
NO_COLOR=1 COLUMNS=100 controlroom status | sed $'s/\x1b\\[[0-9;]*m//g' > assets/status-pi-controlroom.txt
controlroom check 019 > assets/check-019.txt                                                   # 9 pass · 1 fail (write-scope = my own files, L048)
(cd ~/src/github.com/shopify-playground/graph-search && HERDR_WORKSPACE_ID=wD HERDR_PANE_ID=wD:p1 NO_COLOR=1 COLUMNS=100 controlroom status) \
  | sed $'s/\x1b\\[[0-9;]*m//g' > assets/status-graph-search.txt
grep -E '^\| (A033|A040|A042|A043|A044) ' docs/briefs/AUTOMATIONS.md > assets/automations-excerpt.txt
grep -h 'turn aborted' logs/agents.log; grep -h 'prompt taken' logs/tick.log  > assets/prompt-uptake-lines.txt
grep '^\[11-17' ~/src/github.com/shopify-playground/graph-search/logs/agents.log > assets/agents-log-graph-search-11-17.txt  (selected lines)
for r in lookbook-research graph-search kumo-research upi-clustering-research taste-id-research; do ls $r/docs/briefs | grep -c '^[0-9]'; done
# build
npx -y @marp-team/marp-cli@latest deck.md --html -o deck.html
npx -y @marp-team/marp-cli@latest deck.md --html --pdf --allow-local-files -o deck.pdf
npx -y @marp-team/marp-cli@latest deck.md --html --images png -o /tmp/deckpng/s.png     # visual check of slides 1,5,6,7,9,10,12,13,15,16,17
```
Layout fixes after the first render: fixed `pre` font (15 px) instead of em-relative (Marp's auto-scaling had shrunk code blocks to ~12 px); slide 6 capture moved to full width with the legend tables beneath; memory lines wrapped by hand to ≤ 120 chars; slide 10 capture lines shortened to fit a half-width column.

## Slide-by-slide
| # | title | one line | capture |
|---|---|---|---|
| 1 | The one-liner | title + "closing the laptop pauses *me*, not the project" | — |
| 2 | Herdr + pi in 90 seconds | two columns; 68 agents on this laptop, 8 shown | `herdr-agent-list.txt` |
| 3 | Why I built it | September (~15 agents, chat as memory) + design §0 problem list + the 26 h worker | — |
| 4 | The operating model | README diagram + six-pieces table; footprint 2,335 lines bin/ · 98-line ext · 3 templates | — |
| 5 | A brief is a contract | 018 header + Acceptance block; live `check 019` (9 pass · 1 honest fail); judge line | `brief-018-…`, `check-019.txt`, `judge-lines.txt` |
| 6 | The board & the strip | full-width strip capture + field table + colour legend | `status-pi-controlroom.trimmed.txt` |
| 7 | Memory | grammar, 40/30, D002 D015 D031 + L005 L028 L046 verbatim, dream, flush 75 %, Boot order | — |
| 8 | Automations | ledger rows A033/A040/A042–A044, round-wake text, uptake log lines, guards | `automations-excerpt.txt`, `prompt-uptake-lines.txt` |
| 9 | Durability, honestly | 5-row "what survives what" (010 §3 → 012/013) + the 167 % storm in 4 beats | — |
| 10 | Remote machines | hosts table, `mode remote`, labels table, graph-search 3-host strip | `status-graph-search.rooms-agents.txt` |
| 11 | The projects | 7 rooms × what · briefs · one number · hosts (+ psd footnote) | — |
| 12 | A day in the life | graph-search 11-17 `agents.log`, 08:08 → 15:19 + 11-18 08:31; two-wakes footnote | `agents-log-graph-search-11-17.txt` |
| 13 | Publishing: lancedocs | flow diagram status-page → gh-pages + publishers.sh → lancedocs → GDocs; snapshots | — |
| 14 | Verification culture | 0.2.0 gate; S1–S10 grades before/after 012; 011 3 blockers; L032 symlink | — |
| 15 | Not Torrent | 013 table trimmed to 8 rows; Torrent bullets (paraphrased); borrowed = judge; bridge | — |
| 16 | Costs & models | model table (brief's 11-11 numbers); $27 vs $348/day; judge $0.07; rules; L091 | — |
| 17 | Future | hosted controller (pi.shopify.io), `launch --host`, **Tobi's workstations [Open]**, charters, Drive publisher, known gaps | — |
| 18 | Takeaways + links | 3 takeaways; install line; exec-overview path; live page URL | — |

## `[Open — Lance to fill]`
1. **Slide 17 — Tobi's remote workstations**: two placeholder bullets (`[Open — Lance to fill]` and `[Open — Lance to fill: what they are, how a room would use one]`). No source in this repo; nothing invented.
2. Slide 15 — the Torrent bullets are paraphrased from brief 020's summary of Slack; if you want a direct quote or a link on the slide, add it (constraint: no private-Slack quotes, so I left it paraphrased).
3. Slide 11 — the lookbook-research and personalized-search-demo preambles are still the untouched template; the "what it is" cells for those rows are my one-line summaries from their boards, not from a preamble you wrote.

## Deviations
- **Slide 5 — `controlroom check 019` shows 9 pass · 1 FAIL, not the "10 pass" the brief expected.** The FAIL is write-scope naming this deck's own untracked files (`docs/talks/…`, `results/020-talk-deck.md`) — write-scope is repo-global (L048). I kept the real output and annotated it on the slide rather than stage/stash files to fake a clean run. `notes.md` says so.
- **Slide 6 — "capture full" vs "monospace blocks ≤ 14 lines per slide".** The full strip is 30 lines; the slide shows 13 lines (header, ROOMS, AGENTS, TICK/COST/CTX/MEMORY/AUTOMATIONS) and the full capture is in `assets/status-pi-controlroom.txt`. PIPELINES/EVENTS/WAITING/BRIEFS lines are described in the field table instead.
- **Slide 7 — memory lines are quoted exactly but wrapped onto 2–3 lines each** so the block stays legible (a 250-char line auto-scales to ~9 px in Marp). Text unchanged.
- **Slide 12 — picked graph-search's 11-17, not pi-controlroom's 11-10/11-17.** This room's log for those days has no worker DONE / blocked / hand-off; graph-search's 11-17 has every beat the brief asked for (Boot, rounds, DONE, a question to Lance, land + publish, laptop closes → VM primary). Read-only; file cited.
- **Slide 15 — 013 is a comparison to Tobi's ULTIMATE harness, not to Torrent** (013 never mentions Torrent). The slide labels the table as such and carries the Torrent facts from the brief as separate bullets.
- **Slide 10 capture needed `HERDR_WORKSPACE_ID=wD HERDR_PANE_ID=wD:p1`**: run from my wC pane, `controlroom status` in graph-search showed wC's LOCAL agents (the strip scopes LOCAL by the caller's workspace env). Noted in Sources. Possible nit for `status` run from a foreign pane; not touched (no `bin/` edits).
- **`NO_COLOR=1` left ANSI escapes in the header line** of `controlroom status` (`[1m`, `[90m`); stripped with `sed` for the captures. Noted here as a tiny strip nit; no code touched.
- Footprint numbers on slide 4 use today's `wc -l` (2,335 lines bin/, 98-line extension, 3 templates) rather than exec-overview's 11-17 figures (~1,500 / 90 / 2); Sources says which is which.
- Marp built with `--html` (needed for the two-column `<div>` grid); the brief's command had no flag. No other theme or structure changes; `gaia` + `invert` is the dark variant.
- Speaker notes: one or two run to 121 words vs the 60–120 spec; left as is.

## Still open / suggestions (not done, not in scope)
- `controlroom status` from a pane in another workspace reports that pane's workspace as LOCAL — worth a `--room` or cwd-based scoping (not a `bin/` edit for this brief).
- graph-search memory is at 74 D / 162 L with `last dream never` — the deck says so on slides 11 and 17; a dream/consolidation brief there would make the "bounded memory" claim true in the biggest room.

DONE 020
