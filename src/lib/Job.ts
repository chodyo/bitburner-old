import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    something(ns);
}

/**
 * workForCompany:
 * This singularity function requires Source-File 4 to run.
 * A power up you obtain later in the game.
 * It will be very obvious when and how you can obtain it.
 */
function something(ns: NS) {
    const logger = new Logger(ns, { stdout: true });
    logger.info("hi from work");

    logger.info("MegaCorp", ns.workForCompany("MegaCorp"));
}
