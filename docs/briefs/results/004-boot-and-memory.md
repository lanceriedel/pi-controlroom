# 004 — boot-and-memory: results

**Status: DONE** — worker `boot-and-memory`, 2026-10-27 12:38 → 12:50. All code deliverables A–D shipped; all proofs run on this repo. No commits, no pushes. `docs/design/*` untouched.

## What changed (file:lines)

| File | Lines | Change |
|---|---|---|
| `bin/controlroom` | 10–11 | two help lines for the new commands (`sed -n 2,14p` in the fallback arm) |
| `bin/controlroom` | 118 | `status_text`: `mem_py strip` → one `MEMORY` line between EVENTS and WAITING; prints nothing when `docs/briefs/memory/` is absent |
| `bin/controlroom` | **126–241** | `# ---- memory (004) ---- … # ---- end memory ----`: one bash function `mem_py <cmd>` wrapping a single `python3 - "$@" <<'PY'` block (args via argv, stdin stays the heredoc). Sub-commands: `decide` `lesson` (append, ID = max+1 incl. struck, auto-slug, ≤160 chars, `--from` required and path-validated unless `chat:`), `supersede` (strike in place + `superseded-by` + copy to `archive/YYYY-MM.md`), `memory` (counts / `--counts` / `--decisions` / `--lessons` / `--unsourced`; default ≤ 70 lines; `⚠ over budget` past 40/30), `strip`, `init` (idempotent scaffold + 7-line LESSONS seed, `--no-seed`), `land` |
| `bin/controlroom` | 253–254, 282 | `init`: parses `--no-seed` / `--memory-only`; `--memory-only` runs only the scaffold (no herdr, no pane/agent changes); full `init` calls `mem_py init` after the strip is created |
| `bin/controlroom` | 292 | `launch`: `PRE="Read …LESSONS.md first (project lessons; treat as rules). Then read"` **only if** `docs/briefs/memory/LESSONS.md` exists; otherwise prompt text is byte-identical to before |
| `bin/controlroom` | 371–373 | one contiguous case-arm group `decide\|lesson\|supersede\|memory\|land) mem_py "$CMD" "$@"` |
| `prompts/controller.md` | 7–9 | **Boot** section, verbatim from design §1.5 (+ one parenthetical for brand-new projects) |
| `prompts/controller.md` | 19 | **Memory** rule: Constraints start with applicable D/L lines verbatim; `controlroom memory` is the source; record via `decide\|lesson --from`; `land` after integrating. Frontmatter unchanged (both values already quoted — verified) |
| `README.md` | 102–109 | vocabulary: **Memory (decision · lesson · landed)** |
| `README.md` | 151 | strip docs: `MEMORY` line |
| `README.md` | 170–175 | Commands table: `decide` `lesson` `supersede` `memory` `land` `init --memory-only` |
| `skills/controlroom/SKILL.md` | 33–35, 41–42 | Commands table rows + two protocol bullets (Boot from files; Memory into briefs) |
| `bin/controlroom-pager` | — | **unchanged**: it renders whatever `controlroom status` prints; the `⚠ over budget` yellow uses `\033[33m`, which the pager already maps |
| `docs/briefs/README.md` | — | unchanged by this worker (it was already `M` in git from the controller) |

Net: **+127 lines** in `bin/controlroom` (248 → 375), bash + python3 stdlib only.

New files: `docs/briefs/memory/{DECISIONS.md,LESSONS.md,proposed.md,.version}`, `memory/archive/2026-10.md`, `memory/dreams/` (empty).

## Proof transcript (trimmed)

