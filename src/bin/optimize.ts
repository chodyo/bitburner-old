import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { ScriptResult } from "/lib/Optimize";
import { PortNumbers } from "/lib/PortNumbers";

const scriptsThatCostMeMoney = ["/bin/hacknet.js", "/bin/home.js", "/bin/pserv.js"];

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");

    const scripts = [
        { name: "/bin/startHack.js", active: true, runOnce: true },
        { name: "/bin/redpill.js", active: false, runFast: false },
        { name: "/bin/contracts.js", active: true },
        { name: "/bin/faction.js", active: true, args: ["--state", "joinFaction"] },
        { name: "/bin/home.js", active: true },
        { name: "/bin/darkweb.js", active: true },
        { name: "/bin/pserv.js", active: true },
        { name: "/bin/hacknet.js", active: true },
        { name: "/bin/bladeburner.js", active: true },
        { name: "/bin/wallst.js", active: false },
        { name: "/bin/gang.js", active: true },
    ];

    while (scripts.some((script) => script.active)) {
        updateScriptsBasedOnCtrlMsgs(ns, scripts);

        const activeScripts = scripts.filter((script) => script.active);

        const runOnceScripts = activeScripts.filter((script) => script.runOnce);
        for (const script of runOnceScripts) {
            startScript(ns, script);
        }

        const runFastScripts = activeScripts.filter((script) => script.runFast);
        for (let i = 0; i < 500; i++) {
            for (const fastScript of runFastScripts) await runTerminatingScript(ns, fastScript);
            await ns.sleep(5);
        }

        const secondaryScripts = activeScripts.filter((script) => !script.runOnce && !script.runFast);
        for (const secondaryScript of secondaryScripts) {
            await runTerminatingScript(ns, secondaryScript);
            await ns.sleep(2 * 100); // give me a chance to check out other script logs
        }
    }
}

function startScript(ns: NS, script: { name: string; args?: string[] }) {
    const logger = new Logger(ns);

    const runningScript = ns.getRunningScript(script.name, "home", ...(script.args ? script.args : []));
    if (!runningScript?.pid) {
        const pid = ns.run(script.name, 1, ...(script.args ? script.args : []));
        if (!pid) {
            logger.toast(`optimize failed to run ${script.name} - recommend temporarily disabling it`);
        }
    }
}

async function runTerminatingScript(ns: NS, script: { name: string; args?: string[] }) {
    const logger = new Logger(ns);

    const pid = ns.run(script.name, 1, ...(script.args ? script.args : []));
    if (!pid) {
        logger.toast(`optimize failed to run ${script.name} - recommend temporarily disabling it`);
        return;
    }

    const waitTimeMs = 10;
    while (ns.getRunningScript(pid)) await ns.sleep(waitTimeMs);
}

function updateScriptsBasedOnCtrlMsgs(ns: NS, scripts: { name: string; active: boolean; args?: string[] }[]) {
    const logger = new Logger(ns);

    const controlPortHandle = ns.getPortHandle(PortNumbers.Control);
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
            control.delete(script.name);
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
    }
}
