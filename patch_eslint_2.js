const fs = require('fs');
let fileContent = fs.readFileSync('backend/src/services/exportService.js', 'utf8');

// There might be another "return await"
fileContent = fileContent.replace("return await this.exportToZIP(reports);", "return this.exportToZIP(reports);");
fileContent = fileContent.replace(/return await /g, "return ");

fs.writeFileSync('backend/src/services/exportService.js', fileContent);
