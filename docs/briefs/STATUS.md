# STATUS — control room board (pi-controlroom)
**Where to go:** Herdr workspace `wC` → tab **CONTROLLER** (agent `controller`). Talk to it; it briefs, launches, integrates.

## Workers
| pane | agent | brief | state | result |
|---|---|---|---|---|

## Notes
- 10-28 — **0.2.0 committed** `327109a` (not pushed); logs/ + dream scratch gitignored. Open for 0.2.1: see results/012 'Still open'.
- 10-28 08:02 — Round A027 #1 (daily): room empty, nothing to integrate; recorded L034 quote-from-arg, L035 idle-wake-late-not-never. Still waiting: **commit 0.2.0?**
- 10-27 23:47 — Rounds #3/#4 empty (fired 6 min late each — sleep; L035). Round backed off: A025 cancelled → **A027 weekdays 08:00** while idle; re-arm `wake 2h` when work launches. Still waiting: **commit 0.2.0?**
- 10-27 19:40 — Round A025 #2: dream judged (6 promote/4 reject, 6 supersedes incl. dup D019). Memory 24 D · 27 L · 0 proposed. Still waiting: **commit 0.2.0?**
- 10-27 17:40 — Round A025 #1: 012 landed; 0.2.0 verified (S1–S9 pass, S10 untested). L027→L030. Lessons at 28/30 → dream requested. **Ready to commit 0.2.0** — waiting for Lance's word.
- 10-27 15:25 — Verification round done (009/010/011 landed). Verdict: **not safe to commit** until 012 lands (ledger blockers, stuck? FAIL, flush<75 bug, controller continuity). L023 superseded by L027 (extension did not compact; typed /compact did). Standing round wake A025 armed (17:39, every 2h). 012 proof /flush at 15:41 (ctx 8%) → flushed D020, replied /compact.

## Decisions waiting on the human
_(none)_

## How to use the agents
`herdr agent list` · `herdr agent read <name> --source recent-unwrapped --lines 60` · `herdr agent prompt <name> "…"` · `herdr agent focus <name>`
Only **blocked** needs a human. New work → `docs/briefs/<X>.md` (objective · inputs · constraints · deliverable · where to write) → ask controller to launch.
Results land in `docs/briefs/results/`; chat is ephemeral, files are the memory.

