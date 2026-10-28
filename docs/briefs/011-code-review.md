# 011 — code-review: review the uncommitted 0.2.0 "durable control room" diff before commit

## Objective
Review the uncommitted changes in this repo before 0.2.0 is committed. Four workers edited `bin/controlroom` in parallel (blocks `# ---- memory (004) ----`, `# ---- tick/health/pause (005) ----`, `# ---- automations (006) ----`, `# ---- dream (007) ----`, `# ---- compaction (008) ----`); a fifth added `extensions/controlroom.ts`. Find what's actually wrong at the seams. **Actionable findings only, no patches applied.**

## Memory that applies
- L006 **hidden-subagents-die** — this review was first tried as a hidden subagent; it read 104K tokens and died silently at 4 min. You are in a Herdr pane: **write partial findings to the result file every ~10 minutes** so nothing is lost.
- L011 **test-in-scratch-repo** · L012 **agent-names-global** · L019 **llm-cannot-slash** · L020 **symlinked CLI is live within 60 s via launchd tick — read-only review; never save edits to `bin/controlroom`**

## Scope
- `git diff` (tracked: `bin/controlroom` 248→~1030 lines, `bin/controlroom-pager`, `prompts/controller.md`, `README.md`, `skills/controlroom/SKILL.md`, `package.json`) plus untracked `extensions/controlroom.ts`, `prompts/dream.md`.
- Spec: `docs/design/durable-controlroom.md`. Worker claims: `docs/briefs/results/004…008-*.md` ("Deviations" / "Gotchas" sections).
- Environment: bash 3.2 on macOS, python3 stdlib only. A scenario-test worker (`durability-tests`) is running against the live room in parallel: **don't** run `pause`, `launch`, `wake`, `dream`, `init`, `retire`. Allowed: `bash -n`, `controlroom status|memory|automations|health`, `tick --once --dry-run`, `shellcheck` if present.

## Look for
1. Seams between blocks: duplicated helpers, two parsers for `AUTOMATIONS.md`/STATUS.md, inconsistent row formats, `set -u` unbound-variable risks, case-arm ordering/shadowing (`cancel A###` vs `cancel <agent>`), help text vs real arms.
2. Tick safety: lock staleness, atomic writes, idempotency across passes, behaviour when `herdr` is down/garbage, two overlapping ticks, unbounded growth of `logs/.tick-state.json` / `.health.json` / `tick.log`.
3. Prompt-the-controller path: rate cap across restarts, blocked-retry, `[play]` collapse, any way a wake could prompt a *worker* or another workspace's agent.
4. Memory CLI: `--from` validation bypasses, ID collisions after `supersede`, over-budget behaviour, `land` deleting text that memory lines cite.
5. Extension: event names vs pi 1.4.0 (`~/.pi/pkg/pi-1.4.0/docs/extensions.md`), the `/compact`-on-reply trigger (false positives), fail-safety, marker files.
6. Security/hygiene: anything executing text read from files/log lines; plist env; secrets in logs.
7. Docs drift: README/SKILL commands table vs actual `case` arms.

## Deliverable
`docs/briefs/results/011-code-review.md`: numbered findings by severity (**blocker / should-fix / nit**), each with `file:line`, what's wrong, why it matters, suggested fix. ≤ 120 lines. End with a 3-line verdict: safe to commit as-is? what must be fixed first? Then the sentinel line `DONE 011` and go idle. Time-box: 40 minutes; write what you have at 30.
