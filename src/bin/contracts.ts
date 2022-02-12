import { NS } from "Bitburner";
import { autosolve, findAndFilterContracts } from "/lib/CodingContracts";

export async function main(ns: NS) {
    findAndFilterContracts(ns).forEach((contract) => autosolve(ns, contract));
}
