import { NS } from "Bitburner";
import { buyCheapestUpgrade } from "lib/Hacknet";
import { desiredSavings } from "lib/Money";
import { buyPservUpgrade } from "lib/Pserv";

export async function main(ns: NS) {
    ns.tprint(`starting optimize::main`);

    var isHacknetUpgradable = true;
    var myHackingLevel = 0; // TODO: make an event channel via ports
    // TODO: stop optimize if already running

    while (1) {
        if (isHacknetUpgradable) {
            isHacknetUpgradable = buyCheapestUpgrade(ns, desiredSavings(ns));
        }

        await buyPservUpgrade(ns);

        if (shouldITryHackingSomeoneNew(ns, myHackingLevel)) {
            ns.tprint(`redeploying hack scripts`);
            ns.run("/bin/start-hack.ns");
        }

        // TODO: check for new programs to create and create them

        myHackingLevel = ns.getPlayer().hacking;
        await ns.asleep(3000);
    }
}

function didILevelUpHacking(ns: NS, oldLevel: number) {
    return ns.getPlayer().hacking !== oldLevel;
}

function shouldITryHackingSomeoneNew(ns: NS, myHackingLevel: number) {
    if (didILevelUpHacking(ns, myHackingLevel) && (ns.getPlayer().hacking % 10 === 0 || ns.getPlayer().hacking === 1)) {
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
function programs(ns: NS) {
    ns.createProgram("ftpcrack.exe");
}
