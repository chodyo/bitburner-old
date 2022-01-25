import { NS } from "Bitburner";
import { $ } from "lib/Money";
import { Logger } from "lib/Logger";
import { hasSourceFile } from "lib/SourceFiles";

const minRoiRecoverySeconds = 30 * 60;

enum upgrades {
    purchase,
    level,
    ram,
    cores,
}

export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: false });

    const n = (ns.args[0] as number) || 0;
    const node = ns.hacknet.getNodeStats(n);
    const baseMoneyGainRate = moneyGainRate(ns, { n: n });
    const levelUpgrade =
        moneyGainRate(ns, {
            n: n,
            level: ns.hacknet.getLevelUpgradeCost(n, 1) === Infinity ? node.level : node.level + 1,
        }) - baseMoneyGainRate;
    const ramUpgrade =
        moneyGainRate(ns, {
            n: n,
            ram: ns.hacknet.getRamUpgradeCost(n, 1) === Infinity ? node.ram : node.ram * 2,
        }) - baseMoneyGainRate;
    const coreUpgrade =
        moneyGainRate(ns, {
            n: n,
            cores: ns.hacknet.getCoreUpgradeCost(n, 1) === Infinity ? node.cores : node.cores + 1,
        }) - baseMoneyGainRate;
    logger.info(`
        node production=${ns.nFormat(node.production, $)}/sec level=${node.level} ram=${node.ram} cores=${node.cores}
        level=${levelUpgrade} => +${ns.nFormat(levelUpgrade, $)}/sec
        ram=${ramUpgrade} => +${ns.nFormat(ramUpgrade, $)}/sec
        cores=${coreUpgrade} => +${ns.nFormat(coreUpgrade, $)}/sec`);

    while (true) {
        // once every 60 seconds
        let upgradeTimes = 0;
        while (buyCheapestUpgrade(ns)) {
            // buy everything that's worth it as fast as i can
            upgradeTimes++;
            await ns.sleep(10);
        }
        logger.info(`finished buying ${upgradeTimes} hacknet upgrades`);
        await ns.sleep(60000);
    }
    logger.info("exiting");
}

export function buyCheapestUpgrade(ns: NS) {
    const logger = new Logger(ns);

    const cheapest = cheapestUpgrade(ns);

    if (!shouldBuyCheapestUpgrade(ns, cheapest.cost, cheapest.upgradeType, cheapest.n)) {
        return false;
    }

    let result: number | boolean | string | undefined = undefined;
    switch (cheapest.upgradeType) {
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
            logger.error(`unexpected hacknet upgrade=${upgrades[cheapest.upgradeType]}`);
            return false;
    }
    logger.info(`upgraded hacknet upgrade=${upgrades[cheapest.upgradeType]} node=${cheapest.n} result=${result}`);
    return true;
}

function cheapestUpgrade(ns: NS) {
    const h = ns.hacknet;

    const c = {
        cost: h.numNodes() < h.maxNumNodes() ? h.getPurchaseNodeCost() : Infinity,
        upgradeType: upgrades.purchase,
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
            c.upgradeType =
                minCost === levelCost ? upgrades.level : minCost === ramCost ? upgrades.ram : upgrades.cores;
            c.n = i;
        });

    return c;
}

function shouldBuyCheapestUpgrade(ns: NS, cost: number, upgradeType: upgrades, n: number) {
    const h = ns.hacknet;
    const cash = ns.getServerMoneyAvailable("home");
    let rate = 0;
    switch (upgradeType) {
        case upgrades.purchase:
            rate = moneyGainRate(ns, { level: 1, ram: 1, cores: 1 });
            break;
        case upgrades.level:
            rate = moneyGainRate(ns, { n: n, level: h.getNodeStats(n).level + 1 });
            break;
        case upgrades.ram:
            rate = moneyGainRate(ns, { n: n, ram: h.getNodeStats(n).ram * 2 });
            break;
        case upgrades.cores:
            rate = moneyGainRate(ns, { n: n, level: h.getNodeStats(n).cores + 1 });
            break;
        default:
            return false;
    }

    const haveEnoughCash = cash >= cost;
    const roiQuickly = cost / rate <= minRoiRecoverySeconds;
    const excessiveWealthRatio = cost / rate <= cash / cost;

    return haveEnoughCash && (roiQuickly || excessiveWealthRatio);
}

/**
 * @param opts.n The ID of the hacknet node
 * @param opts.level The new level
 * @param opts.ram amount The new ram amount
 * @param opts.cores The new number of cores
 */
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

    // BitNodeMultipliers.HacknetNodeMoney
    let bitNodeMult = 1;
    if (hasSourceFile(ns, 5, 1)) {
        bitNodeMult = ns.getBitNodeMultipliers().HacknetNodeMoney;
    } else {
        const logger = new Logger(ns, { stdout: true });
        bitNodeMult = 0.05;
        logger.warn(`hard coded bitNodeMult=${bitNodeMult} for SF4.1`);
    }

    return levelMult * ramMult * coresMult * mult * bitNodeMult;
}
