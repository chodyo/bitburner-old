import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    const flags = ns.flags([["target", ""]]);
    const target = flags["target"];
    if (!target) {
        logger.error("run /bin/weaken.js --target {hostname}");
        return;
    }
    const securityDiff = await ns.weaken(target);
    logger.info(`weakened ${target} by ${securityDiff}`);
}
