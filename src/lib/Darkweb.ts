import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { desiredSavings } from "/lib/Money";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    let iterations = 0;
    while (!buyAllDarkwebUpgrades(ns)) {
        iterations++;
        await ns.sleep(60000);
    }

    if (iterations === 0) {
        logger.trace("already had all darkweb purchases");
        return;
    }

    logger.toast("done buying darkweb items", "info");
}

/**
 * Returns true when all upgrades are purchased.
 */
function buyAllDarkwebUpgrades(ns: NS) {
    const logger = new Logger(ns);

    if (ns.getServerMoneyAvailable("home") < 200000) {
        return false;
    }

    if (ns.purchaseTor()) {
        logger.toast("bought tor router");
    }

    const minutesOfSavings = 30;
    const savings = desiredSavings(ns, minutesOfSavings);

    return [
        { name: "BruteSSH.exe", cost: 500e3, keepSavings: false },
        { name: "FTPCrack.exe", cost: 1.5e6, keepSavings: false },
        { name: "relaySMTP.exe", cost: 5e6, keepSavings: false },
        { name: "HTTPWorm.exe", cost: 30e6, keepSavings: false },
        { name: "SQLInject.exe", cost: 250e6, keepSavings: false },

        { name: "ServerProfiler.exe", cost: 500e3, keepSavings: true },
        { name: "DeepscanV1.exe", cost: 500e3, keepSavings: true },
        { name: "AutoLink.exe", cost: 1e6, keepSavings: true },
        { name: "DeepscanV2.exe", cost: 25e6, keepSavings: true },
    ].every((program) => {
        if (ns.fileExists(program.name, "home")) {
            return true;
        }

        const availableCash = ns.getServerMoneyAvailable("home") - (program.keepSavings ? savings : 0);
        if (availableCash < program.cost) {
            return false;
        }

        if (ns.purchaseProgram(program.name)) {
            logger.toast(`purchased ${program.name} from darkweb`);
            return true;
        }

        return false;
    });
}
