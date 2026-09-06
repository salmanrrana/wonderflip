import js from "@eslint/js";
import globals from "globals";
export default [
  { ignores: ["node_modules/**"] },
  {
    files: ["js/**/*.js", "data/**/*.js"],
    languageOptions: { globals: globals.browser, sourceType: "script" },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z][A-Z0-9_]*$" }],
    },
  },
  {
    files: ["data/**/*.js"],
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z][A-Z0-9_]*$" }],
    },
  },
  {
    files: ["js/levels.js"],
    languageOptions: {
      globals: {
        ANIMALS: "readonly",
        COLORS: "readonly",
        DINOSAURS: "readonly",
        EXPLORERS: "readonly",
        FLAGS_USA: "readonly",
        FLAGS_WORLD: "readonly",
        INSECTS: "readonly",
        INSTRUMENTS: "readonly",
        LANDMARKS: "readonly",
        LETTERS: "readonly",
        NUMBERS: "readonly",
        PLANETS: "readonly",
        SCIENTISTS: "readonly",
        TOOLS: "readonly",
        VEHICLES: "readonly",
        WEATHER: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { caughtErrors: "none", varsIgnorePattern: "^(LEVELS|LEVEL_BY_ID)$" },
      ],
    },
  },
  {
    files: ["js/game.js"],
    languageOptions: {
      globals: {
        LEVELS: "readonly",
        LEVEL_BY_ID: "readonly",
        Voice: "readonly",
      },
    },
  },
  {
    files: ["js/speech.js"],
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_$",
          caughtErrorsIgnorePattern: "^_$",
          varsIgnorePattern: "^Voice$",
        },
      ],
    },
  },
  {
    files: ["tools/**/*.js"],
    languageOptions: { globals: globals.node, sourceType: "commonjs" },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["error", { caughtErrors: "none" }],
    },
  },
  {
    files: ["tools/check_tap.js"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      sourceType: "commonjs",
    },
  },
  {
    files: ["tools/**/*.mjs", "eslint.config.mjs"],
    languageOptions: { globals: globals.node, sourceType: "module" },
    rules: js.configs.recommended.rules,
  },
];
