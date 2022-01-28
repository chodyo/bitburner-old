import { NS } from "Bitburner";
import { Logger } from "lib/Logger";
import { hasSourceFile } from "lib/SourceFiles";

const minRoiRecoverySeconds = 30 * 60;

enum upgrades {
    purchase = "purchase",
    level = "level",
    ram = "ram",
    cores = "cores",
}

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.alert(`reminder: hard coded bitNodeMult=${getBitnodeMult(ns)} for SF4.1`, "warning");
    logger.info(`hacknet production mult ${ns.getHacknetMultipliers().production}`);

    while (hacknetUpgradable(ns)) {
        let upgradeCount = 0;
        while (buyHacknetUpgrade(ns)) {
            // buy everything that's worth it as fast as i can
            upgradeCount++;
            await ns.sleep(10);
        }
        if (upgradeCount > 0) {
            logger.toast(`finished buying ${upgradeCount} hacknet upgrades :)`);
        }
        await ns.sleep(60000);
    }
    logger.toast("exiting Hacknet buyer", "info");
}

function hacknetUpgradable(ns: NS) {
    const h = ns.hacknet;

    if (h.numNodes() < h.maxNumNodes() || h.maxNumNodes() === Infinity) {
        return true;
    }

    return Array(h.maxNumNodes())
        .fill(undefined)
        .some(
            (_, n) =>
                h.getLevelUpgradeCost(n, 1) < Infinity ||
                h.getRamUpgradeCost(n, 1) < Infinity ||
                h.getCoreUpgradeCost(n, 1) < Infinity
        );
}

export function buyHacknetUpgrade(ns: NS) {
    const logger = new Logger(ns);

    const best = bestUpgrade(ns);
    logger.info(`best hacknet upgrade: ${JSON.stringify(best)}`);

    if (!shouldIBuyUpgrade(ns, best.cost, best.extraCashRate)) {
        return false;
    }

    let result: number | boolean | undefined = undefined;
    switch (best.upgradeType) {
        case upgrades.purchase:
            result = ns.hacknet.purchaseNode();
            break;
        case upgrades.level:
            result = ns.hacknet.upgradeLevel(best.n, 1);
            break;
        case upgrades.ram:
            result = ns.hacknet.upgradeRam(best.n, 1);
            break;
        case upgrades.cores:
            result = ns.hacknet.upgradeCore(best.n, 1);
            break;
        default:
            throw new Error(`unexpected hacknet upgrade=${upgrades[best.upgradeType]}`);
    }
    logger.info(`upgraded hacknet, best upgrade=${JSON.stringify(best)} result=${result}`);
    return true;
}

/**
 * "Best" is defined by the highest cost/return ratio
 */
function bestUpgrade(ns: NS) {
    const h = ns.hacknet;

    const c = {
        cost: h.numNodes() < h.maxNumNodes() ? h.getPurchaseNodeCost() : Infinity,
        extraCashRate: moneyGainRate(ns, 1, 1, 1) - moneyGainRate(ns, 0, 0, 0),
        upgradeType: upgrades.purchase,
        n: -1,
    };

    Array(h.numNodes())
        .fill(undefined)
        .forEach((_, n) => {
            const node = h.getNodeStats(n);
            const baseRate = moneyGainRate(ns, node.level, node.ram, node.cores);

            const levelCost = h.getLevelUpgradeCost(n, 1);
            const ramCost = h.getRamUpgradeCost(n, 1);
            const coresCost = h.getCoreUpgradeCost(n, 1);

            const levelRate = levelCost === Infinity ? 0 : moneyGainRate(ns, node.level + 1, node.ram, node.cores);
            const ramRate = ramCost === Infinity ? 0 : moneyGainRate(ns, node.level, node.ram * 2, node.cores);
            const coresRate = coresCost === Infinity ? 0 : moneyGainRate(ns, node.level, node.ram, node.cores + 1);
            const bestRate = Math.max(levelRate, ramRate, coresRate);
            if (bestRate <= c.extraCashRate) {
                return;
            }

            c.cost = bestRate === levelRate ? levelCost : bestRate === ramRate ? ramCost : coresCost;
            c.extraCashRate = bestRate - baseRate;
            c.upgradeType =
                bestRate === levelRate ? upgrades.level : bestRate === ramRate ? upgrades.ram : upgrades.cores;
            c.n = n;
        });

    return c;
}

function shouldIBuyUpgrade(ns: NS, cost: number, extraCashRate: number) {
    const cash = ns.getServerMoneyAvailable("home");

    const haveEnoughCash = cash >= cost;
    const roiQuickly = cost / extraCashRate <= minRoiRecoverySeconds;
    const excessiveWealthRatio = cost / extraCashRate <= cash / cost;

    return haveEnoughCash && (roiQuickly || excessiveWealthRatio);
}

function moneyGainRate(
    ns: NS,
    level: number,
    ram: number,
    cores: number,
    hacknetProductionMult = ns.getHacknetMultipliers().production,
    bitNodeMult = getBitnodeMult(ns)
) {
    // HacknetNodeConstants.MoneyGainPerLevel
    // this seems actually constant (compared to bitNodeMult)
    const gainPerLevel = 1.5;

    const levelMult = level * gainPerLevel;
    const ramMult = Math.pow(1.035, ram - 1);
    const coresMult = (cores + 5) / 6;

    return levelMult * ramMult * coresMult * hacknetProductionMult * bitNodeMult;
}

function getBitnodeMult(ns: NS) {
    // BitNodeMultipliers.HacknetNodeMoney
    if (hasSourceFile(ns, 5, 1)) {
        return ns.getBitNodeMultipliers().HacknetNodeMoney;
    }
    return 0.05;
}
