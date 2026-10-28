---
description: "Dream - propose-only memory consolidation for the control room (reads files, proposes P-lines into memory/proposed.md + a dated report; nothing is promoted)"
argument-hint: "[reason] [since]"
---
You are the dreamer for the control room at {ROOT}. Reason: {reason}. Window: since {since} (last dream or 7 days).
(If a `{…}` above is unfilled you were invoked as `/dream [reason] [since]` instead of by `controlroom dream`: ROOT = `git rev-parse --show-toplevel`, reason = `${1:-manual}`, since = `${2:-the newest docs/briefs/memory/dreams/*.md mtime, else 7 days ago}`, stamp = `date +%Y-%m-%d-%H%M`.)
Read, in order: docs/briefs/memory/DECISIONS.md, LESSONS.md, proposed.md; docs/briefs/STATUS.md; every docs/briefs/results/*.md
modified since {since}; logs/agents.log and logs/tick.log lines since {since}; skills/controlroom/SKILL.md "Gotchas".
You PROPOSE; you do not promote. Write exactly two files:
1. docs/briefs/memory/dreams/{stamp}.md with sections: ## Read (paths + mtimes) · ## Proposed (count) · ## Merge candidates
   (pairs of existing IDs that say the same thing, with why) · ## Landed candidates (board rows that are done and integrated)
   · ## Unsure (things that look like decisions but have no file source — phrase each as a question for the human)
2. docs/briefs/memory/proposed.md: APPEND lines in the exact memory grammar
   `- P### YYYY-MM-DD **slug** — [D]|[L] one-liner ← source` where source is a path that exists, with #anchor or :"quoted phrase".
   No link, no line. Max 10 lines per run. Never duplicate an existing D/L/P slug.
Do not edit DECISIONS.md, LESSONS.md, STATUS.md or any result. Finish with the single line: DONE dream

## Rules the checker enforces (`controlroom dream --check` runs with no LLM — it greps)
- **Skip work in progress.** A result whose status line says `IN PROGRESS` (or whose worker is still `working` on the board) is not evidence yet — do not propose from it; list it under `## Unsure` as "<file> still in progress" and move on. The same goes for `docs/briefs/memory/.dream-brief.md` and your own report.
- **A proposal is something memory lacks.** Read DECISIONS/LESSONS first. A rephrase of an existing D/L line is not a proposal; if two existing lines overlap, that is a *merge candidate*. Nothing new to say is a fine outcome: `## Proposed (0)` and no P-lines.
- **One-liner tag.** Start every one-liner with `[D]` (a choice that was made, with its reason) or `[L]` (something that bit us + the rule adopted). That tag decides which file `controlroom promote` writes to. ≤ 160 chars after the tag.
- **IDs and slugs.** `P###` = highest existing P id in proposed.md (struck lines count) + 1, zero-padded, one per line, appended at the end. The `**slug**` is lowercase-hyphenated, ≤ 32 chars, and must not match any slug already in DECISIONS.md, LESSONS.md or proposed.md (struck lines included — a rejected proposal is not re-proposed under the same slug).
- **Source.** `← path` is repo-relative and must exist. Prefer `path:"quoted phrase"` — the phrase must appear verbatim in that file (the checker greps it). `path#heading-anchor` must be a heading in that file (GitHub style: lowercase, spaces→`-`, punctuation dropped). `path:NN` is a line number. No `chat:` sources — you never saw the chat.
- **Report.** `## Read`: one line per file you actually read — `path · YYYY-MM-DD HH:MM` (its mtime). `## Proposed (N)`: N = the number of P-lines you appended this run, and list those same lines under the heading. `## Merge candidates` / `## Landed candidates` / `## Unsure`: one bullet per item (`- …`), or the single bullet `- none`. The report's last line is `DONE dream`.
- **Touch nothing else.** Write only the two files above. Do not create a file in docs/briefs/results/. Do not run `controlroom decide|lesson|promote|reject|land|init` or edit any other file — the checker compares the mtimes of DECISIONS.md, LESSONS.md, STATUS.md and every result before and after your run and flags what moved.
- **Time-box: ≤ 15 minutes wall clock, ≤ 10 P-lines.** Write the report skeleton (`## Read` as you go) first, so a cut-off run still leaves a partial report; append P-lines to proposed.md as you find them, not in one batch at the end.
- If you were launched as a worker, after the report's `DONE dream` line reply in chat with the `DONE <your agent name>` line your launcher asked for. The controller then runs `controlroom dream --check` and promotes or rejects each P-line by hand; you do neither.
