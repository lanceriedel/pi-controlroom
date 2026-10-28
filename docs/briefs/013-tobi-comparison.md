# 013 — tobi-comparison: a readable document for Lance — pi-controlroom 0.2.0 vs Tobi's "ULTIMATE" harness

## Objective
Lance asked: *"a document that compares what I have done with this project vs what Tobi was showing — pros/cons, features, etc."* Write it for **him as the reader** (not for the controller): what each system is, a feature-by-feature comparison, honest pros/cons of each approach, where ours is better/worse/different-on-purpose, what's proven vs. on paper, and what to do next. He will likely share it, so it must stand alone.

## Memory that applies (verbatim; `controlroom memory` is the source)
- D001 facts-cut · D002 wakes-prompt-watches-dont · D004 cost-detail-view-only · D007 memory-via-briefs · D008 tick-runner-launchd · D014 dream-on-demand-after-batch · D015 controller-by-pane-id · D020 controller-arms-round-wake · D021 ledger-never-hand-edited · D027 0-2-0-committed
- L028 a claim about a mechanism needs a log line from that mechanism · L035 idle wakes fire late not never · L036 ctl-name-predicate-shared (found by Lance's other room this morning — real-world proof the multi-room story matters)
- Label claims **[Verified — path/command]** / **[Inferred]** / **[Open]**. No marketing.

## Inputs (read in this order; read-only)
1. `docs/briefs/results/010-tobi-scorecard.md` — the 21-row scorecard written **before** 012; its §4 gap and §3 durability verdict are now partly out of date. Re-grade rows where 012 changed the answer.
2. `docs/briefs/results/012-close-the-loop.md` — what got fixed and proven live (S3 `stuck?` pass, S6 extension-triggered compaction, heartbeat gate, Boot round wake).
3. `docs/briefs/results/009-durability-tests.md` — S1–S10 scenarios and their grades; S10 Herdr restart still untested.
4. `docs/briefs/results/011-code-review.md` "Still open" + 012's "Still open for 0.2.1" — the honest cons list.
5. `docs/design/durable-controlroom.md` §0–§1 (philosophy: files are the protocol, human closes the loop, no daemons/DBs) and `docs/briefs/results/003-critic.md` (what was deliberately cut and why).
6. `README.md`, `prompts/controller.md`, `bin/controlroom` help header (`controlroom` with no args), `controlroom memory`, `controlroom automations --all`, `git log --oneline | head -12`.
7. Tobi's reference = the screenshot described in `docs/briefs/010-tobi-scorecard.md` (coordinator "2 waiting on you" · Lander · LANDED 5 · Memory 6.8k = 13 decisions · 118 facts · 19 lessons · DREAM session 2 · AUTOMATIONS 5 incl. "Dream after a pause", "Dream before compaction" · IN FLIGHT 3 · PAUSE dialog, play after 120 min · "Automation A29 wakes me at 18:12 UTC" · status bar `dream 2 ready · Pausing… · 5 automations · warm · core changed → restart · $576 · 2.6M tokens`). We never saw his code — say so; everything about his internals is **[Inferred]** from the screenshot.

## Deliverable — `docs/briefs/results/013-tobi-comparison.md` (≤ 250 lines, Markdown Lance can paste into Slack/Obsidian)
1. **TL;DR** (≤ 8 bullets): what's the same idea, what's different on purpose, the single biggest strength and weakness of ours.
2. **What each system is** (one paragraph each): Tobi's = a custom harness/UI with an in-app coordinator; ours = a ~1,100-line bash+python CLI over plain Markdown files + one 85-line pi extension, running inside Herdr panes, launchd tick, no daemons/DBs.
3. **Feature comparison table**: coordinator/controller · workers & lifecycle · landing/integration · memory (types, sourcing, budgets, archive) · dream/consolidation · automations (wake/watch/watch-path/round/flush/post-compaction) · pause/play · stuck/health alarms · compaction survival · cost/token visibility · UI/status bar · restart/durability · multi-room · verification evidence. Columns: Tobi (from screenshot) · pi-controlroom 0.2.0 · verdict (same / in spirit / ours better / his better / cut on purpose / open) · evidence tag.
4. **Pros of our approach** and **Cons / what Tobi's does that ours doesn't** — honest, each with a one-line why.
5. **Design choices made deliberately differently** (FACTS cut, no lander, dream on demand not nightly, human closes the loop, $ in detail only) — the reasoning in one sentence each, from the design/critic docs.
6. **What is proven vs. on paper**: S1–S9 live grades after 012; S10 and auto-flush ≥ 75 % untested; L036 as this morning's real-world find.
7. **What it cost and took**: `git log` dates, ~14 briefs, worker count, $ from `controlroom detail`/health if available (say [Verified] or [Inferred]).
8. **If you wanted to close the remaining gaps**: ≤ 6 items in order (status-bar badge/count of "waiting on you", `core changed → restart` indicator, Herdr-restart test, auto-flush ≥ 75 % test, tick.log rotation/health pruning, Dream before compaction?) with a one-line cost/benefit each.
End with `DONE 013`, then go idle. Write the skeleton (headings + table header) in the first 5 minutes.

## Constraints
- Read-only; no code changes, no `init`, no touching other rooms (L037), nothing committed. Time-box 30 min.
- Facts over adjectives; where 010 and 012 disagree, 012 wins (it is later and live-proven) — say "010 graded X; after 012: Y".
