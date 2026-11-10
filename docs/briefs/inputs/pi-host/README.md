# Inputs for 017-pi-host-spike — drop files here (Lance, from a WARP browser)

pi.shopify.io is Mint + WARP only; agents on this machine cannot read it. Save these as files in this directory:

1. `AGENTS.md` — https://github.com/shop/world/blob/main/areas/incubating/pi-host/AGENTS.md (the zone overview)
2. `README.md.zone` — the zone README (pillars, "sandboxes at the edges" deferral)
3. `api.md` — whatever documents the REST/SSE session API (create session · post prompt · read transcript/SSE · sleep/wake timer · idempotency keys). If it lives in source, `src/host/server.ts` + the route files are fine.
4. `auth.md` — how a person gets a Mint token usable from a CLI/curl today (River 11-09: "the mint token pi.shopify.io CLI path doesn't work yet" — note whatever does work: browser cookie, `mint` CLI, token exchange).
5. Optional: `pi.js` notes — the `import pi from "https://pi.shopify.io/pi.js"` client and `s.doc()` session documents.

When the files are here, tell the controller "inputs are in" and it launches the spike.
