const fs = require('fs');
let fileContent = fs.readFileSync('backend/src/services/exportService.js', 'utf8');

// remove uuidv4 since it's unused
fileContent = fileContent.replace("const { v4: uuidv4 } = require('uuid');\n", "");

// fix iterators/generators loop
const searchLoop = `        // Assign to reports
        for (const report of reports) {
          report.photos = photosByReport[report.id] || [];
          report.audio = audioByReport[report.id] || [];
        }`;
const replacementLoop = `        // Assign to reports
        reports.forEach((report) => {
          report.photos = photosByReport[report.id] || [];
          report.audio = audioByReport[report.id] || [];
        });`;
fileContent = fileContent.replace(searchLoop, replacementLoop);

// Disable class-methods-use-this rule as it's a known style for services
fileContent = `/* eslint-disable class-methods-use-this */\n` + fileContent;

// fix no-return-await
fileContent = fileContent.replace("return await this.exportToJSON(reports);", "return this.exportToJSON(reports);");

fs.writeFileSync('backend/src/services/exportService.js', fileContent);
