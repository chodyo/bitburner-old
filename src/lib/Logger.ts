import { NS } from "Bitburner";

class Logger {
    static TRACE_LITERAL = "TRACE";
    static INFO_LITERAL = "INFO";
    static WARN_LITERAL = "WARN";
    static ERROR_LITERAL = "ERROR";
    ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    trace(msg: string, ...args: any[]) {
        this.log(msg, this.caller(), Logger.TRACE_LITERAL, args);
    }

    info(msg: string, ...args: any[]) {
        this.log(msg, this.caller(), Logger.INFO_LITERAL, args);
    }

    warn(msg: string, ...args: any[]) {
        this.log(msg, this.caller(), Logger.WARN_LITERAL, args);
    }

    error(msg: string, ...args: any[]) {
        this.log(msg, this.caller(), Logger.ERROR_LITERAL, args);
    }

    private caller() {
        try {
            throw new Error();
        } catch (e) {
            // matches this function, the caller and the parent
            const allMatches = e.stack.match(/([\w\.]+)@|at ([\w\.]+) \(/g);
            // match parent function name
            const parentMatches = allMatches[2].match(/([\w\.]+)@|at ([\w\.]+) \(/);
            // return only name
            return parentMatches[1] || parentMatches[2];
        }
    }

    private log(msg: string, caller: string, level: string, args: any[]) {
        for (let i in args) {
            args[i] = JSON.stringify(args[i]);
        }
        level = level.padEnd(6);
        const date = new Date().toLocaleTimeString("en-US", { hour12: false }).padEnd(8);
        caller = caller.padEnd(20);
        this.ns.tprintf(`${level} >  ${date}  >  ${caller}  >  ${msg} ${args}`);
    }
}

export { Logger };