## Landed
| when | brief | worker | result | one-liner |
|---|---|---|---|---|
| 10-27 | dream 2026-10-27-1740 | dreamer-1 | [dreams/2026-10-27-1740.md](memory/dreams/2026-10-27-1740.md) | 10 proposed → 6 promoted (D023–D026, L032–L033) · 4 rejected · 6 merges applied |
| 10-27 | 012-close-the-loop | close-the-loop | [results/012-close-the-loop.md](results/012-close-the-loop.md) | all 011 blockers + 009 bugs 1–6 fixed; S3 stuck? **pass** (20m), S6 flush→compact **pass** (ext-triggered #2); +68 lines |
| 10-27 | 011-code-review | code-review | [results/011-code-review.md](results/011-code-review.md) | 3 blockers (ledger IDs/race/parse) · 12 should-fix · not safe to commit |
| 10-27 | 009-durability-tests | durability-tests | [results/009-durability-tests.md](results/009-durability-tests.md) | 7 pass · 1 partial (S6) · 1 FAIL (S3 stuck?) · 1 untested · 9 bugs |
| 10-27 | 010-tobi-scorecard | tobi-scorecard | [results/010-tobi-scorecard.md](results/010-tobi-scorecard.md) | 4 match · 9 spirit · 5 partial · 2 cut · 1 missing; gap = controller continuity |
| 10-27 | 008-compaction-extension | compaction-ext | [results/008-compaction-extension.md](results/008-compaction-extension.md) | extensions/controlroom.ts · /flush · event · tick fallback · v0.2.0 |
| 10-27 | 006-wake-automations | wake-automations | [results/006-wake-automations.md](results/006-wake-automations.md) | wake/watch-path/cancel · controller prompting w/ guards · PONG verified live |
| 10-27 | 007-dream-propose | dream-propose | [results/007-dream-propose.md](results/007-dream-propose.md) | prompts/dream.md · dream/--check/promote/reject · 3 runs: keep on demand |
| 10-27 | 004-boot-and-memory | boot-and-memory | [results/004-boot-and-memory.md](results/004-boot-and-memory.md) | Boot section · memory/ · decide/lesson/supersede/memory/land · strip MEMORY |
| 10-27 | 005-tick-stuck-pause | tick-stuck-pause | [results/005-tick-stuck-pause.md](results/005-tick-stuck-pause.md) | launchd tick · AUTOMATIONS.md · health/stuck? · pause/play |
| 10-27 | 003-durable-design | durable-design | [design](../design/durable-controlroom.md) · [results](results/003-durable-design.md) · [critic](results/003-critic.md) | — |
| 10-27 | 002-pulse-notify | pulse-notify | [results/002-pulse-notify.md](results/002-pulse-notify.md) | launchd poller installed & verified |
| 10-27 | 001-mana-install | mana-install | [results/001-mana-install.md](results/001-mana-install.md) | install complete; human GUI steps remain |

## Retired workers (tab closed; session resumable)
| agent | when | reason | resume |
|---|---|---|---|
| mana-install | 10-27 13:13 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-26T21-29-54-199Z_01a17a1e-b117-770b-9ebc-84c9759c9324.jsonl` |
| pulse-notify | 10-27 13:13 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T15-44-17-378Z_01a17e08-a1e1-75fb-9036-4f1816dd7291.jsonl` |
| durable-design | 10-27 13:13 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T18-05-12-047Z_01a17e89-a3ef-7002-b44f-dfa642d7a50a.jsonl` |
| dreamer-1 | 10-27 13:25 | 007 proof | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T19-12-51-479Z_01a17ec7-9517-7024-94da-a6a853a2a96b.jsonl` |
| dreamer-2 | 10-27 13:25 | 007 proof | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T19-18-20-858Z_01a17ecc-9bb9-773b-98b7-da314feb94d5.jsonl` |
| dreamer-3 | 10-27 13:25 | 007 proof | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T19-23-17-247Z_01a17ed1-217f-7418-91ea-567b2099fcf2.jsonl` |
| boot-and-memory | 10-27 14:08 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T18-37-35-522Z_01a17ea7-4ba1-7174-bbf5-2d718d99f3f8.jsonl` |
| tick-stuck-pause | 10-27 14:08 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T18-37-43-519Z_01a17ea7-6adf-74cf-b42b-e7e85e9baf28.jsonl` |
| wake-automations | 10-27 14:34 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T19-03-50-057Z_01a17ebf-5229-703e-a473-7d78f26a128d.jsonl` |
| dream-propose | 10-27 14:34 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T19-03-58-202Z_01a17ebf-71f9-704d-af45-3b731db1512d.jsonl` |
| stuck-probe | 10-27 15:08 | 009 S3 probe done (stuck? never fired) | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T20-41-03-383Z_01a17f18-5496-734b-b721-d942fbc96e8e.jsonl` |
| compaction-ext | 10-27 15:19 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T20-08-36-777Z_01a17efa-a0a9-728e-bc2e-ea7a37dc8f60.jsonl` |
| durability-tests | 10-27 15:19 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T20-38-01-960Z_01a17f15-8fe8-766f-b7c2-a01c1d1cce86.jsonl` |
| tobi-scorecard | 10-27 15:19 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T20-38-09-960Z_01a17f15-af28-7574-bae2-4b1ee97404d6.jsonl` |
| code-review | 10-27 15:19 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T20-43-20-626Z_01a17f1a-6cb2-7525-a758-330b89788456.jsonl` |
| stuck-probe | 10-27 15:49 | 012 S3 re-run: stuck? fired at 20m (pass) | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T21-24-43-298Z_01a17f40-4ea1-71ca-ae76-d49adc01ac59.jsonl` |
| close-the-loop | 10-27 17:40 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T21-21-23-699Z_01a17f3d-42f3-74b4-bd50-4f030485d2ea.jsonl` |
| dreamer-1 | 10-27 19:40 | dream judged | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-27T23-40-13-691Z_01a17fbc-5dfb-75e7-ba7c-45519921ac00.jsonl` |
