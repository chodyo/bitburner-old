import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { getAllRootedServers } from "/lib/Root";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");

    const hackFiles = ["/bin/hack.js", "/bin/grow.js", "/bin/weaken.js", "/lib/Logger.js"];
    const hackRam = ns.getScriptRam("/bin/hack.js");

    while (true) {
        const rootedServers = Array.from(getAllRootedServers(ns));

        for (const hostname of rootedServers) {
            if (hackFiles.every((filename) => ns.fileExists(filename, hostname))) continue;
            await ns.scp(hackFiles, hostname);
        }

        const myHackingLevel = ns.getHackingLevel();

        const target = rootedServers
            .filter((hostname) => myHackingLevel > ns.getServerRequiredHackingLevel(hostname))
            .map((hostname) => ({
                hostname: hostname,
                maxMoney: ns.getServerMaxMoney(hostname),
                money: ns.getServerMoneyAvailable(hostname),
                minSecurity: ns.getServerMinSecurityLevel(hostname),
                security: ns.getServerSecurityLevel(hostname),
            }))
            // super basic, just choose target to be the one with the highest max money
            // this could probably be optimized to take into account other factors but idk how to do that yet
            .reduce((prevHost, currHost) => (prevHost.maxMoney > currHost.maxMoney ? prevHost : currHost));

        // todo: need to figure out an equation for dollars per second when hacking/growing/weakening

        // todo: adjust targetMoney/targetSecurity by factoring in active scripts here

        // todo: run hack/grow/weaken while calculating effects

        rootedServers
            .map((hostname) => ({
                hostname: hostname,
                threads: Math.floor((ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname)) / hackRam),
            }))
            .filter((server) => server.threads)
            .forEach((server) => {
                if (ns.exec("/bin/hack.js", server.hostname, server.threads, "--target", target.hostname)) {
                    logger.info("hacking", target.hostname, server.hostname, server.threads);
                    return;
                }
                logger.error("failed to hack", target.hostname, server.hostname, server.threads);
            });

        await ns.sleep(5 * 60 * 1000);
    }
}
