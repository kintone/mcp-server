const { createConfig } = require("@cybozu/license-manager");

const config = createConfig({
  analyze: {
    allowLicenses: [
      "MIT",
      "Apache-2.0",
      "BSD-2-Clause",
      "BSD-3-Clause",
      "BSD-3-Clause OR MIT",
      "ISC",
      "0BSD",
      "Python-2.0",
      "MPL-2.0",
      "CC0-1.0",
      "CC-BY-3.0",
      "CC-BY-4.0",
      "(MIT OR Apache-2.0)",
      "(MIT OR CC0-1.0)",
      "(MIT AND Zlib)",
      "(MIT AND BSD-3-Clause)",
      "(MIT AND CC-BY-3.0)",
      "(WTFPL OR MIT)",
      "BlueOak-1.0.0",
      "(BSD-3-Clause OR GPL-2.0)",
      "Unlicense",
    ],
    allowPackages: [
      // https://github.com/npm/cli/blob/latest/LICENSE
      "npm",
    ],
  },
  extract: {
    output: "./NOTICE",
  },
  overrideLicenseText: (dep) => {
    if (dep.name === "@tokenizer/token") {
      return {
        // License text is written in README.md
        licenseText: "See https://github.com/Borewit/tokenizer-token#licence",
      };
    }
    return undefined;
  },
  packageManager: "pnpm",
});

module.exports = config;
