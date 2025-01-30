export default {
    preset: "ts-jest",
    transform: {
        "^.+\\.tsx?$": ["ts-jest", {
            useESM: true
        }]
    },
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["./jest.setup.mjs"]
};
