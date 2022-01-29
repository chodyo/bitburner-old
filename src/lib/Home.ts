import { NS } from "Bitburner";
import { Logger } from "lib/Logger";
import { desiredSavings } from "lib/Money";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    while (homeUpgradable(ns)) {
        let upgradeCount = 0;
        while (buyHomeUpgrade(ns)) {
            // buy everything that's worth it as fast as i can
            upgradeCount++;
            await ns.sleep(10);
        }
        if (upgradeCount > 0) {
            logger.toast(`finished buying ${upgradeCount} home upgrades :)`);
        }
        await ns.sleep(60000);
    }
    logger.toast("exiting Home buyer", "info");
}

function homeUpgradable(ns: NS) {
    if (ns.getUpgradeHomeCoresCost() < Infinity) return true;
    if (ns.getUpgradeHomeRamCost() < Infinity) return true;
    return false;
}

function buyHomeUpgrade(ns: NS) {
    let lowestCost = Infinity;
    let lowestUpgradeFn = () => false;

    if (ns.getUpgradeHomeCoresCost() < lowestCost) {
        lowestCost = ns.getUpgradeHomeCoresCost();
        lowestUpgradeFn = ns.upgradeHomeCores;
    }

    if (ns.getUpgradeHomeRamCost() < lowestCost) {
        lowestCost = ns.getUpgradeHomeRamCost();
        lowestUpgradeFn = ns.upgradeHomeRam;
    }

    if (ns.getServerMoneyAvailable("home") < lowestCost + desiredSavings(ns, 30)) {
        return false;
    }

    return lowestUpgradeFn();
}
