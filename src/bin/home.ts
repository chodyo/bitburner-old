import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { sendControlMsg } from "/lib/Optimize";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    if (!homeUpgradable(ns)) {
        logger.toast("done buying home upgrades", "info");
        sendControlMsg(ns, { script: "/bin/home.js", done: "", next: "exit" });
        return;
    }

    let upgradeCount = 0;
    while (buyHomeUpgrade(ns)) {
        // buy everything that's worth it as fast as i can
        upgradeCount++;
        await ns.sleep(10);
    }
    if (upgradeCount > 0) {
        logger.toast(`finished buying ${upgradeCount} home upgrades :)`);
    }

    logger.info("exiting Home buyer");
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

    if (ns.getServerMoneyAvailable("home") < lowestCost) {
        return false;
    }

    return lowestUpgradeFn();
}
