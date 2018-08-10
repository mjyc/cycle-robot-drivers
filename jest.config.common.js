module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  "transformIgnorePatterns": [
    "<rootDir>/node_modules/(?!@cycle)",
    "<rootDir>/node_modules/(?!@cycle-robot-drivers)"
  ],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      tsConfigFile: "<rootDir>/tsconfig.json"
    }
  }
};
