import { NS } from "Bitburner";
import { desiredSavings } from "lib/Money";

export async function main(ns: NS) {
    while (buyCheapestUpgrade(ns, desiredSavings(ns))) {
        await ns.sleep(3000);
    }
}

export function buyCheapestUpgrade(ns: NS, maxMoneyKeep: number) {
    var cheapest = {
        cost: Infinity,
        runUpgradeFn: (index: number, n: number) => {},
        upgradeFnParam: 0,
    };

    if (ns.hacknet.numNodes() < ns.hacknet.maxNumNodes()) {
        var newNodeCost = ns.hacknet.getPurchaseNodeCost();
        if (!cheapest.cost || newNodeCost < cheapest.cost) {
            cheapest.cost = newNodeCost;
            cheapest.runUpgradeFn = ns.hacknet.purchaseNode;
        }
    }

    for (var i = 0; i < ns.hacknet.numNodes(); i++) {
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

    if (!cheapest.cost) {
        return false;
    } else if (ns.getServerMoneyAvailable("home") >= cheapest.cost + maxMoneyKeep) {
        ns.tprint(`upgrading ${cheapest.runUpgradeFn.name} ${cheapest.upgradeFnParam}`);
        cheapest.runUpgradeFn(cheapest.upgradeFnParam, 1);
    }
    return true;
}
