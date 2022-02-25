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

    doHack(ns, rootedServers);
}

class Target {
    private ns: NS;
    hostname: string;

    security: number;
    money: number;

    constructor(ns: NS, hostname: string) {
        this.ns = ns;
        this.hostname = hostname;

        this.security = this.ns.getServerSecurityLevel(this.hostname);
        this.money = this.ns.getServerMoneyAvailable(this.hostname);
    }

    toString(): string {
        return JSON.stringify({
            hostname: this.hostname,
            security: this.security,
            minSecurity: this.minSecurity,
            money: this.money,
            maxMoney: this.maxMoney,
        });
    }

    get maxMoney() {
        return this.ns.getServerMaxMoney(this.hostname);
    }
    get minSecurity() {
        return this.ns.getServerMinSecurityLevel(this.hostname);
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

function doHack(ns: NS, rootedServers: Target[]) {
    const logger = new Logger(ns);
    rootedServers
        .filter((target) => ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target.hostname))
        .filter((target) => target.maxMoney > 0)
        .sort((a, b) => a.maxMoney - b.maxMoney) // todo: reverse this (for testing)
        .slice(0, 2) // todo: this should be adjusted
        .forEach((target) => {
            logger.trace("now", target.toString());

            // weaken to min
            const stateWhenWeakenCompletes = getServerStateAtTime(ns, rootedServers, target, target.weakenTime);
            logger.trace("weakenTime", target.weakenTime, "after weaken", stateWhenWeakenCompletes);
            if (stateWhenWeakenCompletes.security > target.minSecurity) {
                let threads = 0;
                while (target.security - ns.weakenAnalyze(threads) > target.minSecurity) {
                    threads++;
                }
                spinUpScriptWithThreads(ns, rootedServers, target, "/bin/weaken.js", threads);
            }

            // grow to 100%
            const stateWhenGrowCompletes = getServerStateAtTime(ns, rootedServers, target, target.growTime);
            logger.trace("growTime", target.growTime, "after grow", stateWhenGrowCompletes);
            if (
                stateWhenGrowCompletes.money < target.maxMoney &&
                stateWhenGrowCompletes.security <= target.minSecurity
            ) {
                const threads = ns.growthAnalyze(target.hostname, target.maxMoney / (target.money || 0.00001)); // protect against money===0
                spinUpScriptWithThreads(ns, rootedServers, target, "/bin/grow.js", threads);
            }

            // server is primed and ready for hack to begin
            const stateWhenHackCompletes = getServerStateAtTime(ns, rootedServers, target, target.hackTime);
            logger.trace("hackTime", target.hackTime, "after hack", stateWhenHackCompletes);
            if (
                stateWhenHackCompletes.money >= target.maxMoney &&
                stateWhenHackCompletes.security <= target.minSecurity
            ) {
                const hackAmount = (7 / 100) * target.maxMoney; // todo: configurable
                const threads = ns.hackAnalyzeThreads(target.hostname, hackAmount);
                spinUpScriptWithThreads(ns, rootedServers, target, "/bin/hack.js", threads);
            }
        });
}

function spinUpScriptWithThreads(
    ns: NS,
    rootedServers: Target[],
    target: Target,
    scriptname: string,
    totalThreads: number
) {
    const logger = new Logger(ns);

    const ramPerThread = ns.getScriptRam(scriptname);
    for (const server of rootedServers) {
        if (totalThreads <= 0) return;

        const serverRamAvailable = ns.getServerMaxRam(server.hostname) - ns.getServerUsedRam(server.hostname);
        const serverThreads = Math.floor(serverRamAvailable / ramPerThread);
        if (serverThreads === 0) continue;

        ns.exec(scriptname, server.hostname, serverThreads, ...["--target", target.hostname]);
        logger.trace("started script on server against target", scriptname, server.hostname, target.hostname);

        totalThreads -= serverThreads;
    }
}

function getServerStateAtTime(
    ns: NS,
    rootedServers: Target[],
    target: Target,
    seconds: number
): { security: number; money: number } {
    const scripts = allScriptsAgainstTarget(ns, rootedServers, target)
        .sort((a, b) => a.remainingTime - b.remainingTime)
        .filter((script) => script.remainingTime <= seconds);

    const result = { security: target.security, money: target.money };

    scripts.forEach((script) => {
        switch (script.action) {
            case "weaken":
                result.security -= ns.weakenAnalyze(script.threads, ns.getServer(script.hostname).cpuCores);
                result.security = Math.max(result.security, target.minSecurity);
                break;
            case "grow": {
                const oldServerMoney = result.money;
                let serverGrowth = ns.getServerGrowth(target.hostname);
                serverGrowth = serverGrowth < 1 ? 1 : serverGrowth;
                result.money += 1 * script.threads;
                result.money *= serverGrowth;
                result.money = Math.min(result.money, target.maxMoney);
                if (result.money !== oldServerMoney) {
                    result.security += ns.growthAnalyzeSecurity(script.threads);
                    result.security = Math.max(result.security, target.minSecurity);
                }
                break;
            }
            case "hack": {
                const oldServerMoney = result.money;
                result.security += ns.hackAnalyzeSecurity(script.threads);
                result.security = Math.max(result.security, target.minSecurity);
                if (result.money !== oldServerMoney) {
                    result.security += ns.growthAnalyzeSecurity(script.threads);
                    result.security = Math.max(result.security, target.minSecurity);
                }
                break;
            }
            default:
                throw new Error(`unexpected script action ${script.action}`);
        }
    });

    return result;
}

function allScriptsAgainstTarget(ns: NS, rootedServers: Target[], target: Target) {
    const scriptTypes = [
        { action: "weaken", time: target.weakenTime },
        { action: "grow", time: target.growTime },
        { action: "hack", time: target.hackTime },
    ];
    return rootedServers.flatMap((server) => {
        const scripts = Array<{ action: string; threads: number; remainingTime: number; hostname: string }>();
        scriptTypes.forEach((scriptType) => {
            const script = ns.getRunningScript(
                `/bin/${scriptType.action}.js`,
                server.hostname,
                ...["--target", target.hostname]
            );
            if (script) {
                scripts.push({
                    action: scriptType.action,
                    threads: script.threads,
                    remainingTime: scriptType.time - script.onlineRunningTime,
                    hostname: server.hostname,
                });
            }
        });
        return scripts;
    });
}
