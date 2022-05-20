const fs = require("fs");
const environment = process.argv[2];
const content = require(`../environments/${environment}.json`);
fs.writeFileSync("environment.json", JSON.stringify(content, undefined, 2));
