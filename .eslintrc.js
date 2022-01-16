module.exports = {
    root: true,
    overrides: [
        {
            files: ["*.ts", "*.tsx"], // Your TypeScript files extension
            parserOptions: {
                project: ["./tsconfig.json"], // Specify it only for TypeScript files
            },
        },
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
    overrides: [{ files: ["*.ts", "*.tsx"] }],
    parserOptions: {
        project: "./tsconfig.json",
    },
    rules: {
        "@typescript-eslint/no-floating-promises": ["error"],
        "@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: true }],
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
};
