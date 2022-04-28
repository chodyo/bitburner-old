import { NS } from "Bitburner";
import { Logger } from "/lib/Logger";

export async function main(ns: NS) {
    const logger = new Logger(ns);

    const done = gang(ns);
    if (!done) {
        logger.info("did gang stuff");
        return;
    }

    logger.alert("done running gang", "info");
}

/**
 * Returns true when done with gang.
 */
function gang(ns: NS): boolean {
    const logger = new Logger(ns);

    if (!ns.gang.inGang()) {
        if (!getStatsTo40(ns)) {
            logger.trace("still training stats");
            return false;
        }

        if (!getKarmaSoHigh(ns)) {
            logger.trace("still farming karma");
            return false;
        }
    }

    if (!manageGang(ns)) {
        logger.trace("still managing gang");
        return false;
    }

    return false;
}

function getStatsTo40(ns: NS): boolean {
    const logger = new Logger(ns);
    const p = ns.getPlayer();
    const to40 = 40;

    const statsToTrain = [
        { name: "str", lvl: p.strength },
        { name: "def", lvl: p.defense },
        { name: "dex", lvl: p.dexterity },
        { name: "agi", lvl: p.agility },
    ].filter((stats) => stats.lvl < to40);

    if (statsToTrain.length === 0) {
        if (p.isWorking && p.className.startsWith("training")) ns.singularity.stopAction();
        return true;
    }

    trainStat(ns, statsToTrain[0].name);

    return false;
}

function trainStat(ns: NS, stat: string): boolean {
    const p = ns.getPlayer();

    if (p.className.startsWith(`training your ${stat}`)) {
        return true;
    }
    if (p.className.startsWith("training your")) {
        ns.singularity.stopAction();
    }

    if (ns.getPlayer().isWorking) {
        return false;
    }

    return ns.singularity.gymWorkout("powerhouse gym", stat, true);
}

function getKarmaSoHigh(ns: NS) {
    const ss = "Slum Snakes";
    if (ns.gang.inGang()) return true;
    if (ns.singularity.checkFactionInvitations().includes(ss)) return ns.singularity.joinFaction(ss);
    if (ns.gang.createGang(ss)) return true;

    ns.singularity.commitCrime("homicide");
    return false;
}

function generateName(): string {
    const colors = [
        "Cyan",
        "Rouge",
        "Beige",
        "Zaffre",
        "Pink",
        "Glaucous",
        "Cerulean",
        "Chartreuse",
        "Viridian",
        "Bisque",
        "Laurel",
        "Alabaster",
        "Sable",
        "Citrine",
        "Amber",
        "Persimmon",
        "Vermilion",
        "Pewter",
        "Sepia",
        "Garnet",
        "Obsidian",
    ];

    const color = colors[Math.floor(Math.random() * colors.length)];

    const adjectives = [
        "Adamant",
        "Adroit",
        "Baleful",
        "Bellicose",
        "Boorish",
        "Comely",
        "Corpulent",
        "Crapulous",
        "Defamatory",
        "Efficacious",
        "Equanimous",
        "Execrable",
        "Fastidious",
        "Feckless",
        "Hubristic",
        "Incendiary",
        "Insidious",
        "Insolent",
        "Judicious",
        "Limpid",
        "Mordant",
        "Nefarious",
        "Petulant",
        "Rebarbative",
        "Serpentine",
        "Tenacious",
        "Tremulous",
        "Turgid",
        "Voracious",
        "Wheedling",
        "Zealous",
    ];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];

    const firstNames = [
        "Duke",
        "Jacques",
        "Kirnon",
        "Grim",
        "Ark",
        "Ridley",
        "Fark",
        "Zindo",
        "Payne",
        "Tristan",
        "Kaiser",
        "Yao",
        "Rapture",
        "Eleanore",
        "Fatima",
        "Zero",
        "Pearl",
        "Zada",
        "Inigo",
        "Haera",
        "Ike",
        "Fane",
        "Norrix",
        "Gray",
        "Zander",
        "Grim",
        "Mace",
    ];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];

    const permutations = 4;
    switch (Math.floor(Math.random() * permutations)) {
        case 0:
            return `${color} ${firstName}`;
        case 1:
            return `${adj} ${firstName}`;
        case 2:
            return `${color} ${adj} ${firstName}`;
        default:
            return `${adj} ${color} ${firstName}`;
    }
}

