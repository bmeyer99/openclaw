import { o as createSubsystemLogger } from "./entry.js";
import "./auth-profiles-DKgK9hDN.js";
import { c as resolveDefaultAgentId, s as resolveAgentWorkspaceDir } from "./agent-scope-jm0ZdXwM.js";
import "./utils-PmTbZoD1.js";
import "./exec-BIMFe4XS.js";
import "./github-copilot-token-rP-6QdKv.js";
import "./pi-model-discovery-CsRo-xMp.js";
import { r as loadConfig } from "./config-D2YxKDFm.js";
import "./manifest-registry-tuAcHxrV.js";
import "./server-context-CM_E6wD5.js";
import "./errors-DdT2Dtkb.js";
import "./control-service-CsZqkYzD.js";
import "./client-BYx0ZoAv.js";
import "./call-BP5bxCbS.js";
import "./message-channel-Csfn34Sf.js";
import "./links-jGisPfXW.js";
import "./plugins-TrKFfrLt.js";
import "./logging-fywhKCmE.js";
import "./accounts-B5QZU96b.js";
import { t as loadOpenClawPlugins } from "./loader--20mbAgI.js";
import "./progress-Dn3kWpaL.js";
import "./prompt-style-D5D7b3cX.js";
import "./manager-D4vFZNfd.js";
import "./paths-RvF0P6tQ.js";
import "./sqlite-B_L84oiu.js";
import "./routes-BYsSaHTN.js";
import "./pi-embedded-helpers-lTQOm0Sp.js";
import "./deliver-CZ9s51XS.js";
import "./sandbox-CGhb3yKM.js";
import "./channel-summary-DFJB-feZ.js";
import "./wsl-BHM9IW7W.js";
import "./skills-DtwGIkTI.js";
import "./image-CohUtSc5.js";
import "./redact-CDPAzwi8.js";
import "./tool-display-BMYWrp0L.js";
import "./restart-sentinel-DywisDen.js";
import "./channel-selection-BM0IKqqi.js";
import "./commands-QKCDDyUp.js";
import "./pairing-store-DMex6WWe.js";
import "./login-qr-DPRAiQJC.js";
import "./pairing-labels-C6I3dD-m.js";

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