import { NS } from "Bitburner";
import { Logger } from "lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    let iterations = 0;
    while (!buyAllDarkwebUpgrades(ns)) {
        iterations++;
        await ns.sleep(60000);
    }

    if (iterations === 0) {
        logger.trace("already had everything");
        return;
    }

    logger.toast("done buying darkweb upgrades", "info");
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

    return [
        { name: "BruteSSH.exe", cost: 500e3 },
        { name: "FTPCrack.exe", cost: 1.5e6 },
        { name: "relaySMTP.exe", cost: 5e6 },
        { name: "HTTPWorm.exe", cost: 30e6 },
        { name: "SQLInject.exe", cost: 250e6 },
    ].every((program) => {
        if (ns.fileExists(program.name, "home")) {
            return true;
        }

        if (ns.getServerMoneyAvailable("home") < program.cost) {
            return false;
        }

        if (ns.purchaseProgram(program.name)) {
            logger.toast(`purchased ${program.name} from darkweb`);
            return true;
        }

        return false;
    });
}
