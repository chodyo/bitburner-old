import { NS } from "Bitburner";
import { Logger } from "lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    while (true) {
        ns.run("/lib/CodingContracts.js", 1, "autosolve", "--quiet");
        await ns.sleep(10 * 60 * 1000);
    }
    logger.toast("exiting contracts solver", "info");
}
