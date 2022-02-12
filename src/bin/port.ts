import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns, { enableNSTrace: false });
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const port = ns.getPortHandle(1);
    while (true) {
        const p = port.read() as string;
        switch (p) {
            case "NULL PORT DATA":
                break;
            default:
                logger.info("executing async func", p);
                const fn = new AsyncFunction("ns", p);
                const result = await fn(ns);
                logger.info(p, "->", result);
                break;
        }
        await ns.sleep(1 * 1000);
    }
}
