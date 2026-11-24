# Control-room portfolio — 2026-09-11 → 2026-11-24

*Lance Riedel · internal · written 2026-11-24 from the files in ten repos on this laptop (brief 022). Every number cites a file path or URL; `[Inferred]` marks reading between the lines; `$` figures are computed from pi session files on this laptop only and exclude dev002/c4d workers.*

This is a portfolio of research and engineering projects, each run as a **control room**: one person, one controller agent per project, worker agents in their own terminal panes, and a rule that everything that matters — briefs, results, board, decisions, lessons — is a Markdown file in git. Ten rooms opened between 11 September and 23 November 2026, on a laptop and two Shopify VMs (`dev002`, `c4d`). Three threads connect them: **(1) taste graph → graph-shaped search → personalization** — `lookbook-research` assembled Shopify's cross-merchant purchase/curation graph, `graph-search` put it inside the Vantage engine and proved a judged relevance lift, `taste-id-research` and `curated-scrapes` feed the next arms, `personalized-search-demo` and `kumo-research` tested the competing bets (dense/ANN, Kumo relational models); **(2) the catalogue itself** — `upi-clustering-research` and `product-knowledge` on identity and attributes at 10 B products; **(3) the tooling** — `pi-controlroom`, which runs all of the above, plus `gsd-reviews`, a review desk built on it.

## Summary

