# 004 — boot-and-memory: controller Boot section + typed memory (DECISIONS / LESSONS) + `land`

## Objective
Implement the first (and highest-value, lowest-risk) slice of the durable control room: a fresh or resumed controller **boots from files**, and the project gains two append-only memory files — `DECISIONS.md` and `LESSONS.md` — with a CLI that enforces "no source, no line". Plus `controlroom land` to move done worker rows into a `## Landed` table. Everything must be additive: an existing control room that ignores these features keeps working unchanged.

## Inputs — read first, in this order
1. `docs/design/durable-controlroom.md` — **§0 summary, §1 Memory (authoritative spec: files, exact line grammar, rules, CLI, how memory reaches workers), §5 Landed, §8 Migration, §9 brief 004 row.** Implement §1 and §5 as written; where the design says `[A]` (assumed threshold) use the value given.
2. `docs/briefs/results/003-critic.md` — rationale for "memory injected by the controller when writing briefs, not blindly by launch", and "ship the Boot section first".
3. `bin/controlroom` — the CLI you're extending (bash dispatcher + inline `python3 - <<'PY'` blocks; follow that style). Read `init`, `launch`, `status_text`, `retire` to see how STATUS.md is parsed/appended today.
4. `bin/controlroom-pager` — the strip; you add one MEMORY line.
5. `prompts/controller.md` — the `/controller` template; you add the Boot section and the brief-writing rule. **Frontmatter values containing `: ` must be quoted** (see SKILL.md gotchas).
6. `skills/controlroom/SKILL.md` and `README.md` — add the new vocabulary/commands; the "Gotchas learned" section is the seed for LESSONS.
7. Live examples: `docs/briefs/STATUS.md` (note the `## Decisions waiting on the human` list and the workers table), `docs/briefs/results/00[123]-*.md`.

## Deliverables (code)
A. **`prompts/controller.md`** — add, verbatim from design §1.5: the **Boot** section (6 steps + "two lines where things stand" + PAUSED check), and the rule *"Every brief's Constraints section starts with the decisions and lessons that apply to it, copied verbatim with their IDs; `controlroom memory` is your source."*
B. **`bin/controlroom`** new subcommands per design §1.4 and §5:
   - `decide "<one-liner>" --from <source> [--slug s]`, `lesson "<one-liner>" --from <source> [--slug s]` — append `- D###/L### YYYY-MM-DD **slug** — one-liner ← source`; ID = max+1; refuse without `--from`; validate source path exists unless `chat:`; auto-slug from one-liner if omitted; print the line.
   - `supersede <ID> <byID>` — strike in place, append to `memory/archive/YYYY-MM.md`, note `superseded-by`.
   - `memory [--counts|--decisions|--lessons|--unsourced]` — default: counts line + active lines of both (≤ 70 lines); `⚠ over budget` when > 40/30.
   - `land` — move `done` rows from the workers table into `## Landed` (`date · agent · brief · result`), creating the section if missing; delete struck (`~~…~~`) items from `## Decisions waiting on the human`. Print what moved.
   - `init` — idempotently create `docs/briefs/memory/{DECISIONS,LESSONS,proposed}.md`, `archive/`, `dreams/`; **seed LESSONS.md** from SKILL.md "Gotchas learned" + README "lost a step" (≈6 lines, each with a real `← source`); `--no-seed` to skip. Re-running `init` on this repo must not duplicate anything.
   - `launch` — add the one sentence from §1.5 to the worker prompt **only if** `docs/briefs/memory/LESSONS.md` exists.
C. **`bin/controlroom-pager`** / `status_text` — one line: `MEMORY  N decisions · M lessons · newest Xh ago · P proposed · last dream …` between EVENTS and WAITING (omit gracefully when `memory/` is absent).
D. **Docs** — README "The vocabulary" gets *Memory (decision · lesson · landed)*; the Commands table and SKILL.md table get the new commands; `docs/briefs/README.md` unchanged.

## Deliverables (prove it on this repo)
- Run `controlroom init` here → `memory/` appears, LESSONS seeded, STATUS.md untouched except a `## Landed` header if you choose to add it at init (design §8 says append-only).
- `controlroom decide "FACTS memory type cut; DECISIONS+LESSONS only" --from docs/briefs/results/003-critic.md` and 3–4 more real decisions from the design's §9 defaults (wakes-prompt-yes/watches-no; dream-after-pause off; $ in detail view only; thresholds) — each `--from docs/design/durable-controlroom.md#…`.
- `controlroom land` → the three done workers (mana-install, pulse-notify, durable-design) move to `## Landed`; the strip still renders.
- A refusal test: `controlroom decide "x"` (no `--from`) exits non-zero with a clear message.
- `bash -n bin/controlroom` and a run of every existing subcommand's `--help`/no-arg path to show nothing regressed (`status`, `verify controller`, `gc`).

## Constraints
- Copy the applicable memory into this brief's spirit: **L — no `timeout` binary here**: wrap anything that could hang in `perl -e 'alarm 60; exec @ARGV' --`. **L — frontmatter `: ` must be quoted** or pi silently skips the template. **D — FACTS is cut**; don't add it. **D — memory reaches workers via briefs written by the controller**, so `launch` gets only the single optional sentence.
- bash + python3 stdlib only. Keep `bin/controlroom` readable; total addition ≲ 150 lines.
- Don't touch `logs/agents.log` format, the `DONE <name>` sentinel, or watcher behaviour (brief 005 owns `tick`).
- No commits, no pushes. Don't edit `docs/design/*` — if you must deviate, record it in results under "Deviations".
- Worker 005 (`tick-stuck-pause`) runs in parallel and edits `bin/controlroom` too: **keep your additions in a clearly delimited block** (`# ---- memory (004) ----` … `# ---- end memory ----`) near the end of the dispatcher and add new `case` arms in one contiguous group, so the controller can merge trivially.

## Where to write
`docs/briefs/results/004-boot-and-memory.md`: status · what changed (file:lines) · proof transcript (commands + output, trimmed) · deviations from the design · gotchas. Finish with the sentinel line `DONE 004` and go idle.
