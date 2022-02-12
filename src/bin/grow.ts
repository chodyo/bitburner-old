import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    const flags = ns.flags([["target", ""]]);
    const target = flags["target"];
    if (!target) {
        logger.error("run /bin/grow.js --target {hostname}");
        return;
    }
    const growthMult = await ns.grow(target);
    logger.info(`grew ${target} by ${growthMult}%`);
}
