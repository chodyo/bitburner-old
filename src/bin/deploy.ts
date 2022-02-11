import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { singleDeploy } from "/lib/Deploy";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    const args = ns.flags([
        ["hostname", "home"],
        ["filename", ""],
        ["fileargs", []],
    ]);

    const hostname = args["hostname"];
    const filename = args["filename"];
    const fileArgs = args["fileargs"];

    logger.info("beginning deployment", hostname, filename, ...fileArgs);
    await singleDeploy(ns, filename, hostname, ...fileArgs);
}
