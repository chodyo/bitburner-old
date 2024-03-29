import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    const flags = ns.flags([["target", ""]]);
    const target = flags["target"];
    if (!target) {
        logger.error("run /bin/hack.js --target {hostname}");
        return;
    }
    const cash = await ns.hack(target);
    logger.info(`hacked ${target} for ${ns.nFormat(cash, "$0.00a")}`);
}