```
$ bash -n bin/controlroom && echo SYNTAX_OK
SYNTAX_OK

$ bin/controlroom decide "x"                      # refusal test
refused: no source, no line — add --from <repo/path[#anchor|:line|:"phrase"]> (or --from chat:<ISO-ts>)
rc=1
$ bin/controlroom decide "y" --from docs/nope.md
refused: source path not found: docs/nope.md
rc=1

$ bin/controlroom init --memory-only              # (see Deviations for why not full `init`)
memory/   created memory/ archive/ dreams/ DECISIONS.md LESSONS.md proposed.md
- L001 2026-10-27 **no-timeout-binary** — no `timeout`/`gtimeout` on this Mac; wrap … `perl -e 'alarm N; exec @ARGV' --` … ← docs/briefs/results/001-mana-install.md#6-gotchas
- L002 2026-10-27 **caffeinate-pipelines** — … ← README.md:"lost a step to this once"
- L003 2026-10-27 **frontmatter-quote-colon** — … ← skills/controlroom/SKILL.md:"must be quoted"
- L004 2026-10-27 **heredoc-eats-stdin** — … ← skills/controlroom/SKILL.md:"loses stdin"
- L005 2026-10-27 **timebox-local-compute** — … ← skills/controlroom/SKILL.md:"blocked 26 h"
- L006 2026-10-27 **hidden-subagents-die** — … ← README.md:"killed after ~3 minutes"
- L007 2026-10-27 **toasts-unreliable** — … ← README.md:"default to *off*"
          seeded 7 L-lines from skills/controlroom/SKILL.md Gotchas + README (--no-seed to skip)
$ bin/controlroom init --memory-only              # second run: nothing duplicated
memory/   present (skipped)
          LESSONS already seeded (skipped)
$ grep -c 'lost a step to this once' README.md; grep -c 'must be quoted' skills/controlroom/SKILL.md; …   # every seed's quoted phrase exists
1 1 1 1 1 1 1

$ bin/controlroom decide "FACTS memory type cut; DECISIONS+LESSONS only (…)" --from docs/briefs/results/003-critic.md --slug facts-cut
- D001 2026-10-27 **facts-cut** — … ← docs/briefs/results/003-critic.md
  D002 wakes-prompt-watches-dont  ← docs/design/durable-controlroom.md#2.3-cli
  D003 dream-after-pause-off      ← …#4.-pause--play
  D004 cost-detail-view-only      ← …#6.-cost--health-on-the-strip
  D005 durable-go                 ← docs/briefs/STATUS.md:"approve defaults & launch 004–008"
  D006 thresholds-v1              ← …#10.-verification-log      (first attempt refused: "one-liner is 171 chars (max 160)" — cap works)
  D007 memory-via-briefs          ← …#1.5-how-memory-reaches-workers-and-the-controller

$ bin/controlroom memory --counts
7 decisions · 8 lessons · 0 proposed   # (L008 added after the land step; see Gotchas)
$ bin/controlroom memory | wc -l
17                                                  # counts line + 7 D + blank + 7 L

$ bin/controlroom lesson "test lesson to be superseded" --from chat:2026-10-27T12:50   → L008
$ bin/controlroom lesson "test replacement" --from chat:2026-10-27T12:51              → L009
$ bin/controlroom memory --unsourced                # both chat: lines listed
$ bin/controlroom supersede L008 L009
L008 struck, superseded-by L009 · archived to memory/archive/2026-10.md
$ tail -2 docs/briefs/memory/LESSONS.md
- ~~L008 2026-10-27 **test-lesson-to-be** — test lesson to be superseded~~ superseded-by L009 ← chat:2026-10-27T12:50
- L009 …
$ bin/controlroom supersede L008 L009   → "L008 not found or already struck" rc=1
$ bin/controlroom supersede L009 L999   → "L999 not found — it must exist before it can supersede" rc=1
$ bin/controlroom lesson "id-continuity check" --from chat:…   → L010   (IDs count struck lines; no reuse)
  (L008–L010 were test junk — removed by hand afterwards; see Gotchas)

$ bin/controlroom land
landed  durable-design     003-durable-design  (done (idle, warm))
landed  pulse-notify       002-pulse-notify  (done (idle, warm))
landed  mana-install       001-mana-install  (done (idle, warm))
dropped decided: 1. ~~Durable design — approve defaults & launch 004–008?~~ **decided 10-27: go, with proposed defaults** (…
$ bin/controlroom land
land: nothing to move (no `done` rows with a result link, no struck decisions)
$ diff /tmp/STATUS.before.md docs/briefs/STATUS.md     # 3 worker rows removed, struck item removed, remaining item renumbered 2.→1., and:
> ## Landed
> | when | brief | worker | result | one-liner |
> |---|---|---|---|---|
> | 10-27 | 003-durable-design | durable-design | [design](../design/durable-controlroom.md) · [results](…) · [critic](…) | — |
> | 10-27 | 002-pulse-notify | pulse-notify | [results/002-pulse-notify.md](results/002-pulse-notify.md) | launchd poller installed & verified |
> | 10-27 | 001-mana-install | mana-install | [results/001-mana-install.md](results/001-mana-install.md) | install complete; human GUI steps remain |

$ perl -e 'alarm 60; exec @ARGV' -- bin/controlroom status | sed -n '/EVENTS/,$p'
 EVENTS (logs/agents.log)
   … 5 lines …
 MEMORY  7 decisions · 7 lessons · newest 0m ago · 0 proposed · last dream never
 WAITING ON LANCE
   1. **Overview video of pi-controlroom** — …
 BRIEFS   001-mana-install 002-pulse-notify 003-durable-design 004-boot-and-memory 005-tick-stuck-pause

# scratch repo (mktemp -d; git init): edge cases
 strip with no memory/ → 0 MEMORY lines           init --memory-only --no-seed → 0 decisions · 0 lessons
 31 lessons → "0 decisions · 31 lessons · 0 proposed   ⚠ over budget: LESSONS 31/30"; strip shows yellow ⚠
 land on a board with a struck item → item removed, remaining renumbered, text copied to memory/archive/

# regressions (perl alarm-wrapped where herdr is involved)
$ bin/controlroom | tail -2            → help now lists decide/lesson/supersede/memory/land
$ bin/controlroom verify controller    → stalled   (pre-existing semantics: idle, no DONE line)
$ bin/controlroom gc --hours 1         → would retire mana-install (idle 21.2h) / pulse-notify (3.0h) / (dry run — add --apply)
$ bin/controlroom status | head -4     → header + AGENTS render as before
$ bin/controlroom launch / resume / retire (no args) → usage, rc=2 (unchanged)
```

