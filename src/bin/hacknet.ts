import { NS } from "Bitburner";
import { Logger } from "lib/Logger";
import { hacknetUpgradable, buyHacknetUpgrade } from "/lib/Hacknet";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    if (!hacknetUpgradable(ns)) {
        logger.toast("done buying hacknet upgrades", "info");

        // let optimize know not to start it again
        logger.info("exit 0");
        return;
    }

    let upgradeCount = 0;
    while (buyHacknetUpgrade(ns)) {
        // buy everything that's worth it as fast as i can
        upgradeCount++;
        await ns.sleep(10);
    }
    if (upgradeCount > 0) {
        logger.toast(`finished buying ${upgradeCount} hacknet upgrades :)`);
    }
}
