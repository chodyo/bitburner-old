import { NS } from "Bitburner";
import { connect } from "/lib/Connect";
import { Logger } from "/lib/Logger";

const theRedPill = "The Red Pill";
const worldDaemon = "w0r1d_d43m0n";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    if (!ns.getOwnedAugmentations().includes(theRedPill)) {
        logger.trace("haven't bought the red pill aug yet");
        return;
    }

    if (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(worldDaemon)) {
        logger.trace("not high enough level to backdoor world daemon yet");
        return;
    }

    if (!connect(ns, worldDaemon)) {
        throw new Error(`failed to connect to ${worldDaemon}`);
    }

    await ns.installBackdoor();

    logger.toast(`backdoored ${worldDaemon}`, "success", 60 * 1000);
}
