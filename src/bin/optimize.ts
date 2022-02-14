import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { controlPort, ScriptResult } from "/lib/Optimize";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");

    const controlPortHandle = ns.getPortHandle(controlPort);

    const scripts = [
        { name: "/bin/startHack.js", active: true },
        { name: "/bin/darkweb.js", active: true },
        { name: "/bin/hacknet.js", active: true },
        { name: "/bin/contracts.js", active: true },
        { name: "/bin/home.js", active: true },
        { name: "/bin/pserv.js", active: true },
        { name: "/bin/faction.js", active: true, args: ["--state", "joinFaction"] },
    ];

    while (scripts.some((script) => script.active)) {
        const control = new Map<string, ScriptResult>();
        while (!controlPortHandle.empty()) {
            const msg: ScriptResult = JSON.parse(controlPortHandle.read().toString());
            control.set(msg.script, msg);
        }

        for (let i in scripts) {
            const script = scripts[i];

            const controlMsg = control.get(script.name);
            if (controlMsg) {
                logger.trace("control msg", controlMsg);
                if (controlMsg.next === "exit") scripts[i].active = false;
                else scripts[i].active = true;

                if (controlMsg.next && script.args && script.args.length > 0)
                    scripts[i].args = [script.args[0], controlMsg.next];
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
