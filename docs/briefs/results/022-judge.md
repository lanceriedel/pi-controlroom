# 022 — judge · docs/briefs/022-portfolio-doc.md vs docs/briefs/results/022-portfolio-doc.md

2026-11-24 11:10 · model `openai/gpt-6.1-sol` · `controlroom judge 022` · 43 s · 1 file read(s)

## Requirements
| requirement | source | verdict | evidence |
|---|---|---|---|
| Executive portfolio covering every room consistently | Objective: "every project that runs as a control room, each in the same shape" | PASS | "10-row summary table (purpose · status · started · briefs · hosts · headline · demo/page · laptop-only $)" |
| Summary first, project pages after | Objective: "A summary table up front; one page per project after." | PASS | "one section per room with the same eight headings, each 17–25 lines" |
| Sourced numbers and artefact-backed demos | Objective: "numbers from files, demos only if there is an artefact (page, deck, video, result file) to point at." | PARTIAL | Portfolio: "Nobody else ships a receiver-scored nested code (`002`)." |
| Source claims and mark inference | Memory that applies: "L028 claims need a source — every number and every \"demoed\" claim carries a file path or URL;…" | PARTIAL | Portfolio: "graph-search 111 · kumo 64 · upi 10 · taste-id 5 · curated 3 · gsd 1 · pi-controlroom 20." |
| Read-only other rooms; no state commands or panes | Memory that applies: "L037 read-only in every other room: read files, never run `controlroom` commands that change state there,…" | N-A | "no `controlroom` state commands in other rooms, no panes touched." |
| Save partials early, one project at a time | Memory that applies: "L037 read-only in every other room: read files, never run `controlroom` commands that change state there,…" | PARTIAL | "Partial save was a 10-line skeleton rather than the finished two big sections" |
| Computed session costs confined to one column | Memory that applies: "L037 read-only in every other room: read files, never run `controlroom` commands that change state there,…" | FAIL | Portfolio: "Built and verified in essentially two days for ≈ $117 (`results/013`)." |
| Internal audience; no buyer/merchant-level data or private Slack quotes | Memory that applies: "Internal audience; project details are fine; no buyer/merchant-level data, no private-Slack quotes." | FAIL | Portfolio: "garagegrowngear.com 1,352 products / 290 brands (001's #1 pick); motocampnerd.com 1,179 / 85;" |
| Describe review desk without review contents | Inputs — the ten rooms: "README, `docs/reviews/INBOX-*.md` (describe the function; **no review contents** in the doc)" | FAIL | Portfolio: "all three Move-to-Done reviews closed with their own criteria unmet or unmeasured" |
| Markdown ≤400 lines | Deliverable: "Deliverable — `docs/portfolio-2026-11.md` in pi-controlroom (≤ 400 lines) + `docs/portfolio-2026-11.html`…" | PASS | "`docs/portfolio-2026-11.md` — 258 lines (cap 400)" |
| HTML via required renderer | Deliverable: "Deliverable — `docs/portfolio-2026-11.md` in pi-controlroom (≤ 400 lines) + `docs/portfolio-2026-11.html`…" | PASS | "`docs/portfolio-2026-11.html` — 50,139 B via `controlroom-md2html` (13 `<h2>`, 30 links)." |
| One framing paragraph, period and three themes | Deliverable: "1. **One paragraph** — what this portfolio is (research/engineering projects run as control rooms by one person…" | PASS | Portfolio: "# Control-room portfolio — 2026-09-11 → 2026-11-24" |
| Table includes all requested fields and rooms | Deliverable: "2. **Summary table** — one row per project: name · one-line purpose · status (active / paused / done / new) ·…" | PASS | Portfolio: "| project | purpose (one line) | status | started | briefs¹ | hosts | headline result | demo / page | laptop-only $² |" |
| Status uses specified vocabulary | Deliverable: "2. **Summary table** — one row per project: name · one-line purpose · status (active / paused / done / new) ·…" | PARTIAL | "**Status labels** (active / paused / idle / new) were not defined by the brief;" |
| Briefs landed count | Deliverable: "2. **Summary table** — one row per project: name · one-line purpose · status (active / paused / done / new) ·…" | PARTIAL | "so the column overstates by 3–4 per room." |
| Same eight headings and ≤35 lines per room | Deliverable: "3. **One section per project** (same headings every time, ≤ 35 lines): **What it is** (2–3 sentences) ·…" | PASS | "one section per room with the same eight headings, each 17–25 lines" |
| What it is: 2–3 sentences | Deliverable: "3. **One section per project** (same headings every time, ≤ 35 lines): **What it is** (2–3 sentences) ·…" | FAIL | Portfolio: "**What it is.** A research room on Taste ID — Kshetrajna's per-person nested taste code" |
| Why, phase, in-flight work and blockers | Deliverable: "3. **One section per project** (same headings every time, ≤ 35 lines): **What it is** (2–3 sentences) ·…" | PASS | Portfolio: "**Where it stands.** **Finish line TBD — Lance** (`STATUS.md`). Five briefs landed on 11-17; nothing since." |
| Demonstrated: bulleted linked artefacts | Deliverable: "3. **One section per project** (same headings every time, ≤ 35 lines): **What it is** (2–3 sentences) ·…" | PARTIAL | Portfolio: "**Demonstrated.** `docs/reviews/<id>-<slug>.md` × 6 and the INBOX table (`results/001-ok2-inbox.md`);" |
| Key results: ≤5 sourced numbers | Deliverable: "3. **One section per project** (same headings every time, ≤ 35 lines): **What it is** (2–3 sentences) ·…" | FAIL | Portfolio: "300 seeds / 1,793 queries / 7.2 M docs, 217 seeds won / 82 lost, failure 2.6 % (`results/015`)." |
| Learnings: ≤5 sourced lessons/decisions with IDs | Deliverable: "3. **One section per project** (same headings every time, ≤ 35 lines): **What it is** (2–3 sentences) ·…" | PARTIAL | Portfolio: "Label policy: internal graph names any shop with \"any sign of mattering\"; external export keeps the hashed scrub" |
| Next: ≤3 items | Deliverable: "3. **One section per project** (same headings every time, ≤ 35 lines): **What it is** (2–3 sentences) ·…" | FAIL | Portfolio: "089 cold-start + audience grants → 091 degree-aware walk on the 096 harness → 074 matched pilot (yes/no)" |
| People and dependencies grounded in room files | Deliverable: "3. **One section per project** (same headings every time, ≤ 35 lines): **What it is** (2–3 sentences) ·…" | PARTIAL | Portfolio: "Jonathan (Vantage review), Kshetrajna, Shuying, Khalil, Jennifer Zheng (named in `STATUS.md`)" |
| ≤8 cross-project learnings naming rooms | Deliverable: "4. **Cross-project learnings** — ≤ 8 bullets that recur across rooms (e.g. time-box compute, files first, model…" | PASS | "8 cross-project learnings · appendix (how numbers were computed, what was not read)." |
| Appendix explains computation and access gaps | Deliverable: "5. **Appendix** — how the numbers were computed; what you could not read." | PASS | Portfolio: "**Not read / could not verify.** Google Docs and Slides were not opened (links copied from result files)." |
| Result coverage, deviations and sentinel | Deliverable: "Then `docs/briefs/results/022-portfolio-doc.md`: coverage table (room · files read · gaps), deviations, `DONE 022`." | PASS | "| room | files read | gaps |" |
| Writes confined to portfolio and result | Constraints: "Read-only outside `docs/portfolio-2026-11.*` and the result; no `bin/` changes; no publishing (Lance decides…" | FAIL | "`logs/022-costs.tsv` — per-room cost aggregation" |
| No bin changes or publishing | Constraints: "Read-only outside `docs/portfolio-2026-11.*` and the result; no `bin/` changes; no publishing (Lance decides…" | N-A | "no publishing, no `bin/` changes" |
| Time-box 2.5 hours | Constraints: "Read-only outside `docs/portfolio-2026-11.*` and the result; no `bin/` changes; no publishing (Lance decides…" | N-A | "2026-11-24 ~09:50 → 11:10 MST (~80 min of the 2.5 h box)" |
| Save table and two biggest sections first | Constraints: "Read-only outside `docs/portfolio-2026-11.*` and the result; no `bin/` changes; no publishing (Lance decides…" | PARTIAL | "Partial save was a 10-line skeleton rather than the finished two big sections" |

