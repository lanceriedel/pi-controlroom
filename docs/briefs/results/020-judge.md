# 020 — judge · docs/briefs/020-talk-deck.md vs docs/briefs/results/020-talk-deck.md

2026-11-23 13:49 · model `openai/gpt-6.1-sol` · `controlroom judge 020` · 39 s · 0 file read(s)

## Requirements
| requirement | source | verdict | evidence |
|---|---|---|---|
| 18-slide presentation in prescribed order | Objective: "18 slides following the outline below exactly (titles may be sharpened, order and content stay)" | PASS | "deck.md — Marp, 18 slides (19 `---` separators incl. frontmatter)" |
| Speaker notes, 60–120 words per slide | Objective: "speaker notes per slide (what he says, 60–120 words)" | PARTIAL | "Speaker notes: one or two run to 121 words vs the 60–120 spec; left as is." |
| Real machine captures | Objective: "real screenshots/text captures from this machine" | PASS | "assets/ — 12 text captures" |
| Honest, sourced numbers | Objective: "an honest tone — numbers from files, no marketing." | PARTIAL | "notes.md — 18 note sections + **Sources** (every number on every slide → file/command) + captures index" |
| Every slide number sourced in notes | Memory: "L028 claims need a source line — every number on a slide traces to a file/command in `notes.md`…" | PARTIAL | "notes.md — 18 note sections + **Sources** (every number on every slide → file/command) + captures index" |
| Other rooms read-only; approved capture method | Memory: "L037 never touch another room's state — read other rooms' files only; captures via `controlroom status`…" | N-A | "# captures (read-only; other rooms touched only via `controlroom status` run from their repo — L037)" — process not verifiable |
| Save partials early; no bin edits | Memory: "L002 save partials early · L032/L045 don't edit `bin/`." | N-A | "Noted in Sources. Possible nit for `status` run from a foreign pane; not touched (no `bin/` edits)." — save timing unverified |
| Cost slide uses supplied session-jsonl facts | Memory: "D004 $ in detail only → cost slide uses the session-jsonl numbers already computed (below), not live `health`." | PARTIAL | "model table (brief's 11-11 numbers); $27 vs $348/day; judge $0.07; rules; L091" |
| Acceptance block shown | Memory: "the \"brief is a contract\" slide must show the Acceptance block." | PASS | "018 header + Acceptance block; live `check 019` (9 pass · 1 honest fail); judge line" |
| Slide 1 operating one-liner | Slides: "1. **The one-liner** — one controller, many workers, everything is a file in git; closing the laptop pauses…" | PARTIAL | "title + \"closing the laptop pauses *me*, not the project\"" |
| Slide 2 pi/Herdr columns and eight-line capture | Slides: "2. **Herdr + pi in 90 seconds** — two columns: pi (agent, sessions, extensions, skills, Shopify proxy)…" | PASS | "two columns; 68 agents on this laptop, 8 shown" |
| Slide 3 motivation and September context | Slides: "3. **Why I built it** — the problem list from exec-overview §\"Why this shape\" + the September situation…" | PARTIAL | "September (~15 agents, chat as memory) + design §0 problem list + the 26 h worker" |
| Slide 4 diagram and six pieces | Slides: "4. **The operating model** — the README diagram (monospace box) + the six pieces table…" | PASS | "README diagram + six-pieces table; footprint 2,335 lines bin/ · 98-line ext · 3 templates" |
| Slide 5 check output and judge | Slides: "5. **A brief is a contract** — show `docs/briefs/018-acceptance-checks.md` header + `## Acceptance` block…" | PARTIAL | "**Slide 5 — `controlroom check 019` shows 9 pass · 1 FAIL, not the \"10 pass\" the brief expected.**" |
| Slide 6 full strip, fields and legend | Slides: "6. **The board & the strip** — capture `NO_COLOR=1 controlroom status` from pi-controlroom (full) and annotate…" | PARTIAL | "the slide shows 13 lines (header, ROOMS, AGENTS, TICK/COST/CTX/MEMORY/AUTOMATIONS)" |
| Slide 7 memory grammar, quotes and lifecycle | Slides: "7. **Memory** — grammar line, budgets 40/30, three real D lines + three real L lines (quote exactly)…" | PASS | "grammar, 40/30, D002 D015 D031 + L005 L028 L046 verbatim, dream, flush 75 %, Boot order" |
| Slide 8 automations and uptake logs | Slides: "8. **Automations** — AUTOMATIONS.md table excerpt (sanitize nothing; it's internal), the round wake text…" | PASS | "ledger rows A033/A040/A042–A044, round-wake text, uptake log lines, guards" |
| Slide 9 survival table, storm, breaker and fresh-session lesson | Slides: "9. **Durability, honestly** — table \"what survives what\" (compaction / restart / reboot / sleep / human absent)…" | PARTIAL | "5-row \"what survives what\" (010 §3 → 012/013) + the 167 % storm in 4 beats" |
| Slide 10 hosts, remote command, labels and capture | Slides: "10. **Remote machines** — hosts table (laptop · dev002 · c4d), `host:` header, `controlroom mode remote dev002`…" | PARTIAL | "hosts table, `mode remote`, labels table, graph-search 3-host strip" |
| Slide 11 seven project rows with counts and hosts | Slides: "11. **The projects** — 7 rows: room · what it is · briefs count · one number · hosts. Facts from each board." | PASS | "7 rooms × what · briefs · one number · hosts (+ psd footnote)" |
| Slide 12 06:00–22:00 timeline from one day | Slides: "12. **A day in the life** — timeline 06:00 → 22:00: Boot, round, worker DONE, blocked question, land, status page…" | PARTIAL | "graph-search 11-17 `agents.log`, 08:08 → 15:19 + 11-18 08:31; two-wakes footnote" |
| Slide 13 publishing flow, flags, preamble and archive | Slides: "13. **Publishing: lancedocs** — flow diagram: STATUS/health + preamble → `status-page` → latest.md/html…" | PARTIAL | "flow diagram status-page → gh-pages + publishers.sh → lancedocs → GDocs; snapshots" |
| Slide 14 verification gate and retests | Slides: "14. **Verification culture** — 0.2.0 gate: 009 scenarios S1–S10 grades, 011 review (3 blockers), 012 fixes…" | PASS | "0.2.0 gate; S1–S10 grades before/after 012; 011 3 blockers; L032 symlink" |
| Slide 15 comparison, borrowed gate and bridge | Slides: "15. **Not Torrent — and not trying to be** — the 013 comparison table (trimmed to 8 rows)…" | PARTIAL | "013 table trimmed to 8 rows; Torrent bullets (paraphrased); borrowed = judge; bridge" |
| Slide 16 supplied model facts and rules | Slides: "16. **Costs & models** — the model table above; rule of thumb: fable for build/eval workers…" | PARTIAL | "model table (brief's 11-11 numbers); $27 vs $348/day; judge $0.07; rules; L091" |
| Slide 17 future capabilities and explicit placeholder | Slides: "17. **Future** — controller as a hosted durable session (pi.shopify.io: what exists / what's missing)…" | PASS | "hosted controller (pi.shopify.io), `launch --host`, **Tobi's workstations [Open]**, charters, Drive publisher, known gaps" |
| Slide 18 takeaways, install and exec-overview URL | Slides: "18. **Takeaways + links** — 3 takeaways; `pi install git:github.com/lanceriedel/pi-controlroom`; exec overview URL…" | PARTIAL | "3 takeaways; install line; exec-overview path; live page URL" |
| Marp HTML and PDF build | Build: "Marp: `npx -y @marp-team/marp-cli@latest deck.md -o deck.html` and `--pdf`…" | PASS | "npx -y @marp-team/marp-cli@latest deck.md --html --pdf --allow-local-files -o deck.pdf" |
| Dark theme and 16:9 | Build: "Theme: default `gaia` or `uncover` with a dark variant; 16:9;" | PASS | "theme `gaia` + `class: invert` (dark), 16:9" |
| Monospace blocks ≤14 lines; one idea per slide | Build: "monospace blocks ≤ 14 lines per slide; one idea per slide;" | PARTIAL | "memory lines are quoted exactly but wrapped onto 2–3 lines each" |
| Notes in Marp comments and printable notes-only file | Build: "speaker notes as Marp `<!-- -->` comments *and* collected in `notes.md`." | PASS | "speaker notes as `<!-- -->` comments on every slide (100–121 words each)" |
| Text assets pasted into code blocks | Build: "Captures: text captures saved as files in `assets/` and pasted as code blocks (no images needed)" | PARTIAL | "assets/ — 12 text captures" |
| Read-only outside talks; no edits or publishing | Constraints: "Read-only outside `docs/talks/`; no `bin/` edits; no publishing (Lance will share the deck himself);" | N-A | "read-only outside `docs/talks/` · no commits, no publishing." — process not verifiable |
| No buyer/merchant data or private Slack quotes | Constraints: "internal details are fine (internal audience) but no buyer/merchant data and no quotes from private Slack." | PARTIAL | "constraint: no private-Slack quotes, so I left it paraphrased" |
| Time box, early skeleton, sequential fill | Constraints: "Time-box 2.5 h; write `deck.md` skeleton (18 titles) in the first 10 min and fill in order." | N-A | "2026-11-23 13:34 → 13:48 CST (~14 min of a 2.5 h box)" — skeleton/fill timing unverified |
| Required artifact set | Deliverable: "`docs/talks/controlroom-talk/{deck.md,deck.html,deck.pdf,notes.md,assets/}` and…" | PASS | "`deck.pdf` — 18 pages, 185 KB (Chrome present; `--pdf --allow-local-files` worked first time)" |
| Build log and slide summaries | Deliverable: "build log (commands), slide-by-slide one-line summary," | PASS | "## Build log (commands, in order)" |
| Open list, deviations and sentinel | Deliverable: "the `[Open — Lance to fill]` list, deviations, `DONE 020`." | PASS | "DONE 020" |

## Undeclared deviations
- Cost fact changed: brief "judge ≈ $0.06/review."; result "judge $0.07"; no matching deviation or source for the replacement.
- Timeline span and single-day requirement skipped: brief "timeline 06:00 → 22:00" and "Real timestamps from `logs/agents.log` of one day"; result "08:08 → 15:19 + 11-18 08:31". The declared room substitution does not declare these changes.
- Exec-overview URL replaced with a path: brief "exec overview URL"; result "exec-overview path; live page URL"; no matching deviation.

## Unsupported claims
- none

## Verdict
ACCEPT WITH NOTES
The artifact set and overall objective are evidenced; declared capture and note-length compromises are transparent.
Correct or source the judge cost, supply the requested timeline and overview URL, or explicitly declare those deviations.

## Cost
7,595 in · 2,869 out (cache r 0 / w 7,592) · $0.0477 · openai/gpt-6.1-sol · 39 s