## Deviations from the design / brief
1. **`init --memory-only` added** (not in design §1.4/§8). Full `controlroom init` renames *the current pane's agent* to `controller` and splits the pane; running it from this worker pane would have hijacked the live control room. The flag runs just the §8 memory scaffold + seed. Full `init` still does everything (memory step included, after the strip).
2. **`land` also copies dropped struck board items to `memory/archive/YYYY-MM.md`** (`- board <date> (dropped by land): …`). Reason: a `decide --from STATUS.md:"<question>"` line cites text that `land` then deletes; keeping a copy honours "nothing is ever deleted" (§1.3). Design §5 said "delete struck items whose text appears as a `--from` in DECISIONS.md"; the brief said "delete struck items" — implemented the brief's simpler rule, with the archive copy as the safety net. Remaining items are renumbered (`2.` → `1.`).
3. **`## Landed` is created on first `land`, not at `init`** (brief left this open; design §5 says "created on first land").
4. **Seed is 7 lines, not ≈6**: the seven gotchas from SKILL.md/README that bite a controller (dropped `pane split --ratio` and `agent list name`, which are implementation trivia already encoded in the CLI).
5. **Memory files have a one-line `#` header** (design examples show bare lines). Counts use `^- [DL][0-9]` so headers don't affect anything.
6. **`bin/controlroom-pager` untouched** — brief C said "pager / status_text"; status_text alone suffices.
7. **No design edits.** D006 (thresholds) was shortened to fit 160 chars; D005 is sourced from STATUS.md (the event), the others from design anchors as the brief asked.

## Gotchas
- **A worker must never run full `controlroom init` inside a live control room** — it renames the *caller's* agent and splits the *caller's* pane. Use `init --memory-only`. (Recorded as L008.)
- Testing `supersede` on the real LESSONS.md left three `chat:`-sourced junk lines (L008–L010); I removed them by hand plus the archive entry, then re-ran the supersede test in a scratch repo. Rule for future workers: **prove memory CLIs in a `mktemp -d` + `git init` scratch repo**, not on the real files.
- GitHub-style anchors for headings like `## 4. Pause / Play` are ugly (`#4.-pause--play`); `:"quoted phrase"` sources read better and are grep-verifiable.
- `python3 - "$@" <<'PY'` is a clean way to pass arguments to an inline script without losing stdin to the heredoc (the L004 lesson in action).
- `verify controller` reports `stalled` for an idle controller — pre-existing; the controller never prints `DONE`. Brief 005's health work may want to special-case it.

DONE 004
