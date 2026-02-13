import { c as enableConsoleCapture, i as normalizeEnv, n as isTruthyEnvValue, p as defaultRuntime } from "./entry.js";
import "./auth-profiles-DKgK9hDN.js";
import "./agent-scope-jm0ZdXwM.js";
import { d as resolveConfigDir } from "./utils-PmTbZoD1.js";
import "./exec-BIMFe4XS.js";
import "./github-copilot-token-rP-6QdKv.js";
import "./pi-model-discovery-CsRo-xMp.js";
import { M as VERSION } from "./config-D2YxKDFm.js";
import "./manifest-registry-tuAcHxrV.js";
import "./server-context-CM_E6wD5.js";
import { r as formatUncaughtError } from "./errors-DdT2Dtkb.js";
import "./control-service-CsZqkYzD.js";
import { t as ensureOpenClawCliOnPath } from "./path-env-CUhrC5DA.js";
import "./tailscale-BUcKO8Rr.js";
import "./auth-viF_w60n.js";
import "./client-BYx0ZoAv.js";
import "./call-BP5bxCbS.js";
import "./message-channel-Csfn34Sf.js";
import "./links-jGisPfXW.js";
import "./plugin-auto-enable-BCaO-x5O.js";
import "./plugins-TrKFfrLt.js";
import "./logging-fywhKCmE.js";
import "./accounts-B5QZU96b.js";
import { jt as installUnhandledRejectionHandler } from "./loader--20mbAgI.js";
import "./progress-Dn3kWpaL.js";
import "./prompt-style-D5D7b3cX.js";
import "./note-CBiVaqG7.js";
import "./clack-prompter-BJuVh97L.js";
import "./onboard-channels-B--0Z9ss.js";
import "./archive-mFgwsll-.js";
import "./installs-C5cjVarj.js";
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
import "./channels-status-issues-DRXQXvhY.js";
import { n as ensurePluginRegistryLoaded } from "./command-options-D7kre5yC.js";
import { i as getCommandPath, s as getPrimaryCommand, u as hasHelpOrVersion } from "./register.subclis-Dd04ACbv.js";
import "./completion-cli-DqfY4zeV.js";
import "./gateway-rpc-C_u_Bd8V.js";
import "./deps-Cs9H-k3F.js";
import "./daemon-runtime-BHG5CXec.js";
import { t as assertSupportedRuntime } from "./runtime-guard-DkjmhnBD.js";
import "./service-DDLmNXs9.js";
import "./systemd-BatTMuQk.js";
import "./service-audit-Cabb86Ni.js";
import "./table-CIkhZk5W.js";
import "./widearea-dns-CwnGNpiS.js";
import "./audit-CEiNX4FA.js";
import "./onboard-skills-DPHNS7xc.js";
import "./health-format-CLeRoqUc.js";
import "./update-runner-CDZoc8i4.js";
import "./github-copilot-auth-UcSIKqKw.js";
import "./logging-56YfW4V5.js";
import "./hooks-status-Dyz0pY0O.js";
import "./status-C-YMwgkE.js";
import "./skills-status-zh2LneT8.js";
import "./tui-RUoSyyCB.js";
import "./agent-BXdxmKzk.js";
import "./node-service-3V4T3lmf.js";
import "./status.update-GD0PxBy2.js";
import "./auth-health-5NJ_mVlU.js";
import { a as findRoutedCommand, n as emitCliBanner, t as ensureConfigReady } from "./config-guard-BqKk9MQW.js";
import "./help-format-GuCWws6r.js";
import "./configure-E0G0AjLD.js";
import "./systemd-linger-C0UIEsx9.js";
import "./doctor-CUr6v-pZ.js";
import path from "node:path";
import process$1 from "node:process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

//#region src/infra/dotenv.ts
function loadDotEnv(opts) {
	const quiet = opts?.quiet ?? true;
	dotenv.config({ quiet });
	const globalEnvPath = path.join(resolveConfigDir(process.env), ".env");
	if (!fs.existsSync(globalEnvPath)) return;
	dotenv.config({
		quiet,
		path: globalEnvPath,
		override: false
	});
}

