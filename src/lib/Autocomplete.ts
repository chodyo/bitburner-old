export type Autocomplete = {
    servers: string[];

    txts: string[];

    scripts: string[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flags: (schema: [string, string | number | boolean | string[]][]) => any;
};
