import { t as createSubsystemLogger } from "./subsystem-46MXi6Ip.js";
import { r as loadConfig } from "./config-O5yyJTBQ.js";
import { S as ensureChromeExtensionRelayServer } from "./chrome-BZQheL0a.js";
import { a as resolveProfile, i as resolveBrowserConfig, t as createBrowserRouteContext } from "./server-context-BJ_Q7rDK.js";

//#region src/browser/control-service.ts
let state = null;
const logService = createSubsystemLogger("browser").child("service");
function getBrowserControlState() {
	return state;
}
function createBrowserControlContext() {
	return createBrowserRouteContext({ getState: () => state });
}
async function startBrowserControlServiceFromConfig() {
	if (state) return state;
	const cfg = loadConfig();
	const resolved = resolveBrowserConfig(cfg.browser, cfg);
	if (!resolved.enabled) return null;
	state = {
		server: null,
		port: resolved.controlPort,
		resolved,
		profiles: /* @__PURE__ */ new Map()
	};
	for (const name of Object.keys(resolved.profiles)) {
		const profile = resolveProfile(resolved, name);
		if (!profile || profile.driver !== "extension") continue;
		await ensureChromeExtensionRelayServer({ cdpUrl: profile.cdpUrl }).catch((err) => {
			logService.warn(`Chrome extension relay init failed for profile "${name}": ${String(err)}`);
		});
	}
	logService.info(`Browser control service ready (profiles=${Object.keys(resolved.profiles).length})`);
	return state;
}
async function stopBrowserControlService() {
	const current = state;
	if (!current) return;
	const ctx = createBrowserRouteContext({ getState: () => state });
	try {
		for (const name of Object.keys(current.resolved.profiles)) try {
			await ctx.forProfile(name).stopRunningBrowser();
		} catch {}
	} catch (err) {
		logService.warn(`openclaw browser stop failed: ${String(err)}`);
	}
	state = null;
	try {
		await (await import("./pw-ai-DvURv772.js")).closePlaywrightBrowserConnection();
	} catch {}
}

//#endregion
export { stopBrowserControlService as i, getBrowserControlState as n, startBrowserControlServiceFromConfig as r, createBrowserControlContext as t };