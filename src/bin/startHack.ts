import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { getAllRootedServers } from "/lib/Root";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");

    const rootedServers = Array.from(getAllRootedServers(ns))
        .map((hostname) => new Target(ns, hostname))
        .filter((target) => target.hostname !== "home");

    await distributeHackFiles(ns, rootedServers);

    something(ns, rootedServers);

    const potentialTargets = getPotentialTargets(ns, rootedServers);

    doHack(ns, potentialTargets);
}

class Target {
    private ns: NS;
    hostname: string;

    constructor(ns: NS, hostname: string) {
        this.ns = ns;
        this.hostname = hostname;
    }

    get maxMoney() {
        return this.ns.getServerMaxMoney(this.hostname);
    }
    get money() {
        return this.ns.getServerMoneyAvailable(this.hostname);
    }

    get minSecurity() {
        return this.ns.getServerMinSecurityLevel(this.hostname);
    }
    get security() {
        return this.ns.getServerSecurityLevel(this.hostname);
    }

    get hackChance() {
        return this.ns.hackAnalyzeChance(this.hostname);
    }
    get hackTime() {
        return this.ns.getHackTime(this.hostname) / 1000;
    }
    get growTime() {
        return this.ns.getGrowTime(this.hostname) / 1000;
    }
    get weakenTime() {
        return this.ns.getWeakenTime(this.hostname) / 1000;
    }

    get rate() {
        return (this.maxMoney * this.hackChance) / this.hackTime;
    }
}

async function distributeHackFiles(ns: NS, rootedServers: Target[]) {
    const hackFiles = ["/bin/hack.js", "/bin/grow.js", "/bin/weaken.js", "/lib/Logger.js"];

    for (const target of rootedServers) {
        if (hackFiles.every((filename) => ns.fileExists(filename, target.hostname))) continue;
        await ns.scp(hackFiles, target.hostname);
    }
}

function getPotentialTargets(ns: NS, rootedServers: Target[]) {
    const myHackingLevel = ns.getHackingLevel();
    return rootedServers
        .filter((target) => myHackingLevel >= ns.getServerRequiredHackingLevel(target.hostname))
        .sort((a, b) => b.rate - a.rate);
}

function doHack(ns: NS, rootedServers: Target[]) {
    const logger = new Logger(ns);

    const hackRam = ns.getScriptRam("/bin/hack.js");
    const growRam = ns.getScriptRam("/bin/grow.js");
    const weakenRam = ns.getScriptRam("/bin/weaken.js");

    const target = rootedServers[0];

    rootedServers
        .map((scriptHost) => {
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
                hostname: scriptHost.hostname,
                scriptname: scriptname,
                threads: Math.floor(
                    (ns.getServerMaxRam(scriptHost.hostname) - ns.getServerUsedRam(scriptHost.hostname)) / ram
                ),
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

function something(ns: NS, rootedServers: Target[]) {
    const logger = new Logger(ns);

    rootedServers.forEach((server) => {
        const scripts = allScriptsAgainstTarget(ns, rootedServers, server.hostname);
        if (scripts.length > 0) logger.trace("scriptsAgainstTarget", scripts);
    });
}

function allScriptsAgainstTarget(ns: NS, rootedServers: Target[], target: string) {
    return rootedServers
        .flatMap((server) => {
            const scripts: any = [];
            [
                { action: "weaken", time: server.weakenTime },
                { action: "grow", time: server.growTime },
                { action: "hack", time: server.hackTime },
            ].forEach((scriptType) => {
                const script = ns.getRunningScript(
                    `/bin/${scriptType.action}.js`,
                    server.hostname,
                    ...["--target", target]
                );
                if (script) {
                    scripts.push({
                        action: scriptType.action,
                        threads: script.threads,
                        remainingTime: scriptType.time - script.onlineRunningTime,
                    });
                }
            });
            return scripts;
        })
        .sort((a, b) => a.remainingTime - b.remainingTime);
}
