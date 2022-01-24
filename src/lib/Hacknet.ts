import { NS } from "Bitburner";
import { desiredSavings, $ } from "lib/Money";
import { Logger } from "lib/Logger";

enum upgrades {
    purchase,
    level,
    ram,
    cores,
}

export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: true });

    const n = ns.args[0] as number;
    const node = ns.hacknet.getNodeStats(n);
    const levelUpgrade = ns.hacknet.getLevelUpgradeCost(n, 1) === Infinity ? node.level : node.level + 1;
    const ramUpgrade = ns.hacknet.getRamUpgradeCost(n, 1) === Infinity ? node.ram : node.ram * 2;
    const coreUpgrade = ns.hacknet.getCoreUpgradeCost(n, 1) === Infinity ? node.cores : node.cores + 1;
    logger.info(`
        production=${ns.nFormat(node.production, $)}/sec
        level=+${ns.nFormat(moneyGainRate(ns, { n: n, level: levelUpgrade }) - node.production, $)}/sec
        ram=+${ns.nFormat(moneyGainRate(ns, { n: n, ram: ramUpgrade }) - node.production, $)}/sec
        core=+${ns.nFormat(moneyGainRate(ns, { n: n, cores: coreUpgrade }) - node.production, $)}/sec`);
    return;

    while (buyCheapestUpgrade(ns, desiredSavings(ns))) {
        await ns.sleep(60000);
    }
    logger.info("finished buying hacknet upgrades");
}

const maxToSpendOnHacknet = 1e9;

export function buyCheapestUpgrade(ns: NS, maxMoneyKeep: number) {
    const logger = new Logger(ns);

    const cheapest = cheapestUpgrade(ns);
    if (cheapest.cost > maxToSpendOnHacknet) {
        return false;
    }

    const cash = ns.getServerMoneyAvailable("home");
    if (cash < cheapest.cost + maxMoneyKeep) {
        logger.info(
            `not upgrading hacknet cash=${ns.nFormat(cash, $)} cost=${ns.nFormat(
                cheapest.cost,
                $
            )} savings=${ns.nFormat(maxMoneyKeep, $)}`
        );
        return true;
    }

    let result: number | boolean | string | undefined = undefined;
    switch (cheapest.fn) {
        case upgrades.purchase:
            result = ns.hacknet.purchaseNode();
            break;
        case upgrades.level:
            result = ns.hacknet.upgradeLevel(cheapest.n, 1);
            break;
        case upgrades.ram:
            result = ns.hacknet.upgradeRam(cheapest.n, 1);
            break;
        case upgrades.cores:
            result = ns.hacknet.upgradeCore(cheapest.n, 1);
            break;
        default:
            logger.error(`unexpected hacknet upgrade=${upgrades[cheapest.fn]}`);
            return false;
    }
    logger.info(`upgraded hacknet upgrade=${upgrades[cheapest.fn]} node=${cheapest.n} result=${result}`);
    return true;
}

function cheapestUpgrade(ns: NS) {
    const h = ns.hacknet;

    const c = {
        cost: h.numNodes() < h.maxNumNodes() ? h.getPurchaseNodeCost() : Infinity,
        fn: upgrades.purchase,
        n: -1,
    };

    Array(h.numNodes())
        .fill(undefined)
        .forEach((_, i) => {
            const levelCost = h.getLevelUpgradeCost(i, 1);
            const ramCost = h.getRamUpgradeCost(i, 1);
            const coresCost = h.getCoreUpgradeCost(i, 1);

            const minCost = Math.min(levelCost, ramCost, coresCost);
            if (minCost > c.cost) {
                return;
            }

            c.cost = minCost;
            c.fn = minCost === levelCost ? upgrades.level : minCost === ramCost ? upgrades.ram : upgrades.cores;
            c.n = i;
        });

    return c;
}

function moneyGainRate(
    ns: NS,
    opts: {
        n?: number;
        level?: number;
        ram?: number;
        cores?: number;
    },
    mult = ns.getHacknetMultipliers().production
) {
    if (!opts.n === undefined && (opts.level === undefined || opts.ram === undefined || opts.cores === undefined)) {
        throw new Error(
            `missing opts - either specify the node number n, or provide the raw values of the node's level, ram, and cores; n=${opts.n} level=${opts.level} ram=${opts.ram} cores=${opts.cores}`
        );
    }

    opts.level = !opts.level ? ns.hacknet.getNodeStats(opts.n!).level : opts.level;
    opts.ram = !opts.ram ? ns.hacknet.getNodeStats(opts.n!).ram : opts.ram;
    opts.cores = !opts.cores ? ns.hacknet.getNodeStats(opts.n!).cores : opts.cores;

    // HacknetNodeConstants.MoneyGainPerLevel
    const gainPerLevel = 1.5;

    const levelMult = opts.level! * gainPerLevel;
    const ramMult = Math.pow(1.035, opts.ram! - 1);
    const coresMult = (opts.cores! + 5) / 6;

    // BitNodeMultipliers.HacknetNodeMoney - presumably this will be built in to the production multiplier?
    const bitNodeMult = 1;

    return levelMult * ramMult * coresMult * mult * bitNodeMult;
}
