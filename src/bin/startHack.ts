import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { PortNumbers } from "/lib/PortNumbers";
import { getAllRootedServers } from "/lib/Root";
import { StartHackParams } from "/lib/StartHack";

let params: StartHackParams = {
    logHost: "nobody",
    hackPercent: 8,
};

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting params=", params);

    const hackParamsPortHandle = ns.getPortHandle(PortNumbers.StartHackParams);

    while (true) {
        while (!hackParamsPortHandle.empty()) {
            const msg: StartHackParams = JSON.parse(hackParamsPortHandle.read() as string);
            if (msg.logHost) {
                logger.trace("updated logHost", `${params.logHost} -> ${msg.logHost}`);
                params.logHost = msg.logHost;
            }
            if (msg.hackPercent) {
                logger.trace("updated hackPercent", `${params.hackPercent} -> ${msg.hackPercent}`);
                params.hackPercent = msg.hackPercent;
            }
        }

        const rootedServers = Array.from(getAllRootedServers(ns)).map((hostname) => new Target(ns, hostname));
        await distributeHackFiles(ns, rootedServers);
        doHack(ns, rootedServers);
        await ns.sleep(100);
    }
}

class Target {
    private ns: NS;
    hostname: string;

    security: number;
    money: number;

    private bufferTime = 0.1;

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
        return this.ns.getHackTime(this.hostname) / 1000 + this.bufferTime;
    }
    get growTime() {
        return this.ns.getGrowTime(this.hostname) / 1000 + this.bufferTime;
    }
    get weakenTime() {
        return this.ns.getWeakenTime(this.hostname) / 1000 + this.bufferTime;
    }
    get rate() {
        return (this.maxMoney * this.hackChance) / this.hackTime;
    }
}

async function distributeHackFiles(ns: NS, rootedServers: Target[]) {
    const hackFiles = ["/bin/hack.js", "/bin/grow.js", "/bin/weaken.js", "/lib/Logger.js"];

    for (const target of rootedServers) {
        if (target.hostname === "home") continue;
        if (hackFiles.every((filename) => ns.fileExists(filename, target.hostname))) continue;
        await ns.scp(hackFiles, target.hostname);
    }
}

function doHack(ns: NS, rootedServers: Target[]) {
    const logger = new Logger(ns);
    rootedServers
        .filter((target) => ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target.hostname))
        .filter((target) => target.maxMoney > 0)
        .filter((target) => target.hostname !== "home")
        .sort((a, b) => a.maxMoney - b.maxMoney)
        // .slice(0, 10)
        .forEach((target) => {
            // logger.trace("now", target.toString());

            // weaken to min
            const stateWhenWeakenCompletes = getServerStateAtTime(ns, rootedServers, target, target.weakenTime);
            // logger.trace("weakenTime", target.weakenTime, "after weaken", stateWhenWeakenCompletes);
            if (stateWhenWeakenCompletes.security > target.minSecurity) {
                let threads = 1;
                while (stateWhenWeakenCompletes.security - ns.weakenAnalyze(threads) > target.minSecurity) {
                    threads++;
                }
                if (target.hostname.toLowerCase() === params.logHost?.toLowerCase())
                    logger.info(`weakening ${target.hostname} with ${threads} threads`);
                spinUpScriptWithThreads(ns, rootedServers, target, "/bin/weaken.js", threads);
            }

            // grow to 100%
            const stateWhenGrowCompletes = getServerStateAtTime(ns, rootedServers, target, target.growTime);
            // logger.trace("growTime", target.growTime, "after grow", stateWhenGrowCompletes);
            if (
                stateWhenGrowCompletes.money < target.maxMoney &&
                stateWhenGrowCompletes.security <= target.minSecurity
            ) {
                const nonzeroMoney = stateWhenGrowCompletes.money || 0.00000000001; // protect against div by 0
                const threads = Math.ceil(ns.growthAnalyze(target.hostname, target.maxMoney / nonzeroMoney));
                if (target.hostname.toLowerCase() === params.logHost?.toLowerCase())
                    logger.info(`growing ${target.hostname} with ${threads} threads`);
                spinUpScriptWithThreads(ns, rootedServers, target, "/bin/grow.js", threads);
            }

            // server is primed and ready for hack to begin
            const stateWhenHackCompletes = getServerStateAtTime(ns, rootedServers, target, target.hackTime);
            // logger.trace("hackTime", target.hackTime, "after hack", stateWhenHackCompletes);
            if (
                stateWhenHackCompletes.money >= target.maxMoney &&
                stateWhenHackCompletes.security <= target.minSecurity
            ) {
                const hackAmount = (params.hackPercent / 100) * target.maxMoney; // todo: configurable
                const threads = Math.ceil(ns.hackAnalyzeThreads(target.hostname, hackAmount));
                if (target.hostname.toLowerCase() === params.logHost?.toLowerCase())
                    logger.info(`hacking ${target.hostname} with ${threads} threads`);
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

    const homeReserveRam =
        ns.getScriptRam("/bin/faction.js") +
        ns.getScriptRam("/bin/optimize.js") +
        ns.getScriptRam("/bin/startHack.js") +
        2;

    const ramPerThread = ns.getScriptRam(scriptname);
    for (const server of rootedServers) {
        if (totalThreads <= 0) return;

        const serverMaxRam = ns.getServerMaxRam(server.hostname) - (server.hostname === "home" ? homeReserveRam : 0);
        const serverRamAvailable = serverMaxRam - ns.getServerUsedRam(server.hostname);
        const serverMaxThreads = Math.floor(serverRamAvailable / ramPerThread);
        if (serverMaxThreads <= 0) continue;

        const threads = Math.min(totalThreads, serverMaxThreads);

        const pid = ns.exec(scriptname, server.hostname, threads, ...["--target", target.hostname]);

        // out of ram?
        if (!pid) continue;

        if (target.hostname.toLowerCase() === params.logHost?.toLowerCase()) {
            logger.trace(
                `started=${pid} script=${scriptname} on server=${server.hostname} against target=${target.hostname} threads=${threads}`
            );
        }

        totalThreads -= threads;
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
                const growthFactor = ns.formulas.hacking.growPercent(
                    ns.getServer(target.hostname),
                    script.threads,
                    ns.getPlayer(),
                    ns.getServer(script.hostname).cpuCores
                );
                // new Logger(ns).info(`growthFactor=${growthFactor}`);
                const oldServerMoney = result.money;
                // let serverGrowth = ns.getServerGrowth(target.hostname);
                // serverGrowth = serverGrowth < 1 ? 1 : serverGrowth;
                // result.money += 1 * script.threads;
                // result.money *= serverGrowth;
                result.money *= growthFactor;
                result.money = Math.min(result.money, target.maxMoney);
                if (result.money !== oldServerMoney) {
                    result.security += ns.growthAnalyzeSecurity(script.threads);
                    result.security = Math.max(result.security, target.minSecurity);
                }
                break;
            }
            case "hack": {
                const oldServerMoney = result.money;
                const hackFactor =
                    ns.formulas.hacking.hackPercent(ns.getServer(target.hostname), ns.getPlayer()) * script.threads;
                // new Logger(ns).info(`hackFactor=${hackFactor}`);
                result.money -= hackFactor * result.money;
                if (result.money !== oldServerMoney) {
                    result.security += ns.hackAnalyzeSecurity(script.threads);
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
