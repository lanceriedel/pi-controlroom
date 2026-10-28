# Results — 003 Durable design

## 1. Status
**done** — design written to `docs/design/durable-controlroom.md` (321 lines; sections 0–10 incl. one-page summary, glossary diff, verification log). Critic (`003-critic.md`) read and addressed point by point (design §9 "Critic points — disposition"). No edits to `bin/`, `prompts/`, `skills/`, `README.md`. Prototypes under `logs/scratch/003-*`; launchd test unit booted out.

Note: the brief pointed at `~/.pi/pkg/pi-0.85.1/docs`; only **pi 1.4.0** is installed — all extension API names are pinned against 1.4.0 docs/examples.

## 2. Summary (15 lines)
1. The biggest durability hole needs no code: `prompts/controller.md` never tells a (re)started controller to read STATUS.md, results/, agents.log. A **Boot** section ships first (brief 004).
2. **Memory** = two append-only files, `memory/DECISIONS.md` + `LESSONS.md` (FACTS cut per critic). Exact grammar: `- D007 2026-10-27 **slug** — one-liner ← source`. `--from` is mandatory; no source, no line. Superseded lines are struck and moved to `archive/`, never deleted. Budgets 40/30 active lines.
3. Memory reaches workers **through the brief the controller writes** (copied D/L lines in Constraints), plus one sentence in `launch` ("read LESSONS.md first") only if the dir exists.
4. **One reconciler — `controlroom tick`** — run by launchd every 60 s replaces all nohup watcher loops: verifies workers, re-arms watches from the board after any restart, fires automations, runs health. Idempotent; state is only in files.
5. **Automations** live in `docs/briefs/AUTOMATIONS.md` (a markdown table that *is* the state): `A### · kind (watch|wake|watch-path|play|flush) · state · next · repeat · fired · prompt? · instruction`. CLI `wake <when> "<instr>"`, `watch-path`, `automations`, `cancel`.
6. Prompting the controller is per-row opt-in: wakes yes, watches **no** by default (human still closes the loop); `CONTROLROOM_AUTOPROMPT=0` global off; blocked controller → retry; rate cap.
7. **Pause/Play** = `logs/PAUSED` marker: `launch` refuses, in-flight drains, rows go `held`, `--resume-after` adds a `play` row; `play` collapses held prompts into one.
8. **Landed** = `## Landed` table in STATUS.md + `controlroom land` (~10 lines). **No lander agent** — results are files, not branches.
9. **Dream** = propose-only, on demand: `prompts/dream.md` → `dreamer` worker reads files only, appends `P###` lines to `memory/proposed.md` + a report in `memory/dreams/`; `dream --check` validates every `← path` exists; `promote`/`reject`. Scheduling it (nightly wake) is gated on measured value.
10. **Health**: `stuck?` (working + no write 20 min + jsonl unchanged + same last tool line) is the 26 h-incident alarm; `spinning?` for cost rising with no writes.
11. **Cost IS exposed** (critic said unverified): `herdr agent list` gives the pi session jsonl path; summing `usage.cost.total` gives $/tokens in 21 ms. Kept in **detail view only**.
12. **Compaction hook** = ~40-line extension `extensions/controlroom.ts`: at 75 % context, `pi.sendUserMessage` asks the controller to *flush* decisions/lessons to memory before `/compact`; `session_before_compact` only logs an event (no LLM call). Ships via `package.json` `pi.extensions`. Shell fallback: tick computes context % from the jsonl and fires the same text as an automation.
13. **Migration**: `init` idempotently adds memory/, AUTOMATIONS.md, `## Landed`, the launchd tick; appends only; users ignoring the features see one zero-count line.
14. **Sequence**: 004 boot-and-memory → 005 tick-stuck-pause → 006 wake-automations → 007 dream-propose → 008 compaction-extension. Each ≤ half a day, independently useful.
15. The one capability that could reshape 005: whether the `herdr` CLI works from a launchd context (open question below). Fallback designed (`tick --loop` in the status pane).

