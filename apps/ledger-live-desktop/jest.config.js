const defaultConfig = {
  globals: {
    __DEV__: false, // LL specific or Node global variable?
    __APP_VERSION__: "2.0.0", // ?
    "ts-jest": {
      isolatedModules: true,
    },
  },
  testEnvironment: "node",
  globalSetup: "<rootDir>/tets/setup.js",
  setupFiles: ["<rootDir>/tests/jestSetup.js"],
  moduleDirectories: ["node_modules"],
};

module.exports = {
  projects: [
    {
      // config for normal jest unit tests (not react testing library)
      ...defaultConfig,
      testPathIgnorePatterns: ["(/__tests__/.*|(\\.|/)react\\.test|spec)\\.tsx"], // this basically says don't run this config for any spec/test files matching this regex
    },
    {
      ...defaultConfig,
      displayName: "dom", // ?
      testEnvironment: "jsdom",
      testRegex: "(/__tests__/.*|(\\.|/)react\\.test|spec)\\.tsx", // run these specific tests
      moduleNameMapper: {
        uuid: require.resolve("uuid"), // finds the path of the uuid modile - more overhead to look this up but readable and easy
      },
    },
  ],
};
