import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { ScriptResult } from "/lib/Optimize";
import { PortNumbers } from "/lib/PortNumbers";

const scriptsThatCostMeMoney = ["/bin/darkweb.js", "/bin/hacknet.js", "/bin/home.js", "/bin/pserv.js"];

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");
    logger.toast("reminder that hacknet has the bitnode mult hardcoded to 0.05", "warning");

    const controlPortHandle = ns.getPortHandle(PortNumbers.Control);

    const scripts = [
        { name: "/bin/startHack.js", active: true },
        { name: "/bin/darkweb.js", active: true },
        { name: "/bin/hacknet.js", active: true },
        { name: "/bin/contracts.js", active: true },
        { name: "/bin/home.js", active: true },
        { name: "/bin/pserv.js", active: true },
        { name: "/bin/faction.js", active: true, args: ["--state", "joinFaction"] },
        { name: "/bin/redpill.js", active: true },
    ];

    while (scripts.some((script) => script.active)) {
        const control = new Map<string, ScriptResult>();
        while (!controlPortHandle.empty()) {
            const msg: ScriptResult = JSON.parse(controlPortHandle.read().toString());
            control.set(msg.script, msg);
        }

        for (let i in scripts) {
            const script = scripts[i];

            // 2.00GB | stanek.get (fn)
            // const controlMsg = control.get(script.name);
            const controlMsg = control["get"](script.name);
            if (controlMsg) {
                logger.trace("control msg", controlMsg);
                if (controlMsg.next === "exit") scripts[i].active = false;
                else scripts[i].active = true;

                if (controlMsg.done === "saveMoney") {
                    scripts
                        .filter((script) => scriptsThatCostMeMoney.includes(script.name))
                        .forEach((script) => {
                            script.active = false;
                        });
                }

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
