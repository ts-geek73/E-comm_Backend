const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  "preset": "@shelf/jest-mongodb",
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    ...tsJestTransformCfg,
  },
};