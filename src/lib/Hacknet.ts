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
    while (buyCheapestUpgrade(ns, desiredSavings(ns))) {
        await ns.sleep(3000);
    }
    const logger = new Logger(ns);
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
        roi: 0, // todo
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
