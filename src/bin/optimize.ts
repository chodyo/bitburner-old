import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { gainRootAccess } from "/lib/Root";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");

    const deploys = [
        {
            scriptname: "/lib/Hacknet.js",
            destination: "foodnstuff",
            dependencies: ["/lib/Logger.js"],
            args: [],
        },
        {
            scriptname: "/lib/CodingContracts.js",
            destination: "iron-gym",
            dependencies: [],
            args: ["autosolve", "--quiet", "--daemon"],
        },
        {
            scriptname: "/lib/Home.js",
            destination: "sigma-cosmetics",
            dependencies: ["/lib/Logger.js", "/lib/Money.js"],
            args: [],
        },
        {
            scriptname: "/lib/Darkweb.js",
            destination: "joesguns",
            dependencies: ["/lib/Logger.js", "/lib/Money.js"],
            args: [],
        },
    ];
    for (const deploy of deploys) {
        if (!gainRootAccess(ns, deploy.destination)) {
            logger.toast(`no root access on ${deploy.destination} for ${deploy.scriptname}`, "error");
            continue;
        }

        if (deploy.dependencies.length > 0) await ns.scp(deploy.dependencies, deploy.destination);
        await ns.scp(deploy.scriptname, deploy.destination);

        ns.scriptKill(deploy.scriptname, deploy.destination);
        const result: "success" | "error" = ns.exec(deploy.scriptname, deploy.destination, 1, ...deploy.args)
            ? "success"
            : "error";
        logger.toast(`running script ${deploy.scriptname} on ${deploy.destination}: ${result}`, result);
    }

    // scripts that know when there's nothing left to do and exit on their own
    const oneTimeScripts = ["/lib/Pserv.js", "/lib/Faction.js", "/bin/startHack.js"];
    oneTimeScripts.forEach((filename) => {
        ns.scriptKill(filename, "home");
        const result: "success" | "error" = ns.exec(filename, "home") ? "success" : "error";
        logger.toast(`running script ${filename} on home: ${result}`, result);
    });

    const backgroundScripts = [];
    while (backgroundScripts.length > 0) {
        backgroundScripts.forEach((filename) => {
            ns.scriptKill(filename, "home");
            const result: "success" | "error" = ns.exec(filename, "home") ? "success" : "error";
            logger.toast(`running script ${filename} on home: ${result}`, result);
        });
        await ns.asleep(60000);
    }
}
