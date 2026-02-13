import { C as setVerbose, O as isRich, k as theme, n as isTruthyEnvValue, p as defaultRuntime } from "./entry.js";
import "./auth-profiles-DKgK9hDN.js";
import { n as replaceCliName, r as resolveCliName } from "./command-format-3xiXujG0.js";
import "./agent-scope-jm0ZdXwM.js";
import "./utils-PmTbZoD1.js";
import "./exec-BIMFe4XS.js";
import "./github-copilot-token-rP-6QdKv.js";
import "./pi-model-discovery-CsRo-xMp.js";
import { M as VERSION } from "./config-D2YxKDFm.js";
import "./manifest-registry-tuAcHxrV.js";
import "./server-context-CM_E6wD5.js";
import "./errors-DdT2Dtkb.js";
import "./control-service-CsZqkYzD.js";
import "./tailscale-BUcKO8Rr.js";
import "./auth-viF_w60n.js";
import "./client-BYx0ZoAv.js";
import "./call-BP5bxCbS.js";
import "./message-channel-Csfn34Sf.js";
import { t as formatDocsLink } from "./links-jGisPfXW.js";
import "./plugin-auto-enable-BCaO-x5O.js";
import "./plugins-TrKFfrLt.js";
import "./logging-fywhKCmE.js";
import "./accounts-B5QZU96b.js";
import "./loader--20mbAgI.js";
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
import { n as resolveCliChannelOptions } from "./channel-options-Dr_V1MXS.js";
import { c as getVerboseFlag, i as getCommandPath, u as hasHelpOrVersion } from "./register.subclis-Dd04ACbv.js";
import "./completion-cli-DqfY4zeV.js";
import "./gateway-rpc-C_u_Bd8V.js";
import "./deps-Cs9H-k3F.js";
import "./daemon-runtime-BHG5CXec.js";
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
import { t as forceFreePort } from "./ports-DE3IL0e3.js";
import "./auth-health-5NJ_mVlU.js";
import { i as hasEmittedCliBanner, n as emitCliBanner, o as registerProgramCommands, r as formatCliBannerLine, t as ensureConfigReady } from "./config-guard-BqKk9MQW.js";
import "./help-format-GuCWws6r.js";
import "./configure-E0G0AjLD.js";
import "./systemd-linger-C0UIEsx9.js";
import "./doctor-CUr6v-pZ.js";
import { Command } from "commander";

//#region src/cli/program/context.ts
function createProgramContext() {
	const channelOptions = resolveCliChannelOptions();
	return {
		programVersion: VERSION,
		channelOptions,
		messageChannelOptions: channelOptions.join("|"),
		agentChannelOptions: ["last", ...channelOptions].join("|")
	};
}

//#endregion
//#region src/cli/program/help.ts
const CLI_NAME = resolveCliName();
const EXAMPLES = [
	["openclaw channels login --verbose", "Link personal WhatsApp Web and show QR + connection logs."],
	["openclaw message send --target +15555550123 --message \"Hi\" --json", "Send via your web session and print JSON result."],
	["openclaw gateway --port 18789", "Run the WebSocket Gateway locally."],
	["openclaw --dev gateway", "Run a dev Gateway (isolated state/config) on ws://127.0.0.1:19001."],
	["openclaw gateway --force", "Kill anything bound to the default gateway port, then start it."],
	["openclaw gateway ...", "Gateway control via WebSocket."],
	["openclaw agent --to +15555550123 --message \"Run summary\" --deliver", "Talk directly to the agent using the Gateway; optionally send the WhatsApp reply."],
	["openclaw message send --channel telegram --target @mychat --message \"Hi\"", "Send via your Telegram bot."]
];
function configureProgramHelp(program, ctx) {
	program.name(CLI_NAME).description("").version(ctx.programVersion).option("--dev", "Dev profile: isolate state under ~/.openclaw-dev, default gateway port 19001, and shift derived ports (browser/canvas)").option("--profile <name>", "Use a named profile (isolates OPENCLAW_STATE_DIR/OPENCLAW_CONFIG_PATH under ~/.openclaw-<name>)");
	program.option("--no-color", "Disable ANSI colors", false);
	program.configureHelp({
		optionTerm: (option) => theme.option(option.flags),
		subcommandTerm: (cmd) => theme.command(cmd.name())
	});
	program.configureOutput({
		writeOut: (str) => {
			const colored = str.replace(/^Usage:/gm, theme.heading("Usage:")).replace(/^Options:/gm, theme.heading("Options:")).replace(/^Commands:/gm, theme.heading("Commands:"));
			process.stdout.write(colored);
		},
		writeErr: (str) => process.stderr.write(str),
		outputError: (str, write) => write(theme.error(str))
	});
	if (process.argv.includes("-V") || process.argv.includes("--version") || process.argv.includes("-v")) {
		console.log(ctx.programVersion);
		process.exit(0);
	}
	program.addHelpText("beforeAll", () => {
		if (hasEmittedCliBanner()) return "";
		const rich = isRich();
		return `\n${formatCliBannerLine(ctx.programVersion, { richTty: rich })}\n`;
	});
	const fmtExamples = EXAMPLES.map(([cmd, desc]) => `  ${theme.command(replaceCliName(cmd, CLI_NAME))}\n    ${theme.muted(desc)}`).join("\n");
	program.addHelpText("afterAll", ({ command }) => {
		if (command !== program) return "";
		const docs = formatDocsLink("/cli", "docs.openclaw.ai/cli");
		return `\n${theme.heading("Examples:")}\n${fmtExamples}\n\n${theme.muted("Docs:")} ${docs}\n`;
	});
}

//#endregion
//#region src/cli/program/preaction.ts
function setProcessTitleForCommand(actionCommand) {
	let current = actionCommand;
	while (current.parent && current.parent.parent) current = current.parent;
	const name = current.name();
	const cliName = resolveCliName();
	if (!name || name === cliName) return;
	process.title = `${cliName}-${name}`;
}
const PLUGIN_REQUIRED_COMMANDS = new Set([
	"message",
	"channels",
	"directory"
]);
function registerPreActionHooks(program, programVersion) {
	program.hook("preAction", async (_thisCommand, actionCommand) => {
		setProcessTitleForCommand(actionCommand);
		const argv = process.argv;
		if (hasHelpOrVersion(argv)) return;
		const commandPath = getCommandPath(argv, 2);
		if (!(isTruthyEnvValue(process.env.OPENCLAW_HIDE_BANNER) || commandPath[0] === "update" || commandPath[0] === "completion" || commandPath[0] === "plugins" && commandPath[1] === "update")) emitCliBanner(programVersion);
		const verbose = getVerboseFlag(argv, { includeDebug: true });
		setVerbose(verbose);
		if (!verbose) process.env.NODE_NO_WARNINGS ??= "1";
		if (commandPath[0] === "doctor" || commandPath[0] === "completion") return;
		await ensureConfigReady({
			runtime: defaultRuntime,
			commandPath
		});
		if (PLUGIN_REQUIRED_COMMANDS.has(commandPath[0])) ensurePluginRegistryLoaded();
	});
}

//#endregion
//#region src/cli/program/build-program.ts
function buildProgram() {
	const program = new Command();
	const ctx = createProgramContext();
	const argv = process.argv;
	configureProgramHelp(program, ctx);
	registerPreActionHooks(program, ctx.programVersion);
	registerProgramCommands(program, ctx, argv);
	return program;
}

//#endregion
export { buildProgram };