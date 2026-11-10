// controlroom — flush decisions/lessons to memory before compaction (brief 008, design §7; 012 fixes). pi 1.4.0 API.
// Active only in the controller's pane (HERDR_ENV=1, docs/briefs/memory/ under cwd, HERDR_PANE_ID == logs/.controller,
// and — when herdr knows the pane's session — that session file is ours, so a hidden subagent inheriting HERDR_PANE_ID stays inactive).
// No LLM call here: at 75 % context it queues one follow-up asking the controller to flush; compaction is pi's default.
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const THRESHOLD = 75; // D006 thresholds-v1
const COMPACT_RE = /^\s*`?\/compact`?\.?\s*$/m; // (012) 011 #14: bare, backticked or with a full stop — on its own line
const flushText = (pct: number) =>
	`[controlroom · flush] Context at ${pct}% (threshold ${THRESHOLD}%). Before compaction: run \`controlroom memory\`, then record every decision/lesson from this session that is not yet there (controlroom decide|lesson --from <file>), update STATUS.md, note your next wake. Then reply \`/compact\` on a line of its own (this extension runs it).`;

export default function (pi: ExtensionAPI) {
	let active = false;
	let requested = false; // in-memory half of the rising-edge state; the file half is logs/.flush-requested
	let manual = false; // (012) 009 bug 3: a /flush request is not cancelled by being below the threshold
	let nudged = false; // (012) 011 #14: one nudge when a final reply (no tool calls) arrives without /compact
	let compactAt = 0; // (015.10) circuit breaker: when we triggered a compaction and the next turn is STILL over the threshold, compaction is not reducing context (graph-search 11-10: 44 flush→/compact→compact loops at 164 %, zero `compaction` entries written) — stand down instead of looping
	let cooldownUntil = 0;
	const COOLDOWN_MS = 30 * 60_000;
	let root = "";
	let sessionFile = "";
	const marker = () => join(root, "logs/.flush-requested"); // shared guard with the tick's shell fallback (§7.4); written by `controlroom event flush-requested`
	const event = (kind: string, ...arg: string[]) => pi.exec("controlroom", ["event", kind, ...arg], { cwd: root, timeout: 10_000 });
	const guard = async (name: string, fn: () => void | Promise<void>) => {
		try { await fn(); } catch (e) { await event("ext-error", `${name}: ${e instanceof Error ? e.message : String(e)}`).catch(() => {}); }
	};
	const heartbeat = () => { if (active) writeFileSync(join(root, "logs/.ext-alive"), `${new Date().toISOString()} ${process.pid} ${sessionFile}\n`); }; // (012) 011 #15: ts pid session — the tick checks all three
	const clear = () => { requested = false; manual = false; nudged = false; if (root && existsSync(marker())) unlinkSync(marker()); };
	const flush = (ctx: ExtensionContext, pct: number, how: "steer" | "followUp" | undefined, src: "ext" | "manual") => {
		pi.sendUserMessage(flushText(pct), how ? { deliverAs: how } : undefined);
		requested = true; manual = src === "manual"; nudged = false;
		return event("flush-requested", String(pct), src); // → agents.log + marker (with source) + one toast per crossing
	};

	pi.on("session_start", (_e, ctx) => guard("session_start", async () => {
		root = ctx.cwd; active = false; sessionFile = ctx.sessionManager.getSessionFile() ?? "";
		const m = existsSync(join(root, "logs/.flush-requested")) ? readFileSync(join(root, "logs/.flush-requested"), "utf8") : "";
		requested = !!m; manual = / manual /.test(m + " "); // a restart does not re-fire the same crossing; a pending manual request survives it
		if (process.env.HERDR_ENV !== "1" || !existsSync(join(root, "docs/briefs/memory"))) return;
		const ctl = existsSync(join(root, "logs/.controller")) ? readFileSync(join(root, "logs/.controller"), "utf8").trim() : "";
		active = !!ctl && ctl === process.env.HERDR_PANE_ID; // D015: by pane id
		if (active && sessionFile) { // (012) 010 §4: and by session file when herdr knows it — a subagent in this pane's env has a different one
			try {
				const out = await pi.exec("herdr", ["agent", "list"], { timeout: 10_000 });
				const pane = (JSON.parse(out.stdout).result.agents as { pane_id: string; agent_session?: { value?: string } }[]).find((a) => a.pane_id === ctl);
				const theirs = pane?.agent_session?.value ?? "";
				if (theirs && theirs !== sessionFile) active = false;
			} catch { /* herdr unavailable → pane-id gate only */ }
		}
		heartbeat();
	}));

	pi.on("turn_end", (e, ctx) => guard("turn_end", async () => {
		if (!active) return;
		heartbeat();
		const said = (e.message as { content?: unknown }).content;
		if (requested && Array.isArray(said) && said.some((c) => c?.type === "text" && COMPACT_RE.test(c.text))) {
			clear(); // (012) cleared on trigger, not on the next below-threshold turn
			compactAt = Date.now();
			ctx.compact({ onError: (err) => void event("ext-error", `compact: ${err.message}`) }); // the flush text ends "reply /compact" — actually run it (pi's default compaction; nothing replaced)
			return;
		}
		const final = Array.isArray(said) && !said.some((c) => c?.type === "toolCall"); // a reply with no tool calls ends the run
		if (requested && final && !nudged) { nudged = true; pi.sendUserMessage("[controlroom · flush] You said you would reply `/compact` on its own line once memory is flushed — do it now (or say why not).", { deliverAs: "followUp" }); } // (012) 011 #14: one nudge, only after a final reply without it (the 15:41 live run nudged mid-flush after 3 tool turns)
		const pct = ctx.getContextUsage()?.percent;
		if (pct === null || pct === undefined) return; // unknown right after compaction
		if (pct < THRESHOLD) { if (!manual) clear(); compactAt = 0; cooldownUntil = 0; return; } // below → re-arm (rising edge); a manual request stays pending (009 bug 3)
		if (Date.now() < cooldownUntil) return; // breaker open: no more flush requests until it expires or context drops below the threshold
		if (compactAt && Date.now() - compactAt < 10 * 60_000) { // we compacted minutes ago and are still over the line → compaction is not working here; stop asking
			cooldownUntil = Date.now() + COOLDOWN_MS; compactAt = 0;
			await event("ext-error", `compaction did not reduce context (still ${Math.round(pct)}%) — flush requests paused 30 min; type /compact when idle, or start a fresh session and Boot from files`);
			return;
		}
		if (requested || existsSync(marker())) return; // already requested for this crossing (by us, before a restart, or by the tick fallback)
		await flush(ctx, Math.round(pct), "followUp", "ext");
	}));

	pi.on("session_before_compact", (e, _ctx) => guard("session_before_compact", async () => {
		if (!active) return;
		clear(); // (012) a compaction by any route (ours, typed, auto) closes the pending request
		await event("compaction", String(e.preparation.tokensBefore));
	})); // returns nothing → pi's default compaction

	pi.registerCommand("flush", {
		description: "controlroom: ask the controller to flush decisions/lessons to memory now (then /compact)",
		handler: async (_args, ctx) => guard("/flush", async () => {
			if (!existsSync(join(ctx.cwd, "docs/briefs/memory"))) { ctx.ui.notify("no docs/briefs/memory/ here", "warning"); return; }
			root = root || ctx.cwd;
			await flush(ctx, Math.round(ctx.getContextUsage()?.percent ?? 0), ctx.isIdle() ? undefined : "followUp", "manual");
			ctx.ui.notify("flush requested", "info");
		}),
	});
}
