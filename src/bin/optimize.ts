import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { alreadyDeployed } from "/lib/Deploy";

export async function main(ns: NS) {
    // Game keeps crashing on reset, maybe delaying the start will help
    await ns.sleep(1 * 60 * 1000);

    const logger = new Logger(ns);
    logger.trace("starting");

    // scripts that know when there's nothing left to do and exit on their own
    const oneTimeScripts = ["/lib/Darkweb.js", "/lib/Pserv.js"];
    oneTimeScripts.forEach((filename) => {
        if (alreadyDeployed(ns, filename, "home")) return;
        const result: "success" | "error" = ns.run(filename) ? "success" : "error";
        logger.toast(`running script ${filename} on home: ${result}`, result);
    });

    const backgroundScripts = [
        "/lib/Home.js",
        "/lib/Hacknet.js",
        "/lib/Faction.js",
        "/bin/startHack.js",
        "/bin/contracts.js",
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
