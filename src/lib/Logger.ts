import { NS } from "Bitburner";

type LogOptions = {
    /**
     * Controls whether netscript functions should log.
     * @default false
     */
    enableNSTrace?: boolean;

    /**
     * Controls whether logger output should print to the terminal.
     * @default false
     */
    stdout?: boolean;
};

class Logger {
    static TRACE_LITERAL = "TRACE";
    static INFO_LITERAL = "INFO";
    static WARN_LITERAL = "WARN";
    static ERROR_LITERAL = "ERROR";

    ns: NS;
    options: LogOptions;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    print: (msg: any) => void;

    constructor(ns: NS, options?: LogOptions) {
        this.ns = ns;
        this.options = { enableNSTrace: false, stdout: false, ...options };

        if (this.options.stdout) {
            this.print = this.ns.tprint;
        } else {
            this.print = this.ns.print;
        }
    }

    alert(msg: string, variant: "success" | "info" | "warning" | "error" = "success") {
        this.ns.alert(msg);

        switch (variant) {
            case "error":
                this.error(msg);
                break;
            case "warning":
                this.warn(msg);
                break;
            case "success":
            case "info":
            default:
                this.info(msg);
                break;
        }
    }

    toast(msg: string, variant: "success" | "info" | "warning" | "error" = "success", duration = 2000) {
        this.ns.toast(msg, variant, duration);

        switch (variant) {
            case "error":
                this.error(msg);
                break;
            case "warning":
                this.warn(msg);
                break;
            case "success":
            case "info":
            default:
                this.info(msg);
                break;
        }
    }

    trace(msg: string, ...args: any[]) {
        this.log(msg, this.caller(), Logger.TRACE_LITERAL, ...args);
    }

    info(msg: string, ...args: any[]) {
        this.log(msg, this.caller(), Logger.INFO_LITERAL, ...args);
    }

    warn(msg: string, ...args: any[]) {
        this.log(msg, this.caller(), Logger.WARN_LITERAL, ...args);
    }

    error(msg: string, ...args: any[]) {
        this.log(msg, this.caller(), Logger.ERROR_LITERAL, ...args);
    }

    private caller() {
        try {
            throw new Error();
        } catch (e) {
            // matches this function, the caller and the parent
            const allMatches = e.stack.match(/([\w.]+)@|at ([\w.]+) \(/g);
            // match parent function name
            const parentMatches = allMatches[2].match(/([\w.]+)@|at ([\w.]+) \(/);
            // return only name
            return parentMatches[1] || parentMatches[2];
        }
    }

    private log(msg: string, caller: string, level: string, ...args: any[]) {
        this.ns.disableLog("ALL"); // remove this if regular function logs are helpful

        level = level.padEnd(6);
        const date = new Date().toLocaleTimeString("en-US", { hour12: false }).padEnd(8);
        caller = caller.padEnd(20);
        args = args.map((val) => (typeof val === "object" ? JSON.stringify(val) : val));

        this.print(`${level} >  ${date}  >  ${caller}  >  ${msg} ${args}`);
    }
}

export { Logger };
