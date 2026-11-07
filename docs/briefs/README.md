# Briefs

Files are the protocol. The controller writes a brief here (`NNN-slug.md`, zero-padded, chronological),
launches a worker with `controlroom launch <name> docs/briefs/NNN-slug.md "worker: <name>"`,
and the worker writes its result to `docs/briefs/results/NNN-slug.md`. The live board is `STATUS.md`.

Each brief contains: objective · inputs (with paths) · constraints (time-boxed compute) · deliverable · where to write results.

Newest first; the last 8 are shown, older briefs are folded below.

| Brief | Stream | Needs external resources? |
|---|---|---|
| [014-prompt-uptake](014-prompt-uptake.md) | Tick detects error-aborted controller turns after a prompt and re-prompts; defer prompts right after machine wake | no |
| [013-tobi-comparison](013-tobi-comparison.md) | Lance-facing doc: pi-controlroom 0.2.0 vs Tobi's harness — features, pros/cons, proven vs on paper | no |
| [012-close-the-loop](012-close-the-loop.md) | Fix 011 blockers/should-fix, 009 bugs (stuck? cache-warm, flush<75, init collision), heartbeat gate, Boot round-wake; re-grade S3/S6 | no |
| [011-code-review](011-code-review.md) | Pre-commit review of the 0.2.0 diff (seams, tick safety, prompt path, memory CLI, extension, docs drift) | no |
| [010-tobi-scorecard](010-tobi-scorecard.md) | Feature-by-feature grade vs Tobi's ULTIMATE reference + durability verdict | no |
| [009-durability-tests](009-durability-tests.md) | Scenario tests S1–S10: fresh boot, tick restart, real stuck worker, pause/drain, mid-turn queue, compaction loop, 2nd room, dream, rate cap | no — local Herdr |
| [008-compaction-extension](008-compaction-extension.md) | `extensions/controlroom.ts` flush-at-75% + shell fallback | no |
| [007-dream-propose](007-dream-propose.md) | `prompts/dream.md`, `dream --check`, `promote/reject` | no |

<details><summary>6 older briefs</summary>

| Brief | Stream | Needs external resources? |
|---|---|---|
| [006-wake-automations](006-wake-automations.md) | `wake`, `watch-path`, `cancel`; controller self-prompting w/ rate cap | no |
| [005-tick-stuck-pause](005-tick-stuck-pause.md) | `controlroom tick` reconciler (launchd) · AUTOMATIONS.md watch rows · `health` with `stuck?` · `pause/play` | no — local launchd |
| [004-boot-and-memory](004-boot-and-memory.md) | Controller Boot section · `memory/DECISIONS,LESSONS` · `decide/lesson/supersede/memory/land` · strip MEMORY line | no |
| [003-durable-design](003-durable-design.md) | Design doc: durable control room (memory · tick/automations · dream · pause · landed) → `docs/design/durable-controlroom.md` | no |
| [002-pulse-notify](002-pulse-notify.md) | macOS notification when a Mana pulse/daily radar has "Needs you" items (launchd poller) | no — local only |
| [001-mana-install](001-mana-install.md) | Install Shopify Mana into Obsidian vault `~/Documents/mana` | yes — `dev` toolchain, Shopify GitHub, network |

</details>
