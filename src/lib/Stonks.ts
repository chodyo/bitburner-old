import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    something(ns);
}

/**
 * getSymbols:
 * You don't have TIX API Access!
 * Cannot use getSymbols()
 */
function something(ns: NS) {
    const logger = new Logger(ns, { stdout: true });
    logger.info("hi from stonks");

    logger.info("stonks", ns.stock.getSymbols());
}
