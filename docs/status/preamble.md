# pi-controlroom — where we stand

**Goal:** a durable control room for [pi](https://pi.dev) + [Herdr](https://herdr.dev): one *controller* pi writes briefs, launches *worker* pis in their own tabs, and integrates their results — all through files in the repo (`docs/briefs/`), a live status strip, a 60 s launchd tick, and a small memory (decisions · lessons) that survives compaction and restarts. The test is operational: can a room run for days with nobody typing, and tell a human where things stand in one glance?

Everything here is a convention plus ~1,500 lines of bash + python3 (`bin/controlroom`), a pi extension (`extensions/controlroom.ts`) and two prompts. Version 0.2.0 is tagged; 0.2.1 material is listed under "still open" in the latest results.

## Next, in order
1. **015 status page** — this page: rendered from `STATUS.md` + `health`, republished after every `launch` and `land`, GitHub Pages + extra publishers.
2. 0.2.1 nits: `wake --repeat weekdays` first-fire filter · `core changed → restart` detection · remaining items from results/012 and results/014 "still open".

## Open questions
- Which rooms (graph-search, lookbook, psd) switch from hand-rolled publish scripts to the built-in `status-page`?
