import "./pi-embedded-helpers-DT6rWpms.js";
import { Z as loadOpenClawPlugins } from "./reply-BlmcfzxV.js";
import "./paths-BDd7_JUB.js";
import { c as resolveDefaultAgentId, s as resolveAgentWorkspaceDir } from "./agent-scope-CrgUOY3f.js";
import { t as createSubsystemLogger } from "./subsystem-46MXi6Ip.js";
import "./utils-Dg0Xbl6w.js";
import "./exec-CTo4hK94.js";
import "./model-selection-CLkwGev5.js";
import "./github-copilot-token-VZsS4013.js";
import "./boolean-CE7i9tBR.js";
import "./env-DOcCob95.js";
import { r as loadConfig } from "./config-O5yyJTBQ.js";
import "./manifest-registry-BFpLJJDB.js";
import "./plugins-D1CxUobm.js";
import "./sandbox-DfObM-3h.js";
import "./image-CoAJZvwC.js";
import "./pi-model-discovery-DjGamP_B.js";
import "./chrome-BZQheL0a.js";
import "./skills-C4b1FA1e.js";
import "./routes-qdH4r5DL.js";
import "./server-context-BJ_Q7rDK.js";
import "./message-channel-BD3kuDks.js";
import "./logging-BdnOSVPD.js";
import "./accounts-BlHoTziG.js";
import "./paths-50eo6DV6.js";
import "./redact-BKh-zp-c.js";
import "./tool-display-rIUh61kT.js";
import "./deliver-CES7Lmef.js";
import "./dispatcher-Ldt6f0T1.js";
import "./manager-DzVsfNPg.js";
import "./sqlite-Dz6S6ijV.js";
import "./channel-summary-Dj5jW3A1.js";
import "./client-BoOinpaZ.js";
import "./call-BSsife63.js";
import "./login-qr-CwJ7a2oY.js";
import "./pairing-store-BnMngoWQ.js";
import "./links-C9fyAH-V.js";
import "./progress-uNDQDtGB.js";
import "./pi-tools.policy-DP8RtOoM.js";
import "./prompt-style-gfROyHgB.js";
import "./pairing-labels-DK2aLSd2.js";
import "./control-service-C_HzrVwd.js";
import "./restart-sentinel-CdcBcziq.js";
import "./channel-selection-Cmg7RpCn.js";

//#region src/plugins/cli.ts
const log = createSubsystemLogger("plugins");
function registerPluginCliCommands(program, cfg) {
	const config = cfg ?? loadConfig();
	const workspaceDir = resolveAgentWorkspaceDir(config, resolveDefaultAgentId(config));
	const logger = {
		info: (msg) => log.info(msg),
		warn: (msg) => log.warn(msg),
		error: (msg) => log.error(msg),
		debug: (msg) => log.debug(msg)
	};
	const registry = loadOpenClawPlugins({
		config,
		workspaceDir,
		logger
	});
	const existingCommands = new Set(program.commands.map((cmd) => cmd.name()));
	for (const entry of registry.cliRegistrars) {
		if (entry.commands.length > 0) {
			const overlaps = entry.commands.filter((command) => existingCommands.has(command));
			if (overlaps.length > 0) {
				log.debug(`plugin CLI register skipped (${entry.pluginId}): command already registered (${overlaps.join(", ")})`);
				continue;
			}
		}
		try {
			const result = entry.register({
				program,
				config,
				workspaceDir,
				logger
			});
			if (result && typeof result.then === "function") result.catch((err) => {
				log.warn(`plugin CLI register failed (${entry.pluginId}): ${String(err)}`);
			});
			for (const command of entry.commands) existingCommands.add(command);
		} catch (err) {
			log.warn(`plugin CLI register failed (${entry.pluginId}): ${String(err)}`);
		}
	}
}

//#endregion
export { registerPluginCliCommands };