| project | purpose (one line) | briefs¹ | headline result | demo / page | repo · commits |
| --- | --- | --- | --- | --- | — |
| **graph-search** | Merchant graph inside Vantage: graph-shaped search at production latency, every result explained | 115 | gated graph keeper **+0.127 nDCG@10 [+0.112, +0.143]** vs plain, 300 seeds / 1,793 queries / 7.2 M docs, 16/28 ms p50/p95 (`results/015`) | [demo (IAP)](https://graph-demo-572522519687.us-central1.run.app/graph) · [overview gdoc](https://docs.google.com/document/d/1qwNdWI8xTJq9vgXfhiWVfjxfBVyFKDNPyo4tX9BoELI/edit) | [graph-search](https://github.com/shopify-playground/graph-search) · 589 commits 2026-11-07→2026-11-24 · 11309 files · last: _089: Cloud Run + IAP demo — final result (cold-start check, _ |
| **lookbook-research** | Build Shopify's taste graph (purchase + curation + concepts) and a lookbook demo on it | 64 | 155 M purchase edges from **334.7 M cross-merchant buyers / 3.06 M shops**; next-brand recall@10 **0.23 vs 0.07** popularity (`how-it-was-built.html`) | [bento demo (IAP)](https://lookbook-bento-572522519687.us-central1.run.app) · [dataset map](https://lancedocs.quick.shopify.io/lookbook/dataset-map.html) | [lookbook-research](https://github.com/shopify-playground/lookbook-research) · 81 commits 2026-06-23→2026-11-08 · 943 files · last: _status page 2026-11-08 16:16 EST_ |
| **personalized-search-demo** | Started as a KG re-ranking demo; became the strategy/doc room (Vantage vs turbopuffer, Kumo external brief, exec strategy) | 29 | 3 exec strategy pages published + 6 live docs incl. Vantage-vs-turbopuffer rev 13 (`results/022`, `STATUS.md`) | [turbopuffer vs Vantage](https://lancedocs.quick.shopify.io/search/turbopuffer-vs-vantage.html) · [strategy one-pager](https://lancedocs.quick.shopify.io/strategy/graph-search-strategy.html) | [personalized-search-demo](https://github.com/shopify-playground/personalized-search-demo) · 21 commits 2026-05-12→2026-11-11 · 281 files · last: _strategy docs: layer 2 is Catalog's CKG; taste graph is an e_ |
| **kumo-research** | Phase 1 (done): does the Kumo/NVIDIA relational FM beat cheap flat models? → No. **Phase 2 (from 11-24): a framework for using GNN / relational learning on catalog-quality problems — categorization first** | 67 | **No, decision-grade:** FM ties boosting (Δ −0.015 [−0.061, +0.032], n=160) and loses on adoption (−0.055 AUC) → STOP (D069) | closing memo `docs/briefs/reviews/gate4-addendum-kumo-catalog.md` | [kumo-research](https://github.com/shopify-playground/kumo-research) · 13 commits 2026-11-11→2026-11-24 · 207 files · last: _D072 pivot; board_ |
| **upi-clustering-research** | Evaluate UPI clustering at 10 B products; test shingling/signature candidate generation | 13 | real data: **45 % of records touched by a J≥0.7 text pair vs 25 % current UPI density**; candidates ∝ N^1.82 → K=50 budget makes it ∝ N^1.29 (`results/008`, `010`) | findings report `docs/status/preamble.md` | [upi-clustering-research](https://github.com/shopify-playground/upi-clustering-research) · 127 commits 2026-11-12→2026-11-24 · 73 files · last: _board: quiet round 09:35_ |
| **taste-id-research** | Where Taste ID stands and how it combines with the taste graph / graph search | 8 | model runs locally; proven result is same-category next-product **28/32/33 % vs 18 %** bar; search win unproven (`results/001`, `004`) | [where we stand](https://lancedocs.quick.shopify.io/taste-id-research/taste-id-where-we-stand-2026-11-17.html) | [taste-id-research](https://github.com/shopify-playground/taste-id-research) · 18 commits 2026-11-17→2026-11-23 · 38 files · last: _006: PinnerSage citation verified (arXiv 2007.03634)_ |
| **curated-scrapes** | Turn Andreas's curated-store graph (4,963 boutiques, 7 M products) into a `curated_stores` edge layer + scrapes | 5 | layer live on dev002; link prediction brand→store **hit@10 0.31 / @100 0.54** vs v_0_5 0.005 (graph-search `results/096`) | dev002 :4321/:4322 (laptop forward; no public page) | [curated-scrapes](https://github.com/shopify-playground/curated-scrapes) · 13 commits 2026-11-23→2026-11-24 · 28 files · last: _002 launched (next-five), 003 seed-experiment written + A004_ |
| **gsd-reviews** | Prepared briefs for every Vault review where Lance is OK1/OK2 | 4 | 6 prepared reviews + inbox table in ~75 min; proposed rule "No numbers, no click" (`results/001`) | none (private, status page off, D001) | [gsd-reviews](https://github.com/lanceriedel/gsd-reviews) · 4 commits 2026-11-18→2026-11-20 · 21 files · last: _memory: L003 proxy credential expiry_ |
| **product-knowledge** | Taxonomy governance + KG overlay; now the "Attribute Gap" proposal and the curated-demo host | 9 | TAE v2 page published, 5 results judged ACCEPT (`STATUS.md`) | [taxonomy-agent-enrichment](https://lancedocs.quick.shopify.io/catalog/taxonomy-agent-enrichment.html) | [product-knowledge](https://github.com/Shopify/product-knowledge) · 9 commits 2026-04-13→2026-11-23 · 54 files · last: _STATUS: pk-remote online on dev002 (w5), key refreshed; deci_ |
| **pi-controlroom** | The tooling: durable multi-agent project office over Markdown files | 23 | 10 rooms run on it; 10 durability scenarios S1–S9 pass live; briefs are enforceable contracts since 11-17 (`results/012`, `018`) | [status page](https://lanceriedel.github.io/pi-controlroom/status/latest.html) · [talk deck](https://docs.google.com/presentation/d/1cA6Zcc8aOezlUhsgetYiH3rBTEFIg6JtTDhEkJuF5ts/edit) | [pi-controlroom](https://github.com/lanceriedel/pi-controlroom) · 132 commits 2026-09-16→2026-11-24 · 103 files · last: _portfolio: summary table without status/started/hosts/$ colu_ |

¹ `ls docs/briefs | grep -c '^[0-9A-Z]'` as the brief specifies — includes ledger files (STATUS, AUTOMATIONS, README, PROTOCOL); numbered-brief counts are in the appendix.

## graph-search

**What it is.** A private Vantage (index-serving) stack on dev002/c4d holding Shopify's merchant graph — 142,631 shop/brand/concept nodes, 2.05–2.2 M edges — as ordinary collections, plus a Java `graph_walk` operator inside the broker so a search request hops merchant→neighbour relations in-engine and boosts or filters products by them. 7.2 M real products (1,571 graph shops) and a 15.8 M "haystack" variant; a `/graph` demo UI shows plain vs graph side by side with per-result explanations (`docs/status/graph-search-one-pager-2026-11-16.md`).

**Why.** Thesis: cross-merchant purchases plus merchants' own curation can make storefront search a *discovery* surface, served inside Vantage at production latency, with every result explaining itself — "data no competitor has". Not an assumed win: the graph must beat plain text (shown), the ANN+graph hybrid must beat both a strong seed-aware ANN and the graph keeper (open), and catalogue coverage must be measured (open) (`docs/status/preamble.md`).

**Where it stands (11-24).** Infrastructure done; keeper proven on covered merchants; impact share unknown. Since 11-17 the room has mostly waited on Lance's decisions (074 matched pilot, 078b demo default, 081/082 coverage audit, hygiene). 11-23: Andreas's curated-store graph integrated as `curated_stores` layer (092–095) and a link-prediction eval gave the room its first offline objective (096, D076). 11-24: 089 Cloud Run + IAP demo deployed (D077) — Shopify-reachable at one URL, per-user grants because an org policy forbids `domain:shopify.com` (`results/089`). Operators pushed to `Shopify/index-serving` branch `lanceriedel/graph-walk-operator`, not yet compiled on the rebased base (`STATUS.md` 11-16).

**Demonstrated.**
- Live demo behind IAP: https://graph-demo-572522519687.us-central1.run.app/graph (`results/089-cloud-run-iap-demo.md`); reference for every control: https://lancedocs.quick.shopify.io/graph-search/demo-reference.html (`results/020`).
- Document of record (overview, three figures, handoff, request flow): [gdoc](https://docs.google.com/document/d/1qwNdWI8xTJq9vgXfhiWVfjxfBVyFKDNPyo4tX9BoELI/edit); md twins `docs/status/graph-search-{overview,one-pager,request-flow}-2026-11-1*.md`, `executive-overview-2026-11-13.md`.
- Blind LLM-judged evaluations at 50 and 300 seeds on 1 M, 7.2 M and 15.8 M docs (`results/009`, `014`, `015`, `016`); landscape review vs Unicorn/Pixie/PinSage (`docs/status/graph-search-landscape-2026-11-17.md`).

**Key results.**
- Gated graph keeper **+0.127 nDCG@10 [95 % CI +0.112, +0.143]** vs our plain-text baseline, 300 seeds / 1,793 queries / 7.2 M docs, 217 seeds won / 82 lost, failure 2.6 % (`results/015`). Caveat: baseline is *our* Plain, not production ranking (L053).
- Over-boosting hurts: ×4 −0.023, 13.5 % failures (`results/015`); "brake pads" 0/20 → 18/20 right after the text gate (`results/014`).
- Latency exec p50/p95: Plain 6/13 ms, keeper 16/28 ms, flat 7.2 M → 15.8 M docs on one c4d box (`results/011`, `015`, `016`).
- Every ANN+graph hybrid so far at or below the keeper (0.551–0.621 vs 0.637); ANN alone +0.040 on identical ids (`results/026`, `030`, `031`) — the proof question of the 037 charter is **open**.
- Curated layer link prediction: brand→held-out store hit@10 **0.31 / hit@100 0.54** (2-round walk) vs popularity 0.028/0.31, v_0_5 0.005 (`results/096`).

**Learnings.** Half of the graph's gain at ×1 was the seed's own catalogue — test seed-free frontiers before claiming taste transfer (L023). An LLM judge favours literal matches, so graph gains read conservatively (`preamble.md`). A room that collapses its critical path onto one human approval idles every worker; keep independent design/review lanes running (L149). A "defect" in hybrid results was usually the graph being right (boosted items 80 % relevant vs 49 % text-only) — fix the condition, not the block (L155). Compute baselines on train edges only; the auto-judge rejects leakage even when the headline holds (L170).

**Next.** 089 cold-start + audience grants → 091 degree-aware walk on the 096 harness → 074 matched pilot (yes/no) · 078b default · 081/082 coverage and data-asset audits. Hygiene: strip fabricated PROOF_FIXTURES, compile/test the operator branch.

**People & dependencies.** index-serving team (operator PR, two engine asks, `Shopify/index-serving`); Andreas Pihlström's `curated-shop-graph` (via curated-scrapes); personalized-search-demo repo hosts the demo UI; LLM proxy credentials for unattended workers; access to raw transaction/collection tables and the production query encoder are the open asks (`one-pager` §Status and asks).

## lookbook-research

**What it is.** The taste-graph substrate for a "lookbook, not a chatbot" shopping experience: Shopify's cross-merchant purchase graph (buyer↔shop via Shop Pay identity), merchant curation (stocks, shared brands, collections), a concept layer from 224 M collection titles, scenes from purchase-graph communities, plus Astra open-web curation — served by an edge service on dev002 and shown through Andreas's bento canvas (`README.md`, `~/.brain/…/lookbook/how-it-was-built.html`).

**Why.** The Pinterest taste graph = bipartite engagement graph + typed vocabulary + multi-vector user model; Shopify has a stronger version of each input, *unassembled*. "Stores like this / people who shop here also shop there" needs no new model, just the graph (`docs/context.md` §3; collaborators Daniel Beauchamp, Andreas Pihlström, Kate Royer).

**Where it stands.** Build phase done Sep 11 → Oct 7 (briefs B–I, 010–042); October turned to synthesis — Catalog & Search owner's brief (044–047), Tobi drill-down (048), Kumo/NVIDIA proposal (050–052), CKG accomplishments (054), dataset map v2 (055, 11-07). No landed result since 11-08; the graph it built is the input to graph-search (served 81.7 M edges on dev002, `results/055`) and the Kumo thread moved to kumo-research. `docs/status/preamble.md` is an unfilled template `[Inferred: room paused rather than closed]`.

**Demonstrated.**
- Bento on Cloud Run + IAP, PURCHASE GRAPH mode, 3.2–4.6 s per query, graph stays on dev002: https://lookbook-bento-572522519687.us-central1.run.app (`results/033`).
- lancedocs pages: [how it was built](https://lancedocs.quick.shopify.io/lookbook/how-it-was-built.html) · [dataset map v2](https://lancedocs.quick.shopify.io/lookbook/dataset-map.html) (32 datasets) · [kumo plan](https://lancedocs.quick.shopify.io/lookbook/kumo-plan.html) · [FM vs taste graph](https://lancedocs.quick.shopify.io/lookbook/fm-vs-taste-graph.html) · [Catalog & Search owner's brief](https://lancedocs.quick.shopify.io/catalog/owner-brief-oct-2026.html) (19,185 words + 1,838-word summary, `results/047`) · [Kumo/NVIDIA proposal](https://lancedocs.quick.shopify.io/catalog/kumo-nvidia-partnership-2026-10.html) (`results/050`).
- Explanations on every edge: 19,926 LLM "why" sentences for $3.46, 99.98 % rule pass, 48/50 by hand (`results/019`).

**Key results.**
- Platform-wide graph: **155 M purchase edges, 334.7 M cross-merchant buyers, 3.06 M shops**, top-50k brands 96.8 % covered; 4.6 TB scanned once; 0 buyer-level rows persisted, k ≥ 20 (`results/012`, `how-it-was-built.html`).
- Curation layer **254 M edges** (stocks 140 M · shared-brands 20.6 M · collections 94 M) (`results/I2`); served store 81,711,973 edges in 48 groups (`results/055`).
- Validation: concept-sharing brand pairs co-purchase **45 % vs 0.8 %** random; co-purchase neighbours in the same merchant collection 65 % vs 20 %; next-brand recall@10 **0.23 vs 0.07** popularity (`how-it-was-built.html` §Check).
- Fashion v2 baselines: next-shop R@10 0.058 (7× popularity) (`results/C3`); learned blend shipped as default, retrieval-ceiling pass billed 4.94 TB under a 6 TB cap (`results/029`, `034`).
- Agreement across evidence families is rare — 99.93 % of 28.5 M pairs have one family — and that is the ranking signal (`results/019`).

**Learnings.** Brief finish lines must be `DONE NNN`; the verifier ignores other tokens (L001). Hidden scout subagents die digesting > 1 MB of results — split inputs or use a pane worker (L006/L007). lancedocs snapshots belong in docs-archive, never the public index (L003). Kumo start path is self-hosted open-source Engine on BigQuery, nothing gated (D001). Label policy: internal graph names any shop with "any sign of mattering"; external export keeps the hashed scrub (STATUS "Decisions" 09-17).

**Next.** `[Inferred from STATUS]` Long-lived proxy credential for the monthly Astra job; commit untracked 048–050 docs; decide whether this room closes into graph-search or resumes the lookbook front-end.

**People & dependencies.** Daniel Beauchamp, Andreas Pihlström (bento, Astra, Gluee), Kate Royer; Catalog/CKG team docs; BigQuery `shopify-dw` under an SMD lease; Kumo contact for a `dataViewer` service account (STATUS "Decisions waiting").

## personalized-search-demo

**What it is.** Began (May 2026 repo; room from 10-20) as a KG-driven re-ranking demo — same query, two personas, explainable divergent top-10 (`README.md`). The data pull was blocked by BigQuery 403 (`results/001`) and the room became the **writing and strategy desk**: Vantage vs turbopuffer, the external Kumo/NVIDIA brief, advisor proposal, Taste ID analysis, Commerce-Graph alignment, and the three executive graph-search strategy pages. It also hosts the graph-search demo UI code.

**Why.** Lance needed positions he could hand to Search/Catalog leadership and to an external partner, each verified against artefacts and mirrored to Google Docs.

**Where it stands.** MODE local; two-controller room since 11-06 (dev002 `psd-remote`, round-trip 65 s, `results/020`). Last landed 027 (strategy pages published after approval). Pending Lance: approve A+C positioning with Kshetrajna (015), six questions to Shuying/Khalil (012), advisor one-pager for Jennifer (009); search-demo stream still blocked on BQ (`STATUS.md` resume notes).

**Demonstrated.**
- [Vantage vs turbopuffer](https://lancedocs.quick.shopify.io/search/turbopuffer-vs-vantage.html) rev 13 (89,645 B) — reviewed with Jonathan's corrections (`results/002`, `006`, `007`).
- Strategy trio: [one-pager](https://lancedocs.quick.shopify.io/strategy/graph-search-strategy.html) · [how it works](https://lancedocs.quick.shopify.io/strategy/graph-search-how-it-works.html) · [relationship map](https://lancedocs.quick.shopify.io/strategy/graph-search-relationship-map.html), gdoc mirrors, name-grep zero hits (`results/022`, `027`).
- [Taste ID analysis](https://lancedocs.quick.shopify.io/catalog/taste-id.html) (`results/021`); external Kumo/NVIDIA Doc in Drive, **not sent** (`results/013`, `STATUS.md`).

**Key results.** turbopuffer's efficiency is real for $/GB and idle tenants (~$70/TB/mo vs $600–3,600) but not a latency win (cold p50 874 ms) (`results/002`). Exec strategy docs: 574 / 1,906 / 1,026 words, published 11-10 (`results/022`). Published Docs updated in place: created 0 / updated 3 / failed 0 (`results/027`). Taste ID read: 536 commits, one author, Oct 20 → Nov 2 (`results/021`).

**Learnings.** Two controllers, one repo: briefs carry a `host:` tag, only the primary edits the board, git is the hand-off (D001). Linux controlroom install needs both symlinks or the strip dies (L001). dev002 cannot push over HTTPS — the laptop pushes for it (L002).

**Next.** Lance's three pending decisions; park or chase BQ access for the original demo.

**People & dependencies.** Jonathan (Vantage review), Kshetrajna, Shuying, Khalil, Jennifer Zheng (named in `STATUS.md`); graph-search (demo code lives here).

## kumo-research

**What it is.** A bounded test of NVIDIA/Kumo relational foundation models on Shopify Catalog tasks with **no Shopify-derived rows leaving Shopify infra**: public harness → native fixtures on c4d → pre-registered pilots against cheap comparators, run by a PM persona (`kumo-pm`) and a research-lead persona (`kumo-jure`) who approve what the controller launches (D062).

**Why.** Jure Leskovec's belief that Kumo can be "greatly utilized" at Shopify; the lookbook Kumo plan proposed self-hosted Engine on BigQuery. The room asked the falsifiable version first: does the pretrained FM beat tuned flat models given identical inputs?

**Where it stands.** **Question 1 answered NO (D069, 11-13).** Reopened 11-17 for Question 2 (opportunity map, 061); paused 11-18 on Q6. **Direction reset 11-24 (Lance):** the room moves off the foundation-model question and onto *the framework* — how to use GNN / relational learning (Kumo or otherwise) to learn **product categorization** and the other catalog-quality problems we actually have (attribute gaps, duplicate/variant identity, taxonomy placement). Phase 1's memos stand as the closing record; the next briefs define the first catalog-quality task, its labels and baseline, and the relational model shape to test against it.

**Demonstrated.**
- Closing memo `docs/briefs/reviews/gate4-addendum-kumo-catalog.md`; status report `docs/research/status-report-2026-11-13.md`; opportunity map `docs/research/kumo-at-shopify-opportunity-map.md` (10 problems scored, top-3 O2/O1/O8).
- First real native construct + forward of a pretrained relational model on Shopify data inside Shopify infra (`results/051b`).

**Key results.**
- Pilot 052: FM NDCG@10 **0.31 vs co-stock heuristic 0.64** (Δ −0.325 [−0.466, −0.191], n=32) — ⅔ of that gap was our 120k-row input truncation (`results/052`, `058b`).
- Confirmatory 057 (n=160, 3 universes): FM given the heuristics' features **ties boosting**, pooled Δ −0.015 [−0.061, +0.032] (`results/057`).
- Temporal brand adoption 060: FM **−0.055 AUC [−0.082, −0.029]** vs 15-feature boosting, below its own flat arm → pre-registered stop rule met (`results/060`).
- ~70 native forwards total, zero exports; PM heartbeat cost ~$1/idle round, $35.6 cumulative before it was switched off (`STATUS.md` A073).

**Learnings.** Test fairness and feature saturation before model capacity — an RFM that reads structure well still lost to flat models on the same inputs (L069). Two NDCG implementations differed by 0.004–0.028; one shared scorer (L057). Native-session releases must be controller-issued IDs, not worker-transcribed chat (L060). Transport loops must whitelist files — a key-bearing contract was copied to a private dir and deleted a minute later; nothing left Shopify (L065). Standing machines should stay busy with parallel bounded jobs, no per-task SSH grant (D065).

**Next.** (1) Pick the first catalog-quality task (categorization is the default) and write down labels, baseline and the metric before any model. (2) Define the relational framing: which tables become nodes/edges, what the GNN sees that a flat model does not. (3) Run the same fairness discipline as Phase 1 (identical inputs, pre-registered stop rules) — the L069 lesson is the reason this phase exists.

**People & dependencies.** Jure Leskovec (real and persona), Privacy Eng gate, Merchant Success/Growth owner (O2), lookbook package (`docs/from-lookbook/`), dev002 + c4d.

## upi-clustering-research

**What it is.** An investigation room triggered by the Search Design Review "UPI clustering at 10 B products" (Boris Nazarov's team; review by Anton Vlasenko, 11-12): evaluate the design, map scale/identity/quality/cost/serving, and test an alternative — conservative identity signatures + shingling/MinHash for candidate generation (`README.md`).

**Why.** Lance's hypothesis that learned identity fields and shingles avoid repeated ANN work; the room's job was to measure, not assert.

**Where it stands.** Ten results in four days (11-12 → 11-16); idle since, no new launch. Blocker is an identity label on ~400 real pairs to turn agree / shingles-only / UPI-only into precision and recall (`docs/status/preamble.md` §Next). Remote boxes flapped overnight repeatedly (`STATUS.md` A001 rounds).

**Demonstrated.**
- Findings report with narrative table `docs/status/preamble.md` → `docs/status/latest.html`; design evaluation `results/001-design-eval.md`; runnable pilot `scripts/duplicate_yield.py` (35 tests, `results/004`).
- Real-data run: 9 whole categories, 10.13 M internal + 2.04 M external products, $9.73 billed, sha256-verified on c4d (`results/009`, `010`).

**Key results.**
- Synthetic ladder to 10 M on 48 cores in 38 min: map/shuffle linear, **candidates ∝ N^1.82**, verify 79 % of wall → "10 B is not a hardware question" (`results/006`).
- Per-record candidate budget K=50 is lossless: −88 % candidates, exponent 1.82 → 1.29, 30 M completed (`results/008`).
- Real data: **32–50 % of records per category touched by a J≥0.7 text pair (weighted 45 %) vs 25 % current UPI density**; 44–88 % of shingles-only pairs are same-shop templated listings (`results/010`).
- Current UPI behaves like a title matcher; title-only shingles at J≥0.9 track it with component recall 0.60–0.87 in 5/9 categories (`results/010` §4b).
- Capacity arithmetic: if "1–2 %" means of 10 T slots, a daily sweep needs ~289–579 GPUs — a denominator question, not a forecast (`preamble.md`).

**Learnings.** Never sample products for duplicates — take complete category slices as a stratified cluster sample (D006). Real text collisions are 5–11× below synthetic but verified pairs/record 7× higher (L017). Dup-heavy intuition is unreliable: the purposive pick was the lowest-density category (L015). Anchored J0.7 chains real listings into 10K–53K components; check component max first (L021). Workers do not commit result files unless the brief says so — 009 sat untracked 16 h (L022).

**Next.** Label ~400 real pairs; rerun title-only + anchor at J≥0.9 across all nine categories; obtain the Mint-gated architecture pre-read.

**People & dependencies.** Boris Nazarov's UPI team, Anton Vlasenko (design review); BigQuery `l2/l3_product_attrs`, `sharded_upi_assignments_latest` (Lance's identity is metadata-only on `working_set`, L014); c4d and dev002.

## taste-id-research

**What it is.** A research room on Taste ID — Kshetrajna's per-person nested taste code (`t1.…`, 16/64/256 bits; person half on-device, product half at the store, Qwen3-Embedding-0.6B underneath) — and how it combines with the taste graph and graph-shaped search as the third arm of the graph-search proof (`docs/status/preamble.md`).

**Why.** Leadership adopted the word (Search review 11-16, incubation brainstorm, Apple as hypothetical adopter) while the artefact froze and its author moved on; Lance wanted a full, sourced assessment first.

**Where it stands.** **Finish line TBD — Lance** (`STATUS.md`). Five briefs landed on 11-17; nothing since. Candidate finish lines on the board: SPEC gap analysis, the missing control, Apple-shaped simulation, Vantage code-score spike.

**Demonstrated.** [Where we stand (lancedocs + gdoc)](https://lancedocs.quick.shopify.io/taste-id-research/taste-id-where-we-stand-2026-11-17.html) (`results/003`); internal state `docs/design/001-…`, external landscape `docs/design/002-…` (Koodos/Shelf, meCore, Qloo, Topics API), meeting prep pack `docs/design/005-…`; model smoke test — `big-a-mixrw` runs on the laptop first try, quickstart byte-identical to the model card, 8 personas nest and are distinct, MPS = CPU (`results/004`).

**Key results.** Proven: same-category next product in top-10 **28 / 32 / 33 % at 16 / 64 / 256 bits vs 18 %** popularity bar on 7,261 held-out shoppers (`docs/status/taste-id-where-we-stand-2026-11-17.md`). Not proven: the search win (every interval spans zero; the product-tower control never ran) and cross-store transfer. Tobi's `SPEC.md` PR #1 open, unreviewed, unowned since Oct 22. SID-LLM is already in production (RQ-KMeans over SPE v3, 3 × 8,192) — Taste ID × SID designs start there (D004). Nobody else ships a receiver-scored nested code (`002`).

**Learnings.** `gh repo clone` gives main only — fetch all branches and list PRs before claiming "no spec" (L003). Shopify HF org needs org read scope + SSO + 2FA per token; each missing one is a different 403 (L006). A prompt to a warm done worker sat unread 75 min — verify uptake within 2 min (L010). Wake rounds must include a tool call or the tick scores them "not taken" (L012).

**Next.** Lance picks the finish line; decide the meCore call and Koodos research call.

**People & dependencies.** Kshetrajna, Javier Moreno (authors), Tobi (SPEC), Sarthak, Juhana (SID-LLM), Antoine; HF `Shopify/taste-id`; lookbook-research and graph-search.

## curated-scrapes

**What it is.** The CURATED track: scrapes of curated multi-brand stores made with Andreas Pihlström's `curated-shop-graph` scraper, and the analysis that turns his graph (4,963 curated boutiques, 7.0 M products, 367-kind taxonomy, towns, Catalog matches) into graph-search's `curated_stores` edge layer. This room scrapes, syncs, analyses, proposes; graph-search owns Vantage, Scripty and the demo (D005).

**Why.** Curation by merchants who *choose* what to carry is the strongest taste signal the graph lacked at boutique granularity; 096 showed the layer predicts its own held-out stockist edges where the old graph cannot.

**Where it stands.** Opened 11-23. 001 first scrapes landed and judged; four stores held; 002 (next five stores, CLI on dev002) running; 003 seed experiment queued behind it (`STATUS.md`). Andreas's 11-24 commit redefined "curated" as *like a seed* — 420 verified, was 1,827 (D010).

**Demonstrated.** Andreas's read-only app on dev002 :4321 and our writable copy on :4322 (laptop forwards) — no public page; `docs/scrapes/2026-11-23-first-two.md`; the layer served as `graph_edge/v_0_8` + `graph_node/v_0_4` on dev002 (graph-search `results/094`).

**Key results.** Offline objective (D008): brand→held-out store **hit@10 0.31 / hit@100 0.54**, store→brand 0.41 / 0.64; v_0_5 0.005 (graph-search `results/096`). Scrapes: garagegrowngear.com 1,352 products / 290 brands (001's #1 pick); motocampnerd.com 1,179 / 85; moskomoto.com 85.5 % house brand → brand-own, not curated (D007). Recovery grows with degree — q3 hit@100 0.76, q1 0.31; 44k brands / 18k stores cold-start, so new scrapes help most by adding train edges to thin nodes (L009).

**Learnings.** CLI scrapes under `AI=0` read no stockist lists, so nothing we scrape gets brand-vouched — ask Andreas (L007). For a Shopify store the Catalog match is by URL, so matched/products ≈ 1 by construction — not a confidence signal (L008). Fix brief typos only after the judge runs; editing first makes the judge see a contradiction (L005). Bookshop/stationery stores list authors as brands → degree hubs; damp and exclude from co-carry (L001).

**Next.** Land 002/003; answer whether 096 needs a second split before attributing gains to new scrapes; questions for Andreas (graph-search plan §7).

**People & dependencies.** Andreas Pihlström (scraper, dump behind Google IAP on Braincell, L011); graph-search `gs-controller`; dev002.

## gsd-reviews

**What it is.** Lance's GSD review desk: every Vault review where he is OK1/OK2 (plus OK-Inform acks) gets a prepared brief — the ask, evidence against the project's *own* success criteria, risks, sharp questions, a recommendation — so approve/decline takes minutes (`README.md`). Review contents are private and not reproduced here.

**Why.** Authors summarise; reviewers should check quoted criteria against artefacts actually opened. Labelling every claim `[Verified — source]` / `[Inferred]` and keeping Vault/GitHub/Slack read-only lets a worker do the legwork while Lance keeps the decision and the click (`docs/status/preamble.md`).

**Where it stands.** 001 landed 11-18: six prepared notes + `docs/reviews/INBOX-2026-11-18.md` in ~75 min. Three decisions wait on Lance: adopt the standing rule, act on the inbox (~40 min), choose a cadence (daily sweep vs on demand) (`STATUS.md`).

**Demonstrated.** `docs/reviews/<id>-<slug>.md` × 6 and the INBOX table (`results/001-ok2-inbox.md`); judge report `results/001-judge.md` (advisory notes only). No public page by design (D001).

**Key results.** 0/5 blocking reviews had an OK1; all three Move-to-Done reviews closed with their own criteria unmet or unmeasured; Investment asks carried no people or cost → proposed rule **"No numbers, no click"** (`preamble.md` §Steps).

**Learnings.** `land` needs a markdown link to the result in the Workers row, not a backticked path (L001). Wakes fired while the laptop is offline abort with Connection error; the tick re-prompts — not a stuck controller (L002). Check the proxy credential before launching a sweep (L003).

**Next.** Lance's three decisions; then a weekly inbox rule.

**People & dependencies.** Vault via Tool Gateway `vault_*` MCP (read-only); pi-controlroom's judge.

## product-knowledge

**What it is.** Sibling to `product-taxonomy` (repo since April; room opened 11-23): taxonomy governance and a knowledge-graph overlay. The room's first job was to rewrite the *taxonomy-agent-enrichment* lancedocs page as a new proposal — "The Attribute Gap — from eight angles" (audits, agentic quality, API primitives, commerce graph, personas, Kumo, KG overlay, scale) — and then to host Andreas's curated-shop-graph demo on dev002 (`STATUS.md`, D004).

**Why.** Current thinking on Catalog attributes had moved (K's commerce-graph position, Sarthak's agentic-ML-layer threads, Kumo's outcome) and the public page was a September revision (L002).

**Where it stands.** 006 published 11-23 14:48; 007 `curated-demo.service` on dev002 :4321 with laptop tunnel 15:52; dev002 controller `pk-remote` online. Next: 008 scraper walk on dev002 — needs a seed store from Lance. Parked: Tobi's "find all implicit state machines" analysis of the universal scraper.

**Demonstrated.** [taxonomy-agent-enrichment](https://lancedocs.quick.shopify.io/catalog/taxonomy-agent-enrichment.html) (5 inline SVG, no plan section, no named-person critique — D003); recon results 001–003 (current thinking, Slack landscape, Kumo latest) and PM synthesis 004, all five judged ACCEPT WITH NOTES (`results/00N-judge.md`); `bin/curated-demo.sh`, 15-min poller for new curated-graph builds (`STATUS.md` Pipelines).

**Key results.** TAE v2 pipeline recon → synthesis → rewrite in one day (D001). Kumo in TAE v2 = NVIDIA path, task-specific RDL models for attribute imputation; kumo-research's D069 STOP covers only the pretrained RFM (D002). `[Inferred]` No measured numbers yet — this is a proposal room so far.

**Learnings.** lancedocs live deploy root is `~/.brain/memory-bank/personal/docs`; never run the old `~/data/docs-OLD/deploy-lancedocs.sh` — it would wipe ~54 live pages (L002, L003). `controlroom land` runs an LLM judge per worker (~45 s) — run it in the background (L004). Never commit `AUTOMATIONS.md` — a tracked copy made dev002's tick fire the laptop's wake (L007).

**Next.** 008 seed from Lance; ping Andreas on the fixed dump; decide the scraper state-machine analysis.

**People & dependencies.** Andreas Pihlström (curated graph); Kshetrajna, Sarthak (positions synthesised in 004); `product-taxonomy`; dev002 `pk-remote`.

## pi-controlroom

**What it is.** The tooling under every room: a ~1,500-line bash+Python CLI, one pi extension and two prompt templates that turn a folder of Markdown files into a durable multi-agent project office — controller, workers in Herdr panes, briefs → results, board, sourced memory, a 60-second tick with wakes/watches, a live strip and a published status page, two-controller remote mode (`docs/exec-overview.md`).

**Why.** In September the plan lived in the controller's chat and every failure came from that one fact — compaction, crash, sleep lost the reasoning (`docs/talks/controlroom-talk/notes.md` §3). Files first; agents disposable.

**Where it stands.** 0.2.x verified; 19 result files landed (001–021); since 11-17 briefs are contracts (`writes:` scope, `## Acceptance` block, declared deviations; `land` refuses failing rows, D031) with an advisory LLM judge at land (D032). Talk deck for ~50 engineers delivered 11-23 (020/021). Waiting on Lance: pi-host inputs (017). Eight controllers alive across rooms on 11-24 (`STATUS.md`).

**Demonstrated.**
- Live status page https://lanceriedel.github.io/pi-controlroom/status/latest.html (`results/015`); [exec overview](docs/exec-overview.md); [talk deck in Slides](https://docs.google.com/presentation/d/1cA6Zcc8aOezlUhsgetYiH3rBTEFIg6JtTDhEkJuF5ts/edit) + notes (`results/020`, `021`).
- Durability: ten scenarios S1–S10 designed, code-reviewed (23 findings), fixed, re-tested — S1–S9 pass live with mechanism log lines (`results/009`, `011`, `012`); compaction loop verified live with no human typing `/compact` (L030).
- Comparison to Tobi's "ULTIMATE" harness (`results/013-tobi-comparison.md`).

**Key results.** 10 rooms on a laptop + 2 VMs; 30 decisions / 30 lessons in memory, every line cites a source (`exec-overview.md`). Built and verified in essentially two days for ≈ $117 (`results/013`). graph-search ran ~40 briefs / 37 worker sessions / 3 hosts in its first ten days on it (`exec-overview.md`). Failure found in use and fixed in the tool: compaction storm at 167 % ctx, 79 loops, ~$350 → 30-min breaker (L046). Laptop sessions in this cwd: $473 (appendix).

**Learnings.** A lesson asserting a mechanism needs a log line from that mechanism, not a pane glance (L028). Hidden subagents die on read-heavy work — use a Herdr pane (L021). launchd units bootstrapped from `~/.config` die on reboot; link into `~/Library/LaunchAgents` (L044). Write-scope checks are repo-global — parallel workers in one repo flag each other; use worktrees (L048). All controllers on claude-fable-5-1 (Sol too slow in the loop); switch = handoff + fresh session (D030).

**Next.** pi-host inputs (017); this portfolio (022); hosted controller once pi.shopify.io exposes an API (`exec-overview.md` limits).

**People & dependencies.** pi (Shopify fork, extensions/skills), Herdr (terminal multiplexer, local + remote), Shopify LLM proxy, GitHub Pages / lancedocs.

## Cross-project learnings

- **Time-box every computation and demand partial outputs.** A worker sat 26 h at 98 % CPU while the strip said "working" (pi-controlroom L005, curated L004); upi censored 30 M runs under RSS/time caps; graph-search bound deadlines to the actual process tree (L145).
- **Measure against the right baseline before claiming a win.** graph-search's gains are vs *our* Plain, not production (L053) and its ANN comparator turned out query-only (D060); kumo lost to a one-line heuristic once inputs were fair (L069); upi's yardstick is the current system, not truth (`preamble.md`); lookbook validated every layer against popularity (`how-it-was-built.html`).
- **Expiring proxy credentials are the #1 cause of overnight silence.** 24-h personal keys kill remote workers at 16:00 ET (graph-search L008); 401s aborted wakes in taste-id (L011), gsd-reviews (L003), product-knowledge (L006) and pi-controlroom (L039); graph-search automated rotation via launchd (results/017).
- **Files first, memory with sources.** Every room's `DECISIONS.md`/`LESSONS.md` line cites a path; the CLI refuses otherwise (pi-controlroom); kumo required controller-issued release IDs over chat (L060); graph-search's 170 lessons were what let three controller handoffs boot "from files" (STATUS 11-17).
- **Model choice is a policy, not a mood.** Controllers on claude-fable-5-1 (pi-controlroom D030, kumo D063, upi D004); no new investigations on Sol (graph-search D066); never switch a running session mid-stream (upi D004, curated D004).
- **Remote hosts are standing resources; the laptop is the identity.** dev002/c4d keep working when the lid closes; two-controller protocol with `host:` tags and git as the hand-off (psd D001, graph-search `MODE:` line, pi-controlroom `exec-overview.md`); keep both boxes busy with bounded parallel jobs (kumo D065).
- **Hidden subagents are wrong for read-heavy work.** They die at the 3–4-min no-output limit with nothing written (pi-controlroom L021, lookbook L006/L007); use a Herdr pane worker.
- **Briefs as contracts with a judge catch what headlines hide.** Acceptance blocks + `writes:` scope (pi-controlroom D031), auto-judge rejected 096 on train/test leakage though the headline stood (graph-search L170), rejected 001 on nits (curated L005), and read a judge report as a result until CLI artefacts were excluded (pi-controlroom L050).

## Appendix — how the numbers were computed; what was not read

**Cost.** `logs/022-costs.tsv` (this repo): for each room, `sum(message.usage.cost.total)` over every `*.jsonl` in `~/.pi/agent/sessions/<cwd-encoded>/`, python3 stdlib, 2026-11-24. Laptop only — dev002/c4d pi sessions (graph-search, kumo, upi, taste-id, psd, product-knowledge remote controllers and workers) are not on this disk. Session counts / assistant messages: product-knowledge 12 / 600 · lookbook 60 / 7,514 · psd 19 / 1,697 · graph-search 27 / 5,452 · kumo 21 / 4,142 · upi 6 / 698 · taste-id 4 / 415 · curated 3 / 147 · gsd 2 / 203 · pi-controlroom 27 / 1,855. LLM-judge spend inside graph-search (≈ USD 15) is separate and from result files (`executive-overview` §8).

**Briefs.** Table column uses the brief's formula. Numbered briefs only: product-knowledge 7 · lookbook 51 (+10 lettered B–I2) · psd 25 · graph-search 111 · kumo 64 · upi 10 · taste-id 5 · curated 3 · gsd 1 · pi-controlroom 20. Non-judge result files: 7 · 69 · 26 · 120 · 79 · 10 · 5 · 1 · 1 · 19. Memory lines (incl. superseded): graph-search 76 D / 169 L · kumo 40 / 30 · pi-controlroom 30 / 30 · upi 7 / 22 · curated 10 / 12 · taste-id 4 / 12 · lookbook 6 / 8 · product-knowledge 4 / 7 · psd 1 / 2 · gsd 1 / 3.

**Started.** Earliest pi session in the room's cwd, cross-checked with the git date `docs/briefs/STATUS.md` was added: lookbook 09-09/09-14 (09-11 used, the brief's period start); pi-controlroom 09-21; psd sessions from 09-16 but first results 10-20, board 11-06; graph-search 11-07; kumo 11-11/11-13; upi 11-12/11-13; taste-id 11-17; gsd 11-18; curated 11-23; product-knowledge 09-03 sessions (pre-room), board 11-23. **Status** labels are mine: *active* = a launch or land in the last 3 days; *paused* = the board says so or no land since the date given; *new* = opened within a week.

**Not read / could not verify.** Google Docs and Slides were not opened (links copied from result files). lancedocs pages are SSO-gated; only the local HTML sources under `~/.brain/memory-bank/personal/docs/` were read (lookbook). gsd-reviews' `docs/reviews/*.md` were deliberately not read beyond file names. The upi Quick-site architecture pre-read is Mint-gated (room's own note). Graph-search results 040–068 (proof-campaign capture/evaluator work) were read only through the preamble table and executive overview, not individually. Kumo results 001–044 (public harness phase) likewise summarised from the preamble narrative. lookbook and psd `docs/status/preamble.md` are unfilled templates, so "Where it stands" there is inferred from STATUS and git log. No `controlroom` command was run in any other room; no pane was touched (L037).
