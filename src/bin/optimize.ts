import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";
import { alreadyDeployed } from "/lib/Deploy";
import { hackFilePath } from "/lib/Hack";

export async function main(ns: NS) {
    const logger = new Logger(ns);
    logger.trace("starting");

    const backgroundScripts = ["/lib/Home.js", "/lib/Hacknet.js", "/lib/Pserv.js", "/lib/Faction.js"];

    while (true) {
        backgroundScripts.forEach((filename) => {
            if (alreadyDeployed(ns, filename, "home")) return;
            const result: "success" | "error" = ns.run(filename) ? "success" : "error";
            logger.toast(`running script ${filename} on home: ${result}`, result);
        });
        await ns.asleep(60000);
    }
}

// export async function main(ns: NS) {
//     const logger = new Logger(ns);
//     logger.trace("starting");

//     var isHacknetUpgradable = true;
//     var myHackingLevel = 0; // TODO: make an event channel via ports
//     // TODO: stop optimize if already running

//     while (1) {
//         if (isHacknetUpgradable) {
//             isHacknetUpgradable = buyHacknetUpgrade(ns, desiredSavings(ns));
//         }

//         await buyPservUpgrade(ns);

//         if (shouldITryHackingSomeoneNew(ns, myHackingLevel)) {
//             logger.trace(`redeploying hack scripts`);
//             ns.run("/bin/startHack.js");
//         }

//         // TODO: check for new programs to create and create them

//         myHackingLevel = ns.getPlayer().hacking;
//         await ns.asleep(3000);
//     }
// }

function shouldITryHackingSomeoneNew(ns: NS, myHackingLevel: number) {
    const justLeveledUp = ns.getPlayer().hacking !== myHackingLevel;
    const multipleOfTen = ns.getPlayer().hacking % 10 === 0;
    const notRunning = !alreadyDeployed(ns, hackFilePath, "home");
    if ((justLeveledUp && multipleOfTen) || notRunning) {
        return true;
    }
    // TODO: check for new programs on my home
    return false;
}

// Requires source file 4-3 to run :(
// AutoLink.exe: 25
// BruteSSH.exe: 50
// DeepscanV1.exe: 75
// ServerProfiler.exe: 75
// FTPCrack.exe: 100
// relaySMTP.exe: 250
// DeepscanV2.exe: 400
// HTTPWorm.exe: 500
// SQLInject.exe: 750
// function programs(ns: NS) {
//     ns.createProgram("ftpcrack.exe");
// }
