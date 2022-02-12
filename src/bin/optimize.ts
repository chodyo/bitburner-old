import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");

    const scripts = [
        { name: "/bin/startHack.js", active: true },
        { name: "/bin/darkweb.js", active: true },
        { name: "/bin/hacknet.js", active: true },
        { name: "/bin/contracts.js", active: true },
        { name: "/bin/home.js", active: true },
        { name: "/bin/pserv.js", active: true },
        { name: "/bin/Faction.js", active: false },
    ];

    while (scripts.some((script) => script.active)) {
        for (let i in scripts) {
            const script = scripts[i];
            if (!script.active) continue;

            const pid = ns.run(script.name, 1, ...(script.args ? script.args : []));
            if (!pid) {
                logger.toast(`optimize failed to run ${script.name} - recommend temporarily disabling it`);
                continue;
            }
            while (ns.getRunningScript(pid)) await ns.sleep(1000);

            //! for some reason this is returning empty :(
            const scriptLogs = ns.getScriptLogs(script.name, "home");
            logger.trace("script logs", script.name, scriptLogs.length, scriptLogs[scriptLogs.length - 1]);
            if (scriptLogs.length > 0) {
                scripts[i].active = !scriptLogs[scriptLogs.length - 1].toLowerCase().includes("exit 0");
            }
        }
        return; // todo: remove once i have it nice and pretty
    }
}
