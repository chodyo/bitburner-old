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
    const logger = new Logger(ns, { enableNSTrace: true });
    logger.info("starting");

    // runtime error
    // eval("ns.hack('n00dles')");

    //* uses mem
    // const hack = ns.hack;
    // hack("n00dles");

    //* uses mem :(
    // const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    // const hack = new AsyncFunction("ns", `return ns.hack("n00dles")`);
    // const n = await hack(ns);
    // logger.info("hacked", n);

    // runtime error :( dynamic ram still catches it
    // ns.getPortHandle(1).tryWrite(`return ns.hack("n00dles")`)
    //     ? logger.info("wrote fn to port")
    //     : logger.warn("failed to write fn to port");

    logger.info("done");
}

// const hack = () => globalNS.hack("n00dles");