//#endregion
//#region src/cli/route.ts
async function prepareRoutedCommand(params) {
	emitCliBanner(VERSION, { argv: params.argv });
	await ensureConfigReady({
		runtime: defaultRuntime,
		commandPath: params.commandPath
	});
	if (params.loadPlugins) ensurePluginRegistryLoaded();
}
async function tryRouteCli(argv) {
	if (isTruthyEnvValue(process.env.OPENCLAW_DISABLE_ROUTE_FIRST)) return false;
	if (hasHelpOrVersion(argv)) return false;
	const path = getCommandPath(argv, 2);
	if (!path[0]) return false;
	const route = findRoutedCommand(path);
	if (!route) return false;
	await prepareRoutedCommand({
		argv,
		commandPath: path,
		loadPlugins: route.loadPlugins
	});
	return route.run(argv);
}

//#endregion
//#region src/cli/run-main.ts
function rewriteUpdateFlagArgv(argv) {
	const index = argv.indexOf("--update");
	if (index === -1) return argv;
	const next = [...argv];
	next.splice(index, 1, "update");
	return next;
}
async function runCli(argv = process$1.argv) {
	const normalizedArgv = stripWindowsNodeExec(argv);
	loadDotEnv({ quiet: true });
	normalizeEnv();
	ensureOpenClawCliOnPath();
	assertSupportedRuntime();
	if (await tryRouteCli(normalizedArgv)) return;
	enableConsoleCapture();
	const { buildProgram } = await import("./program-PFjqoB-5.js");
	const program = buildProgram();
	installUnhandledRejectionHandler();
	process$1.on("uncaughtException", (error) => {
		console.error("[openclaw] Uncaught exception:", formatUncaughtError(error));
		process$1.exit(1);
	});
	const parseArgv = rewriteUpdateFlagArgv(normalizedArgv);
	const primary = getPrimaryCommand(parseArgv);
	if (primary) {
		const { registerSubCliByName } = await import("./register.subclis-B2Rc08oT.js");
		await registerSubCliByName(program, primary);
	}
	if (!(!primary && hasHelpOrVersion(parseArgv))) {
		const { registerPluginCliCommands } = await import("./cli-Bp48jQQF.js");
		const { loadConfig } = await import("./config-D-3oM1qB.js");
		registerPluginCliCommands(program, loadConfig());
	}
	await program.parseAsync(parseArgv);
}
function stripWindowsNodeExec(argv) {
	if (process$1.platform !== "win32") return argv;
	const stripControlChars = (value) => {
		let out = "";
		for (let i = 0; i < value.length; i += 1) {
			const code = value.charCodeAt(i);
			if (code >= 32 && code !== 127) out += value[i];
		}
		return out;
	};
	const normalizeArg = (value) => stripControlChars(value).replace(/^['"]+|['"]+$/g, "").trim();
	const normalizeCandidate = (value) => normalizeArg(value).replace(/^\\\\\\?\\/, "");
	const execPath = normalizeCandidate(process$1.execPath);
	const execPathLower = execPath.toLowerCase();
	const execBase = path.basename(execPath).toLowerCase();
	const isExecPath = (value) => {
		if (!value) return false;
		const normalized = normalizeCandidate(value);
		if (!normalized) return false;
		const lower = normalized.toLowerCase();
		return lower === execPathLower || path.basename(lower) === execBase || lower.endsWith("\\node.exe") || lower.endsWith("/node.exe") || lower.includes("node.exe") || path.basename(lower) === "node.exe" && fs.existsSync(normalized);
	};
	const filtered = argv.filter((arg, index) => index === 0 || !isExecPath(arg));
	if (filtered.length < 3) return filtered;
	const cleaned = [...filtered];
	if (isExecPath(cleaned[1])) cleaned.splice(1, 1);
	if (isExecPath(cleaned[2])) cleaned.splice(2, 1);
	return cleaned;
}

//#endregion
export { runCli };