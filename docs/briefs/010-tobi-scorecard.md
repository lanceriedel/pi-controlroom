# 010 — tobi-scorecard: how well does pi-controlroom 0.2.0 deliver "Pi durable", feature by feature, vs the reference?

## Objective
The original ask was: *"Tobi is showing this — says Pi durable is key — what could we add to pi-controlroom to do this?"* We designed, critiqued, and shipped five slices. **Grade the result against the reference, honestly.** For each element visible in Tobi's ULTIMATE harness, say what we built, how it differs (by design or by omission), point at the evidence in this repo, and grade: **matches · matches-in-spirit · partial · intentionally cut · missing**. Then answer the real question: *is this control room now durable in the sense he meant* — an agent whose memory, schedule and in-flight state survive compaction, restarts, sleep and human absence — and what's the gap that matters most. Read-only. No code.

## The reference (what the screenshot showed — treat as the spec)
**Left column:** ULTIMATE coordinator agent ("2 waiting on you") · **Lander** agent (idle) · **LANDED 5** list (batches · commits · age) · **Memory 6.8k — 13 decisions · 118 facts · 19 lessons · History #1** · **DREAM session 2 — "Settled… Ready for a fresh chapter… Fall asleep →"** · **AUTOMATIONS 5** — `wake #792 in 15m`, `Watch rubys/roundhouse — fired 3`, `Dream after a pause — armed`, `Dream before compaction — armed` · **IN FLIGHT 3** (coordinator run + workers #1040 … done) · **PAUSE dialog** — "waiting for 2 tasks to finish; nothing new starts. Play by itself after 120 min."
**Center:** coordinator's final answer — lander merged `3467b6c`, six fixes listed, *"Automation A29 wakes me at 18:12 UTC to run its round. From that round I'll check: …"*
**Right:** **Memory — "What every new branch starts from"**: DECISIONS with slug · age · one-liner (`project-rules · 2d · Core changes only if clearly neutral…`), FACTS 118.
**Status bar:** `dream 2 ready to fall asleep · Pausing… 2 tasks running · Play · 5 automations · warm · core changed → restart · 1 setup issue · live gen 1 · tailnet · v3-r25 871/957 · $576 · 2.6M tokens`.
**Tabs:** Agent / System / Review. Model + thinking selectors.

## Inputs (read all; cite by path)
- The conversation's framing is in `docs/briefs/003-durable-design.md` ("The reference pattern") and the controller's 6-point outline is reflected in `docs/briefs/results/003-critic.md` (what was cut and why — FACTS, lander, $-bar, auto-prompting watches, nightly dream).
- `docs/design/durable-controlroom.md` — what we said we'd build.
- `docs/briefs/results/004…008-*.md` — what was built, with each worker's proofs and deviations.
- Live state: `bin/controlroom` (`controlroom status`, `automations`, `memory`, `health`, `detail` output — run them), `docs/briefs/memory/*.md`, `docs/briefs/AUTOMATIONS.md`, `docs/briefs/STATUS.md` (incl. `## Landed`, `## Retired`), `logs/agents.log`, `logs/tick.log`, `extensions/controlroom.ts`, `prompts/controller.md`, `README.md` (new Durability section).
- If `docs/briefs/results/009-durability-tests.md` exists by the time you write the verdict, incorporate its scorecard (a parallel worker is running scenario tests); otherwise say it wasn't available.

## Deliverable — `docs/briefs/results/010-tobi-scorecard.md`
1. **Scorecard table** — one row per reference element (≈ 18 rows: coordinator, lander, landed ledger, typed memory (decisions / facts / lessons / counts / age), "what every branch starts from", dream session, dream-after-pause, dream-before-compaction, wake automations, watch automations, "A29 wakes me at…" reply convention, in-flight list, pause/drain/auto-play, warm/cold, core changed → restart, cost/tokens, status bar as a whole, review tab / model selectors). Columns: reference · ours · grade · evidence (path or command output) · note (design choice vs gap).
2. **Where we're better** (be specific — e.g., every memory line must cite a source; everything is plain files; a human closes the loop by default) and **where we're clearly behind** (e.g., no UI; a Markdown table instead of a panel; 60 s tick latency; dream is manual).
3. **The durability verdict** — for each of: *compaction · controller crash/restart · Herdr/laptop restart · sleep · human absent for a day · worker silently stuck* — does the system survive it today? cite the mechanism and the proof (or lack of one). Three sentences each.
4. **The gap that matters most** — one paragraph, and what the next brief should be.
5. A ≤ 10-line executive summary at the top for Lance.

## Constraints
- Read-only: no edits to any file except your result. Running `controlroom status|automations|memory|health|detail` is fine; don't arm, launch, pause, or dream.
- Label every claim **[Verified — path/command]** or **[Inferred]**. If a proof is only in a worker's result (not independently observed), say "per 00N results".
- ≤ 200 lines. Tables over prose. Finish with the sentinel line `DONE 010` and go idle.
