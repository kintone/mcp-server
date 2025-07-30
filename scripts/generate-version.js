import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = resolve(__dirname, "../package.json");
const versionFilePath = resolve(__dirname, "../src/version.ts");

try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  const versionContent = `// This file is auto-generated. Do not edit manually.
export const version = "${packageJson.version}";
`;

  writeFileSync(versionFilePath, versionContent);
  console.log(`✓ Generated version.ts with version ${packageJson.version}`);
} catch (error) {
  console.error("Failed to generate version.ts:", error);
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}
