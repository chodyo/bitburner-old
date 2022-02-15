import { NS } from "Bitburner";
import { Logger } from "lib/Logger";
import { hacknetUpgradable, buyHacknetUpgrade } from "/lib/Hacknet";
import { sendControlMsg } from "/lib/Optimize";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    if (!hacknetUpgradable(ns)) {
        logger.toast("done buying hacknet upgrades", "info");
        sendControlMsg(ns, { script: "/bin/hacknet.js", done: "", next: "exit" });
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
