module.exports = {
  testRegex: ['/test/*.*.(ts|tsx)$'],
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};