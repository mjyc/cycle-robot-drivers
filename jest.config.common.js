module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  moduleNameMapper: {
    '^@cycle-robot-drivers\\/([^/]+)': '<rootDir>/../$1/src'
  },
  testEnvironment: "jsdom",
  globals: {
    "ts-jest": {
      tsConfig: "<rootDir>/tsconfig.json",
      diagnostics: true,
    },
  },
};
