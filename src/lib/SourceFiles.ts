import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns, { stdout: true });
    const sourceFiles = ns.getOwnedSourceFiles().map((sfLvl) => `Source-File${sfLvl.n}.${sfLvl.lvl}`);
    logger.info("source files", ...sourceFiles);
    logger.info("bitNodeN", ns.getPlayer().bitNodeN);
}

export function hasSourceFile(ns: NS, n: number, lvl: number) {
    const currentlyInBitnode = ns.getPlayer().bitNodeN === n;
    const haveSourceFile = ns.getOwnedSourceFiles().includes({ n: n, lvl: lvl });
    return currentlyInBitnode || haveSourceFile;
}
