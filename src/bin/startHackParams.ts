import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { PortNumbers } from "/lib/PortNumbers";
import { StartHackParams } from "/lib/StartHack";

export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: true });

    const flags = ns.flags([
        ["logHost", ""],
        ["hackPercent", 0],
    ]);

    const logHost = flags["logHost"];
    const hackPercent = flags["hackPercent"];
    if (!logHost && !hackPercent) {
        logger.warn("--logHost hostname --hackPercent 8");
        return;
    }

    const params: StartHackParams = { logHost: logHost, hackPercent: hackPercent };
    const hackParamsPortHandle = ns.getPortHandle(PortNumbers.StartHackParams);
    if (!hackParamsPortHandle.tryWrite(JSON.stringify(params))) {
        logger.error("unable to update startHack");
        return;
    }

    logger.info("startHack updated");
}
