// duplicate of build-tailwind: use this there!
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");

if (process.argv.length !== 5) {
  console.error("src, dest, name are required");
  process.exit(1);
}

const src = process.argv[2];
const dest = process.argv[3];
const name = process.argv[4];

const srcContent = fs.readFileSync(src, "utf8");

// this was needed for the tailwind CSS files...
const contentCleaned = srcContent.replaceAll("`", "'");

const tsContent = `export const ${name} = \`
${contentCleaned}\`
`;

fs.writeFileSync(dest, tsContent);
