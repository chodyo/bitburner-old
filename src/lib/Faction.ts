import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: true });

    const favor = ns.args[0] as number;
    const currentRep = ns.args[1] as number;
    const leftoverRep = calculateRepNeededToReachFavor(ns, favor, currentRep);
    logger.info(
        "remaining rep required to reach favor",
        ns.nFormat(favor, "(0.00a)"),
        ns.nFormat(leftoverRep, "(0.00a)")
    );
}

// TODO: currentRep can be used directly on NS with SF4.2
function calculateRepNeededToReachFavor(ns: NS, favor: number, currentRep: number) {
    const totalRepNeeded = Math.pow(1.02, favor - 1) * 25500 - 25000;
    return totalRepNeeded - currentRep;
}

/**
 * getAugmentationsFromFaction:
 * This singularity function requires Source-File 4 to run.
 * A power up you obtain later in the game.
 * It will be very obvious when and how you can obtain it.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function something(ns: NS) {
    ns.getAugmentationsFromFaction("The Black Hand");
}
