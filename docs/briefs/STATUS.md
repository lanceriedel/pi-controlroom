# STATUS — control room board (pi-controlroom)
**Where to go:** Herdr workspace `wC` → tab **CONTROLLER** (agent `controller`). Talk to it; it briefs, launches, integrates.

## Workers
| pane | agent | brief | state | result |
|---|---|---|---|---|

## Notes
- 11-09 13:00 — Rounds A036 #2–#4 (overnight turns aborted: timeouts/connection errors while asleep; 014 re-prompted each). Room empty. gs-controller's 015 feedback fixed (e691745): header-aware tables, agent columns off by default, installer links md2html+pages, docs note on gh-pages path. Round back to daily (A037).
- 11-08 16:40 — Round A036 #1: 015 landed. Live page https://lanceriedel.github.io/pi-controlroom/status/latest.html (Pages build was failing on a stray self-symlink `docs/briefs/briefs` → removed). dev002 unreachable since 14:56 (network).
- 11-08 — Lance (via gs-controller) asked for `controlroom status-page [--publish]` (event-driven project page → GitHub Pages + publishers; auto after launch/land). Brief 015 launched; round back to 2h.
- 11-07 — Lance asked for the lancedocs lookbook dataset-map to be exploded into a full dataset catalog → wrote `lookbook-research/docs/briefs/055-dataset-map-v2.md` and handed it to controller-w9 to launch (its room, host: local).
- 11-07 08:59 — Round A034 #1 (Sat; fired after 3 just-woke deferrals → cap worked). Lance pushed 0.2.0 + fixes himself (origin at b8c73fb) and added remote-host + two-controller protocol (`docs/remote-host.md`, `docs/two-controller-protocol.md`, +215 lines bin: ROOMS header, hosts). Machine `dev002` registered but unreachable since 18:21. Controller pane had lost its Herdr name (L041) → renamed back to `controller`. Push question is closed; 2 commits ahead.
- 11-06 08:13 — Round A032 #2: 014 landed (TAKEN-OK proof: `tick.log 04:58 A033 prompt taken`). Rounds back to daily (A034; note: `wake 08:00 --repeat "weekdays 08:00"` armed its first fire on Sat 11-07 — first-fire ignores the weekdays filter; 0.2.1 nit). Push a/b still open (now 0.2.1 material too).
- 11-06 04:55 — Round A032 #1 (fired 19 h late: Mac asleep; the new just-woke defer re-deferred at every dark wake → cap needed). Worker prompt-uptake died 08:33 to Connection error mid-result; code already live (`DRY A032 prompt taken`). Resumed with: cap deferrals at 3, write result file, TAKEN-OK proof.
- 11-05 08:05 — Round A030 #5–#6. **Root cause of the 'batched wakes' found in the session jsonl:** the 10-30, 11-02 and 11-04 wakes each started a turn that died with `stopReason: error — Connection error.` (4 retries, 0 output) — the 08:00 wake hits the model seconds after the Mac wakes, before network/VPN is up; the user message stays queued and is re-sent with the next turn. Not a paste problem (L038 was wrong → L039). Brief 014 launched: tick detects error-aborted turns after a prompt and re-prompts.
- 11-03 08:03 — Round A030 #2–#4 arrived together: the 10-30 and 11-02 wakes were pasted but never started a turn (pane input held a stray `wh`?). Room empty, nothing to land. **Gap for 0.2.1:** tick should verify the controller goes idle→working within ~3 min of a prompt, else log `prompt not taken` and re-paste (L038). 13 commits unpushed; push a/b still open.
- 10-29 — psd-controller FYI: lancedocs snapshots now go to `~/.brain/memory-bank/personal/docs-archive/`, not `docs/` (public index). Not this room's workers — relayed to controller-w9 (lookbook) to record.
- 10-29 08:01 — Round A030 #1: room empty. LESSONS 31/30 → merged L024→L030, L010→D015 (29). 11 commits unpushed; push decision (a/b) still open.
- 10-28 17:22 — Round A029 #2: room empty (fired 12 min late — sleep). Backed off to daily A030 weekdays 08:00. Push decision (a/b) still open.
- 10-28 15:10 — Round A029 #1: 013 comparison doc landed (read it: `code docs/briefs/results/013-tobi-comparison.md` ⌘⇧V, or Obsidian → controlroom/results). Push decision (a/b) still open.
- 10-28 10:45 — Lance's w9 strip showed `controller $0.00 · ctx ?%`: init had renamed its controller `controller-<ws>` (012) but strip/controller() only matched `*controller`. Fixed (`is_ctl`, e22064f); CTX now reads the pinned pane's health; wB pin written (`logs/.controller`). `extension absent` in other rooms is expected until their pi is restarted — the package is global.
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
| 11-08 | 015-status-page | status-page | [results/015-status-page.md](results/015-status-page.md) | status-page CLI + md2html + launch/land hooks; Pages enabled, page pushed but 404 until `git rm docs/briefs/briefs` (stray symlink) |
| 11-06 | 014-prompt-uptake | prompt-uptake | [results/014-prompt-uptake.md](results/014-prompt-uptake.md) | uptake check + re-prompt · just-woke defer (capped 3) · strip ⚠ aborted turn · live TAKEN-OK · +40 lines |
| 10-28 | 013-tobi-comparison | tobi-comparison | [results/013-tobi-comparison.md](results/013-tobi-comparison.md) | Lance-facing comparison, 110 lines; biggest weakness = no `core changed → restart` + untested auto-flush/S10 |
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
| tobi-comparison | 10-28 15:09 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-10-28T19-09-49-570Z_01a183eb-2a82-7422-b053-0add08e0c174.jsonl` |
| prompt-uptake | 11-06 08:12 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-11-05T15-03-24-502Z_01a1ac3c-7056-713c-a760-51793f2c1de2.jsonl` |
| status-page | 11-08 16:35 | integrated & landed | `pi --resume /Users/lanceriedel/.pi/agent/sessions/--Users-lanceriedel-src-github.com-lanceriedel-pi-controlroom--/2026-11-08T19-30-07-698Z_01a1bca3-b4d2-71b5-80f7-3f68bd77add7.jsonl` |
