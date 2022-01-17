import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    something(ns);
}

/**
 * getAugmentationsFromFaction:
 * This singularity function requires Source-File 4 to run.
 * A power up you obtain later in the game.
 * It will be very obvious when and how you can obtain it.
 */
function something(ns: NS) {
    const logger = new Logger(ns);
    logger.info("hi from faction");

    logger.info("augmentations", ns.getAugmentationsFromFaction("The Black Hand"));
}
