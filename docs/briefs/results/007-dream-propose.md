# 007 — dream-propose: results

**Status: DONE** — worker `dream-propose`, 2026-10-27 13:04 → 13:30. All code deliverables A–E shipped; scratch proofs run; **three real dream runs done, checked, promoted/rejected, dreamers retired**. No commits, no pushes. Tick / `AUTOMATIONS.md` code untouched (006's); no wake armed.

**Headline for the honesty gate:** run 1 (first ever, 1-day window) was worth reading — 10 real, correctly-cited lines memory lacked plus one true duplicate; run 2 (2-minute window) was mostly noise mined from an in-progress result; run 3 (2-minute window, after the prompt learned to skip in-progress results) said `Proposed (0)` and asked good questions. Total $3.12, 9 minutes of dreamer time. **Recommendation: keep on demand; run it after each *batch* of results lands (or weekly), not nightly.** Details in "Recommendation".

## What changed (file:lines)

| File | Lines | Change |
|---|---|---|
| `prompts/dream.md` | new, 27 lines | §3.2 prompt verbatim (frontmatter `description` quoted per L003; `argument-hint: "[reason] [since]"`) + a **Rules the checker enforces** section: `[D]`/`[L]` tag, ID/slug rules, source forms, report shape, touch-nothing-else, **≤ 15 min / ≤ 10 P-lines**, skip `IN PROGRESS` results (added after run 2, = L018) |
| `bin/controlroom` | 19 | help line for `dream · dream --check · promote · reject` |
| `bin/controlroom` | **673–786** | `# ---- dream (007) ---- … # ---- end dream ----`: `dream_py <render\|check\|promote\|reject>` (python3 stdlib, args via argv, stdin = heredoc per L004). State file `memory/.dream-pre.json` (stamp · since · max P id · mtimes of DECISIONS/LESSONS/STATUS/results/*) written by `render`, read by `check` |
| `bin/controlroom` | 962–972 | case arms: `dream` (parses `--check` / `--reason` / `--since` / `--here`; `render` → `.dream-brief.md`; `--here` cats it; else picks the first free `dreamer-N` from `herdr agent list` (L012 — names are global), calls the existing `launch`, then re-arms its watch row with `dream --check, then promote/reject (report: …)`), `promote\|reject` |
| `bin/controlroom` | 629 | `init`: `proposed.md` header said `p###` (lower-case `n[0]`) → `P###`; also fixed the live header line by `sed` |
| `bin/controlroom` | 973 | help fallback `sed -n 2,18p` → `sed -n '2,/^set -u/…'` — 006 and I both appended header lines and both bumped the range; now it prints the whole header block regardless |
| `README.md` | 117 | vocabulary: **Dream** (propose-only, on demand; check; promote/reject; nothing scheduled until three reports were read) |
| `README.md` | 200–203 | Commands table: `dream`, `dream --check`, `promote`, `reject` |
| `README.md` | 220 | Operating rule 10: *Dream is on demand. Schedule it only after the human has read three reports and said they were useful.* |
| `skills/controlroom/SKILL.md` | 42–44, 57 | Commands rows + the same protocol bullet |
| `docs/briefs/memory/` | — | `dreams/2026-10-27-{1312,1318,1323}.md` (3 reports) · `proposed.md` (14 P-lines, all struck: 9 `promoted-as`, 5 `rejected:`) · `archive/2026-10.md` (+5 rejected, +L008) · `.dream-brief.md` (last render) · `.dream-pre.json` |
| `docs/briefs/memory/DECISIONS.md` / `LESSONS.md` | — | **+D010–D013, +L014–L018 via `promote`; L008 superseded by L009** (see "What I promoted") |

Net in `bin/controlroom`: dream block 114 lines + 11 case-arm lines + 1 help line ≈ **126 added** (≲ 150 ✓). `bash -n` clean. Strip (D) needed no change: `mem_py strip`/`memory` already count `^- P\d{3} ` (struck lines excluded) and `last dream` already reads the newest `dreams/*.md` — verified: `MEMORY  13 decisions · 17 lessons · newest 2m ago · 0 proposed · last dream 0m`.

### Design choices worth knowing
- **Placeholders: the CLI fills them, template args are the fallback.** `render` replaces `{ROOT}` `{reason}` `{since}` `{stamp}` (and `${1:-…}`/`${2:-…}`) and strips the frontmatter. Reason: the CLI *knows* ROOT, the last-dream mtime and the stamp; a model guessing the stamp would break `--check`'s "which report is this run" link. When used as `/dream [reason] [since]` in a pane, pi substitutes `$1`/`$2` and a parenthetical tells the model how to resolve the rest.
- **`--check` knows "this run's" P-lines** = ids above `p_max` recorded at render (struck ones included, so a report still checks clean after you promote/reject). For an older report (pre-json belongs to a newer run) it falls back to the P-ids echoed under the report's `## Proposed` heading.
- **mtime guard = warnings, not failures** (recorded as D013): the controller legitimately `decide`s and retires workers mid-dream — both happened during run 1 — so a hard failure would be a false positive. The warning names the file and time; a human can tell in one glance whether it was them.
- **`promote` goes through `decide`/`lesson`** (subprocess of `$0`), so ID allocation, 160-char cap, source validation and slug are the one code path; the D/L line's date is promotion day. `--kind` overrides the tag for named IDs; with `--all` it filters (and defaults untagged lines). Refuses a slug already active in D/L (rc 1).
- **Failure toast** is `dream report has dead links` for link-class failures (brief's wording) and `dream report failed --check` otherwise (run 3's Unsure asked for this).

## Scratch proofs (L011 — `mktemp -d` + `git init`, `init --memory-only --no-seed`, one fake result file)
```
dream --here --reason "scratch test" --since 2026-10-26T00:00   → brief rendered; 0 unfilled {ROOT}/{since}/{stamp}/{reason}/${1}/${2} placeholders; .dream-pre.json = {stamp, since, p_max:0, mtimes of DECISIONS/LESSONS/STATUS/results/*}
fake dream: 5 P-lines (good phrase · dead path · dead phrase · dup slug of D001 · untagged), report says "Proposed (4)", no DONE dream
dream --check → FAILED · 5 problem(s): no `DONE dream` · heading says 4 / gained 5 · P002 path not found · P003 phrase "unicorns" not in … · P004 duplicate slug **baseline-d** (also D001) · ⚠ P005 no [D]/[L] tag   rc=1
            logs/agents.log: "[13:11] dream report has dead links — 5 problem(s) in …" (toast via `note`)
fixed → dream --check → "dream ok: 2 proposed, 1 merges, 0 landed-candidates · dreams/2026-10-27-1311.md · 0 min"  rc=0 · agents.log line appended
promote P001            → L002 **proxy-idle-retry** (tag [L] → lesson path; P001 struck `promoted-as L002`)
promote P005            → "no [D]/[L] tag — pass --kind D|L" rc=1 ;  promote P005 --kind D → D002
promote P001 (again)    → "not found or already struck"
promote P006 (slug = L001's) → "refused — slug **baseline-l** already in memory as L001 (reject it, or supersede)" rc=1
reject P006 "duplicate of L001" → struck `rejected: duplicate of L001`, copied to archive/2026-10.md ; reject again → rc=1
promote --all --kind L  → skips the [D]-tagged P007 silently (rc 0) ; promote --all → D003 ; then `decide` → D004 (IDs continue past promoted ones)
mtime guard: `decide` + a new results file during a dream → ⚠ moved during the dream: DECISIONS.md (modified 13:12) · ⚠ new during the dream: results/002-new.md  (warnings, not failures)
anchors: #6-gotchas resolves; #7-nope → ✗ ; :3 (line) resolves ; a dead `←` inside the report's Unsure bullet → ✗ (report citations are checked too)
16 P-lines in one run → ✗ "16 P-lines this run (max 10)"
memory --counts after strikes → struck lines excluded (grep ^- ~~P = 5)
--since 7d → 2026-10-20T13:11 ; default --since with a report present → that report's mtime
tick --once --dry-run → "tick: nothing to do" ; memory / decide / lesson unchanged
```

## The three real runs

| run | command | worker | wall | $ · tok · turns | P-lines | merges | `--check` |
|---|---|---|---|---|---|---|---|
| 1 | `dream --reason "007 run 1" --since 2026-10-26T00:00` | dreamer-1 wC:pA (A006) | 4 min | $1.40 · 0.5M · 14 | **10** (6 [D], 4 [L]) | 3 | ok after fixing *my* regex; 2 ⚠ (controller/006 edits) |
| 2 | `dream --reason "007 run 2"` (since 13:16) | dreamer-2 wC:pB (A010) | 3 min | $1.03 · 0.3M · 12 | 4 (2 [D], 2 [L]) | 2 | ok; 1 ⚠ (my results file) |
| 3 | `dream --reason "007 run 3"` (since 13:21, after promote/reject of all 14) | dreamer-3 wC:pC (A011) | 2 min | $0.69 · 0.2M · 8 | **0** | 3 (one is "L008↔L009 resolved") | ok, no ⚠ |

All three: wrote exactly the two files, no `results/` file (despite `launch`'s generic "write the final summary to docs/briefs/results/" sentence), no guarded file touched, report ends `DONE dream`, pane ends `DONE dreamer-N`. 14/14 P-line citations resolved mechanically; I spot-checked 3 phrases by `grep -c` (1/1/1).

### Run 1 — `docs/briefs/memory/dreams/2026-10-27-1312.md`
- `## Read` 16 files with mtimes · `## Proposed (10)` · 3 merge candidates · landed: none · 5 Unsure questions.
- `dream --check` first pass: **5 false failures from my own regex** — the report-scan pattern swallowed the `:` before a quoted phrase (`…/001-mana-install.md:` → "unparseable"). Fixed (`← ([^\s"#:]+(?:#…|:"…"|:\d+)?)`), re-ran: `dream ok: 10 proposed, 3 merges, 0 landed-candidates · 4 min`. Two ⚠, both legitimate and not the dreamer: `STATUS.md modified 13:13` (controller retired 001–005 workers) and `results/006-wake-automations.md modified 13:17` (worker 006).
- P-lines: P001 launchd-bash-c-not-lc [D] · P002 tick-heartbeat-file [D] · P003 rearm-only-rowless [D] · P004 one-room-per-workspace [D] · P005 land-archives-dropped [D] · P006 prefer-phrase-sources [D] · P007 verify-controller-stalled [L] · P008 pin-installed-pi-docs [L] · P009 osascript-notify-permission [L] · P010 pnpm-shim-needs-wrapper [L] — all `results/00N.md:"phrase"`.
- Merge candidates: **L008 ↔ L009 — true duplicate** (same rule, same source, recorded a minute apart) · D006 ↔ D009 partial overlap (true: D009 restates two of D006's numbers and adds evidence) · L010 ↔ L012 (weak, it says so itself).
- **Verdict: worth reading.** The controller had recorded only design-level decisions (D001–D009) and the seeded gotchas; the dreamer surfaced ten *implementation* decisions and lessons that lived only in results files. Citations were real. It hit the 10-line cap and listed what it *didn't* propose and why — the most useful paragraph in the report. The L008/L009 duplicate is a genuine catch. What it got wrong: nothing factual; the weak points are judgement — P001/P002 are tick implementation trivia a future worker would re-derive from the code, P010 is a mana lesson rather than a control-room one, P006 (a convention) was tagged `[D]` where `[L]` fits. And it read two *in-progress* result files (006, 007). Cost of the signal: $1.40.

### Run 2 — `docs/briefs/memory/dreams/2026-10-27-1318.md`
- Window was ~2 minutes of new content. `## Proposed (4)`: P011 source-regex-all-forms [L], P012 skip-in-progress-results [L], P013 mtime-guard-warns [D] — **all three mined from my own `IN PROGRESS` 007 results file** — and P014 paused-rows-held-collapse [D] from the design doc (already approved via D005; 006 implements it). Merge candidates: the same two, flagged "still open from run 1". Unsure (5) were sharper than the proposals: the dreamer's DONE toast says "results in docs/briefs/results/" though the dream forbids writing there; the failure toast says "dead links" for non-link failures; is memory scoped to the control room or to projects; what cadence after 007.
- **Verdict: marginal — one keeper, cost $1.03.** P012 is a genuinely good rule (I adopted it in the prompt and promoted it as L018), and two of the Unsure items led to code changes (dream-specific watch-row text; failure toast names the class). But with nothing new landed, a dreamer reaches: it proposed from a half-written result (ironically including the rule not to) and restated design text. The right answer for a 2-minute window was `Proposed (0)`; the prompt didn't yet say so.

### Run 3 — `docs/briefs/memory/dreams/2026-10-27-1323.md`
- After all 14 P-lines were promoted/rejected and L008 superseded. **`## Proposed (0)` · `- none`**, with a "Not proposed" paragraph explaining each candidate it declined (SKILL gotchas → already D008/L010/L004/L003; 006 evidence → 006 is `IN PROGRESS`). Merge candidates: D006↔D009 (still open — the controller's call), L010↔L012 (weak), and "L008↔L009 is resolved". Unsure: lists 006 and 007 as "still in progress" (L018 applied), guesses — wrongly, but phrased as a question — that the 13:23 `--check` failures came from dup-slug checking (they came from the count fallback), repeats the toast-text points, and asks whether a minimum-window guard is planned.
- **Verdict: correct and cheap ($0.69), and the only thing it could have said.** The value here is the negative result plus the questions. It did not invent anything, cited nothing dead, and respected the in-progress rule.

## What I promoted (controller: `controlroom supersede` if you disagree)
| P | → | line |
|---|---|---|
| P003 | **D010** rearm-only-rowless | tick re-arms a watch only for agents with no row at all and live in herdr ← results/005:"re-fire every minute" |
| P004 | **D011** one-room-per-workspace | one control room per Herdr workspace; plist bakes cwd + HERDR_WORKSPACE_ID ← results/005:"one control room per workspace" |
| P005 | **D012** land-archives-dropped | `land` copies dropped struck board items to memory/archive/ ← results/004:"keeping a copy honours" |
| P013 | **D013** mtime-guard-warns | `dream --check` mtime guard warns, doesn't fail ← results/007:"the controller may legitimately decide mid-dream" |
| P007 | **L014** verify-controller-stalled | `verify controller` says stalled for an idle controller ← results/004:"the controller never prints" |
| P008 | **L015** pin-installed-pi-docs | check `ls ~/.pi/pkg`, pin API names to the installed pi ← results/003-critic:"pin API names against the installed version" |
| P009 | **L016** osascript-notify-permission | `display notification` silent until Script Editor is allowed ← results/002:"Notification permission" |
| P006 | **L017** prefer-phrase-sources (`--kind L` overrode its `[D]`) | prefer `path:"phrase"` over `#anchor` ← results/004:"sources read better and are grep-verifiable" |
| P012 | **L018** skip-in-progress-results | don't propose from `IN PROGRESS` results ← results/007:"could propose from half-written results" |

Rejected (reason in `proposed.md` and `archive/2026-10.md`): P001 launchd `bash -c` (covered by D008 + plist comment) · P002 tick heartbeat file (implementation detail) · P010 pnpm shim (mana lesson, not control-room memory) · P011 regex form (fixed in place; self-referential) · P014 held rows collapse (design §4, approved by D005, 006 implements). Also **`supersede L008 L009`** on the dreamer's merge candidate — same rule, same source, a minute apart; kept L009 because brief 007 cites it. **Left to the controller:** D006 ↔ D009 (fold evidence or supersede part — your numbers); L010 ↔ L012 (merge once 006's `logs/.controller` is the fix).

`proposed.md` now holds 0 open P-lines; `memory --counts` → `13 decisions · 17 lessons · 0 proposed` (L013 was added by another worker during this brief).

## Recommendation — schedule it?
**Not nightly. On demand after a batch of results lands, or weekly at most.** Evidence: a dream's value tracks *how many result files landed since the last one*, not the clock. Run 1 (seven results in window) → 10 real lines + a duplicate catch for $1.40. Runs 2–3 (nothing new) → one keeper and a correct zero, for $1.72 combined. A nightly wake on a quiet project would burn ~$0.70/night to say `Proposed (0)`. Concretely: (a) keep `D003` (on demand); (b) if the controller wants automation, the trigger should be a `watch-path "docs/briefs/results/*.md"` row with `controlroom dream --reason landed --no-prompt` — i.e. wake on *new results*, debounced — not `daily 06:00`; (c) a cheap guard in `dream` ("no result modified since `--since` → print `nothing new since …` and exit 0, `--force` to run anyway") would make a scheduled row safe — I did not add it (not in the brief; one more line budget decision for the controller). (d) The human still has to read the reports: all three are 40–50 lines; the `Not proposed` and `Unsure` paragraphs are the parts worth a person's time.

## Deviations (with reasons)
1. **`[D]`/`[L]` tag** at the start of the one-liner (brief allowed it) — promote needs to know the file; the tag is stripped on promotion.
2. **mtime guard warns instead of failing** — see D013; the controller edited STATUS.md during run 1.
3. **"Skip IN PROGRESS results" rule added to the prompt after run 2** (not in §3.2) — run 2 showed the failure mode; run 3 confirmed the fix. The §3.2 text itself is unchanged; rules are appended below it.
4. **Dream watch row gets its own instruction** (`dream --check, then promote/reject (report: …)`) by re-arming after `launch` — the generic "integrate .dream-brief when DONE" was wrong. The tick's DONE *toast* still says "results in docs/briefs/results/ — say ok" (tick text is 006's; left alone — one line in `tick_pass` could special-case `dreamer-*`).
5. **`promote --kind` overrides the tag for named IDs** (design only had `--all --kind L`) — needed to promote P006 as a lesson without rejecting and re-proposing.
6. **`dream --check` re-runs don't re-log** `dream ok` for the same report (log stayed readable through 3 re-checks of one report).
7. **Help fallback** changed from a fixed `sed` range to "up to `set -u`" — two parallel workers kept bumping the number.
8. **`supersede L008 L009`** executed by me, not the controller — unambiguous duplicate the dreamer found; listed above so it can be reversed by re-adding.
9. Did not add `land --older-than` (design §9 row mentions it; brief 007's deliverables don't) and did not touch `controller.md` (006 was editing it in parallel; the protocol bullet lives in README + SKILL.md as the brief asked).

## Gotchas
- **`herdr agent wait <name> --until idle` returns immediately after `launch`** — the pre-prompt idle. Use `--until done --until blocked` only, or sleep the 90 s launch grace first (the old watch loop knew this). Cost me one confused `--check` against the previous report.
- **Running `dream --here` (or any `dream`) re-renders and overwrites `memory/.dream-pre.json`** — if you do that while a dreamer is still running, `--check` on its report falls back to the echoed-ID path (works, but the mtime guard and duration are lost). One run at a time.
- **A dreamer reads the dreamer's own in-progress result.** The worker whose brief *is* the dream will always have its results file `IN PROGRESS`; now handled by the skip rule, but a run during an active brief will list that file under Unsure every time.
- **My regex bug was invisible in the scratch test** because the scratch report had no `:"phrase"` citations inside its prose — only in P-lines, which take a different parse path. Lesson for checkers: test the report-scan path with the exact source forms the prompt recommends.
- **The guarded-file set includes the dreamer's launcher's result** (007's own file here) — expect one ⚠ per run while a brief that launches dreams is active.
- **`launch`'s fixed prompt text** ("write the final summary to docs/briefs/results/") contradicts the dream brief; three of three dreamers followed the brief, but it is a standing invitation to a stray results file. A `launch --prompt-suffix`/dream-specific sentence would close it.
- Three dreams in 11 minutes is the test harness, not a cadence: the dreamer in run 3 noticed and asked.

DONE 007
