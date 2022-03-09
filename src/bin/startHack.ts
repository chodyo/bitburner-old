import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { PortNumbers } from "/lib/PortNumbers";
import { getAllRootedServers } from "/lib/Root";
import { StartHackParams } from "/lib/StartHack";

const params: StartHackParams = {
    logHost: "nobody",
    hackPercent: 8,
};

let primedServers = new Map<string, boolean>();

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting params=", params);

    primedServers = new Map<string, boolean>();

    const hackParamsPortHandle = ns.getPortHandle(PortNumbers.StartHackParams);

    while (true) {
        while (!hackParamsPortHandle.empty()) {
            const msg: StartHackParams = JSON.parse(hackParamsPortHandle.read() as string);
            if (msg.logHost) {
                updateLogHost(ns, msg.logHost);
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

    // https://bitburner.readthedocs.io/en/latest/advancedgameplay/hackingalgorithms.html#batch-algorithms-hgw-hwgw-or-cycles
    // Depending on your computer’s performance as well as a few other factors,
    // the necessary delay between script execution times may range between 20ms and 200ms,
    // you want to fine-tune this value to be as low as possible while also avoiding your scripts finishing out of order.
    // Anything lower than 20ms will not work due to javascript limitations.
    private bufferTime = 0.02;

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

    let previousTargetIsPrimed = true;

    const targets = rootedServers
        .filter((target) => ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target.hostname))
        .filter((target) => target.maxMoney > 0)
        .filter((target) => target.hostname !== "home")
        .sort((a, b) => a.maxMoney - b.maxMoney)
        // .slice(0, 10)
        .map((target) => {
            // logger.trace("now", target.toString());

            // shortcut to prevent trying to spin up worker threads for a machine later in the list
            // i want to laser focus as much work as possible on the machines in order because
            // once a machine is primed, it takes very little compute and rewards a lot of cash.
            // only work on a machine if i know that every other target before it has already been fully primed.
            if (!previousTargetIsPrimed) {
                return { hostname: target.hostname, primed: false, leftover: false };
            }
            // let later servers know that i am primed or not
            previousTargetIsPrimed = primedServers.get(target.hostname) || false;

            // weaken to min
            const stateWhenWeakenCompletes = getServerStateAtTime(ns, rootedServers, target, target.weakenTime);
            // logger.trace("weakenTime", target.weakenTime, "after weaken", stateWhenWeakenCompletes);
            if (stateWhenWeakenCompletes.security > target.minSecurity) {
                let threads = 1;
                while (stateWhenWeakenCompletes.security - ns.weakenAnalyze(threads) > target.minSecurity) {
                    threads++;
                }
                const notStartedThreads = spinUpScriptWithThreads(ns, rootedServers, target, "/bin/weaken.js", threads);
                if (notStartedThreads > 0) {
                    return { hostname: target.hostname, primed: false, leftover: true };
                }
            }

            // grow to 100%
            const stateWhenGrowCompletes = getServerStateAtTime(ns, rootedServers, target, target.growTime);
            // logger.trace("growTime", target.growTime, "after grow", stateWhenGrowCompletes);
            if (
                stateWhenGrowCompletes.money < target.maxMoney &&
                stateWhenGrowCompletes.security <= target.minSecurity
            ) {
                const nonzeroMoney = stateWhenGrowCompletes.money || 1e-10; // protect against div by 0
                const growthFactor = (target.maxMoney - nonzeroMoney) / nonzeroMoney + 1;
                const threads = Math.ceil(ns.growthAnalyze(target.hostname, growthFactor));
                // if (target.hostname.toLowerCase() === params.logHost?.toLowerCase()) {
                //     logger.trace(`growthFactor=${growthFactor} resulted in threads=${threads}`);
                // }
                const notStartedThreads = spinUpScriptWithThreads(ns, rootedServers, target, "/bin/grow.js", threads);
                if (notStartedThreads > 0) {
                    return { hostname: target.hostname, primed: false, leftover: true };
                }
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
                const leftoverThreads = spinUpScriptWithThreads(ns, rootedServers, target, "/bin/hack.js", threads) > 0;
                return { hostname: target.hostname, primed: true, leftover: leftoverThreads };
            }

            // used to indicate this target finished all work
            return { hostname: target.hostname, primed: undefined, leftover: false };
        })
        .map((target) => {
            if (target.primed && !primedServers.get(target.hostname)) {
                logger.info(`${target.hostname} is now primed`);
            }
            primedServers.set(target.hostname, target.primed || primedServers.get(target.hostname) || false); // in case primed is undefined
            return {
                hostname: target.hostname,
                primed: primedServers.get(target.hostname) || false,
                leftover: target.leftover,
            };
        });

    // automatically adjust logs to show which target we're priming
    // or if they're all primed, keep an eye on the biggest server (the last to be primed)
    const unprimed = targets.filter((target) => !target.primed);
    if (unprimed.length > 0) {
        updateLogHost(ns, unprimed[0].hostname);
    } else {
        updateLogHost(ns, targets[targets.length - 1].hostname);
    }

    const hadLeftoverWork = targets.some((target) => target.leftover);

    const hackPercentAdjustment = 1e-4;
    const oldHackPercent = params.hackPercent;
    // we only want to up the hack percent if every target is primed
    // and there's no leftover work that needs to be done
    if (unprimed.length === 0 && !hadLeftoverWork) {
        params.hackPercent += hackPercentAdjustment;
        params.hackPercent = Math.min(50, params.hackPercent);
    }

    // we only want to reduce the hack percent if we had work that couldn't be allocated
    // because we ran out of ram
    if (hadLeftoverWork) {
        params.hackPercent -= hackPercentAdjustment;
        params.hackPercent = Math.max(1, params.hackPercent);
    }

    // trace out hackPercent changes every half int
    if (Math.floor(oldHackPercent * 2) !== Math.floor(params.hackPercent * 2)) {
        logger.trace("hack percent has now reached", Math.round(params.hackPercent * 2) / 2);
    }
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
        if (totalThreads <= 0) return 0;

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
    return totalThreads;
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

    const result = { hostname: target.hostname, security: target.security, money: target.money };

    scripts.forEach((script) => {
        switch (script.action) {
            case "weaken":
                updateServerStateWeaken(ns, script, result);
                break;
            case "grow": {
                updateServerStateGrow(ns, script, result);
                break;
            }
            case "hack": {
                updateServerStateHack(ns, script, result);
                break;
            }
            default:
                throw new Error(`unexpected script action ${script.action}`);
        }
    });

    return result;
}

function updateServerStateWeaken(
    ns: NS,
    script: { hostname: string; threads: number },
    state: { hostname: string; money: number; security: number }
) {
    state.security -= ns.weakenAnalyze(script.threads, ns.getServer(script.hostname).cpuCores);
    state.security = Math.max(state.security, ns.getServerMinSecurityLevel(state.hostname));
}

function updateServerStateGrow(
    ns: NS,
    script: { hostname: string; threads: number },
    state: { hostname: string; money: number; security: number }
) {
    const growthFactor = ns.formulas.hacking.growPercent(
        ns.getServer(state.hostname),
        script.threads,
        ns.getPlayer(),
        ns.getServer(script.hostname).cpuCores
    );
    // new Logger(ns).info(`growthFactor=${growthFactor}`);
    const oldServerMoney = state.money;
    state.money *= growthFactor;
    state.money = Math.min(state.money, ns.getServerMaxMoney(state.hostname));
    if (state.money !== oldServerMoney) {
        state.security += ns.growthAnalyzeSecurity(script.threads);
        state.security = Math.max(state.security, ns.getServerMinSecurityLevel(state.hostname));
    }
}

function updateServerStateHack(
    ns: NS,
    script: { hostname: string; threads: number },
    state: { hostname: string; money: number; security: number }
) {
    const oldServerMoney = state.money;
    const hackFactor = ns.formulas.hacking.hackPercent(ns.getServer(state.hostname), ns.getPlayer()) * script.threads;
    // new Logger(ns).info(`hackFactor=${hackFactor}`);
    state.money -= hackFactor * state.money;
    state.money = Math.max(state.money, 0);
    if (state.money !== oldServerMoney) {
        state.security += ns.hackAnalyzeSecurity(script.threads);
        state.security = Math.max(state.security, ns.getServerMinSecurityLevel(state.hostname));
    }
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

function updateLogHost(ns: NS, hostname: string) {
    if (params.logHost === hostname) return;

    new Logger(ns).trace("updated logHost", `${params.logHost} -> ${hostname}`);
    params.logHost = hostname;
}
