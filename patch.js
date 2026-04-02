const fs = require('fs');

let fileContent = fs.readFileSync('backend/src/services/exportService.js', 'utf8');

const searchString = `      // Get photos and audio for each report
      for (const report of reports) {
        const [photos] = await sequelize.query(\`
          SELECT * FROM report_photos WHERE report_id = :report_id ORDER BY order_index
        \`, {
          replacements: { report_id: report.id },
          type: sequelize.QueryTypes.SELECT
        });

        const [audio] = await sequelize.query(\`
          SELECT * FROM report_audio WHERE report_id = :report_id ORDER BY created_at
        \`, {
          replacements: { report_id: report.id },
          type: sequelize.QueryTypes.SELECT
        });

        report.photos = photos;
        report.audio = audio;
      }`;

const replacementString = `      // Get photos and audio for all reports in a single query to avoid N+1 problem
      if (reports.length > 0) {
        const reportIdsList = reports.map(r => r.id);

        const [allPhotos] = await sequelize.query(\`
          SELECT * FROM report_photos WHERE report_id = ANY(:report_ids) ORDER BY order_index
        \`, {
          replacements: { report_ids: reportIdsList },
          type: sequelize.QueryTypes.SELECT
        });

        const [allAudio] = await sequelize.query(\`
          SELECT * FROM report_audio WHERE report_id = ANY(:report_ids) ORDER BY created_at
        \`, {
          replacements: { report_ids: reportIdsList },
          type: sequelize.QueryTypes.SELECT
        });

        // Group by report_id
        const photosByReport = {};
        const audioByReport = {};

        allPhotos.forEach(photo => {
          if (!photosByReport[photo.report_id]) photosByReport[photo.report_id] = [];
          photosByReport[photo.report_id].push(photo);
        });

        allAudio.forEach(audio => {
          if (!audioByReport[audio.report_id]) audioByReport[audio.report_id] = [];
          audioByReport[audio.report_id].push(audio);
        });

        // Assign to reports
        for (const report of reports) {
          report.photos = photosByReport[report.id] || [];
          report.audio = audioByReport[report.id] || [];
        }
      }`;

if (fileContent.includes(searchString)) {
  fileContent = fileContent.replace(searchString, replacementString);
  fs.writeFileSync('backend/src/services/exportService.js', fileContent);
  console.log('Successfully patched exportService.js');
} else {
  console.log('Could not find search string in exportService.js');
}