## 3. [Open question]s for Lance
1. **Does `herdr agent list` work from a launchd-spawned process** (socket discovery without the pane's `HERDR_*` env)? If not, the tick runs as `controlroom tick --loop` in the status pane instead (survives pi restarts, not Herdr restarts). First task of brief 005.
2. **Default for automations prompting the controller**: proposed *wakes yes / watches no*. Or everything toast-only until you opt in per project?
3. **Dream after pause** — on by default, or off until 007 shows the output gets read? (proposed: off)
4. **Seed LESSONS.md at `init`** from SKILL.md/README "Gotchas" (6 lines), or start empty and curate by hand? (proposed: seed, `--no-seed` flag)
5. **$/tokens**: keep in detail view (design) or cut entirely (critic)?
6. **Thresholds** to accept provisionally: flush at 75 % context; `stuck?` at 20 min no-write; `spinning?` at 30 min; 40/30 active memory lines; ≤ 6 controller prompts/hour; `chat:` sources age to archive after 30 days.
7. Should `prompt? = yes` watch rows be allowed at all in v1, or deferred to after a week of wakes? (affects 006 scope only)

## 4. [Verified] capability checks (commands used)
| Check | Command / file | Result |
|---|---|---|
| Installed pi version | `pi --version`; `ls ~/.pi/pkg` | 1.4.0 only; brief's 0.85.1 path absent |
| Herdr version | `herdr --version` | 0.8.2 |
| Extension events/APIs | `grep` over `~/.pi/pkg/pi-1.4.0/docs/extensions.md`, `compaction.md`; read `examples/extensions/{custom-compaction,trigger-compact,border-status-editor,send-user-message,auto-commit-on-exit,file-trigger}.ts` | `session_before_compact`, `ctx.getContextUsage().percent/contextWindow`, `ctx.compact({customInstructions})`, `pi.sendUserMessage(…,{deliverAs})`, `pi.exec`, `pi.registerCommand`, `session_start` all present |
| Package ships extensions | `docs/packages.md`; `~/.pi/agent/git/github.com/edxeth/pi-subagents/package.json` (`pi.extensions`); `~/.pi/agent/settings.json` packages list | this repo is installed as a local package path → adding `"extensions":["./extensions"]` is enough |
| Session jsonl path per agent | `herdr agent list` | `agent_session.value` = `~/.pi/agent/sessions/…/*.jsonl` |
| Cost/tokens/last-write from jsonl | `python3 logs/scratch/003-session-cost.py <4 sessions>` (`time`: 0.021 s on 2.4 MB) | controller $7.92 / 3.3M tok / 70 turns; worker sessions ~$1 each |
| Herdr exposes no cost/last-output | `herdr api snapshot` key dump | agents/panes/tabs/layouts only |
| `agent prompt` semantics | `herdr agent prompt --help`, `herdr agent wait --help`, `herdr pane wait-output --help` | rejects when blocked (`agent_blocked`); `--wait --until`; regex wait-output exists |
| launchd one-shot/recurring from a non-LaunchAgents path | `launchctl bootstrap gui/$UID logs/scratch/003-launchd-test.plist`; `cat 003-launchd-fired.txt`; `launchctl print …`; `launchctl bootout …` | bootstrap rc=0, RunAtLoad fired once, calendar stream `active`, bootout rc=0 |
| Existing tools | `which caffeinate launchctl timeout gtimeout` | caffeinate + launchctl present; no `timeout`/`gtimeout` (use `perl -e 'alarm'`) |
| Mana comparison | read `~/Documents/mana/mana/radars/{dream,daily,pulse}.md`, `AGENTS.md` §Memory/Radars (read-only) | adopted: "no link, no line", promotion gate, inbox-for-uncertainty (→ `## Unsure` + proposed.md), cron-in-frontmatter idea (→ AUTOMATIONS rows) |

**[Assumed]** (listed in design §10): launchd catch-up after sleep; `StartCalendarInterval` firing not observed separately from RunAtLoad; pi TUI queues text typed mid-turn as a follow-up; all thresholds.

## 5. Proposed brief split
| # | Title | One-line scope | Depends |
|---|---|---|---|
| 004 | **boot-and-memory** (first) | Boot section + "copy D/L into briefs" rule in `prompts/controller.md`; `memory/` files; `decide` `lesson` `supersede` `memory` `land`; seed LESSONS; `launch` one-liner; `MEMORY` strip line; README/SKILL vocabulary | — |
| 005 | **tick-stuck-pause** | `controlroom tick` reconciler + launchd install/uninstall in `init` (prove herdr-from-launchd first; `--loop` fallback); `health` with `stuck?`/`spinning?`/last-write (+ `$` in detail); `pause`/`play` | 004 (soft) |
| 006 | **wake-automations** | `wake` (once/recurring), `watch-path`, `automations`, `cancel`; prompt-the-controller path (blocked/working/rate cap; live test of mid-turn queuing); strip `AUTOMATIONS` line; "say which automation wakes you" rule | 005 |
| 007 | **dream-propose** | `prompts/dream.md`; `dream [--here]`, `dream --check`, `promote`/`reject`, `land --older-than`; run 3× by hand and report whether output was read (gate for scheduling) | 004, 006 (scheduling only) |
| 008 | **compaction-extension** | `extensions/controlroom.ts` (flush at 75 %, compaction event, `/flush`); `package.json` `pi.extensions`; tick shell fallback (context % + post-compaction reconcile row) | 004, 005 |

## 6. Files
- `docs/design/durable-controlroom.md` — the design
- `logs/scratch/003-session-cost.py` — cost/health prototype (stdlib)
- `logs/scratch/003-launchd-test.plist`, `003-launchd-fired.txt` — launchd verification (unit booted out)

DONE 003
