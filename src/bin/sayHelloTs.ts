import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

/** @param {NS} ns **/
export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: true });
    logger.trace("Hello from TypeScript o/");
    logger.info("\tEverything seems to be in order :D");
    logger.warn("\tJust showing some colors");
    logger.error("Fake error, no panik");
}
