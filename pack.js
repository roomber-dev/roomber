const { env } = require("process");

const sources = require("./client/src/sources.json");

if (require.main === module) {
  const fs = require("fs");
  const obfuscator = require('javascript-obfuscator');

  const packedSources = sources
    .map((file) => fs.readFileSync("./client/src/" + file, { encoding: "utf-8" }))
    .join("\n");

  const obfuscationResult = obfuscator.obfuscate(
    packedSources,
    {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 1,
      numbersToExpressions: true,
      simplify: true,
      stringArrayShuffle: true,
      splitStrings: true,
      stringArrayThreshold: 1
    }
  );

  fs.writeFileSync("./client/Roomber.js", obfuscationResult.getObfuscatedCode());
  console.log("Packed sources into client/Roomber.js");
}

module.exports = {
  getScriptTags() {
    if (env["ROOMBER_PACKED"] === "true") {
      return `<script src="Roomber.js"></script>`;
    } else {
      return sources.map(source => `<script src="src/${source}"></script>`).join("\n");
    }
  }
};
