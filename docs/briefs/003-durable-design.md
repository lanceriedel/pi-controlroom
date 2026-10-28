# 003 — Design: make pi-controlroom durable (memory · automations · dream · pause · landed · cost)

## Objective
Produce a complete, implementable design for turning pi-controlroom from a session-bound coordinator into a **durable** one — a controller whose memory, schedule, and in-flight state survive context compaction, restarts, laptop sleep, and human absence. The reference pattern is Tobi's "ULTIMATE" harness (described below). The design must keep the project's identity: **files are the protocol**, shell + python3 stdlib, Herdr + pi primitives, ~hundreds not thousands of lines. The output is a design document the controller will split into implementation briefs — so it must be concrete enough to brief from (file formats, CLI signatures, prompts, state transitions), not a vision piece.

## Inputs — read all of these first
- `README.md` — current vocabulary and protocol (controller · worker · brief · result · board · pipeline).
- `bin/controlroom` (248 lines) — current CLI: `init launch watch watch-log resume resume-stalled retire gc status statusbar detail verify strip-restart`. Note how `launch` prompts a worker (line ~169) and how `watch` toasts on `DONE` (line ~184).
- `bin/controlroom-pager` — the status strip.
- `prompts/controller.md` — the `/controller` prompt template (what a fresh controller knows at boot).
- `skills/controlroom/SKILL.md` — operating rules + "Gotchas learned" (this is proto-LESSONS).
- `docs/briefs/STATUS.md`, `docs/briefs/README.md`, `docs/briefs/results/001-*.md`, `002-*.md` — live examples of the protocol in use.
- `logs/agents.log` — the event stream the strip reads.
- pi extension API, for the before-compaction hook only: `/Users/lanceriedel/.pi/pkg/pi-0.85.1/docs/extensions.md` and `examples/extensions/` (look for session/compaction/lifecycle events and how an extension can run a shell command or prompt the agent). Also `docs/prompt-templates.md`, `docs/packages.md` (how this package ships prompts/skills; an extension would be added the same way).
- Herdr CLI: `herdr --help`, `herdr agent --help`, `herdr pane --help` (read-only).
- A sibling durable system for comparison: Mana's radars + Dream — `~/Documents/mana/mana/radars/daily.md`, `dream.md`, `pulse.md`, and `~/Documents/mana/AGENTS.md` §"Memory"/"Radars" (read-only; it's a management sidekick, but its radar-frontmatter cron + dream-consolidation + inbox-for-uncertainty are directly relevant).

## The reference pattern (what Tobi's screen showed)
- **Typed, counted memory** — `13 decisions · 118 facts · 19 lessons`; each decision has a slug, age, one-liner. Panel title: *"What every new branch starts from"* — every new worker is seeded from it.
- **Automations** — `wake #792 in 15m`, `Watch <repo> — fired 3`, `Dream after a pause — armed`, `Dream before compaction — armed`. The coordinator's final answers say *"Automation A29 wakes me at 18:12 UTC; from that round I'll check X, Y, Z."*
- **Dream** — a consolidation session (`session 2 — Settled — Fall asleep →`) that compresses what happened into memory.
- **Pause/Play** — "waiting for 2 tasks to finish; nothing new starts. Play by itself after 120 min."
- **Lander** — a separate agent whose only job is merging/landing; a **LANDED** ledger (batches · commits · age).
- **Status bar** — `dream ready · pausing (2 running) · 5 automations · warm · core changed → restart · $576 · 2.6M tokens`.

## Scope — design all of these (the controller's rough outline; improve or overturn it with reasons)
1. **Memory** — `docs/briefs/memory/{DECISIONS,FACTS,LESSONS}.md` (+ maybe `dreams/`). Exact line format (slug · ISO date · one-liner · source link), append-only rules, how size is bounded (dream prunes/merges), how `launch` injects it into every worker prompt, how `/controller` boots from it, how the strip shows counts/age. `controlroom decide|fact|lesson` CLI.
2. **Automations** — `controlroom wake <when> "<instruction>"` (one-shot and recurring), `controlroom watch` upgraded to **prompt the controller** on DONE/blocked (not just toast the human), `controlroom watch-path <glob> "<instruction>"`. Where automation state lives (a file under `logs/` or `docs/briefs/automations.md`?), how they're listed on the board/strip (`armed / fired N / next in Xm`), how they survive a Herdr/laptop restart (launchd vs. background loop vs. re-arm on `init`), idempotency, and how the controller refers to them in its own replies ("A3 wakes me at…").
3. **Dream** — the `controlroom dream` prompt text, triggers (nightly wake · after pause · **before compaction** via a pi extension hook · manual), what it reads, what it writes (`memory/dreams/YYYY-MM-DD-HH.md` + updates to DECISIONS/FACTS/LESSONS + compressing STATUS.md done-rows into `## Landed`), the sentinel it returns, and how to keep it from hallucinating (cite brief/result/log lines; "no link, no line").
4. **Pause / Play** — `controlroom pause [--resume-after Nm]` / `play`; semantics for `launch` (refuse), in-flight workers (drain), watchers, automations (hold or fire?), strip display; interaction with laptop sleep and `caffeinate`.
5. **Landed ledger & lander** — `## Landed` section format in STATUS.md; whether a standing `lander` worker is worth it for this project (be honest — may be overkill; propose the minimal version).
6. **Cost & health on the strip** — what pi/Herdr actually expose (session cost/tokens, agent state, last output time); a "burning $ with no file writes for N min" alarm (the 26-hour incident in SKILL.md); last-dream and next-wake fields.
7. **Compaction hook** — the only piece needing a pi extension: design it (event, what it runs, how it ships in this package via `package.json`'s `pi.extensions`), with a shell-only fallback if the event isn't available.
8. **Migration & compatibility** — how an existing control room (this repo) upgrades: `controlroom init` idempotently adds `memory/`, re-arms automations; nothing breaks for users who ignore the new features.
9. **Sequencing** — split the design into 4–6 implementation briefs with dependencies, each ≤ half a day, each independently useful. Say which one ships first and why.

## Constraints
- Design, not implementation. No edits to `bin/`, `prompts/`, `skills/`, `README.md`. You may create throwaway prototypes under `logs/scratch/003-*` to verify a Herdr/pi/launchd capability, each wrapped in `perl -e 'alarm 60; exec @ARGV' --` (no `timeout` binary here). Record what you verified vs. assumed.
- Label claims: **[Verified — how]**, **[Assumed]**, **[Open question]**. The gaps are findings.
- Stay in the project's idiom: bash + python3 stdlib, markdown files, Herdr/pi CLIs. Reject anything requiring a database, daemon framework, or new runtime unless you argue it's unavoidable (launchd for wakes is acceptable).
- Keep total design ≤ ~600 lines. Prefer tables and exact formats over prose. Include the literal prompt texts the CLI would send.
- Read-only on `~/Documents/mana` and the Shopify mana repo.
- A `critic` review of the controller's outline is running in parallel; the controller will append its findings to this brief's result as `## Critic` — you do not need to wait for it, but if `docs/briefs/results/003-critic.md` exists when you start Part 9, read it and address its points.

## Deliverable
- `docs/design/durable-controlroom.md` — the design (sections 1–9 above, plus a one-page summary at the top and a glossary diff: new vocabulary added to README's "The vocabulary").
- `docs/briefs/results/003-durable-design.md` — status, a 15-line summary, list of **[Open question]**s that need Lance, list of **[Verified]** capability checks with the commands used, and the proposed brief split (titles + one-line scope each).
- Print the sentinel line `DONE 003` and go idle.
