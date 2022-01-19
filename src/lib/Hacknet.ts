import { NS } from "Bitburner";
import { desiredSavings } from "lib/Money";
import { Logger } from "lib/Logger";

export async function main(ns: NS) {
    buyCheapestUpgrade(ns, desiredSavings(ns));
}

const maxToSpendOnHacknet = 1e9;

export function buyCheapestUpgrade(ns: NS, maxMoneyKeep: number) {
    const logger = new Logger(ns);

    const cheapest = {
        cost: maxToSpendOnHacknet,
        runUpgradeFn: function noUpgrade(_index: number, _n: number) {
            return;
        },
        upgradeFnParam: 0,
    };

    if (ns.hacknet.numNodes() < ns.hacknet.maxNumNodes()) {
        const newNodeCost = ns.hacknet.getPurchaseNodeCost();
        if (newNodeCost < cheapest.cost) {
            cheapest.cost = newNodeCost;
            cheapest.runUpgradeFn = ns.hacknet.purchaseNode;
        }
    }

    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
        [
            { cost: ns.hacknet.getRamUpgradeCost(i, 1), upgradeFn: ns.hacknet.upgradeRam },
            { cost: ns.hacknet.getCoreUpgradeCost(i, 1), upgradeFn: ns.hacknet.upgradeCore },
            { cost: ns.hacknet.getCacheUpgradeCost(i, 1), upgradeFn: ns.hacknet.upgradeCache },
            { cost: ns.hacknet.getLevelUpgradeCost(i, 1), upgradeFn: ns.hacknet.upgradeLevel },
        ].forEach((upgrader) => {
            if (upgrader.cost < cheapest.cost) {
                cheapest.cost = upgrader.cost;
                cheapest.runUpgradeFn = upgrader.upgradeFn;
                cheapest.upgradeFnParam = i;
            }
        });
    }

    if (cheapest.cost === maxToSpendOnHacknet) {
        return false;
    } else if (ns.getServerMoneyAvailable("home") >= cheapest.cost + maxMoneyKeep) {
        logger.info("upgrading hacknet", cheapest.runUpgradeFn.name, cheapest.upgradeFnParam);
        cheapest.runUpgradeFn(cheapest.upgradeFnParam, 1);
    }
    return true;
}
