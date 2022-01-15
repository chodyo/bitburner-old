import { NS } from "Bitburner";

class Logger {
    static TRACE_LITERAL = "TRACE";
    static INFO_LITERAL = "INFO";
    static WARN_LITERAL = "WARN";
    static ERR_LITERAL = "ERROR";
    ns: NS;

    constructor(ns: NS) {
        this.ns = ns;
    }

    trace(msg: string, ...args: string[]) {
        this.log(msg, this.caller(), Logger.TRACE_LITERAL, args);
    }

    info(msg: string, ...args: string[]) {
        this.log(msg, this.caller(), Logger.INFO_LITERAL, args);
    }

    warn(msg: string, ...args: string[]) {
        this.log(msg, this.caller(), Logger.WARN_LITERAL, args);
    }

    err(msg: string, ...args: string[]) {
        this.log(msg, this.caller(), Logger.ERR_LITERAL, args);
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

    private log(msg: string, caller: string, level: string, args: string[]) {
        this.ns.tprintf(`${level.padEnd(6)} > ${caller.padEnd(20)} msg::${msg}`, ...args);
    }
}

export { Logger };
