import { NS } from "Bitburner";
import { factionPort } from "/lib/Faction";
import { Logger } from "/lib/Logger";

type ScriptResult = {
    done: boolean;
    next: string;
};

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
        {
            name: "/bin/faction.js",
            active: true,
            args: ["--state", "joinFaction"],
            port: ns.getPortHandle(factionPort),
        },
    ];

    while (scripts.some((script) => script.active)) {
        for (let i in scripts) {
            const script = scripts[i];

            while (script.port && !script.port?.empty()) {
                const result: ScriptResult = JSON.parse(script.port.read().toString());
                logger.trace("script", script.name, "last result", result);

                if (result.next === "exit") scripts[i].active = false;
                else scripts[i].active = true;

                if (result.next && script.args?.length > 0) scripts[i].args = [script.args[0], result.next];
            }

            if (!script.active) continue;

            const pid = ns.run(script.name, 1, ...(script.args ? script.args : []));
            if (!pid) {
                logger.toast(`optimize failed to run ${script.name} - recommend temporarily disabling it`);
                continue;
            }
            while (ns.getRunningScript(pid)) await ns.sleep(2 * 1000);
        }
    }
}
