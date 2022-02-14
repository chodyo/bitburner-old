import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { getAllRootedServers } from "/lib/Root";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");

    const hackFiles = ["/bin/hack.js", "/bin/grow.js", "/bin/weaken.js", "/lib/Logger.js"];
    const hackRam = ns.getScriptRam("/bin/hack.js");
    const growRam = ns.getScriptRam("/bin/grow.js");
    const weakenRam = ns.getScriptRam("/bin/weaken.js");

    const rootedServers = Array.from(getAllRootedServers(ns));

    for (const hostname of rootedServers) {
        if (hackFiles.every((filename) => ns.fileExists(filename, hostname))) continue;
        await ns.scp(hackFiles, hostname);
    }

    const myHackingLevel = ns.getHackingLevel();

    const potentialTargets = rootedServers
        .filter((hostname) => myHackingLevel >= ns.getServerRequiredHackingLevel(hostname))
        .map((hostname) => ({
            hostname: hostname,

            maxMoney: ns.getServerMaxMoney(hostname),
            money: ns.getServerMoneyAvailable(hostname),

            minSecurity: ns.getServerMinSecurityLevel(hostname),
            security: ns.getServerSecurityLevel(hostname),

            hackChance: ns.hackAnalyzeChance(hostname),
        }));

    if (potentialTargets.length === 0) return;

    const target = potentialTargets
        // super basic, just choose target to be the one with the highest max money
        // this could probably be optimized to take into account other factors but idk how to do that yet
        .reduce((prevHost, currHost) => (prevHost.maxMoney > currHost.maxMoney ? prevHost : currHost));

    // calculate state by the time hack/grow/weaken would complete

    // this could be better by computing with respect to time
    // const currentlyRunning = rootedServers
    //     .map((hostname) => ({
    //         hostname: hostname,
    //         activeScript:
    //             ns.getRunningScript("/bin/hack.js", hostname) ||
    //             ns.getRunningScript("/bin/weaken.js", hostname) ||
    //             ns.getRunningScript("/bin/grow.js", hostname),
    //     }))
    //     .filter((machine) => machine.activeScript)
    //     .forEach((machine) => {
    //         switch (machine.activeScript.filename) {
    //             case "/bin/hack.js": {
    //                 const securityIncrease = ns.hackAnalyzeSecurity(machine.activeScript.threads);
    //                 target.security = Math.max(100, target.security + target.hackChance * securityIncrease);
    //                 const moneyDecrease = ns.hackAnalyze(target.hostname) * machine.activeScript.threads;
    //                 target.money = Math.min(0, target.money - target.hackChance * moneyDecrease);
    //                 break;
    //             }
    //             case "/bin/weaken.js":
    //                 const securityDecrease = ns.weakenAnalyze(machine.activeScript.threads);
    //                 target.security = Math.min(target.minSecurity, target.security - securityDecrease);
    //                 break;
    //             case "/bin/grow.js":
    //                 const securityIncrease = ns.growthAnalyzeSecurity(machine.activeScript.threads);
    //                 target.security = Math.max(100, target.security + securityIncrease);
    //                 const moneyIncrease = target.money * ns.getServerGrowth(target.hostname); // todo: probably super wrong

    //                 break;
    //             default:
    //                 throw new Error("unexpected script");
    //         }
    //     });

    // todo: need to figure out an equation for dollars per second when hacking/growing/weakening

    // todo: adjust targetMoney/targetSecurity by factoring in active scripts here

    // todo: run hack/grow/weaken while calculating effects

    rootedServers
        .filter((hostname) => hostname !== "home")
        .map((hostname) => {
            let scriptname = "/bin/hack.js";
            let ram = hackRam;

            if (target.security > target.minSecurity + 5 && Math.random() < 0.95) {
                scriptname = "/bin/weaken.js";
                ram = weakenRam;
            } else if (target.money < 0.9 * target.maxMoney && Math.random() < 0.9) {
                scriptname = "/bin/grow.js";
                ram = growRam;
            }

            return {
                hostname: hostname,
                scriptname: scriptname,
                threads: Math.floor((ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname)) / ram),
            };
        })
        .filter((server) => server.threads)
        .forEach((server) => {
            if (ns.exec(server.scriptname, server.hostname, server.threads, "--target", target.hostname)) {
                logger.info(server.scriptname, target.hostname, server.hostname, server.threads);
                return;
            }
            logger.error("failed to hack", target.hostname, server.hostname, server.threads);
        });
}
