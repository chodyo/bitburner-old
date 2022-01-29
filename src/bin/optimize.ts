import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { alreadyDeployed } from "/lib/Deploy";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");

    const oneTimeScripts = [];
    oneTimeScripts.forEach((filename) => {
        if (alreadyDeployed(ns, filename, "home")) return;
        const result: "success" | "error" = ns.run(filename) ? "success" : "error";
        logger.toast(`running script ${filename} on home: ${result}`, result);
    });

    const backgroundScripts = [
        "/lib/Home.js",
        "/lib/Darkweb.js",
        "/lib/Hacknet.js",
        "/lib/Pserv.js",
        "/lib/Faction.js",
        "/bin/startHack.js",
    ];
    while (true) {
        backgroundScripts.forEach((filename) => {
            if (alreadyDeployed(ns, filename, "home")) return;
            const result: "success" | "error" = ns.run(filename) ? "success" : "error";
            logger.toast(`running script ${filename} on home: ${result}`, result);
        });
        await ns.asleep(60000);
    }
}