function manageGang(ns: NS) {
    ns.gang.setTerritoryWarfare(territoryWarfare(ns));

    ns.gang.recruitMember(generateName());

    ascendGangMembers(ns);

    optimizeGangMemberTasks(ns);

    buyGangMemberEquipment(ns);

    return false;
}

function territoryWarfare(ns: NS): boolean {
    const gangInfo = ns.gang.getGangInformation();
    const otherGangInfo = ns.gang.getOtherGangInformation();
    const maxOtherGangPower = Math.max(
        otherGangInfo.Tetrads.power,
        otherGangInfo["The Syndicate"].power,
        otherGangInfo["The Dark Army"].power,
        otherGangInfo["Speakers for the Dead"].power,
        otherGangInfo.NiteSec.power,
        otherGangInfo["The Black Hand"].power
    );
    return gangInfo.power > maxOtherGangPower * 2;
}

function ascendGangMembers(ns: NS) {
    ns.gang
        .getMemberNames()
        .map((name) => ({ name: name, info: ns.gang.getAscensionResult(name) || { str: 1, def: 1, dex: 1, agi: 1 } }))
        .filter((member) => member.info.str > 2 || member.info.def > 2 || member.info.dex > 2 || member.info.agi > 2)
        .forEach((member) => ns.gang.ascendMember(member.name));
}

function optimizeGangMemberTasks(ns: NS) {
    // probably better to get them some base training before trying to make money
    const membersTraining = ns.gang.getMemberNames().filter((name) => {
        const info = ns.gang.getMemberInformation(name);
        return info.str < 100 || info.def < 100 || info.dex < 100 || info.agi < 100;
    });

    membersTraining.forEach((name) => {
        ns.gang.setMemberTask(name, "Train Combat");
    });

    const members = ns.gang.getMemberNames().filter((name) => !membersTraining.includes(name));

    // ns.alert(`${JSON.stringify(ns.gang.getGangInformation())}`);

    const gangInfo = ns.gang.getGangInformation();

    // wanted penalty too high
    // wanted penalty is the multiplier
    // e.g. profits * wantedPenalty = actualProfits
    if (gangInfo.wantedPenalty < 0.7) {
        members.forEach((name) => {
            ns.gang.setMemberTask(name, "Vigilante Justice");
        });
        return;
    }

    // gang not full, gain respect
    if (ns.gang.getMemberNames().length < 12) {
        members.forEach((name) => ns.gang.setMemberTask(name, "Terrorism"));
        return;
    }

    // territory power too low
    if (!territoryWarfare(ns)) {
        members.forEach((name) => ns.gang.setMemberTask(name, "Territory Warfare"));
        return;
    }

    // make money
    const tasks = ns.gang.getTaskNames();
    members.forEach((name) => {
        const memberTaskProfits = tasks
            .map((taskName) => {
                ns.gang.setMemberTask(name, taskName);
                return { taskName: taskName, profits: ns.gang.getMemberInformation(name).moneyGain };
            })
            .sort((a, b) => b.profits - a.profits)
            .filter((task) => task.profits > 0);

        if (memberTaskProfits.length === 0) {
            ns.gang.setMemberTask(name, "Train Combat");
            return;
        }

        ns.gang.setMemberTask(name, memberTaskProfits[0].taskName);
    });
}

function buyGangMemberEquipment(ns: NS) {
    const equipment = ns.gang
        .getEquipmentNames()
        .map((equipmentName) => ({ name: equipmentName, cost: ns.gang.getEquipmentCost(equipmentName) }))
        .sort((a, b) => a.cost - b.cost);
    ns.gang
        .getMemberNames()
        .map((name) => ({
            name: name,
            equipment: ns.gang.getMemberInformation(name).upgrades,
        }))
        .forEach((member) => {
            equipment.some((equipment) => {
                if (member.equipment.includes(equipment.name)) return false;
                return ns.gang.purchaseEquipment(member.name, equipment.name);
            });
        });
}
