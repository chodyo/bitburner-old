import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    const done = sleeve(ns);
    if (!done) {
        logger.info("did sleeve stuff");
        return;
    }

    logger.alert("done running sleeve", "info");
}

/**
 * Returns true when done with sleeve.
 */
function sleeve(ns: NS): boolean {
    const logger = new Logger(ns);

    ns.sleeve.
}
