import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

/**
 * RUNTIME ERROR
/bin/tryHackWithoutMem.js@home

Dynamic RAM usage calculated to be greater than initial RAM usage on fn: hack.
This is probably because you somehow circumvented the static RAM calculation.

Threads: 1
Dynamic RAM Usage: 1.70GB
Static RAM Usage: 1.60GB

One of these could be the reason:
* Using eval() to get a reference to a ns function
  const myScan = eval('ns.scan');

* Using map access to do the same
  const myScan = ns['scan'];

Sorry :(
 */
export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: true, enableNSTrace: true });
    logger.info("starting");
    eval("ns.hack('n00dles')");
    logger.info("done");
}