## Undeclared deviations
- Write scope: "Read-only outside `docs/portfolio-2026-11.*` and the result"; instead, "`logs/022-costs.tsv` — per-room cost aggregation".
- Cost placement: "D004 $ belongs in one column"; instead, portfolio: "Laptop sessions in this cwd: $473 (appendix)."
- Privacy: "no buyer/merchant-level data"; instead, portfolio: "garagegrowngear.com 1,352 products / 290 brands".
- Review privacy: "**no review contents** in the doc"; instead, portfolio: "0/5 blocking reviews had an OK1".
- Description length: "**What it is** (2–3 sentences)"; several sections use one sentence, including "**What it is.** A research room on Taste ID".
- Numeric cap: "**Key results** (≤ 5 numbers with sources)"; graph-search alone includes "300 seeds / 1,793 queries / 7.2 M docs, 217 seeds won / 82 lost".
- Next cap: "**Next** (≤ 3)"; graph-search adds "078b default · 081/082 coverage and data-asset audits. Hygiene: strip fabricated PROOF_FIXTURES".
- Learning provenance: "from the room's `memory/LESSONS.md` + DECISIONS" and "ids in parentheses"; lookbook instead cites "STATUS \"Decisions\" 09-17".

## Unsupported claims
- none

## Verdict
ACCEPT WITH NOTES
The portfolio delivers the objective and all major deliverable components, with useful sources and honestly declared reading gaps.
Remove merchant/review details, confine costs and writes, and fix the undeclared section-limit and sourcing deviations for ACCEPT.

## Cost
23,427 in · 2,585 out (cache r 6,078 / w 17,343) · $0.0698 · openai/gpt-6.1-sol · 43 s
