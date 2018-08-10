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
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      tsConfigFile: "<rootDir>/tsconfig.json",
      enableTsDiagnostics: true
    }
  }
};
